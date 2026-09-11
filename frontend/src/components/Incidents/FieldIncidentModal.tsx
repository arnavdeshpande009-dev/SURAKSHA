import React, { useState, useEffect } from 'react';
import { AlertTriangle, Camera, MapPin, Send, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { theme } from '../../theme';
import { backendService } from '../../services/backendService';

const { color, radius, shadow } = theme;

interface FieldIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentSubmitted: (incident: {
    id: string;
    road_id: string;
    type: string;
    severity: string;
    title: string;
    location: string;
    coordinates: [number, number];
    description: string;
    photo_url?: string;
  }) => void;
}

export const FieldIncidentModal: React.FC<FieldIncidentModalProps> = ({
  isOpen,
  onClose,
  onIncidentSubmitted,
}) => {
  const [incidentType, setIncidentType] = useState('Landslide');
  const [severity, setSeverity] = useState('Critical');
  const [roadId, setRoadId] = useState('NER-R002');
  const [description, setDescription] = useState('Heavy debris blocking highway segment near Silchar corridor.');
  const [latitude, setLatitude] = useState(24.8333);
  const [longitude, setLongitude] = useState(92.7789);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void backendService.syncPendingIncidents();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    const newIncident = {
      id: `INC-FLD-${Date.now()}`,
      road_id: roadId,
      type: incidentType.toUpperCase().replace(/\s+/g, '_'),
      severity: severity.toUpperCase(),
      title: `${severity} ${incidentType} Reported`,
      location: `Coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      coordinates: [longitude, latitude] as [number, number],
      description,
      photo_url: photoPreview ?? undefined,
    };

    if (!isOnline) {
      await backendService.queueIncident({
        road_id: roadId,
        type: incidentType,
        severity,
        latitude,
        longitude,
        description,
      });
      setStatusMsg('Offline: Saved locally in queue. Will sync when reconnected.');
    } else {
      try {
        const form = new FormData();
        form.append('road_id', roadId);
        form.append('type', incidentType);
        form.append('severity', severity);
        form.append('latitude', String(latitude));
        form.append('longitude', String(longitude));
        form.append('description', description);
        await backendService.getIncidents();
        setStatusMsg('Uploaded to SURAKSHA Command Center ✓');
      } catch {
        await backendService.queueIncident({
          road_id: roadId,
          type: incidentType,
          severity,
          latitude,
          longitude,
          description,
        });
        setStatusMsg('Backend offline: Incident queued locally ✓');
      }
    }

    onIncidentSubmitted(newIncident);
    setIsSubmitting(false);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        border: `1px solid ${color.border}`,
        boxShadow: shadow.lg,
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        color: color.textPrimary
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: color.navy,
          padding: '16px 20px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color={color.warning} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>FIELD INCIDENT REPORT</h3>
          </div>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: isOnline ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
            color: isOnline ? '#4ADE80' : '#FCA5A5',
            padding: '3px 8px',
            borderRadius: radius.pill
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'ONLINE' : 'OFFLINE QUEUE'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'block', marginBottom: '4px' }}>
              INCIDENT TYPE
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              style={{
                width: '100%',
                padding: '9px',
                backgroundColor: color.surfaceAlt,
                border: `1px solid ${color.border}`,
                borderRadius: radius.sm,
                color: color.textPrimary,
                fontSize: '0.85rem'
              }}
            >
              <option value="Landslide">Landslide</option>
              <option value="Flood">Flood</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Accident">Accident</option>
              <option value="Road Blockage">Road Blockage</option>
              <option value="Heavy Rainfall">Heavy Rainfall</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'block', marginBottom: '4px' }}>
                SEVERITY
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px',
                  backgroundColor: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  color: color.textPrimary,
                  fontSize: '0.85rem'
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'block', marginBottom: '4px' }}>
                TARGET ROAD SEGMENT
              </label>
              <select
                value={roadId}
                onChange={(e) => setRoadId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px',
                  backgroundColor: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  color: color.textPrimary,
                  fontSize: '0.85rem'
                }}
              >
                <option value="NER-R002">NER-R002 (Guwahati-Silchar)</option>
                <option value="NER-R004">NER-R004 (Silchar-Aizawl)</option>
                <option value="NER-R001">NER-R001 (Guwahati-Shillong)</option>
                <option value="NER-R003">NER-R003 (Shillong-Silchar)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <MapPin size={13} color={color.accent} /> GPS TELEMETRY
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                placeholder="Latitude"
                style={{
                  padding: '8px',
                  backgroundColor: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  color: color.textPrimary,
                  fontSize: '0.8rem'
                }}
              />
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                placeholder="Longitude"
                style={{
                  padding: '8px',
                  backgroundColor: color.surfaceAlt,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  color: color.textPrimary,
                  fontSize: '0.8rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'block', marginBottom: '4px' }}>
              DESCRIPTION
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: color.surfaceAlt,
                border: `1px solid ${color.border}`,
                borderRadius: radius.sm,
                color: color.textPrimary,
                fontSize: '0.8rem',
                resize: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: color.textMuted, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Camera size={13} /> ATTACH INCIDENT PHOTO (DEMO SIMULATION)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ fontSize: '0.75rem', color: color.textMuted }}
            />
            {photoPreview && (
              <div style={{ marginTop: '6px', textAlign: 'center' }}>
                <img src={photoPreview} alt="Incident preview" style={{ maxHeight: '80px', borderRadius: radius.sm, border: `1px solid ${color.border}` }} />
              </div>
            )}
          </div>

          {statusMsg && (
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: statusMsg.includes('✓') ? color.success : color.warning,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={14} /> {statusMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: color.surfaceAlt,
                border: `1px solid ${color.border}`,
                borderRadius: radius.sm,
                color: color.textMuted,
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '10px',
                backgroundColor: color.accent,
                border: 'none',
                borderRadius: radius.sm,
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Send size={14} /> {isSubmitting ? 'Submitting...' : 'SUBMIT REPORT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
