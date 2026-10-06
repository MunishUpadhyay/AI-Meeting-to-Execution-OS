from app.api.routes.health import router as health_router
from app.api.routes.projects import router as projects_router
from app.api.routes.meetings import router as meetings_router
from app.api.routes.tasks import router as tasks_router
from app.api.routes.decisions import router as decisions_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.risks import router as risks_router

__all__ = [
    "health_router",
    "projects_router",
    "meetings_router",
    "tasks_router",
    "decisions_router",
    "analysis_router",
    "risks_router",
]

