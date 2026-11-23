"""
Pydantic Schemas for Anomaly Detection API
Strict typing and validation matching production enterprise standards.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TransactionRequest(BaseModel):
    id: Optional[str] = Field(default="tx_sample", description="Unique transaction identifier")
    user_id: Optional[str] = Field(default="usr_demo", description="Unique user or account identifier")
    amount: float = Field(..., gt=0, description="Transaction amount in currency units (must be > 0)")
    category: str = Field(default="Other", description="Spending category: Groceries, Dining, Entertainment, Utilities, Healthcare, Travel, Shopping, Other")
    timestamp: Optional[str] = Field(
        default_factory=lambda: datetime.utcnow().isoformat(),
        description="ISO 8601 formatted timestamp (e.g. 2026-11-23T14:30:00Z)"
    )
    note: Optional[str] = Field(default="", description="Optional merchant or expense note")


class AnomalyResponse(BaseModel):
    transaction_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Normalized risk score between 0.0 (safe) and 1.0 (critical)")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, or HIGH")
    is_anomaly: bool = Field(..., description="Flag indicating if the transaction triggered an anomaly alert")
    z_score: float = Field(..., description="Standard deviations above user category baseline")
    reasons: List[str] = Field(..., description="Human-interpretable factors explaining the prediction")
    recommendation: str = Field(..., description="Actionable recommendation for the client")


class BatchTransactionRequest(BaseModel):
    transactions: List[TransactionRequest]


class BatchAnomalyResponse(BaseModel):
    total_processed: int
    anomalies_detected: int
    high_risk_count: int
    results: List[AnomalyResponse]
