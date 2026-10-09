# AI-Based Air Quality Predictor

An end-to-end Machine Learning web application designed to predict the real-time **Air Quality Index (AQI)** based on authentic environmental pollutant measurements. Developed as a college evaluation project emphasizing real Machine Learning pipelines, full mathematical explainability, and enterprise architecture.

---

## 1. Project Objective
To construct a genuine, non-hardcoded machine learning system capable of taking ambient pollutant concentrations (`PM2.5`, `PM10`, `NO2`, `CO`, `SO2`, `O3`) and accurately predicting the continuous Air Quality Index (AQI), categorizing it according to National Air Quality Index (NAQI) risk grades, and providing actionable health advisories.

---

## 2. Key Features
- **Authentic Scikit-Learn Pipeline:** Uses actual trained regression models saved as serialized Joblib artifacts (`air_quality_model.pkl`).
- **Deterministic Preprocessing:** Median imputation for sensor dropouts and standard scaling serialized within the pipeline to avoid data leakage.
- **Model Governance & Transparency:** Live evaluator interface comparing Linear Regression, Random Forest, and Gradient Boosting regressors with actual MAE, RMSE, and $R^2$ scores.
- **Feature Importance Analysis:** Real model weight extraction showing pollutant contribution percentages (`PM2.5: ~49.4%`, `CO: ~42.8%`, `PM10: ~4.2%`).
- **Interactive UI with Presets:** Custom pollutant sliders alongside real-world environmental presets (*Clean Atmosphere*, *Moderate Urban*, *High Pollution*, *Severe Smog Crisis*).
- **Persistent Telemetry:** Audits every user prediction with input parameters, timestamp, and AQI classification to MongoDB.
- **Analytics Dashboard:** Recharts trend timelines and particulate distribution comparisons with empty-state handling.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Machine Learning** | Python 3.13, Scikit-learn, Pandas, NumPy, Scipy, Joblib |
| **Backend API** | FastAPI, Uvicorn, Pydantic, Python-dotenv |
| **Database** | MongoDB (Local / MongoDB Atlas via PyMongo) |
| **Frontend UI** | React.js (Vite), Tailwind CSS, Recharts, Lucide Icons |
| **DevOps / Hosting** | Vercel (Frontend), Render / Railway (Backend), Git |

---

## 4. Dataset Information
- **Source:** Central Pollution Control Board (CPCB) Daily Ambient Air Quality Monitoring Data (`city_day.csv`).
- **Total Records:** 29,531 rows, 16 features.
- **Ground-Truth Labeled Instances:** 24,801 rows with verified non-null target AQI.
- **Target Variable:** `AQI` (Continuous Numerical Regression Target, Range: 13.0 to 2049.0, Mean: 166.46).
- **Primary Input Features:**
  - `PM2.5` (µg/m³): Fine Particulate Matter
  - `PM10` (µg/m³): Coarse Particulate Matter
  - `NO2` (µg/m³): Nitrogen Dioxide
  - `CO` (mg/m³): Carbon Monoxide
  - `SO2` (µg/m³): Sulfur Dioxide
  - `O3` (µg/m³): Ground-Level Ozone

Detailed data profiling is documented in [`DATASET_ANALYSIS.md`](./DATASET_ANALYSIS.md).

---

## 5. Machine Learning Methodology & Architecture

### System Architecture Flowchart
```
                [ CPCB Dataset (city_day.csv) ]
                                |
                                v
               [ Data Cleaning & Drop Missing AQI ]
                                |
                                v
            [ Feature Selection (6 Criteria Pollutants) ]
                                |
                                v
           [ Train/Test Split (80% Train / 20% Test, Seed 42) ]
                                |
                                v
    +---------------------------+---------------------------+
    |                           |                           |
    v                           v                           v
[ Linear Regression ]   [ Random Forest ]      [ Gradient Boosting ]
    |                           |                           |
    +---------------------------+---------------------------+
                                |
                                v
                  [ Holdout Test Set Evaluation ]
                                |
                                v
            [ Champion Selection: Gradient Boosting (R²=0.871) ]
                                |
                                v
               [ Saved Joblib Pipeline & Metadata ]
                                |
                                v
                       [ FastAPI Microservice ]
                                ^
                                | (HTTP REST)
                                v
                     [ React Frontend Dashboard ]
                                |
                                v
                      [ User Input / Presets ]
                                |
                                v
                      [ Prediction Result & Risk ]
                                |
                                v
                     [ MongoDB Audit Storage ]
                                |
                                v
                    [ Recharts Visual Analytics ]
```

---

## 6. Model Evaluation Benchmark (Real Computed Results)

The candidate models were evaluated on the 20% holdout test set (4,961 unseen samples) using deterministic seed `42`:

