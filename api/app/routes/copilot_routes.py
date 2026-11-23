"""
FastAPI Route Handlers for Conversational Copilot
"""

from fastapi import APIRouter, HTTPException, status
from api.app.services.rag_service import (
    rag_engine,
    CopilotQueryRequest,
    CopilotQueryResponse
)

router = APIRouter(prefix="/copilot", tags=["AI Copilot (RAG)"])


@router.post(
    "/query",
    response_model=CopilotQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Question About Spending History",
    description="Uses RAG retrieval to formulate factual financial answers grounded in transaction data."
)
async def query_copilot(payload: CopilotQueryRequest) -> CopilotQueryResponse:
    try:
        return rag_engine.answer_query(payload.query, payload.transactions)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Copilot inference error: {str(e)}"
        )


@router.get(
    "/sample-queries",
    summary="List Suggested Prompts",
    description="Returns pre-built prompts to demonstrate the copilot capabilities in demos."
)
async def get_sample_queries():
    return {
        "suggestions": [
            "How much did I spend on Groceries?",
            "What was my largest transaction?",
            "Are there any unusual spending anomalies?",
            "Break down my total spending",
            "Give me a summary of my expenses"
        ]
    }
