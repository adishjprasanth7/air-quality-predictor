import os
import sys
import json
import time
import math
import re
import datetime
import base64
import hashlib
import hmac
import logging
import secrets
from collections import defaultdict
from typing import Dict, Any, List, Optional
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import (
    JSON,
    Column,
    Float,
    ForeignKey,
    Integer,
    BigInteger,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    delete,
    func,
    insert,
    select,
    text,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
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
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174").split(",")
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "model", "air_quality_model.pkl"))
MODEL_INFO_PATH = os.getenv("MODEL_INFO_PATH", os.path.join(os.path.dirname(__file__), "model", "model_info.json"))
CITIES_DATA_PATH = os.getenv("CITIES_DATA_PATH", os.path.join(os.path.dirname(__file__), "data", "cities_pollution_summary.json"))
FRONTEND_DIST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "air_quality.db")).replace("\\", "/"),
)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
SESSION_COOKIE_NAME = "aerovision_session"
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30

# Security Configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 120  # requests per window
MAX_PAYLOAD_SIZE = 64 * 1024  # 64 KB limit
AUTH_RATE_LIMIT_WINDOW = 60
AUTH_RATE_LIMIT_MAX_ATTEMPTS = 20

# In-memory sliding window rate limiter
ip_request_history = defaultdict(list)
auth_attempt_history = defaultdict(list)
logger = logging.getLogger(__name__)

metadata = MetaData()
users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String(320), nullable=False, unique=True),
    Column("password_hash", String(256), nullable=False),
)
sessions_table = Table(
    "sessions",
    metadata,
    Column("token_hash", String(64), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("expires_at", BigInteger, nullable=False),
)
predictions_table = Table(
    "predictions",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("timestamp", String(32), nullable=False),
    Column("inputs", JSON, nullable=False),
    Column("predicted_aqi", Float, nullable=False),
    Column("category", String(64), nullable=False),
    Column("color", String(32), nullable=False),
    Column("risk_level", String(64), nullable=False),
    Column("health_advisory", Text, nullable=False),
    Column("precautions", JSON, nullable=False),
)

engine_options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite:"):
    engine_options["connect_args"] = {"check_same_thread": False}
    if DATABASE_URL.endswith(":memory:"):
        engine_options["poolclass"] = StaticPool
database_engine: Engine = create_engine(DATABASE_URL, **engine_options)

# Initialize FastAPI App
app = FastAPI(
    title="AI-Based Air Quality Predictor API",
    description="Secure air-quality prediction, account, and PostgreSQL history service.",
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

    # 3. Optional API key for server-to-server access
    api_key = os.getenv("API_KEY")
    if api_key and request.url.path != "/health" and request.method != "OPTIONS":
        provided_api_key = request.headers.get("X-API-Key", "")
        if not hmac.compare_digest(provided_api_key.encode("utf-8"), api_key.encode("utf-8")):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or missing API key."},
                headers={"WWW-Authenticate": "ApiKey"},
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

# Global model cache
model_pipeline = None

def init_db():
    metadata.create_all(database_engine)
    with database_engine.begin() as connection:
        connection.execute(text("SELECT 1"))
        connection.execute(
            delete(sessions_table).where(sessions_table.c.expires_at <= int(time.time()))
        )
    print(f"[Database] Connected successfully using {database_engine.dialect.name}.")

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, salt_text, digest_text = stored_hash.split("$")
        if scheme != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(salt_text)
        expected_digest = base64.urlsafe_b64decode(digest_text)
        actual_digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(actual_digest, expected_digest)
    except (ValueError, TypeError):
        return False

DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))

def enforce_auth_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    key = client_ip
    now = time.monotonic()
    recent_attempts = [attempt for attempt in auth_attempt_history[key] if now - attempt < AUTH_RATE_LIMIT_WINDOW]
    if len(recent_attempts) >= AUTH_RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please wait a minute and try again.",
            headers={"Retry-After": str(AUTH_RATE_LIMIT_WINDOW)},
        )
    recent_attempts.append(now)
    auth_attempt_history[key] = recent_attempts

