"""
SpendSense ML Feature Engineering & Dataset Generator
Industry-grade transaction preprocessing with cyclic temporal encoding
and statistical category baseline z-scoring.
"""

import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any

# Category standard spending baselines (Mean, StdDev) in USD
CATEGORY_BASELINES: Dict[str, Tuple[float, float]] = {
    "Groceries": (65.0, 30.0),
    "Dining": (28.0, 15.0),
    "Entertainment": (45.0, 25.0),
    "Utilities": (120.0, 40.0),
    "Healthcare": (75.0, 50.0),
    "Travel": (110.0, 80.0),
    "Shopping": (55.0, 35.0),
    "Other": (40.0, 30.0)
}

CATEGORIES = list(CATEGORY_BASELINES.keys())


def generate_synthetic_transactions(
    n_samples: int = 5000, 
    anomaly_ratio: float = 0.03, 
    seed: int = 42
) -> List[Dict[str, Any]]:
    """
    Generates synthetic benchmark transaction dataset containing both normal
    spending patterns and real-world fintech anomalies (spikes, odd hours, rapid velocity).
    """
    random.seed(seed)
    transactions = []
    base_time = datetime(2026, 1, 1, 8, 0, 0)

    n_anomalies = int(n_samples * anomaly_ratio)
    anomaly_indices = set(random.sample(range(n_samples), n_anomalies))

    current_time = base_time
    for i in range(n_samples):
        # Step forward 15 to 360 minutes normally
        current_time += timedelta(minutes=random.randint(15, 360))
        is_anomaly = i in anomaly_indices

        if not is_anomaly:
            category = random.choice(CATEGORIES)
            mean, std = CATEGORY_BASELINES[category]
            # Normal amount sampled from positive normal distribution
            amount = max(2.0, round(random.gauss(mean, std), 2))
            # Normal hours: 07:00 to 22:00
            hour = random.randint(7, 22)
            tx_time = current_time.replace(hour=hour, minute=random.randint(0, 59))
            label = 0
            anomaly_type = "normal"
        else:
            # Inject one of 3 realistic fintech anomalies
            anomaly_type = random.choice(["amount_spike", "odd_hour", "burst_rapid"])
            category = random.choice(CATEGORIES)
            mean, std = CATEGORY_BASELINES[category]

            if anomaly_type == "amount_spike":
                # 8x to 25x normal category average
                amount = round(mean + std * random.uniform(8.0, 20.0), 2)
                tx_time = current_time.replace(hour=random.randint(10, 20))
            elif anomaly_type == "odd_hour":
                # Transaction in the dead of night (01:00 - 04:30 AM) with elevated amount
                amount = round(mean + std * random.uniform(2.5, 6.0), 2)
                tx_time = current_time.replace(hour=random.randint(1, 4), minute=random.randint(0, 59))
            else:  # burst_rapid
                amount = round(random.uniform(99.0, 299.0), 2)
                # Bursts happening within 2 minutes of previous
                tx_time = current_time + timedelta(seconds=random.randint(10, 90))

            label = 1

        transactions.append({
            "id": f"tx_{i+1:05d}",
            "user_id": "usr_demo",
            "amount": float(amount),
            "category": category,
            "timestamp": tx_time.isoformat(),
            "is_anomaly": label,
            "anomaly_type": anomaly_type
        })

    return transactions


class FeatureExtractor:
    """
    Transforms raw transaction payloads into numeric feature vectors for ML models.
    Engineered Features:
      1. log_amount: log1p(amount)
      2. category_z_score: (amount - mean_cat) / std_cat
      3. hour_sin, hour_cos: Cyclic hour of day (0-23)
      4. dow_sin, dow_cos: Cyclic day of week (0-6)
      5. One-hot category indicators (8 dimensions)
    Total feature dimensions: 14
    """

    def __init__(self):
        self.categories = CATEGORIES
        self.baselines = CATEGORY_BASELINES

    @property
    def feature_names(self) -> List[str]:
        cat_features = [f"cat_{c.lower()}" for c in self.categories]
        return [
            "log_amount",
            "category_z_score",
            "hour_sin",
            "hour_cos",
            "dow_sin",
            "dow_cos"
        ] + cat_features

    def extract_single(self, tx: Dict[str, Any]) -> List[float]:
        """Extracts numerical feature vector from a single transaction dictionary."""
        amount = float(tx.get("amount", 0.0))
        category = tx.get("category", "Other")
        if category not in self.baselines:
            category = "Other"

        # 1. Log Amount
        log_amount = math.log1p(max(0.0, amount))

        # 2. Category Z-Score
        mean, std = self.baselines[category]
        z_score = (amount - mean) / std if std > 0 else 0.0

        # Parse timestamp
        raw_ts = tx.get("timestamp")
        if isinstance(raw_ts, str):
            try:
                dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            except Exception:
                dt = datetime.utcnow()
        elif isinstance(raw_ts, datetime):
            dt = raw_ts
        else:
            dt = datetime.utcnow()

        # 3. Cyclic Hour Encoding
        hour = dt.hour + (dt.minute / 60.0)
        hour_sin = math.sin(2.0 * math.pi * hour / 24.0)
        hour_cos = math.cos(2.0 * math.pi * hour / 24.0)

        # 4. Cyclic Day-of-Week Encoding
        dow = dt.weekday()
        dow_sin = math.sin(2.0 * math.pi * dow / 7.0)
        dow_cos = math.cos(2.0 * math.pi * dow / 7.0)

        # 5. One-Hot Category
        cat_one_hot = [1.0 if category == c else 0.0 for c in self.categories]

        return [
            log_amount,
            z_score,
            hour_sin,
            hour_cos,
            dow_sin,
            dow_cos
        ] + cat_one_hot

    def transform(self, transactions: List[Dict[str, Any]]) -> List[List[float]]:
        """Batch transforms list of transactions into 2D numeric feature matrix."""
        return [self.extract_single(tx) for tx in transactions]
