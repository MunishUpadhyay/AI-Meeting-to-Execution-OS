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

# Automatically create database tables for MVP
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI Meeting-to-Execution OS",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Include API Routers
app.include_router(health_router)
app.include_router(projects_router)
app.include_router(meetings_router)
app.include_router(tasks_router)
app.include_router(decisions_router)
app.include_router(analysis_router)
