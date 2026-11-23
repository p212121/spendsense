"""
Receipt OCR & Key-Information Extraction Service
Extracts structured financial entities (Merchant, Total, Tax, Date, Category) from receipt text or images.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from api.app.models.receipt import ReceiptExtractionResponse, ReceiptItem

# Merchant Category Knowledge Base
MERCHANT_TAXONOMY = {
    "Groceries": ["walmart", "kroger", "whole foods", "trader joe", "safeway", "costco", "aldi", "target", "supermarket", "market", "grocery"],
    "Dining": ["starbucks", "mcdonald", "subway", "chipotle", "dunkin", "burger", "pizza", "cafe", "restaurant", "bistro", "taco"],
    "Travel": ["uber", "lyft", "shell", "chevron", "bp", "exxon", "airline", "delta", "united", "hotel", "airbnb", "parking", "transit"],
    "Healthcare": ["cvs", "walgreens", "pharmacy", "clinic", "hospital", "dental", "optometry", "rx", "health"],
    "Utilities": ["electric", "water", "gas", "verizon", "att", "t-mobile", "internet", "power", "comcast"],
    "Entertainment": ["netflix", "spotify", "hulu", "disney", "amc", "cinema", "theatre", "steam", "playstation"]
}


class ReceiptExtractor:
    """Production Regex & Entity Matching Engine for financial receipts."""

    def extract_from_text(self, text: str) -> ReceiptExtractionResponse:
        lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
        if not lines:
            return ReceiptExtractionResponse(total_amount=0.0, confidence_score=0.0)

        # 1. Extract Merchant Name (usually the 1st or 2nd non-empty header line)
        merchant = self._extract_merchant(lines)

        # 2. Extract Grand Total
        total, confidence_total = self._extract_total(lines, text)

        # 3. Extract Tax
        tax = self._extract_tax(lines)

        # 4. Extract Date
        date_str = self._extract_date(text)

        # 5. Suggest Category based on merchant name
        category = self._classify_category(merchant, text)

        # 6. Extract Line Items
        items = self._extract_line_items(lines)

        confidence = round(0.5 * confidence_total + 0.3 * (1.0 if date_str else 0.0) + 0.2 * (1.0 if merchant != "Unknown Merchant" else 0.0), 2)

        return ReceiptExtractionResponse(
            merchant_name=merchant,
            transaction_date=date_str,
            total_amount=total,
            tax_amount=tax,
            currency="USD",
            category_suggestion=category,
            confidence_score=confidence,
            raw_text=text[:500],
            items=items
        )

    def _extract_merchant(self, lines: List[str]) -> str:
        # Ignore generic receipts headers like "RECEIPT", "WELCOME", "TAX INVOICE"
        ignored = {"receipt", "tax invoice", "welcome", "customer copy", "sales draft", "store copy", "duplicate"}
        for line in lines[:4]:
            cleaned = line.strip()
            if cleaned.lower() not in ignored and len(cleaned) >= 3 and not re.match(r"^[\d\$\.\,\:\-\/ ]+$", cleaned):
                return cleaned.title()
        return "Unknown Merchant"

    def _extract_total(self, lines: List[str], full_text: str) -> tuple[float, float]:
        # Search specifically for explicit total cues
        total_patterns = [
            r"(?:grand\s*total|total\s*due|balance\s*due|amount\s*due|total)[\s\:\$]*([\d]+[\.\,]\d{2})",
            r"(?:net\s*amount|total\s*usd|final\s*total)[\s\:\$]*([\d]+[\.\,]\d{2})"
        ]

        for pat in total_patterns:
            matches = re.findall(pat, full_text, flags=re.IGNORECASE)
            if matches:
                # The total is usually the last match or highest match
                try:
                    val = float(matches[-1].replace(",", ""))
                    return val, 0.95
                except ValueError:
                    pass

        # Fallback: Find all monetary numbers with 2 decimal places and select max
        all_prices = re.findall(r"\$?\s*([0-9]+\.[0-9]{2})\b", full_text)
        if all_prices:
            try:
                floats = [float(p) for p in all_prices]
                return max(floats), 0.70
            except ValueError:
                pass

        return 0.0, 0.20

    def _extract_tax(self, lines: List[str]) -> float:
        for line in lines:
            if re.search(r"\b(?:tax|vat|sales tax|hst|gst)\b", line, re.IGNORECASE):
                match = re.search(r"([\d]+[\.\,]\d{2})", line)
                if match:
                    try:
                        return float(match.group(1).replace(",", ""))
                    except ValueError:
                        pass
        return 0.0

    def _extract_date(self, text: str) -> str:
        # Matches YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
        patterns = [
            r"\b(202[0-9]-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01]))\b",
            r"\b((?:0[1-9]|1[0-2])[\/\-](?:0[1-9]|[12][0-9]|3[01])[\/\-]202[0-9])\b",
            r"\b((?:0[1-9]|[12][0-9]|3[01])[\/\-](?:0[1-9]|1[0-2])[\/\-]202[0-9])\b"
        ]
        for pat in patterns:
            match = re.search(pat, text)
            if match:
                raw_match = match.group(1)
                # Normalize to YYYY-MM-DD
                for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%d/%m/%Y", "%d-%m-%Y"):
                    try:
                        dt = datetime.strptime(raw_match, fmt)
                        return dt.strftime("%Y-%m-%d")
                    except ValueError:
                        pass
        return datetime.utcnow().strftime("%Y-%m-%d")

    def _classify_category(self, merchant: str, text: str) -> str:
        combined = f"{merchant} {text}".lower()
        for cat, keywords in MERCHANT_TAXONOMY.items():
            for kw in keywords:
                if kw in combined:
                    return cat
        return "Shopping"

    def _extract_line_items(self, lines: List[str]) -> List[ReceiptItem]:
        items = []
        item_regex = re.compile(r"^([A-Za-z0-9\s\.\&\-]{3,30})\s+[\$]?\s*([0-9]+\.[0-9]{2})$")
        for line in lines:
            match = item_regex.match(line.strip())
            if match:
                desc = match.group(1).strip()
                # Skip summary headers
                if not any(k in desc.lower() for k in ["total", "subtotal", "tax", "balance", "cash", "change", "visa", "mastercard"]):
                    try:
                        amt = float(match.group(2))
                        items.append(ReceiptItem(description=desc, amount=amt))
                    except ValueError:
                        pass
        return items[:15]  # limit to top 15 items


receipt_extractor = ReceiptExtractor()
