"""
Model training and evaluation pipeline for Air Quality Predictor.
Trains Linear Regression, Random Forest, and Gradient Boosting Regressors,
evaluates using MAE, RMSE, and R2 on a holdout test set, compares them,
and saves the highest-performing pipeline and performance report.
"""

import os
import json
import datetime
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from preprocessing.preprocessor import FEATURE_COLUMNS, TARGET_COLUMN

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "city_day.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "model")
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "air_quality_model.pkl")
INFO_SAVE_PATH = os.path.join(MODEL_DIR, "model_info.json")

def load_and_clean_data(file_path: str):
    print(f"[1/5] Loading dataset from {file_path}...")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at: {file_path}")
        
    df = pd.read_csv(file_path)
    total_raw_rows = len(df)
    
    # Check required columns
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")

    # Remove duplicates
    duplicates_count = df.duplicated().sum()
    df = df.drop_duplicates()

    # We must drop rows where target AQI is missing because real training requires ground-truth labels
    df_clean = df.dropna(subset=[TARGET_COLUMN]).copy()
    
    # Filter out records where all features are NaN
    df_clean = df_clean.dropna(subset=FEATURE_COLUMNS, how="all")

    # Filter physically impossible negative pollutant readings
    for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
        df_clean = df_clean[df_clean[col].isna() | (df_clean[col] >= 0)]

    print(f"       Raw rows: {total_raw_rows}")
    print(f"       Duplicates removed: {duplicates_count}")
    print(f"       Cleaned rows with valid target AQI: {len(df_clean)}")
    
    return df_clean

def train_and_evaluate():
    os.makedirs(MODEL_DIR, exist_ok=True)
    df = load_and_clean_data(DATA_PATH)
    
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    
    print(f"[2/5] Splitting dataset (80% train, 20% test, random_state=42)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"       Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    
    # Candidate models for comparison
    candidates = {
        "Linear Regression": LinearRegression(),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=100,
            max_depth=16,
            random_state=42,
            n_jobs=-1
        ),
        "Gradient Boosting Regressor": GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
    }
    
    evaluation_results = {}
    pipelines = {}
    
    print("[3/5] Training and evaluating candidate models...")
    for name, estimator in candidates.items():
        print(f"       Training {name}...")
        pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("model", estimator)
        ])
        
        # Fit on training data
        pipe.fit(X_train, y_train)
        
        # Predict on holdout test set
        y_pred = pipe.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, y_pred))
        mse = float(mean_squared_error(y_test, y_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, y_pred))
        
        evaluation_results[name] = {
            "MAE": round(mae, 3),
            "RMSE": round(rmse, 3),
            "R2_Score": round(r2, 4)
        }
        pipelines[name] = pipe
        print(f"       -> {name}: MAE={mae:.3f}, RMSE={rmse:.3f}, R²={r2:.4f}")

    # Determine best model based on R2 Score
    best_model_name = max(evaluation_results, key=lambda k: evaluation_results[k]["R2_Score"])
    best_pipeline = pipelines[best_model_name]
    best_metrics = evaluation_results[best_model_name]
    
    print(f"[4/5] Selected best model: {best_model_name} (R² = {best_metrics['R2_Score']})")
    
    # Extract feature importance if available
    feature_importance = {}
    model_step = best_pipeline.named_steps["model"]
    if hasattr(model_step, "feature_importances_"):
        importances = model_step.feature_importances_
        feature_importance = {
            col: round(float(imp), 4)
            for col, imp in zip(FEATURE_COLUMNS, importances)
        }
    elif hasattr(model_step, "coef_"):
        coefs = np.abs(model_step.coef_)
        total = np.sum(coefs) if np.sum(coefs) > 0 else 1.0
        feature_importance = {
            col: round(float(c / total), 4)
            for col, c in zip(FEATURE_COLUMNS, coefs)
        }
        
    # Sort feature importance descending
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    print(f"       Feature Importances: {feature_importance}")

    # Save model pipeline
    print(f"[5/5] Saving model pipeline to {MODEL_SAVE_PATH}...")
    joblib.dump(best_pipeline, MODEL_SAVE_PATH)
    
    # Prepare metadata
    model_metadata = {
        "model_name": best_model_name,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "trained_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "best_metrics": best_metrics,
        "all_model_evaluations": evaluation_results,
        "feature_importance": feature_importance,
        "dataset_info": {
            "source": "CPCB / Kaggle Air Quality Data in India (city_day.csv)",
            "total_records_used": len(df),
            "train_records": len(X_train),
            "test_records": len(X_test),
            "split_ratio": "80/20",
            "random_state": 42
        }
    }
    
    with open(INFO_SAVE_PATH, "w") as f:
        json.dump(model_metadata, f, indent=2)
        
    print(f"       Model metadata saved to {INFO_SAVE_PATH}")
    print("SUCCESS: Pipeline trained, evaluated, and saved.")
    return model_metadata

if __name__ == "__main__":
    train_and_evaluate()
