"""
Pydantic Schemas for Multimodal Receipt & Invoice Extraction
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    description: str = Field(..., description="Item or product name")
    amount: float = Field(..., description="Price of the individual line item")


class ReceiptExtractionResponse(BaseModel):
    merchant_name: str = Field(default="Unknown Merchant", description="Detected business or store name")
    transaction_date: str = Field(default="", description="Detected transaction date (YYYY-MM-DD)")
    total_amount: float = Field(..., description="Grand total extracted from receipt")
    tax_amount: Optional[float] = Field(default=0.0, description="Extracted sales tax or VAT")
    currency: str = Field(default="USD", description="Currency symbol or 3-letter code")
    category_suggestion: str = Field(default="Shopping", description="AI suggested category based on merchant context")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")
    raw_text: Optional[str] = Field(default="", description="Cleaned OCR raw text")
    items: List[ReceiptItem] = Field(default_factory=list, description="Extracted line items")
