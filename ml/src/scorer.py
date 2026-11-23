"""
SpendSense Anomaly Scoring Engine
Evaluates transactions combining statistical deviation & ML outlier scores.
"""

import math
from typing import Dict, Any, Tuple
from src.dataset import FeatureExtractor, CATEGORY_BASELINES


class AnomalyScorer:
    """
    Production Anomaly Inference Engine.
    Combines Isolation Forest depth score with statistical deviation metrics
    to output an actionable risk score between 0.0 (safe) and 1.0 (critical).
    """

    def __init__(self, isolation_forest=None, baselines: Dict[str, Tuple[float, float]] = None):
        self.model = isolation_forest
        self.baselines = baselines or CATEGORY_BASELINES
        self.feature_extractor = FeatureExtractor()

    def score_transaction(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a transaction payload and returns risk metrics, anomaly flag,
        and human-readable explanation of why it was flagged.
        """
        amount = float(tx.get("amount", 0.0))
        category = tx.get("category", "Other")
        mean, std = self.baselines.get(category, (40.0, 30.0))

        # 1. Statistical Z-Score
        z_score = (amount - mean) / std if std > 0 else 0.0

        # 2. Model Decision / Outlier Score
        feat_vector = [self.feature_extractor.extract_single(tx)]
        
        if self.model is not None:
            try:
                raw_score = float(self.model.decision_function(feat_vector)[0])
                model_risk = 1.0 / (1.0 + math.exp(raw_score * 5.0))
            except Exception:
                model_risk = min(1.0, max(0.0, z_score / 6.0))
        else:
            model_risk = min(1.0, max(0.0, z_score / 6.0))

        # 3. Composite Risk Score
        z_factor = min(1.0, max(0.0, z_score / 5.0)) if z_score > 0 else 0.0
        composite_risk = round(0.6 * model_risk + 0.4 * z_factor, 4)

        # 4. Severity classification & Explanations
        reasons = []
        if z_score >= 3.0:
            reasons.append(f"Amount (${amount:.2f}) is {z_score:.1f}x standard deviations above normal {category} spend (Avg: ${mean:.2f}).")
        
        raw_ts = tx.get("timestamp", "")
        if "T" in str(raw_ts):
            try:
                time_part = str(raw_ts).split("T")[1]
                hour = int(time_part.split(":")[0])
                if 0 <= hour <= 5:
                    reasons.append(f"Transaction occurred at an unusual time ({hour:02d}:00 AM).")
            except Exception:
                pass

        if composite_risk >= 0.70:
            severity = "HIGH"
            is_anomaly = True
            recommendation = "Require multi-factor authentication or freeze card for verification."
        elif composite_risk >= 0.40:
            severity = "MEDIUM"
            is_anomaly = False
            recommendation = "Notify user with a push alert to confirm purchase."
        else:
            severity = "LOW"
            is_anomaly = False
            recommendation = "Approve automatically."

        return {
            "transaction_id": tx.get("id", "tx_unknown"),
            "risk_score": composite_risk,
            "severity": severity,
            "is_anomaly": is_anomaly,
            "z_score": round(z_score, 2),
            "reasons": reasons if reasons else ["Normal spending pattern within category baseline."],
            "recommendation": recommendation
        }
