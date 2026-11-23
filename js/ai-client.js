/**
 * SpendSense 360 AI Integration Client
 * Connects frontend UI with local FastAPI AI backend (http://127.0.0.1:8000)
 */

const AI_API_BASE = "http://127.0.0.1:8000/api/v1";

const SpendSenseAI = {
  isBackendAvailable: false,

  async init() {
    try {
      const res = await fetch("http://127.0.0.1:8000/health", { mode: "cors" });
      if (res.ok) {
        this.isBackendAvailable = true;
        console.log(" SpendSense 360 AI Engine: Online");
        this.renderStatusPill(true);
      }
    } catch (e) {
      this.isBackendAvailable = false;
      console.log(" SpendSense 360 AI Engine: Offline (Run api/main.py)");
      this.renderStatusPill(false);
    }
  },

  renderStatusPill(online) {
    let pill = document.getElementById("aiStatusPill");
    if (!pill) {
      const header = document.querySelector("header .flex.items-center.gap-2\\.5");
      if (header) {
        pill = document.createElement("span");
        pill.id = "aiStatusPill";
        pill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold";
        header.appendChild(pill);
      }
    }
    if (pill) {
      if (online) {
        pill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[11px] font-semibold";
        pill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>AI Engine Active';
      } else {
        pill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[11px] font-semibold";
        pill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>AI Offline';
      }
    }
  },

  async predictAnomaly(transaction) {
    if (!this.isBackendAvailable) return null;
    try {
      const res = await fetch(`${AI_API_BASE}/anomaly/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(transaction.amount),
          category: transaction.category,
          timestamp: transaction.timestamp || new Date().toISOString(),
          note: transaction.note || ""
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Anomaly prediction skipped:", e);
    }
    return null;
  },

  async parseReceiptText(text) {
    if (!this.isBackendAvailable) {
      alert("AI Backend is offline. Ensure 'python -m uvicorn api.main:app' is running.");
      return null;
    }
    try {
      const res = await fetch(`${AI_API_BASE}/receipt/parse-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Receipt parsing error:", e);
    }
    return null;
  },

  async queryCopilot(query, transactions) {
    if (!this.isBackendAvailable) {
      return {
        answer: "AI Backend is currently offline. Please run the local FastAPI service on port 8000."
      };
    }
    try {
      const res = await fetch(`${AI_API_BASE}/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, transactions })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Copilot error:", e);
    }
    return { answer: "Unable to process query at this time." };
  }
};

// Auto-initialize on load
document.addEventListener("DOMContentLoaded", () => {
  SpendSenseAI.init();
});
