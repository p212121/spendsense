"""
SpendSense Enterprise AI Platform API
Production FastAPI Application Entrypoint
"""

import sys
from pathlib import Path
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from api.app.routes.anomaly_routes import router as anomaly_router
from api.app.routes.receipt_routes import router as receipt_router
from api.app.routes.copilot_routes import router as copilot_router

app = FastAPI(
    title="SpendSense 360 AI Platform API",
    description="""
    ## 🚀 Enterprise Financial Intelligence & Anomaly Detection API
    Production-grade AI microservice suite:
    * **Module 1 (AI Anomaly Scoring):** Isolation Forest + Statistical Z-Score deviation engine.
    * **Module 2 (Multimodal Receipt OCR):** Automated parsing of merchant, date, total, and line items.
    * **Module 3 (Conversational Financial Copilot):** Grounded RAG system for spending insights.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers under /api/v1
app.include_router(anomaly_router, prefix="/api/v1")
app.include_router(receipt_router, prefix="/api/v1")
app.include_router(copilot_router, prefix="/api/v1")


@app.get("/", tags=["System"])
async def root():
    return {
        "service": "SpendSense 360 AI Engine",
        "version": "1.0.0",
        "status": "healthy",
        "documentation": "/docs",
        "endpoints": {
            "anomaly_prediction": "/api/v1/anomaly/predict",
            "batch_anomaly": "/api/v1/anomaly/batch-predict",
            "receipt_text_parsing": "/api/v1/receipt/parse-text",
            "receipt_file_upload": "/api/v1/receipt/upload",
            "copilot_query": "/api/v1/copilot/query",
            "copilot_suggestions": "/api/v1/copilot/sample-queries"
        }
    }


@app.get("/health", tags=["System"], status_code=status.HTTP_200_OK)
async def health_check():
    return {
        "status": "healthy",
        "modules": {
            "anomaly_engine": "online",
            "receipt_extractor": "online",
            "copilot_rag": "online"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
