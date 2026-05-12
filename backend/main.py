from fastapi import FastAPI

from api.v1.api_router import api_v1_router
from core.exceptions import add_exception_handlers
from core.middleware import add_cors_middleware
from db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Parc API Server")

add_cors_middleware(app)
add_exception_handlers(app)

app.include_router(api_v1_router, prefix="/api/v1")
