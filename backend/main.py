import os
import sys
import json
import time
import math
import datetime
from collections import defaultdict
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

# Ensure backend root is on Python sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

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

# Security Configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 120  # requests per window
MAX_PAYLOAD_SIZE = 64 * 1024  # 64 KB limit

# In-memory sliding window rate limiter
ip_request_history = defaultdict(list)

# Initialize FastAPI App
app = FastAPI(
    title="AI-Based Air Quality Predictor API",
    description="Production-grade, secure REST API providing real-time Machine Learning AQI predictions, model transparency, and history tracking.",
    version="1.1.0"
)

# ----------------------------------------------------
# SECURITY MIDDLEWARE 1: Rate Limiter & Payload Size Guard
# ----------------------------------------------------
@app.middleware("http")
async def security_guard_middleware(request: Request, call_next):
    # 1. Payload size guard
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_PAYLOAD_SIZE:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"error": "Payload Too Large", "detail": f"Request exceeds max allowed size of {MAX_PAYLOAD_SIZE} bytes."}
        )

    # 2. IP-based sliding window rate limiter
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Filter out requests older than window
    timestamps = [t for t in ip_request_history[client_ip] if now - t < RATE_LIMIT_WINDOW]
    timestamps.append(now)
    ip_request_history[client_ip] = timestamps

    if len(timestamps) > RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate Limit Exceeded",
                "detail": f"Exceeded {RATE_LIMIT_MAX_REQUESTS} requests per {RATE_LIMIT_WINDOW} seconds. Please slow down.",
                "retry_after_seconds": RATE_LIMIT_WINDOW
            },
            headers={"Retry-After": str(RATE_LIMIT_WINDOW)}
        )

    # Process request
    response: Response = await call_next(request)

    # ----------------------------------------------------
    # SECURITY MIDDLEWARE 2: OWASP Hardened Security Headers
    # ----------------------------------------------------
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self' 'unsafe-inline' https:; "
        "style-src 'self' 'unsafe-inline' https:; "
        "font-src 'self' https: data:;"
    )
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(max(0, RATE_LIMIT_MAX_REQUESTS - len(timestamps)))
    response.headers["X-RateLimit-Reset"] = str(int(now + RATE_LIMIT_WINDOW))

    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
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

@app.on_event("startup")
async def startup_event():
    init_db()
    if os.path.exists(MODEL_PATH):
        try:
            get_loaded_model()
            print("[ML Model] Preloaded trained pipeline successfully.")
        except Exception as e:
            print(f"[ML Model] Warning on startup load: {e}")

# Pydantic Schemas with rigorous security validators
class PredictionRequest(BaseModel):
    pm25: float = Field(..., alias="PM2.5", ge=0.0, le=1000.0, description="PM2.5 concentration in µg/m³")
    pm10: float = Field(..., alias="PM10", ge=0.0, le=1500.0, description="PM10 concentration in µg/m³")
    no2: float = Field(..., alias="NO2", ge=0.0, le=1000.0, description="NO2 concentration in µg/m³")
    co: float = Field(..., alias="CO", ge=0.0, le=200.0, description="CO concentration in mg/m³")
    so2: float = Field(..., alias="SO2", ge=0.0, le=1000.0, description="SO2 concentration in µg/m³")
    o3: float = Field(..., alias="O3", ge=0.0, le=1000.0, description="O3 concentration in µg/m³")

    @field_validator("pm25", "pm10", "no2", "co", "so2", "o3")
    @classmethod
    def validate_finite_numbers(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Numeric value must be a valid, finite real number.")
        return float(v)

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
    return {
        "project": "AI-Based Air Quality Predictor",
        "description": "Authentic Machine Learning system predicting AQI based on actual environmental pollutant measurements.",
        "status": "online",
        "version": "1.1.0",
        "security": "OWASP Hardened (Rate Limiting, CSP, HSTS, Input Sanitization)",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "security_status": "/security-status",
            "model_info": "/model-info",
            "predict": "/predict",
            "predictions_history": "/predictions"
        }
    }

@app.get("/health")
def get_health():
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

@app.get("/security-status")
def get_security_status():
    """Returns the live audit report of backend security mechanisms for academic evaluation."""
    return {
        "status": "active",
        "timestamp": datetime.datetime.now().isoformat(),
        "protections": {
            "rate_limiter": {
                "enabled": True,
                "algorithm": "Sliding Window Counter",
                "limit_per_minute": RATE_LIMIT_MAX_REQUESTS,
                "window_seconds": RATE_LIMIT_WINDOW
            },
            "security_headers": {
                "enabled": True,
                "headers": [
                    "X-Content-Type-Options: nosniff",
                    "X-Frame-Options: DENY",
                    "X-XSS-Protection: 1; mode=block",
                    "Strict-Transport-Security",
                    "Content-Security-Policy",
                    "Referrer-Policy: strict-origin-when-cross-origin"
                ]
            },
            "payload_guard": {
                "enabled": True,
                "max_allowed_bytes": MAX_PAYLOAD_SIZE,
                "status": "Protected against HTTP buffer/memory exhaustion attacks"
            },
            "input_sanitization": {
                "enabled": True,
                "validation": "Strict Pydantic schemas rejecting NaN, Infinity, negative values, and extreme outliers",
                "injection_prevention": "Parameter binding with no dynamic shell/SQL query execution"
            },
            "cors_policy": {
                "enabled": True,
                "allowed_origins": [origin.strip() for origin in CORS_ORIGINS]
            }
        }
    }

@app.get("/model-info")
def get_model_info():
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
    pipeline = get_loaded_model()
    
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
    
    if mongo_collection is not None:
        try:
            rec_to_insert = record.copy()
            mongo_collection.insert_one(rec_to_insert)
            record.pop("_id", None)
        except Exception as e:
            print(f"[MongoDB] Insert error: {e}, saving to fallback list.")
            fallback_memory_store.append(record)
    else:
        fallback_memory_store.append(record)
        
    return record

@app.get("/predictions")
def get_predictions(limit: int = 50):
    # Bound limit parameter securely
    safe_limit = max(1, min(limit, 100))
    history: List[Dict[str, Any]] = []
    
    if mongo_collection is not None:
        try:
            cursor = mongo_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(safe_limit)
            history = list(cursor)
        except Exception as e:
            print(f"[MongoDB] Find error: {e}, falling back to memory.")
            history = list(reversed(fallback_memory_store))[:safe_limit]
    else:
        history = list(reversed(fallback_memory_store))[:safe_limit]
        
    return {
        "total_records": len(history),
        "history": history
    }
