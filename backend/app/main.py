# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, student, warden, gate, whatsapp_webhook

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GIKI for Women - Digital Exit Assistance & Warden Approval API",
    description="Academic prototype for digitizing women hostel exit permission with mandatory parent WhatsApp consent and HMAC-SHA256 digital gate pass generation.",
    version="1.0.0",
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(warden.router)
app.include_router(gate.router)
app.include_router(whatsapp_webhook.router)


@app.get("/")
def root():
    return {
        "project": "GIKI for Women - Digital Exit Assistance System",
        "notice": "Academic Prototype — This system does not provide official GIKI authorization.",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": os.getenv("APP_ENV", "development")}
