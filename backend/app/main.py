from fastapi import FastAPI
from app.core.config import settings
from app.database import Base, engine
import app.models  # Register SQLAlchemy models
from app.api.routes import (
    health_router,
    projects_router,
    meetings_router,
    tasks_router,
    decisions_router,
    analysis_router,
)

from fastapi.middleware.cors import CORSMiddleware

# Automatically create database tables for MVP
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI Meeting-to-Execution OS",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for Vite frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(projects_router)
app.include_router(meetings_router)
app.include_router(tasks_router)
app.include_router(decisions_router)
app.include_router(analysis_router)