def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        max_age=SESSION_DURATION_SECONDS,
        path="/",
    )

def get_session_user(request: Request) -> Optional[Dict[str, Any]]:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    with database_engine.begin() as connection:
        user = connection.execute(
            select(users_table.c.id, users_table.c.email)
            .select_from(
                sessions_table.join(users_table, sessions_table.c.user_id == users_table.c.id)
            )
            .where(
                sessions_table.c.token_hash == token_hash,
                sessions_table.c.expires_at > int(time.time()),
            )
        ).mappings().first()
        if user is None:
            connection.execute(delete(sessions_table).where(sessions_table.c.token_hash == token_hash))
            return None
        return {"id": user["id"], "email": user["email"]}

def create_session(connection, user_id: int, response: Response) -> Dict[str, Any]:
    token = secrets.token_urlsafe(32)
    connection.execute(
        insert(sessions_table).values(
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            user_id=user_id,
            expires_at=int(time.time()) + SESSION_DURATION_SECONDS,
        )
    )
    set_session_cookie(response, token)
    user = connection.execute(
        select(users_table.c.id, users_table.c.email).where(users_table.c.id == user_id)
    ).mappings().one()
    return {"id": user["id"], "email": user["email"]}

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

class AuthCredentials(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized

@app.get("/")
def get_root(request: Request):
    frontend_index = os.path.join(FRONTEND_DIST_PATH, "index.html")
    user_agent = (request.headers.get("user-agent") or "").lower()
    browser_like = "python-urllib" not in user_agent and "curl/" not in user_agent
    if os.path.isfile(frontend_index) and browser_like:
        return FileResponse(frontend_index)
    return {
        "project": "AI-Based Air Quality Predictor",
        "description": "Authentic Machine Learning system predicting AQI based on actual environmental pollutant measurements.",
        "status": "online",
        "version": "1.1.0",
        "security": "OWASP Hardened (Rate Limiting, CSP, HSTS, Input Sanitization)",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "auth": {
                "signup": "/auth/signup",
                "login": "/auth/login",
                "current_session": "/auth/me",
                "logout": "/auth/logout"
            },
            "security_status": "/security-status",
            "model_info": "/model-info",
            "predict": "/predict",
            "predictions_history": "/predictions",
            "cities": "/cities",
            "city_detail": "/cities/{city_id}"
        }
    }

@app.get("/health")
def get_health():
    model_loaded = os.path.exists(MODEL_PATH)
    try:
        with database_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if model_loaded else "model_missing",
        "timestamp": datetime.datetime.now().isoformat(),
        "model_file_present": model_loaded,
        "database_connected": db_connected,
        "database_type": database_engine.dialect.name if db_connected else "Unavailable"
    }

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def sign_up(credentials: AuthCredentials, request: Request, response: Response):
    enforce_auth_rate_limit(request)
    try:
        with database_engine.begin() as connection:
            user_id = connection.execute(
                insert(users_table).values(
                    email=credentials.email,
                    password_hash=hash_password(credentials.password),
                )
            ).inserted_primary_key[0]
            user = create_session(connection, user_id, response)
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from error
    return {"user": user}

@app.post("/auth/login")
def sign_in(credentials: AuthCredentials, request: Request, response: Response):
    enforce_auth_rate_limit(request)
    with database_engine.begin() as connection:
        user = connection.execute(
            select(users_table.c.id, users_table.c.password_hash)
            .where(users_table.c.email == credentials.email)
        ).mappings().first()
        password_hash = user["password_hash"] if user is not None else DUMMY_PASSWORD_HASH
        password_matches = verify_password(credentials.password, password_hash)
        if user is None or not password_matches:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email or password is incorrect.",
            )
        session_user = create_session(connection, user["id"], response)
    return {"user": session_user}

@app.get("/auth/me")
def get_current_session(request: Request):
    return {"user": get_session_user(request)}

