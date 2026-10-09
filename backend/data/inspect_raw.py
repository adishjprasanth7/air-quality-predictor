import csv
import json
import os
from collections import defaultdict

FILE_PATH = os.path.join(os.path.dirname(__file__), "city_day.csv")

def inspect_dataset():
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} does not exist")
        return

    total_rows = 0
    header = []
    missing_counts = defaultdict(int)
    row_hashes = set()
    duplicate_rows = 0
    sample_values = defaultdict(list)
    
    # Store numeric values for statistics
    numeric_data = defaultdict(list)
    
    with open(FILE_PATH, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            total_rows += 1
            row_tuple = tuple(row)
            if row_tuple in row_hashes:
                duplicate_rows += 1
            else:
                row_hashes.add(row_tuple)
                
            for col_idx, col_name in enumerate(header):
                val_str = row[col_idx].strip() if col_idx < len(row) else ""
                if val_str == "" or val_str.lower() == "nan" or val_str.lower() == "null":
                    missing_counts[col_name] += 1
                else:
                    if len(sample_values[col_name]) < 5:
                        sample_values[col_name].append(val_str)
                    try:
                        num_val = float(val_str)
                        numeric_data[col_name].append(num_val)
                    except ValueError:
                        pass

    # Column classification
    num_cols = []
    cat_cols = []
    col_stats = {}
    
    for col in header:
        vals = numeric_data[col]
        non_null_count = total_rows - missing_counts[col]
        # If > 90% of non-null values can be parsed as float, it's numerical
        if non_null_count > 0 and (len(vals) / non_null_count) > 0.9:
            num_cols.append(col)
            min_val = min(vals) if vals else None
            max_val = max(vals) if vals else None
            avg_val = sum(vals) / len(vals) if vals else None
            col_stats[col] = {
                "type": "Numerical (float)",
                "min": round(min_val, 2) if min_val is not None else None,
                "max": round(max_val, 2) if max_val is not None else None,
                "mean": round(avg_val, 2) if avg_val is not None else None,
            }
        else:
            cat_cols.append(col)
            col_stats[col] = {
                "type": "Categorical (string)",
                "sample_values": sample_values[col]
            }

    # Target variable analysis
    target_name = "AQI" if "AQI" in header else None
    target_stats = {}
    if target_name:
        aqi_vals = numeric_data[target_name]
        target_stats = {
            "total_records": total_rows,
            "non_null_records": len(aqi_vals),
            "missing_records": missing_counts[target_name],
            "missing_pct": round((missing_counts[target_name] / total_rows) * 100, 2),
            "min_aqi": min(aqi_vals) if aqi_vals else None,
            "max_aqi": max(aqi_vals) if aqi_vals else None,
            "mean_aqi": round(sum(aqi_vals) / len(aqi_vals), 2) if aqi_vals else None,
        }

    report = {
        "file_name": "city_day.csv",
        "total_rows": total_rows,
        "total_columns": len(header),
        "columns": header,
        "duplicate_rows": duplicate_rows,
        "missing_counts": dict(missing_counts),
        "missing_percentages": {c: round((missing_counts[c] / total_rows) * 100, 2) for c in header},
        "numerical_columns": num_cols,
        "categorical_columns": cat_cols,
        "column_stats": col_stats,
        "target_variable": target_name,
        "target_stats": target_stats,
    }

    out_path = os.path.join(os.path.dirname(__file__), "dataset_profile.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("--- DATASET PROFILE SUMMARY ---")
    print(f"Total Rows: {total_rows}")
    print(f"Total Columns: {len(header)}")
    print(f"Duplicate Rows: {duplicate_rows}")
    print(f"Target Column: {target_name} (Valid: {target_stats.get('non_null_records')}, Missing: {target_stats.get('missing_records')} [{target_stats.get('missing_pct')}%])")
    print(f"Numerical Columns ({len(num_cols)}): {num_cols}")
    print(f"Categorical Columns ({len(cat_cols)}): {cat_cols}")
    print("Column Missing Counts:")
    for c in header:
        print(f"  - {c}: {missing_counts[c]} ({report['missing_percentages'][c]}%)")

if __name__ == "__main__":
    inspect_dataset()
