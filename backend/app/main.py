from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import (
    assistant,
    diseases,
    farmers,
    history,
    investigate,
    models_info,
    predict,
    voice,
    weather,
)

app = FastAPI(
    title="KRISHI SAKHI AI",
    description="Predictive Crop Health & Root-Cause Intelligence Platform",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        404: "NOT_FOUND",
        413: "PAYLOAD_TOO_LARGE",
        422: "VALIDATION_ERROR",
        503: "SERVICE_UNAVAILABLE",
    }
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code_map.get(exc.status_code, "HTTP_ERROR"),
                "message": str(exc.detail),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request payload.",
                "details": exc.errors(),
            }
        },
    )


app.include_router(predict.router)
app.include_router(investigate.router)
app.include_router(assistant.router)
app.include_router(voice.router)
app.include_router(diseases.router)
app.include_router(weather.router)
app.include_router(farmers.router)
app.include_router(history.router)
app.include_router(models_info.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "krishi-sakhi-ai", "version": "1.1.0"}
