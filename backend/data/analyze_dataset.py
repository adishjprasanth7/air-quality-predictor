import json
import os
import pandas as pd
import numpy as np

DATA_PATH = os.path.join(os.path.dirname(__file__), "city_day.csv")

def analyze():
    if not os.path.exists(DATA_PATH):
        print(f"Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    rows, cols = df.shape
    columns = list(df.columns)
    
    missing_counts = df.isnull().sum().to_dict()
    missing_pct = ((df.isnull().sum() / rows) * 100).round(2).to_dict()
    
    duplicates = int(df.duplicated().sum())
    
    dtypes = {col: str(df[col].dtype) for col in df.columns}
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # AQI availability
    aqi_present = "AQI" in df.columns
    aqi_valid_count = int(df["AQI"].dropna().count()) if aqi_present else 0
    aqi_missing = int(df["AQI"].isnull().sum()) if aqi_present else rows
    
    # Summary statistics for numeric features
    describe_num = df[num_cols].describe().to_dict()
    
    # Correlations with AQI if AQI is numeric
    correlations = {}
    if aqi_present and "AQI" in num_cols:
        corrs = df[num_cols].corr()["AQI"].sort_values(ascending=False).to_dict()
        correlations = {k: round(v, 4) for k, v in corrs.items() if not np.isnan(v)}

    result = {
        "shape": {"rows": rows, "cols": cols},
        "columns": columns,
        "missing_counts": missing_counts,
        "missing_pct": missing_pct,
        "duplicates": duplicates,
        "dtypes": dtypes,
        "numerical_columns": num_cols,
        "categorical_columns": cat_cols,
        "target": "AQI" if aqi_present else None,
        "aqi_valid_count": aqi_valid_count,
        "aqi_missing": aqi_missing,
        "correlations_with_aqi": correlations,
        "cities_count": int(df["City"].nunique()) if "City" in df.columns else 0,
        "cities": df["City"].unique().tolist() if "City" in df.columns else [],
        "date_range": [str(df["Date"].min()), str(df["Date"].max())] if "Date" in df.columns else []
    }
    
    with open(os.path.join(os.path.dirname(__file__), "analysis_summary.json"), "w") as f:
        json.dump(result, f, indent=2)
        
    print("ANALYSIS COMPLETED SUCCESSFULLY.")
    print(f"Total Rows: {rows}, Total Columns: {cols}")
    print(f"Duplicate rows: {duplicates}")
    print(f"Target column: {'AQI' if aqi_present else 'None'} (Valid non-null rows: {aqi_valid_count})")
    print(f"Numerical columns ({len(num_cols)}): {num_cols}")
    print(f"Categorical columns ({len(cat_cols)}): {cat_cols}")
    print(f"Top correlated pollutants with AQI: {correlations}")

if __name__ == "__main__":
    analyze()
