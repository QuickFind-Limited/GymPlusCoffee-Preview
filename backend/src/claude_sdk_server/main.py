"""Minimal Claude SDK Server."""

import os
from typing import Optional

import atla_insights
from dotenv import load_dotenv
from atla_insights import instrument_claude_code_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from src.claude_sdk_server.api.routers.clarification_router import (
    router as clarification_router,
)
from src.claude_sdk_server.api.routers.claude_router import router as claude_router
from src.claude_sdk_server.api.routers.file_router import router as file_router
from src.claude_sdk_server.api.routers.files_router import router as files_router
from src.claude_sdk_server.api.routers.netsuite_router import router as netsuite_router
from src.claude_sdk_server.api.routers.streaming_router import (
    router as streaming_router,
)
from src.claude_sdk_server.utils.logging_config import get_logger

# Load environment variables from .env file
load_dotenv()

# Initialize logger with clean loguru configuration
logger = get_logger(__name__)

logger.reasoning("Initializing FastAPI application with clean architecture")
app = FastAPI(
    title="Claude SDK Server",
    version="1.0.0",
    description="Minimal REST API server for Claude Code SDK",
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8081",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.context(
    "FastAPI application created with CORS enabled",
    context_data={
        "title": "Claude SDK Server",
        "version": "1.0.0",
        "environment": os.environ.get("ATLA_ENVIRONMENT", "development"),
        "cors_enabled": True,
    },
)

# Configure observability exporters and third-party integrations
logfire_span_processor: Optional[BatchSpanProcessor] = None

logfire_token = os.getenv("LOGFIRE_TOKEN")
if logfire_token:
    try:
        logger.analysis("Configuring logfire OTLP exporter for application monitoring")
        logfire_exporter = OTLPSpanExporter(
            endpoint="https://logfire-eu.pydantic.dev/v1/traces",
            headers={"Authorization": f"Bearer {logfire_token}"},
        )
        logfire_span_processor = BatchSpanProcessor(logfire_exporter)
        FastAPIInstrumentor.instrument_app(app)
        logger.context(
            "Logfire instrumentation enabled",
            context_data={"endpoint": "https://logfire-eu.pydantic.dev/v1/traces"},
        )
    except Exception as exc:
        logger.warning("Logfire instrumentation failed", error=str(exc))
else:
    logger.info("LOGFIRE_TOKEN not provided; skipping logfire instrumentation")

atla_token = os.getenv("ATLA_INSIGHTS_API_KEY")
environment = os.getenv("ATLA_ENVIRONMENT", "development")
if atla_token:
    atla_kwargs = {"metadata": {"environment": environment}}
    if logfire_span_processor:
        atla_kwargs["additional_span_processors"] = [logfire_span_processor]

    try:
        atla_insights.configure(token=atla_token, **atla_kwargs)
        logger.context(
            "Atla Insights configured",
            context_data={
                "environment": environment,
                "logfire_linked": bool(logfire_span_processor),
            },
        )
    except Exception as exc:
        logger.warning("Failed to configure Atla Insights", error=str(exc))
else:
    logger.info("ATLA_INSIGHTS_API_KEY not provided; skipping Atla Insights instrumentation")

try:
    instrument_claude_code_sdk()
    logger.info("Claude Code SDK instrumentation enabled")
except Exception as exc:
    logger.warning("Failed to instrument Claude Code SDK", error=str(exc))

# Include routers
logger.structured("router_registration", router_name="claude_router")
app.include_router(claude_router)

logger.structured("router_registration", router_name="streaming_router")
app.include_router(streaming_router)

logger.structured("router_registration", router_name="file_router")
app.include_router(file_router)

logger.structured("router_registration", router_name="files_router")
app.include_router(files_router)

logger.structured("router_registration", router_name="netsuite_router")
app.include_router(netsuite_router)

logger.structured("router_registration", router_name="clarification_router")
app.include_router(clarification_router)

logger.info("🚀 Claude SDK Server initialized successfully")

# Export app for uvicorn
__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    logger.reasoning("Starting development server with uvicorn")

    server_config = {"host": "0.0.0.0", "port": 8000, "reload": True}

    logger.structured(
        "server_startup", **server_config, app_module="src.claude_sdk_server.main:app"
    )

    logger.info("🌟 Starting Claude SDK Server in development mode")

    uvicorn.run("src.claude_sdk_server.main:app", **server_config)
