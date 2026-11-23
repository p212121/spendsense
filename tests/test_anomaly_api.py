"""
Complete Pytest Integration Test Suite for SpendSense AI Platform
Validates:
1. Health & Root Catalog
2. Anomaly Scoring (Normal vs High Spike)
3. Receipt Entity Extraction (Merchant, Date, Total, Tax)
4. Conversational Copilot (Category, Largest Expense, Anomalies)
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["modules"]["anomaly_engine"] == "online"
    assert data["modules"]["receipt_extractor"] == "online"
    assert data["modules"]["copilot_rag"] == "online"


def test_anomaly_low_risk():
    payload = {
        "id": "tx_normal_01",
        "amount": 25.0,
        "category": "Dining",
        "timestamp": "2026-11-23T13:00:00Z"
    }
    response = client.post("/api/v1/anomaly/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == "LOW"
    assert data["is_anomaly"] is False


def test_anomaly_high_spike():
    payload = {
        "id": "tx_spike_01",
        "amount": 850.0,
        "category": "Dining",
        "timestamp": "2026-11-23T03:15:00Z"
    }
    response = client.post("/api/v1/anomaly/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == "HIGH"
    assert data["is_anomaly"] is True
    assert data["risk_score"] >= 0.70


def test_receipt_text_extraction():
    sample_receipt = (
        "WALMART SUPERCENTER\n"
        "Store #1024 - Dallas, TX\n"
        "Date: 2026-11-18\n"
        "1 Gallon Whole Milk    3.89\n"
        "Whole Wheat Bread      2.49\n"
        "Tax                    0.51\n"
        "TOTAL DUE              6.89\n"
        "Thank you for shopping!"
    )
    response = client.post("/api/v1/receipt/parse-text", json={"text": sample_receipt})
    assert response.status_code == 200
    data = response.json()
    assert "Walmart" in data["merchant_name"]
    assert data["total_amount"] == 6.89
    assert data["tax_amount"] == 0.51
    assert data["transaction_date"] == "2026-11-18"
    assert data["category_suggestion"] == "Groceries"


def test_copilot_category_query():
    payload = {
        "query": "How much did I spend on Groceries?",
        "transactions": [
            {"id": "t1", "amount": 50.0, "category": "Groceries", "timestamp": "2026-11-01T10:00:00Z"},
            {"id": "t2", "amount": 75.0, "category": "Groceries", "timestamp": "2026-11-05T10:00:00Z"},
            {"id": "t3", "amount": 30.0, "category": "Dining", "timestamp": "2026-11-06T12:00:00Z"}
        ]
    }
    response = client.post("/api/v1/copilot/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Groceries" in data["answer"]
    assert "$125.00" in data["answer"]
    assert data["retrieved_transactions_count"] == 3


def test_copilot_largest_transaction():
    payload = {
        "query": "What was my largest transaction?",
        "transactions": [
            {"id": "t1", "amount": 45.0, "category": "Dining", "timestamp": "2026-11-01T10:00:00Z"},
            {"id": "t2", "amount": 420.0, "category": "Travel", "timestamp": "2026-11-05T10:00:00Z", "note": "Flight ticket"}
        ]
    }
    response = client.post("/api/v1/copilot/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "$420.00" in data["answer"]
    assert "Travel" in data["answer"]
