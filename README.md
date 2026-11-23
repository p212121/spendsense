# 💳 SpendSense 360 — AI Financial Intelligence & Anomaly Engine

> **Industry-Grade Final Year Engineering Project:** Microservice architecture combining Machine Learning (Isolation Forest Anomaly Detection), Computer Vision / OCR (Receipt Entity Extraction), and Generative AI (Conversational RAG) with complete Docker, CI/CD, and Cloud Deployment.

[![Live Swagger API](https://img.shields.io/badge/Live_API-Render_Cloud-00c58e?style=for-the-badge&logo=render)](https://spendsense-ai-bwk4.onrender.com/docs)
[![API Health](https://img.shields.io/badge/Health_Check-Passing_Online-4c1?style=for-the-badge)](https://spendsense-ai-bwk4.onrender.com/health)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions)](https://github.com/p212121/spendsense/actions)

* **🌐 Live Production API Docs:** [https://spendsense-ai-bwk4.onrender.com/docs](https://spendsense-ai-bwk4.onrender.com/docs)
* **🔍 Live Health Check:** [https://spendsense-ai-bwk4.onrender.com/health](https://spendsense-ai-bwk4.onrender.com/health)

![SpendSense](icons/icon.svg)

---

## 🎯 Architectural Overview

```text
                                 ┌──────────────────────────────────────┐
                                 │       Client Application (UI)        │
                                 │   Mobile-First PWA Dashboard (SPA)   │
                                 └──────────────────┬───────────────────┘
                                                    │ HTTPS / JSON / Multipart
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FastAPI Backend Microservice                              │
│                                                                                        │
│  ┌──────────────────────────┐  ┌───────────────────────────┐  ┌─────────────────────┐  │
│  │   /api/v1/anomaly        │  │   /api/v1/receipt/extract │  │  /api/v1/copilot    │  │
│  │   Isolation Forest +     │  │   Entity Regex & Token    │  │  Semantic Search    │  │
│  │   Cyclic Feature Engine  │  │   Parser Pipeline         │  │  + Financial RAG    │  │
│  └────────────┬─────────────┘  └─────────────┬─────────────┘  └──────────┬──────────┘  │
│               │                              │                           │             │
└───────────────┼──────────────────────────────┼───────────────────────────┼─────────────┘
                │                              │                           │
                ▼                              ▼                           ▼
┌──────────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────┐
│       MLflow / Joblib        │ │    Fast In-Memory Buffer  │ │  Vector Knowledge Base  │
│  Trained Models & Scalers    │ │    (OCR Stream Buffer)    │ │  Transaction Embeddings │
│  (14-Dimensional Matrix)     │ │                           │ │  & Statistical Indices  │
└──────────────────────────────┘ └───────────────────────────┘ └─────────────────────────┘
```

---

## 🧠 Core Machine Learning & AI Modules

### 1. AI Anomaly & Fraud Detection Engine (`ml/src/scorer.py`)
* **Algorithm:** **Isolation Forest + Statistical Deviation Ensemble**.
* **Contamination Rate:** 3.0% (calibrated against credit-card and banking benchmarks).
* **Mathematical Feature Engineering:**
  1. **Log Normalization:** $x_{\text{scaled}} = \ln(1 + \text{amount})$ to handle extreme skew.
  2. **Category Baseline Z-Score:** $z = \frac{\text{amount} - \mu_{\text{cat}}}{\sigma_{\text{cat}}}$.
  3. **Cyclic Temporal Encoding:**
     $$\text{hour\_sin} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \text{hour\_cos} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)$$
     $$\text{dow\_sin} = \sin\left(\frac{2\pi \cdot \text{dow}}{7}\right), \quad \text{dow\_cos} = \cos\left(\frac{2\pi \cdot \text{dow}}{7}\right)$$
  4. **Categorical One-Hot Encodings:** 8 category dimensions.
* **Output:** Normalized Risk Score ($0.0 \to 1.0$), Severity (`LOW`, `MEDIUM`, `HIGH`), and human-interpretable factors explaining why a transaction was flagged.

### 2. Multimodal Receipt Entity Extractor (`api/app/services/ocr_service.py`)
* Automatically parses scanned receipts, PDFs, and plain text.
* Extracts **Merchant Name**, **Transaction Date**, **Grand Total**, **Sales Tax**, and **Line Items** using confidence-scored regex entity matchers and merchant taxonomy classification.

### 3. Financial Copilot (RAG Engine) (`api/app/services/rag_service.py`)
* Retrieval-Augmented Generation answering user natural language queries (e.g., *"How much did I spend on dining?"*, *"What was my largest transaction?"*).
* Zero API cost: operates deterministic semantic retrieval offline, with optional connection to free **Groq Cloud (LLaMA-3-8B)**.

---

## 🚀 Quick Start Guide

### 1. Launch the FastAPI AI Server
```powershell
# Activate your virtual environment
.\venv\Scripts\activate

# Launch the FastAPI server with hot-reload
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
Visit **`http://127.0.0.1:8000/docs`** to open the interactive Swagger UI.

### 2. Run Automated Pytest Suite
```powershell
python -m pytest tests/test_anomaly_api.py -v
```
Runs 6 unit and integration test assertions verifying health, anomaly scoring, OCR parsing, and RAG copilot responses.

### 3. Launch Frontend Dashboard
Simply open [`index.html`](file:///c:/Users/pawan/OneDrive/Desktop/spendsense/index.html) in your browser, or run:
```bash
npm start
```
and visit `http://localhost:3000`. The frontend will automatically detect the AI backend and show a green **"AI Engine Active"** pill in the top header.

---

## 🚢 100% Free Production Deployment

### Option A: Docker & Docker Compose
```bash
# Build and run the production container locally
docker-compose -f docker/docker-compose.yml up --build -d
```

### Option B: Free Cloud Hosting (Render.com / Hugging Face Spaces)
1. Push this repository to **GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete SpendSense 360 AI Platform"
   git push origin main
   ```
2. Log into [Render.com](https://render.com) (100% Free Tier).
3. Click **New $\rightarrow$ Web Service $\rightarrow$ Build from Docker**.
4. Point to `docker/Dockerfile.api`.
5. Render will build the image and provide a public HTTPS URL (e.g., `https://spendsense-ai.onrender.com/docs`).

---

## 🧪 CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Every push to `main` executes:
1. **Automated Testing:** Sets up Python 3.11 and runs the full `pytest` suite.
2. **Model Validation:** Verifies that model artifacts serialize and deserialize properly.
3. **Docker Multi-Stage Build:** Builds minimal production container and verifies health check.
4. **Continuous Deployment:** Fires webhook to automatically trigger zero-downtime redeployment on Render.

---

## 🎓 Viva & Technical Interview Questions

**Q1: Why did you choose Isolation Forest instead of a standard binary classifier like Logistic Regression?**
> *Answer:* Fraud and financial anomalies in real-world banking represent less than 0.5% of total events, creating extreme class imbalance. Supervised classifiers overfit or require synthetic oversampling (SMOTE). Isolation Forest is an unsupervised tree-based algorithm that exploits the fact that anomalies have shorter average path lengths in random partitions, making it ideal for detecting novel, unlabelled spending anomalies.

**Q2: Why use cyclic trigonometric encoding for the hour and day features?**
> *Answer:* Standard integer hours (0 to 23) create an artificial distance gap between 23:59 (11:59 PM) and 00:01 (12:01 AM). By projecting hours onto the unit circle using $\sin\left(\frac{2\pi \cdot h}{24}\right)$ and $\cos\left(\frac{2\pi \cdot h}{24}\right)$, the model preserves true continuous circular proximity across midnight.

**Q3: How is this architecture production-grade?**
> *Answer:* It enforces separation of concerns: Pydantic schemas for runtime validation, async FastAPI endpoints, serialized `.joblib` model caching with singleton dependency injection, multi-stage Docker containerization with a non-root user for security, and end-to-end CI/CD test automation.
