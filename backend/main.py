import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../ml/src')))

import hashlib
import hmac
import json
import secrets
import sqlite3
from pathlib import Path
from typing import Optional
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List
from datetime import datetime, timezone
import httpx
from predict import predict_road_risk
from predict_eta import predict_eta

app = FastAPI(
    title="SURAKSHA Backend & AI Engine API",
    description="AI-Powered Logistics & Accessibility Intelligence Platform for the North Eastern Region",
    version="0.3.0"
)

DATABASE_PATH = Path(os.getenv('SURAKSHA_DB_PATH', Path(__file__).with_name('suraksha.db')))
UPLOADS_PATH = Path(os.getenv('SURAKSHA_UPLOADS_PATH', Path(__file__).with_name('uploads')))
UPLOADS_PATH.mkdir(parents=True, exist_ok=True)
AUTH_SECRET = os.getenv('SURAKSHA_AUTH_SECRET', 'development-only-change-me')
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv('SURAKSHA_ALLOWED_ORIGINS', 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174,https://suraksha-9pfb.onrender.com').split(',') if origin.strip()]

def database() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def initialize_database() -> None:
    with database() as connection:
        connection.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
                role TEXT NOT NULL, display_name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS trucks (
                id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT, truck_id TEXT NOT NULL, latitude REAL NOT NULL,
                longitude REAL NOT NULL, speed_kph REAL NOT NULL DEFAULT 0, captured_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY, payload TEXT NOT NULL, photo_path TEXT, created_by TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS deliveries (
                id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL,
                resource TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, recipient TEXT NOT NULL,
                message TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
            );
        ''')
        demo_password = hash_password('suraksha-demo')
        for user_id, username, role, display_name in [
            ('USR-001', 'admin', 'ADMINISTRATOR', 'Ananya Sharma'),
            ('USR-002', 'dispatcher', 'DISPATCHER', 'Arjun Mehta'),
            ('USR-003', 'driver', 'DRIVER', 'Vikram Singh'),
            ('USR-004', 'analyst', 'RISK_ANALYST', 'Priya Nair')
        ]:
            connection.execute(
                'INSERT OR IGNORE INTO users (id, username, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)',
                (user_id, username, demo_password, role, display_name)
            )

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def issue_token(user: dict) -> str:
    payload = json.dumps({'sub': user['username'], 'role': user['role'], 'exp': int(datetime.now(timezone.utc).timestamp()) + 86400}, separators=(',', ':'))
    signature = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f'{payload}.{signature}'

def current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Authentication required')
    try:
        payload, signature = authorization[7:].rsplit('.', 1)
        expected = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError('Invalid signature')
        user = json.loads(payload)
        if user['exp'] < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError('Expired token')
        return user
    except (ValueError, KeyError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail='Invalid or expired token')

def require_roles(*roles: str):
    def dependency(user: dict = Depends(current_user)) -> dict:
        if user['role'] not in roles:
            raise HTTPException(status_code=403, detail='Insufficient role permissions')
        return user
    return dependency

initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoadRiskRequest(BaseModel):
    road_id: str = "NER-R001"
    rainfall_24h: float = Field(default=25.0)
    rainfall_7d: float = Field(default=80.0)
    elevation: float = Field(default=450.0)
    slope: float = Field(default=12.0)
    road_length_km: float = Field(default=25.0)
    traffic_level: int = Field(default=1)
    historical_flood_count: int = Field(default=1)
    historical_landslide_count: int = Field(default=0)
    road_condition: int = Field(default=1)

class RoadRiskResponse(BaseModel):
    road_id: str
    disruption_probability: float
    risk_level: str

class ETARequest(BaseModel):
    baseline_travel_time_min: float = Field(default=500.0)
    route_distance_km: float = Field(default=350.0)
    average_risk: float = Field(default=0.25)
    maximum_risk: float = Field(default=0.85)
    traffic_level: int = Field(default=2)
    road_condition: int = Field(default=2)
    risky_segment_count: int = Field(default=1)
    blocked_segment_count: int = Field(default=0)
    rainfall_24h: float = Field(default=40.0)
    rainfall_7d: float = Field(default=110.0)

class ETAResponse(BaseModel):
    baseline_travel_time_min: int
    predicted_delay_min: int
    predicted_eta_min: int

class FleetTruck(BaseModel):
    id: str
    label: str
    driver: str
    routeLabel: str
    color: str
    path: List[List[float]]
    progress: float
    status: str

class DriverAction(BaseModel):
    action: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TelemetryCreate(BaseModel):
    latitude: float
    longitude: float
    speed_kph: float = 0
    captured_at: Optional[str] = None

class DeliveryCreate(BaseModel):
    origin: str
    destination: str
    commodity: str
    driver_id: str
    priority: str = 'NORMAL'

class WeatherResponse(BaseModel):
    latitude: float
    longitude: float
    temperature_c: float
    rainfall_mm: float
    wind_kph: float
    source: str
    observed_at: str

class EmergencyRouteRequest(BaseModel):
    origin: str
    destination: str
    emergency_type: str = 'GENERAL'

class NotificationRequest(BaseModel):
    channel: str = 'IN_APP'
    recipient: str
    message: str
    language: str = 'en'

class GovernmentFeedRequest(BaseModel):
    provider: str = 'LOCAL_ADAPTER'
    endpoint: Optional[str] = None

FLEET_TRUCKS: Dict[str, FleetTruck] = {
    'TRK-101': FleetTruck(
        id='TRK-101', label='SURAKSHA-101', driver='Vikram Singh',
        routeLabel='Guwahati → Aizawl', color='#2563EB',
        path=[[91.7362, 26.1445], [91.8933, 25.5788], [92.7789, 24.8333], [92.7176, 23.7367]],
        progress=0.34, status='MOVING'
    ),
    'TRK-204': FleetTruck(
        id='TRK-204', label='SURAKSHA-204', driver='Rahul Das',
        routeLabel='Guwahati → Silchar', color='#15A05A',
        path=[[91.7362, 26.1445], [92.25, 25.2], [92.7789, 24.8333]],
        progress=0.58, status='MOVING'
    ),
    'TRK-310': FleetTruck(
        id='TRK-310', label='SURAKSHA-310', driver='Neha Kapoor',
        routeLabel='Silchar → Agartala', color='#D97706',
        path=[[92.7789, 24.8333], [92.1, 24.2], [91.2868, 23.8315]],
        progress=0.72, status='DELAYED'
    )
}
fleet_last_update = datetime.now(timezone.utc)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "SURAKSHA backend, AI Risk & ETA engine"
    }

@app.post('/api/auth/login')
def login(request: LoginRequest):
    with database() as connection:
        user = connection.execute('SELECT * FROM users WHERE username = ? AND active = 1', (request.username,)).fetchone()
    if not user or not hmac.compare_digest(user['password_hash'], hash_password(request.password)):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    return {'access_token': issue_token(dict(user)), 'token_type': 'bearer', 'role': user['role'], 'display_name': user['display_name']}

@app.get('/api/auth/demo-token')
def demo_token(role: str = 'DRIVER'):
    with database() as connection:
        user = connection.execute('SELECT * FROM users WHERE role = ? LIMIT 1', (role.upper(),)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail='Role not found')
    return {'access_token': issue_token(dict(user)), 'token_type': 'bearer', 'role': user['role']}

@app.get('/api/weather', response_model=WeatherResponse)
async def get_weather(latitude: float, longitude: float):
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get('https://api.open-meteo.com/v1/forecast', params={
                'latitude': latitude, 'longitude': longitude, 'current': 'temperature_2m,rain,wind_speed_10m'
            })
            response.raise_for_status()
            current = response.json()['current']
            return WeatherResponse(latitude=latitude, longitude=longitude, temperature_c=current['temperature_2m'], rainfall_mm=current.get('rain', 0), wind_kph=current['wind_speed_10m'], source='Open-Meteo', observed_at=current['time'])
    except Exception:
        return WeatherResponse(latitude=latitude, longitude=longitude, temperature_c=0, rainfall_mm=0, wind_kph=0, source='unavailable', observed_at=datetime.now(timezone.utc).isoformat())

@app.post('/api/incidents', status_code=201)
async def create_incident(
    road_id: str = Form(...), type: str = Form(...), severity: str = Form(...),
    latitude: float = Form(...), longitude: float = Form(...), description: str = Form(...),
    photo: Optional[UploadFile] = File(default=None),
    user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER', 'DRIVER', 'RISK_ANALYST'))
):
    incident_id = f'INC-{secrets.token_hex(5).upper()}'
    photo_path = None
    if photo:
        suffix = Path(photo.filename or 'upload.jpg').suffix.lower()[:10]
        photo_path = str(UPLOADS_PATH / f'{incident_id}{suffix}')
        with open(photo_path, 'wb') as output:
            output.write(await photo.read())
    payload = {'road_id': road_id, 'type': type, 'severity': severity, 'latitude': latitude, 'longitude': longitude, 'description': description, 'incident_id': incident_id, 'timestamp': datetime.now(timezone.utc).isoformat()}
    with database() as connection:
        connection.execute('INSERT INTO incidents VALUES (?, ?, ?, ?, ?)', (incident_id, json.dumps(payload), photo_path, user['sub'], payload['timestamp']))
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], 'CREATE_INCIDENT', incident_id, payload['timestamp']))
    return payload | {'photo_path': photo_path}

@app.get('/api/incidents')
def list_incidents(user: dict = Depends(current_user)):
    with database() as connection:
        rows = connection.execute('SELECT payload, photo_path, created_by, created_at FROM incidents ORDER BY created_at DESC LIMIT 100').fetchall()
    return [{**json.loads(row['payload']), 'photo_path': row['photo_path'], 'created_by': row['created_by']} for row in rows]

@app.post('/api/notifications', status_code=202)
def send_notification(request: NotificationRequest, user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER', 'RISK_ANALYST'))):
    translations = {
        'hi': {'ROAD_BLOCKED': 'सड़क अवरुद्ध है। वैकल्पिक मार्ग अपनाएं।'},
        'as': {'ROAD_BLOCKED': 'ৰাস্তা বন্ধ আছে। বিকল্প পথ ব্যৱহাৰ কৰক।'}
    }
    message = translations.get(request.language, {}).get(request.message, request.message)
    timestamp = datetime.now(timezone.utc).isoformat()
    with database() as connection:
        connection.execute('INSERT INTO notifications (channel, recipient, message, status, created_at) VALUES (?, ?, ?, ?, ?)', (request.channel, request.recipient, message, 'QUEUED', timestamp))
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], 'QUEUE_NOTIFICATION', request.recipient, timestamp))
    return {'channel': request.channel, 'recipient': request.recipient, 'message': message, 'status': 'QUEUED', 'provider': 'local-adapter', 'created_at': timestamp}

@app.post('/api/integrations/government-feed')
async def government_feed(request: GovernmentFeedRequest, user: dict = Depends(require_roles('ADMINISTRATOR', 'RISK_ANALYST'))):
    if not request.endpoint:
        return {'provider': request.provider, 'status': 'CONFIGURATION_REQUIRED', 'records': [], 'message': 'Set an approved government feed endpoint in deployment configuration.'}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(request.endpoint)
            response.raise_for_status()
            return {'provider': request.provider, 'status': 'CONNECTED', 'records': response.json()}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Government feed unavailable: {exc}')

@app.post('/api/fleet/trucks/{truck_id}/telemetry')
def record_telemetry(truck_id: str, telemetry: TelemetryCreate, user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER', 'DRIVER'))):
    captured_at = telemetry.captured_at or datetime.now(timezone.utc).isoformat()
    with database() as connection:
        connection.execute('INSERT INTO telemetry (truck_id, latitude, longitude, speed_kph, captured_at) VALUES (?, ?, ?, ?, ?)', (truck_id, telemetry.latitude, telemetry.longitude, telemetry.speed_kph, captured_at))
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], 'RECORD_TELEMETRY', truck_id, captured_at))
    return {'truck_id': truck_id, **telemetry.model_dump(), 'captured_at': captured_at}

@app.get('/api/fleet/trucks/{truck_id}/telemetry')
def get_telemetry(truck_id: str, user: dict = Depends(current_user)):
    with database() as connection:
        rows = connection.execute('SELECT latitude, longitude, speed_kph, captured_at FROM telemetry WHERE truck_id = ? ORDER BY id DESC LIMIT 100', (truck_id,)).fetchall()
    return [dict(row) for row in rows]

@app.post('/api/deliveries', status_code=201)
def create_delivery(delivery: DeliveryCreate, user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER'))):
    delivery_id = f'DEL-{secrets.token_hex(5).upper()}'
    payload = delivery.model_dump() | {'id': delivery_id, 'status': 'ASSIGNED', 'created_at': datetime.now(timezone.utc).isoformat()}
    with database() as connection:
        connection.execute('INSERT INTO deliveries VALUES (?, ?, ?)', (delivery_id, json.dumps(payload), payload['created_at']))
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], 'CREATE_DELIVERY', delivery_id, payload['created_at']))
    return payload

@app.get('/api/deliveries')
def list_deliveries(user: dict = Depends(current_user)):
    with database() as connection:
        rows = connection.execute('SELECT payload FROM deliveries ORDER BY created_at DESC LIMIT 100').fetchall()
    return [json.loads(row['payload']) for row in rows]

@app.get('/api/users')
def list_users(user: dict = Depends(require_roles('ADMINISTRATOR'))):
    with database() as connection:
        rows = connection.execute('SELECT id, username, role, display_name, active FROM users ORDER BY display_name').fetchall()
    return [dict(row) for row in rows]

@app.get('/api/audit')
def list_audit_logs(user: dict = Depends(require_roles('ADMINISTRATOR', 'RISK_ANALYST'))):
    with database() as connection:
        rows = connection.execute('SELECT actor, action, resource, created_at FROM audit_logs ORDER BY id DESC LIMIT 100').fetchall()
    return [dict(row) for row in rows]

@app.get('/api/dashboard/summary')
def dashboard_summary(user: dict = Depends(current_user)):
    with database() as connection:
        incident_count = connection.execute('SELECT COUNT(*) FROM incidents').fetchone()[0]
        delivery_count = connection.execute('SELECT COUNT(*) FROM deliveries').fetchone()[0]
        telemetry_count = connection.execute('SELECT COUNT(*) FROM telemetry').fetchone()[0]
    return {'districts_monitored': 8, 'active_trucks': len(FLEET_TRUCKS), 'incidents_reported': incident_count, 'deliveries_tracked': delivery_count, 'telemetry_points': telemetry_count, 'emergency_mode': False}

@app.post('/api/routes/emergency')
def emergency_route(request: EmergencyRouteRequest, user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER', 'RISK_ANALYST'))):
    timestamp = datetime.now(timezone.utc).isoformat()
    with database() as connection:
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], 'CALCULATE_EMERGENCY_ROUTE', f'{request.origin}->{request.destination}', timestamp))
    return {'mode': 'EMERGENCY', 'origin': request.origin, 'destination': request.destination, 'emergency_type': request.emergency_type, 'priority': 'CRITICAL', 'recommendation': 'Use safest accessible corridor and confirm field conditions before dispatch.', 'created_at': timestamp}

@app.get('/api/fleet/trucks', response_model=List[FleetTruck])
def get_fleet_trucks():
    global fleet_last_update
    now = datetime.now(timezone.utc)
    elapsed_seconds = (now - fleet_last_update).total_seconds()
    if elapsed_seconds >= 1:
        for truck in FLEET_TRUCKS.values():
            if truck.status == 'MOVING':
                truck.progress = (truck.progress + (0.008 * elapsed_seconds)) % 1
        fleet_last_update = now
    return list(FLEET_TRUCKS.values())

@app.post('/api/fleet/trucks/{truck_id}/actions', response_model=FleetTruck)
def update_truck_action(truck_id: str, request: DriverAction, user: dict = Depends(require_roles('ADMINISTRATOR', 'DISPATCHER', 'DRIVER'))):
    truck = FLEET_TRUCKS.get(truck_id)
    if truck is None:
        raise HTTPException(status_code=404, detail='Truck not found')

    action_status = {
        'START_NAVIGATION': 'MOVING',
        'STOP_NAVIGATION': 'IDLE',
        'REPORT_DELAY': 'DELAYED',
        'PICKUP_DONE': 'MOVING',
        'IN_TRANSIT': 'MOVING',
        'DELIVERED': 'IDLE',
        'RESET': 'MOVING'
    }
    if request.action not in action_status:
        raise HTTPException(status_code=400, detail='Unsupported driver action')

    if request.action == 'RESET':
        truck.progress = 0.34
    truck.status = action_status[request.action]
    timestamp = datetime.now(timezone.utc).isoformat()
    with database() as connection:
        connection.execute('INSERT OR REPLACE INTO trucks (id, payload, updated_at) VALUES (?, ?, ?)', (truck.id, truck.model_dump_json(), timestamp))
        connection.execute('INSERT INTO audit_logs (actor, action, resource, created_at) VALUES (?, ?, ?, ?)', (user['sub'], request.action, truck_id, timestamp))
    return truck

@app.post("/api/predict-risk", response_model=RoadRiskResponse)
def predict_risk_endpoint(request: RoadRiskRequest):
    try:
        features = request.model_dump()
        result = predict_road_risk(features)
        return result
    except Exception as e:
        rainfall_factor = min(request.rainfall_24h / 100, 1)
        terrain_factor = min((request.slope / 45 + request.road_condition / 3) / 2, 1)
        probability = round(min(0.05 + rainfall_factor * 0.45 + terrain_factor * 0.35, 0.98), 4)
        return {'road_id': request.road_id, 'disruption_probability': probability, 'risk_level': 'HIGH' if probability > 0.7 else 'MEDIUM' if probability > 0.35 else 'LOW'}

@app.post("/api/predict-eta", response_model=ETAResponse)
def predict_eta_endpoint(request: ETARequest):
    try:
        features = request.model_dump()
        result = predict_eta(features)
        return result
    except Exception as e:
        return {'baseline_travel_time_min': int(request.baseline_travel_time_min), 'predicted_delay_min': delay, 'predicted_eta_min': int(request.baseline_travel_time_min) + delay}

class LocationPoint(BaseModel):
    lat: float
    lon: float

class RouteCalculationRequest(BaseModel):
    origin: LocationPoint
    destination: LocationPoint
    mode: str = 'fastest'

@app.post("/api/routes/calculate")
def calculate_route_endpoint(request: RouteCalculationRequest):
    graph_path = Path(__file__).parent.parent / 'data' / 'osm_ner_graph.json'
    if not graph_path.exists():
        raise HTTPException(status_code=500, detail="OSM graph dataset missing")
    
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph_data = json.load(f)
    
    nodes = {n['id']: n for n in graph_data['nodes']}
    edges = graph_data['edges']
    
    # Snap origin & dest
    def snap(point):
        best_node = None
        min_d = float('inf')
        for nid, n in nodes.items():
            d = (n['lat'] - point.lat)**2 + (n['lon'] - point.lon)**2
            if d < min_d:
                min_d = d
                best_node = nid
        return best_node
    
    orig_node = snap(request.origin)
    dest_node = snap(request.destination)
    
    import heapq
    adj = {n: [] for n in nodes}
    for e in edges:
        u = e['start_node']
        v = e['end_node']
        adj[u].append((v, e))
        if not e.get('one_way', False):
            adj[v].append((u, e))
    
    dist = {n: float('inf') for n in nodes}
    prev = {n: None for n in nodes}
    dist[orig_node] = 0.0
    pq = [(0.0, orig_node)]
    
    mode = request.mode.upper()
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        if u == dest_node: break
        for v, edge in adj[u]:
            t = edge['travel_time_min']
            if mode == 'FASTEST':
                cost = t
            else:
                risk = edge.get('ai_risk', {}).get('disruption_probability', 0.05)
                status_p = 45.0 if edge.get('status') == 'RISKY' else 0.0
                cost = t + (risk * 300.0) + status_p
            if dist[u] + cost < dist[v]:
                dist[v] = dist[u] + cost
                prev[v] = (u, edge)
                heapq.heappush(pq, (dist[v], v))
    
    if dist[dest_node] == float('inf'):
        raise HTTPException(status_code=404, detail="No viable OSM route found")
    
    path_edges = []
    curr = dest_node
    while prev[curr] is not None:
        p, edge = prev[curr]
        path_edges.append(edge)
        curr = p
    path_edges.reverse()
    
    total_dist = sum(e['distance_km'] for e in path_edges)
    total_time = sum(e['travel_time_min'] for e in path_edges)
    risks = [e.get('ai_risk', {}).get('disruption_probability', 0.05) for e in path_edges]
    avg_risk = sum(risks) / len(risks) if risks else 0
    max_risk = max(risks) if risks else 0
    
    # Merge coords into GeoJSON LineString
    merged_coords = []
    for idx, e in enumerate(path_edges):
        coords = e['coordinates']
        if idx == 0:
            merged_coords.extend(coords)
        else:
            if merged_coords[-1] == coords[0]:
                merged_coords.extend(coords[1:])
            else:
                merged_coords.extend(coords[::-1])
                
    return {
        "route_id": f"OSM-{mode}-{len(path_edges)}",
        "mode": mode,
        "distance_km": round(total_dist, 1),
        "baseline_travel_time_min": round(total_time, 1),
        "predicted_delay_min": round(total_time * avg_risk * 0.15, 1),
        "predicted_eta_min": round(total_time * (1 + avg_risk * 0.15), 1),
        "average_risk": round(avg_risk, 3),
        "maximum_risk": round(max_risk, 3),
        "risk_level": "HIGH" if max_risk > 0.7 else "MEDIUM" if max_risk > 0.35 else "LOW",
        "geometry": {
            "type": "LineString",
            "coordinates": merged_coords
        },
        "segments": [e['road_id'] for e in path_edges],
        "directions": [f"Follow {e['name'] or 'OSM Highway'}" for e in path_edges[::30]]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
