"""
Anomaly Detection Inference Service
Loads serialized joblib model artifacts and executes low-latency inference.
"""

import sys
import joblib
from pathlib import Path
from typing import Dict, Any, List

# Ensure ml package is on PYTHONPATH
root_dir = Path(__file__).resolve().parent.parent.parent.parent
ml_dir = root_dir / "ml"
if str(ml_dir) not in sys.path:
    sys.path.append(str(ml_dir))

from api.app.models.anomaly import (
    TransactionRequest,
    AnomalyResponse,
    BatchAnomalyResponse
)
from src.scorer import AnomalyScorer


class AnomalyService:
    def __init__(self):
        self.model_path = ml_dir / "artifacts" / "anomaly_scorer.joblib"
        self.scorer: AnomalyScorer = self._load_model()

    def _load_model(self) -> AnomalyScorer:
        """Loads serialized model artifact or initializes default scorer."""
        if self.model_path.exists():
            try:
                scorer = joblib.load(self.model_path)
                return scorer
            except Exception as e:
                print(f"[WARN] Failed to load artifact from {self.model_path}: {e}")
        return AnomalyScorer()

    def predict_single(self, req: TransactionRequest) -> AnomalyResponse:
        tx_dict = req.model_dump()
        result = self.scorer.score_transaction(tx_dict)
        return AnomalyResponse(**result)

    def predict_batch(self, requests: List[TransactionRequest]) -> BatchAnomalyResponse:
        results = [self.predict_single(tx) for tx in requests]
        anomalies = [r for r in results if r.is_anomaly]
        high_risk = [r for r in results if r.severity == "HIGH"]

        return BatchAnomalyResponse(
            total_processed=len(results),
            anomalies_detected=len(anomalies),
            high_risk_count=len(high_risk),
            results=results
        )


# Singleton instance for dependency injection
anomaly_service = AnomalyService()
