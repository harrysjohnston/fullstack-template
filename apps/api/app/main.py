from fastapi import FastAPI

from app.config import settings
from app.exceptions import setup_exception_handlers
from app.routers import auth, users

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    openapi_url=settings.openapi_url,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
)

# Setup exception handlers for standardized error responses
setup_exception_handlers(app)

# Include routers with API version prefix
app.include_router(users.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