| Model | $R^2$ Score | RMSE | MAE | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Gradient Boosting Regressor** | **0.8710** | **48.424** | **22.688** | **Selected Champion Model** |
| Random Forest Regressor | 0.8665 | 49.267 | 22.361 | Benchmark Candidate |
| Linear Regression | 0.7702 | 64.631 | 31.801 | Baseline Candidate |

### Feature Importance Weights
- **PM2.5:** 49.44%
- **CO:** 42.83%
- **PM10:** 4.23%
- **SO2:** 1.36%
- **NO2:** 1.35%
- **O3:** 0.80%

---

## 7. Project Directory Structure
```
air-quality-predictor/
├── backend/
│   ├── data/
│   │   ├── city_day.csv             # Official CPCB training dataset
│   │   ├── inspect_raw.py           # Dataset profile generator
│   │   └── dataset_profile.json     # Profiling summary
│   ├── model/
│   │   ├── air_quality_model.pkl    # Serialized Scikit-learn pipeline
│   │   └── model_info.json          # Verified benchmark & metrics metadata
│   ├── preprocessing/
│   │   └── preprocessor.py          # Features, NAQI categories & advisories
│   ├── training/
│   │   └── train.py                 # Multi-model training and evaluation script
│   ├── main.py                      # FastAPI microservice
│   ├── test_api.py                  # API test suite
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── HomeView.jsx         # AQI fundamentals and guide
│   │   │   ├── PredictView.jsx      # Input sliders, presets, and result gauge
│   │   │   ├── DashboardView.jsx    # Real-time Recharts trend analytics
│   │   │   ├── ModelInfoView.jsx    # College evaluator model transparency view
│   │   │   └── ProjectFlowView.jsx  # Complete visual project workflow
│   │   ├── App.jsx                  # Main view coordinator
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Dark mode & glassmorphism design tokens
│   ├── package.json                 # Frontend dependencies
│   ├── index.html                   # HTML entry point with meta tags
│   └── vercel.json                  # Single-page app routing for Vercel
├── .env.example                     # Environment configuration template
├── DATASET_ANALYSIS.md              # Stage 1 dataset inspection documentation
├── Procfile                         # Cloud deployment process file
└── package.json                     # Root convenience scripts
```

---

## 8. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Environment Configuration
```bash
git clone <repository-url>
cd "air quality predictor"
cp .env.example .env
```

### 2. Backend Installation & Training
```bash
# Install Python packages
python -m pip install -r backend/requirements.txt

# Train the ML models and generate the pipeline
python backend/training/train.py

# Test all API endpoints
python backend/test_api.py
```

### 3. Frontend Installation
```bash
cd frontend
npm install
cd ..
```

---

## 9. Running Locally

### Start Backend API
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Alternative Redoc Documentation: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### Start Frontend Dashboard
In a separate terminal:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 10. API Specification

| Endpoint | Method | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | API Information & Service Discovery | Returns project description & version |
| `/health` | `GET` | Health Check & Database Status | Checks model presence and MongoDB connection |
| `/model-info` | `GET` | Live ML Metrics & Feature Weights | Returns genuine holdout $R^2$, RMSE, MAE |
| `/predict` | `POST` | Execute ML Pipeline Inference | `{"PM2.5": 65, "PM10": 120, "NO2": 38, "CO": 1.1, "SO2": 15, "O3": 32}` |
| `/predictions` | `GET` | Retrieve Prediction Audit History | Returns list of historical prediction runs |

---

## 11. Deployment Guide

### Frontend Deployment (Vercel)
1. Push the code to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `frontend`.
3. Build command: `npm run build`, Output directory: `dist`.
4. Deploy.

### Backend Deployment (Render / Railway)
1. In Render, select **New Web Service** from your GitHub repo.
2. Set the **Build Command** to: `pip install -r backend/requirements.txt && python backend/training/train.py`
3. Set the **Start Command** to: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `CORS_ORIGINS`: Your Vercel frontend URL.

---

## 12. College Evaluator Quick Reference
When presenting this project to an evaluator:
1. **Explain Dataset Authenticity:** Open [`DATASET_ANALYSIS.md`](./DATASET_ANALYSIS.md) and explain the 29,531 records from CPCB.
2. **Demonstrate Model Governance:** Show the **"ML Model & Evaluation"** tab on the web app. Highlight the holdout comparison where Gradient Boosting achieved an $R^2$ of `0.8710`.
3. **Run Live Predictions:** Use the presets or enter extreme pollutant numbers to demonstrate how the model continuously adjusts the AQI and triggers the appropriate NAQI health alerts.
4. **Show Audit Trails:** Navigate to the **"Dashboard & History"** tab to demonstrate how predictions are saved and plotted sequentially in Recharts.