@app.post("/auth/logout")
def sign_out(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with database_engine.begin() as connection:
            connection.execute(delete(sessions_table).where(sessions_table.c.token_hash == token_hash))
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return {"message": "Signed out."}

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
            "authentication_rate_limiter": {
                "enabled": True,
                "limit_per_ip_per_minute": AUTH_RATE_LIMIT_MAX_ATTEMPTS,
                "window_seconds": AUTH_RATE_LIMIT_WINDOW
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
    
    try:
        with database_engine.begin() as connection:
            connection.execute(insert(predictions_table).values(**record))
    except Exception as error:
        logger.exception("Could not save prediction history.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prediction completed, but its history could not be saved.",
        ) from error
        
    return record

@app.get("/predictions")
def get_predictions(limit: int = 50):
    # Bound limit parameter securely
    safe_limit = max(1, min(limit, 100))
    with database_engine.connect() as connection:
        total_records = connection.execute(
            select(func.count()).select_from(predictions_table)
        ).scalar_one()
        rows = connection.execute(
            select(
                predictions_table.c.timestamp,
                predictions_table.c.inputs,
                predictions_table.c.predicted_aqi,
                predictions_table.c.category,
                predictions_table.c.color,
                predictions_table.c.risk_level,
                predictions_table.c.health_advisory,
                predictions_table.c.precautions,
            )
            .order_by(predictions_table.c.id.desc())
            .limit(safe_limit)
        ).mappings()
        history = [dict(row) for row in rows]

    return {
        "total_records": total_records,
        "history": history,
    }

# Cached cities data
cities_cache: Optional[List[Dict[str, Any]]] = None

def get_loaded_cities() -> List[Dict[str, Any]]:
    global cities_cache
    if cities_cache is None:
        if not os.path.exists(CITIES_DATA_PATH):
            # Fallback: if summary json doesn't exist yet, run process_cities or raise
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cities pollution summary dataset not found. Run backend/data/process_cities.py first."
            )
        try:
            with open(CITIES_DATA_PATH, "r", encoding="utf-8") as f:
                cities_cache = json.load(f)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read cities data: {str(e)}"
            )
    return cities_cache

@app.get("/cities")
def get_cities(
    region: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: Optional[str] = "aqi",
    order: Optional[str] = "desc"
):
    """
    Returns authentic CPCB air quality and pollutant statistics for 26 major monitored Indian cities.
    Supports filtering by geographical region and pollution category.
    """
    cities = get_loaded_cities()
    filtered = cities

    if region:
        filtered = [c for c in filtered if c.get("region", "").lower() == region.lower()]

    if category:
        filtered = [c for c in filtered if c.get("category", "").lower() == category.lower()]

    # Sorting
    reverse = (order.lower() == "desc")
    if sort_by == "aqi":
        filtered = sorted(filtered, key=lambda x: x.get("aqi", 0), reverse=reverse)
    elif sort_by == "city":
        filtered = sorted(filtered, key=lambda x: x.get("city", ""), reverse=reverse)
    elif sort_by in ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3"]:
        filtered = sorted(
            filtered,
            key=lambda x: x.get("pollutants", {}).get(sort_by, {}).get("value", 0),
            reverse=reverse
        )

    # Compute summary stats
    aqi_values = [c["aqi"] for c in cities if "aqi" in c]
    national_mean_aqi = round(sum(aqi_values) / len(aqi_values), 1) if aqi_values else 0.0

    return {
        "total_cities": len(filtered),
        "national_mean_aqi": national_mean_aqi,
        "most_polluted": cities[0]["city"] if cities else None,
        "cleanest": cities[-1]["city"] if cities else None,
        "cities": filtered
    }

@app.get("/cities/{city_id}")
def get_city_detail(city_id: str):
    """
    Returns detailed pollutant rates and seasonal trends for a single city by name or slug.
    """
    cities = get_loaded_cities()
    target = None
    query = city_id.lower().replace(" ", "").replace("-", "")

    for c in cities:
        c_name = c["city"].lower().replace(" ", "").replace("-", "")
        c_slug = c.get("id", "").lower().replace("-", "")
        if query == c_name or query == c_slug:
            target = c
            break

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{city_id}' not found in the 26 monitored Indian cities dataset."
        )

    return target

if os.path.isdir(FRONTEND_DIST_PATH):
    from fastapi.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_PATH, "assets")), name="frontend_assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
