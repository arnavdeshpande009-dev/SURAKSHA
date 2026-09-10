from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import numpy as np
from typing import Dict, Any

def evaluate_model(y_true, y_pred_labels, y_pred_probs) -> Dict[str, Any]:
    """Calculates classification metrics for model evaluation."""
    metrics = {
        'accuracy': float(accuracy_score(y_true, y_pred_labels)),
        'precision': float(precision_score(y_true, y_pred_labels)),
        'recall': float(recall_score(y_true, y_pred_labels)),
        'f1_score': float(f1_score(y_true, y_pred_labels)),
        'roc_auc': float(roc_auc_score(y_true, y_pred_probs)),
        'confusion_matrix': confusion_matrix(y_true, y_pred_labels).tolist()
    }
    return metrics
