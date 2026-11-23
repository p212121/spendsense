"""
FastAPI Route Handlers for Anomaly Detection
Provides high-performance endpoints for single and batch risk scoring.
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from api.app.models.anomaly import (
    TransactionRequest,
    AnomalyResponse,
    BatchTransactionRequest,
    BatchAnomalyResponse
)
from api.app.services.anomaly_service import anomaly_service

router = APIRouter(prefix="/anomaly", tags=["AI Anomaly Detection"])


@router.post(
    "/predict",
    response_model=AnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Single Transaction Risk",
    description="Processes transaction amount, category, and temporal patterns through the Anomaly Scorer."
)
async def predict_anomaly(payload: TransactionRequest) -> AnomalyResponse:
    try:
        return anomaly_service.predict_single(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@router.post(
    "/batch-predict",
    response_model=BatchAnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Multiple Transactions",
    description="Batch scores multiple transactions in a single API call for bulk history analysis."
)
async def batch_predict_anomalies(payload: BatchTransactionRequest) -> BatchAnomalyResponse:
    try:
        return anomaly_service.predict_batch(payload.transactions)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference error: {str(e)}"
        )


@router.get(
    "/model-info",
    summary="Retrieve Active Model Metadata",
    description="Returns metadata about model architecture, training configuration, and feature dimensions."
)
async def get_model_info():
    metadata_path = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "artifacts" / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, "r") as f:
            return json.load(f)
    return {
        "status": "default_engine_active",
        "description": "Composite Isolation Forest & Baseline Z-Score Ensemble"
    }
