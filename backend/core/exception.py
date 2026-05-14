import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppException(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        data: Any = None,
    ):
        self.message = message
        self.status_code = status_code
        self.data = data


def bad_request(message: str, data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_400_BAD_REQUEST, data=data)


def unauthorized(message: str = "Authentication required.", data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_401_UNAUTHORIZED, data=data)


def forbidden(message: str = "Permission denied.", data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_403_FORBIDDEN, data=data)


def not_found(message: str = "Resource not found.", data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_404_NOT_FOUND, data=data)


def conflict(message: str, data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_409_CONFLICT, data=data)


def bad_gateway(message: str, data: Any = None) -> AppException:
    return AppException(message=message, status_code=status.HTTP_502_BAD_GATEWAY, data=data)


def _error_response(status_code: int, message: str, data: Any = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": data,
        },
    )


def add_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return _error_response(exc.status_code, exc.message, exc.data)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return _error_response(exc.status_code, str(exc.detail))

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled server error: %s", exc)
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Internal server error. Please try again later.",
        )
