import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from features import FEATURE_COLUMNS, TARGET_COLUMN

def validate_dataframe(df: pd.DataFrame) -> bool:
    """Ensures required columns exist and checks for data integrity."""
    missing_cols = [col for col in FEATURE_COLUMNS if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required feature columns: {missing_cols}")
    return True

def prepare_data(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Validates, cleans missing values, and splits data into train/test sets."""
    from sklearn.model_selection import train_test_split
    validate_dataframe(df)
    
    # Handle missing values by median imputation
    X = df[FEATURE_COLUMNS].fillna(df[FEATURE_COLUMNS].median())
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    return X_train, X_test, y_train, y_test
