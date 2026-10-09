import os
import json
import datetime
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Preprocessing helpers
from preprocessing.preprocessor import (
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    get_aqi_classification
)

# Configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "model", "air_quality_model.pkl"))
MODEL_INFO_PATH = os.getenv("MODEL_INFO_PATH", os.path.join(os.path.dirname(__file__), "model", "model_info.json"))

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/air_quality_db")
DB_NAME = os.getenv("DB_NAME", "air_quality_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "predictions")

# Initialize FastAPI App
app = FastAPI(
    title="AI-Based Air Quality Predictor API",
    description="Production-grade REST API providing real-time Machine Learning AQI predictions, model transparency, and history tracking.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache and DB client
model_pipeline = None
mongo_client = None
mongo_collection = None
fallback_memory_store: List[Dict[str, Any]] = []

def init_db():
    global mongo_client, mongo_collection
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Test connection
        mongo_client.admin.command('ping')
        db = mongo_client[DB_NAME]
        mongo_collection = db[COLLECTION_NAME]
        print("[MongoDB] Connected successfully to:", MONGODB_URI)
    except Exception as e:
        mongo_client = None
        mongo_collection = None
        print(f"[MongoDB] Connection warning (using in-memory fallback): {e}")

def get_loaded_model():
    global model_pipeline
    if model_pipeline is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Trained model not found at {MODEL_PATH}. Please run backend/training/train.py first."
            )
        try:
            model_pipeline = joblib.load(MODEL_PATH)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load trained model: {str(e)}"
            )
    return model_pipeline

# Lifecycle startup event
@app.on_event("startup")
async def startup_event():
    init_db()
    if os.path.exists(MODEL_PATH):
        try:
            get_loaded_model()
            print("[ML Model] Preloaded trained pipeline successfully.")
        except Exception as e:
            print(f"[ML Model] Warning on startup load: {e}")

# Pydantic Schemas
class PredictionRequest(BaseModel):
    pm25: float = Field(..., alias="PM2.5", ge=0, le=1000, description="PM2.5 concentration in µg/m³")
    pm10: float = Field(..., alias="PM10", ge=0, le=1500, description="PM10 concentration in µg/m³")
    no2: float = Field(..., alias="NO2", ge=0, le=1000, description="NO2 concentration in µg/m³")
    co: float = Field(..., alias="CO", ge=0, le=200, description="CO concentration in mg/m³")
    so2: float = Field(..., alias="SO2", ge=0, le=1000, description="SO2 concentration in µg/m³")
    o3: float = Field(..., alias="O3", ge=0, le=1000, description="O3 concentration in µg/m³")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "PM2.5": 48.5,
                "PM10": 105.2,
                "NO2": 32.4,
                "CO": 0.85,
                "SO2": 14.2,
                "O3": 28.0
            }
        }

@app.get("/")
def get_root():
    """Returns project details and available documentation endpoints."""
    return {
        "project": "AI-Based Air Quality Predictor",
        "description": "Authentic Machine Learning system predicting AQI based on actual environmental pollutant measurements.",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "model_info": "/model-info",
            "predict": "/predict",
            "predictions_history": "/predictions"
        }
    }

@app.get("/health")
def get_health():
    """Healthcheck endpoint verifying model readiness and DB availability."""
    model_loaded = os.path.exists(MODEL_PATH)
    db_connected = False
    if mongo_client:
        try:
            mongo_client.admin.command('ping')
            db_connected = True
        except Exception:
            db_connected = False

    return {
        "status": "healthy" if model_loaded else "model_missing",
        "timestamp": datetime.datetime.now().isoformat(),
        "model_file_present": model_loaded,
        "database_connected": db_connected,
        "database_type": "MongoDB Atlas / Local" if db_connected else "In-Memory Fallback"
    }

@app.get("/model-info")
def get_model_info():
    """Returns genuine metrics and metadata generated during actual model evaluation."""
    if not os.path.exists(MODEL_INFO_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model info metadata file not found. Train the model first."
        )
    try:
        with open(MODEL_INFO_PATH, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading model info: {str(e)}"
        )

@app.post("/predict")
def predict_aqi(payload: PredictionRequest):
    """
    Receives pollutant inputs, transforms via saved pipeline, executes ML prediction,
    classifies into NAQI category with health advisories, and stores record.
    """
    pipeline = get_loaded_model()
    
    # Map request features in strict feature order
    input_data = {
        "PM2.5": [payload.pm25],
        "PM10": [payload.pm10],
        "NO2": [payload.no2],
        "CO": [payload.co],
        "SO2": [payload.so2],
        "O3": [payload.o3]
    }
    input_df = pd.DataFrame(input_data)
    
    try:
        raw_pred = pipeline.predict(input_df)[0]
        predicted_aqi = round(max(0.0, float(raw_pred)), 1)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}"
        )

    # Classify according to NAQI guidelines
    classification = get_aqi_classification(predicted_aqi)
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    record = {
        "timestamp": timestamp,
        "inputs": {
            "PM2.5": payload.pm25,
            "PM10": payload.pm10,
            "NO2": payload.no2,
            "CO": payload.co,
            "SO2": payload.so2,
            "O3": payload.o3
        },
        "predicted_aqi": predicted_aqi,
        "category": classification["category"],
        "color": classification["color"],
        "risk_level": classification["risk_level"],
        "health_advisory": classification["health_advisory"],
        "precautions": classification["precautions"]
    }
    
    # Store record
    if mongo_collection is not None:
        try:
            rec_to_insert = record.copy()
            mongo_collection.insert_one(rec_to_insert)
            # Remove mongo _id for clean response
            record.pop("_id", None)
        except Exception as e:
            print(f"[MongoDB] Insert error: {e}, saving to fallback list.")
            fallback_memory_store.append(record)
    else:
        fallback_memory_store.append(record)
        
    return record

@app.get("/predictions")
def get_predictions(limit: int = 50):
    """Retrieves chronological history of recent predictions."""
    history: List[Dict[str, Any]] = []
    
    if mongo_collection is not None:
        try:
            cursor = mongo_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
            history = list(cursor)
        except Exception as e:
            print(f"[MongoDB] Find error: {e}, falling back to memory.")
            history = list(reversed(fallback_memory_store))[:limit]
    else:
        history = list(reversed(fallback_memory_store))[:limit]
        
    return {
        "total_records": len(history),
        "history": history
    }
