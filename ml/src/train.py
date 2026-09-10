import os
import joblib
import pandas as pd
from xgboost import XGBClassifier
from data_prep import prepare_data
from evaluation import evaluate_model
from features import FEATURE_COLUMNS
from generate_data import generate_synthetic_data

def train_xgb_model(data_path: str = None, model_output_path: str = None):
    """Trains an XGBoost classifier on the road disruption dataset."""
    if data_path and os.path.exists(data_path):
        print(f"Loading data from: {data_path}")
        df = pd.read_csv(data_path)
    else:
        print("Data path not provided or found. Generating synthetic dataset...")
        df = generate_synthetic_data()

    X_train, X_test, y_train, y_test = prepare_data(df)

    # Initialize XGBoost Classifier
    model = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )

    # Fit model
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    metrics = evaluate_model(y_test, y_pred, y_probs)

    print("\n--- DEMONSTRATION / SYNTHETIC DATA EVALUATION METRICS ---")
    print(f"Accuracy : {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall   : {metrics['recall']:.4f}")
    print(f"F1 Score : {metrics['f1_score']:.4f}")
    print(f"ROC AUC  : {metrics['roc_auc']:.4f}")
    print(f"Confusion Matrix:\n{metrics['confusion_matrix']}")
    print("-----------------------------------------------------------\n")

    # Save model artifact
    if not model_output_path:
        model_output_path = os.path.join(os.path.dirname(__file__), '../models/xgb_road_disruption.joblib')

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    print(f"Model saved successfully to: {model_output_path}")

    return model, metrics

if __name__ == '__main__':
    csv_path = os.path.join(os.path.dirname(__file__), '../../data/demo/synthetic_road_disruption.csv')
    train_xgb_model(data_path=csv_path)
