# Dataset Analysis Report: Air Quality Index (AQI)

## 1. Dataset Overview & Source
The dataset utilized in this project is the official **Central Pollution Control Board (CPCB) Daily Ambient Air Quality Monitoring Data** (`city_day.csv`), widely recognized as the benchmark environmental repository for Indian cities on Kaggle. It tracks day-level criteria pollutant concentrations and the resulting statutory Air Quality Index (AQI).

- **File Name:** `backend/data/city_day.csv`
- **Total Records (Rows):** 29,531
- **Total Features (Columns):** 16
- **Duplicate Records:** 0 (0.0%)

---

## 2. Feature & Variable Inventory

### Target Variable
- **Target Column:** `AQI` (Air Quality Index)
- **Nature:** Continuous Numerical Variable (Regression Target)
- **Valid Ground-Truth Records:** 24,850 records (84.15%)
- **Missing Ground-Truth Records:** 4,681 records (15.85%)
- **Statistical Spread:**
  - Minimum AQI: `13.0`
  - Maximum AQI: `2049.0`
  - Mean AQI: `166.46`

### Categorical Columns (3)
1. **`City`** (String): Monitored municipal boundary (e.g., Delhi, Mumbai, Ahmedabad, Bengaluru). 0% missing.
2. **`Date`** (String / Date): Daily observation date. 0% missing.
3. **`AQI_Bucket`** (String): Categorical classification corresponding to NAQI standards (`Good`, `Satisfactory`, `Moderate`, `Poor`, `Very Poor`, `Severe`). Missing in 4,681 rows (15.85%).

### Numerical Columns (13)
| Column Name | Metric Type | Min | Mean | Max | Missing Count | Missing % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PM2.5** | Particulate (≤ 2.5 µm) | 0.04 | 67.45 | 949.99 | 4,598 | 15.57% |
| **PM10** | Particulate (≤ 10 µm) | 0.01 | 118.13 | 1000.00 | 11,140 | 37.72% |
| **NO** | Nitric Oxide (µg/m³) | 0.02 | 17.57 | 390.68 | 3,582 | 12.13% |
| **NO2** | Nitrogen Dioxide (µg/m³) | 0.01 | 28.56 | 362.21 | 3,585 | 12.14% |
| **NOx** | Nitrogen Oxides (µg/m³) | 0.00 | 32.31 | 467.63 | 4,185 | 14.17% |
| **NH3** | Ammonia (µg/m³) | 0.01 | 23.48 | 352.89 | 10,328 | 34.97% |
| **CO** | Carbon Monoxide (mg/m³) | 0.00 | 2.25 | 175.81 | 2,059 | 6.97% |
| **SO2** | Sulfur Dioxide (µg/m³) | 0.01 | 14.53 | 193.86 | 3,854 | 13.05% |
| **O3** | Ground-Level Ozone (µg/m³) | 0.01 | 34.49 | 257.73 | 4,022 | 13.62% |
| **Benzene** | Hydrocarbon (µg/m³) | 0.00 | 3.28 | 455.03 | 5,623 | 19.04% |
| **Toluene** | Hydrocarbon (µg/m³) | 0.00 | 8.70 | 454.85 | 8,041 | 27.23% |
| **Xylene** | Hydrocarbon (µg/m³) | 0.00 | 3.07 | 170.37 | 18,109 | 61.32% |
| **AQI** | Calculated Index (Target) | 13.00 | 166.46 | 2049.00 | 4,681 | 15.85% |

---

## 3. Selected Model Features
For production inference and student evaluation, the 6 core criteria pollutants defined by international air quality standards (CPCB / US EPA) are chosen as the active ML features:
1. `PM2.5` (Fine Particulate Matter)
2. `PM10` (Coarse Particulate Matter)
3. `NO2` (Nitrogen Dioxide)
4. `CO` (Carbon Monoxide)
5. `SO2` (Sulfur Dioxide)
6. `O3` (Ozone)

**Rationale:**
- These 6 pollutants form the statutory foundation for calculating standard Air Quality Sub-Indices.
- Secondary VOC pollutants such as `Xylene` (61.32% missing) and `Toluene` (27.23% missing) exhibit high missingness across city monitoring stations, reducing their operational utility.
- Limiting the feature set to the 6 primary criteria pollutants makes the prediction system practically deployable for end users, municipal stations, and portable sensors.

---

## 4. Preprocessing Requirements

1. **Target Filtering:**
   - Drop rows where `AQI` is `NaN` (4,681 records). Supervised regression requires ground-truth targets for authentic learning.
   - Verified training set size: **24,850 ground-truth records**.

2. **Missing Value Imputation:**
   - Use `SimpleImputer(strategy='median')` to handle sensor dropouts in pollutant values without distorting skewed atmospheric distributions.

3. **Feature Scaling:**
   - Standardize inputs via `StandardScaler()` so differing measurement units (e.g., mg/m³ for CO vs µg/m³ for PM2.5) are normalized for regression stability.

4. **Holdout Validation:**
   - 80% Training (19,880 samples) and 20% Holdout Testing (4,970 samples) using a deterministic `random_state=42`.

5. **Inference Consistency:**
   - The exact Scikit-learn Pipeline created during training is serialized with Joblib and loaded by the FastAPI endpoint, guaranteeing identical imputation and scaling transformations.
