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
    const textEl = document.getElementById("aiStatusBadgeText");
    const desktopBadge = document.getElementById("aiStatusBadge");
    const mobileBadge = document.getElementById("aiStatusBadgeMobile");

    if (textEl) {
      textEl.textContent = labelText || (online ? "Cloud AI Active" : "AI Offline");
    }

    [desktopBadge, mobileBadge].forEach(badge => {
      if (!badge) return;
      if (online) {
        badge.className = badge.id === "aiStatusBadge" 
          ? "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-300/50 dark:border-emerald-800"
          : "sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>${badge.id === "aiStatusBadge" ? (labelText || "Cloud AI Active") : "AI"}</span>`;
      } else {
        badge.className = badge.id === "aiStatusBadge"
          ? "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-semibold border border-amber-300/50 dark:border-amber-800"
          : "sm:hidden flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold";
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>${badge.id === "aiStatusBadge" ? "AI Offline" : "Off"}</span>`;
      }
    });
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
