/**
 * SpendSense 360 AI Integration Client
 * Connects frontend UI with Cloud & Local FastAPI AI backend
 */

// Production Cloud URL (Render) with automatic fallback to Localhost
const CLOUD_API_BASE = "https://spendsense-ai-bwk4.onrender.com";
const LOCAL_API_BASE = "http://127.0.0.1:8000";

const SpendSenseAI = {
  isBackendAvailable: false,
  activeEndpoint: null,

  async init() {
    // 1. Try Production Cloud API first
    try {
      const res = await fetch(`${CLOUD_API_BASE}/health`, { mode: "cors" });
      if (res.ok) {
        this.isBackendAvailable = true;
        this.activeEndpoint = `${CLOUD_API_BASE}/api/v1`;
        console.log(" SpendSense 360 AI Engine: Online (Cloud Production)");
        this.renderStatusPill(true, "Cloud AI Active");
        return;
      }
    } catch (e) {
      console.log(" Cloud API sleeping or unreachable, testing local fallback...");
    }

    // 2. Try Localhost API fallback
    try {
      const res = await fetch(`${LOCAL_API_BASE}/health`, { mode: "cors" });
      if (res.ok) {
        this.isBackendAvailable = true;
        this.activeEndpoint = `${LOCAL_API_BASE}/api/v1`;
        console.log(" SpendSense 360 AI Engine: Online (Localhost)");
        this.renderStatusPill(true, "Local AI Active");
        return;
      }
    } catch (e) {
      this.isBackendAvailable = false;
      this.activeEndpoint = null;
      console.log(" SpendSense 360 AI Engine: Offline");
      this.renderStatusPill(false, "AI Offline");
    }
  },

  renderStatusPill(online, labelText) {
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
        pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>${labelText || "AI Active"}`;
      } else {
        pill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[11px] font-semibold";
        pill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>AI Offline';
      }
    }
  },

  async predictAnomaly(transaction) {
    if (!this.isBackendAvailable || !this.activeEndpoint) return null;
    try {
      const res = await fetch(`${this.activeEndpoint}/anomaly/predict`, {
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
    if (!this.isBackendAvailable || !this.activeEndpoint) {
      alert("AI Backend is initializing. Please wait a few seconds.");
      return null;
    }
    try {
      const res = await fetch(`${this.activeEndpoint}/receipt/parse-text`, {
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
    if (!this.isBackendAvailable || !this.activeEndpoint) {
      return {
        answer: "AI Cloud Engine is spinning up or offline. Please refresh in 30 seconds."
      };
    }
    try {
      const res = await fetch(`${this.activeEndpoint}/copilot/query`, {
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
