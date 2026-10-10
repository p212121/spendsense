# 💳 SpendSense — Understand Your Spending

> **Lightweight, mobile-first personal finance tracker with zero server latency, instant expense logging, and real-time visual analytics.**

![SpendSense](icons/icon.svg)

---

## 🎯 Value Proposition

* **🔒 Privacy-First:** 100% locally on-device using browser storage (`localStorage`). No financial links, bank credentials, or external API transmissions.
* **⚡ Frictionless Logging:** Add expenses in **under 3 seconds** with touch-optimized numeric inputs and quick category chips.
* **📊 Visual Insights:** Interactive Chart.js doughnut breakdowns and trend bar graphs to visualize spending leaks.
* **🚨 Budget Alerts:** Real-time visual progress bars and dynamic badges alerting when approaching (**80%**) or exceeding (**100%**) daily & monthly ceilings.
* **📱 Offline Capable (PWA):** Zero-dependency offline service worker and web app manifest ready for mobile home screen installation.

---

## 🚀 Quick Start

### Option 1: Direct Browser Launch (Zero Install)
Simply double-click or open [`index.html`](file:///c:/Users/pawan/OneDrive/Desktop/spendsense/index.html) in any modern web browser (Chrome, Edge, Safari, Firefox). All dependencies (including Chart.js) are self-contained locally.

### Option 2: Local Development Server
```bash
# Run the built-in static HTTP server
npm start
```
Then visit **`http://localhost:3000`** in your browser.

### Run Automated Tests
```bash
npm test
```

---

## 📋 PRD Feature Matrix

| Requirement | Feature | Implementation Details | Status |
| :--- | :--- | :--- | :---: |
| **FR-01** | **Quick Expense Input** | Large numeric input, quick amount chips (`+5`, `+10`, `+20`, `+50`, `+100`), quick date toggles, instant category chips, smart note suggestions. | ✅ Done |
| **FR-02** | **Local Data Storage** | Zero server tracking. Complete persistence in browser `localStorage` (`spendsense_transactions`, `spendsense_categories`, `spendsense_settings`). | ✅ Done |
| **FR-03** | **Budget Limits Alert** | Configurable daily & monthly ceilings. Dynamic progress bars with healthy (green), near limit (amber at 80%), and over-limit (red at 100%) alert banners. | ✅ Done |
| **FR-04** | **Category Charts** | Interactive Chart.js doughnut chart with center total display and responsive legends; trend bar chart for daily/weekly/monthly spending patterns. | ✅ Done |
| **FR-05** | **Transaction History Log** | Chronological log grouped by day with day subtotals. Search by note/category, category dropdown filter, time filter, single-tap edit and delete modals. | ✅ Done |
| **FR-06** | **Data Export / Import** | One-click export to standard RFC 4180 **CSV** and full backup **JSON**. Seamless restore/merge with file upload. One-click **Demo Data** generator. | ✅ Done |
| **FR-07** | **Custom Categories** | Create custom spending categories with custom names, emoji icons, and accent color pickers. Automatic fallback to "Other" when a category is deleted. | ✅ Done |

---

## 📂 Project Structure

```
spendsense/
├── index.html                 # Mobile-first application shell & wireframe
├── manifest.webmanifest       # PWA manifest for home screen installation
├── sw.js                      # Service Worker for 100% offline functionality
├── server.js                  # Zero-dependency local development server
├── package.json               # Project manifest, scripts, and test runner
├── css/
│   └── styles.css             # High-contrast, mobile-first responsive design & dark/light mode
├── js/
│   ├── chart.umd.min.js       # Local Chart.js library (205 KB, offline ready)
│   ├── store.js               # Reactive store, LocalStorage CRUD, budget threshold calculations
│   ├── charts.js              # Chart.js visualization engine (doughnut & trend bar charts)
│   ├── export-import.js       # RFC 4180 CSV parser & JSON backup/restore manager
│   └── app.js                 # Primary controller wiring up UI, budget alerts, and history log
├── icons/
│   └── icon.svg               # Vector app icon & branding
└── test/
    └── suite.js               # Automated unit & integration tests
```

---

## 🛠️ Tech Stack

* **Frontend:** Plain HTML5, CSS3 (Modern Flexbox / Grid, CSS Custom Properties, Dark Mode).
* **Data Visualization:** Local Chart.js (v4.4.2 UMD bundle, zero CDN dependency).
* **Data Persistence:** Web Storage API (`window.localStorage`).
* **Offline & PWA:** Service Worker API (`sw.js`) & Web App Manifest.
* **Testing:** Node.js Assert test runner.

---

## 🔒 Security & Privacy Guarantee

SpendSense does **not** collect, store, transmit, or analyze any financial data on external servers. All information stays exclusively on your local device within your browser storage.
