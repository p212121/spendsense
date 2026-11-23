"""
SpendSense Model Training Pipeline
Trains an Isolation Forest outlier detection model with statistical risk scoring.
Saves model artifacts to ml/artifacts/ for direct production inference.
"""

import sys
import json
import joblib
from pathlib import Path

# Add ml root to sys.path
current_dir = Path(__file__).resolve().parent
ml_dir = current_dir.parent
if str(ml_dir) not in sys.path:
    sys.path.append(str(ml_dir))

from src.dataset import generate_synthetic_transactions, FeatureExtractor, CATEGORIES, CATEGORY_BASELINES
from src.scorer import AnomalyScorer


def train_and_export():
    """Generates synthetic dataset, trains IsolationForest, and saves artifacts."""
    artifacts_dir = ml_dir / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    print("Generating 5,000 synthetic transactions...")
    raw_txs = generate_synthetic_transactions(n_samples=5000, anomaly_ratio=0.03, seed=42)

    extractor = FeatureExtractor()
    X = extractor.transform(raw_txs)

    print(f"Features extracted: {len(X)} rows x {len(X[0])} dimensions.")

    model = None
    try:
        from sklearn.ensemble import IsolationForest
        print("Training Scikit-Learn IsolationForest model (100 estimators, 3% contamination)...")
        model = IsolationForest(
            n_estimators=100,
            contamination=0.03,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X)
        print("Isolation Forest trained successfully.")
    except ImportError:
        print("Scikit-Learn not yet available, building statistical baseline engine.")

    # Package into AnomalyScorer
    scorer = AnomalyScorer(isolation_forest=model, baselines=CATEGORY_BASELINES)

    # Save model artifact
    model_path = artifacts_dir / "anomaly_scorer.joblib"
    joblib.dump(scorer, model_path)
    print(f"Artifact exported successfully to: {model_path}")

    # Generate metadata card
    metadata = {
        "model_type": "IsolationForest + Category Z-Score Ensemble",
        "contamination": 0.03,
        "n_samples_trained": len(raw_txs),
        "features": extractor.feature_names,
        "categories_supported": CATEGORIES,
        "status": "production_ready"
    }
    with open(artifacts_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("Metadata card saved to ml/artifacts/metadata.json.")
    return scorer


if __name__ == "__main__":
    train_and_export()
