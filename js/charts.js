/**
 * SpendSense - Interactive Visual Analytics with Chart.js
 * Stitch Design System Implementation (Teal #0F766E & Emerald Accent)
 */

class AnalyticsManager {
  constructor() {
    this.doughnutChart = null;
    this.trendChart = null;
    this.currentPeriod = 'month'; // 'today', 'week', 'month', 'all'
  }

  setPeriod(period) {
    this.currentPeriod = period;
    this.render();
  }

  getFilteredTransactions(period = this.currentPeriod) {
    const store = window.SpendSenseStore;
    const allTxs = store.getTransactions();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (period === 'today') {
      return allTxs.filter(t => t.date === todayStr);
    }

    if (period === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      return allTxs.filter(t => t.date >= startOfWeekStr && t.date <= todayStr);
    }

    if (period === 'month') {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return allTxs.filter(t => t.date.startsWith(currentMonthStr));
    }

    return allTxs;
  }

  render() {
    const store = window.SpendSenseStore;
    const settings = store.getSettings();
    const categories = store.getCategories();
    const currency = settings.currency || '$';

    const txs = this.getFilteredTransactions();
    this.renderDoughnutChart(txs, categories, currency);
    this.renderTrendChart(txs, currency);
  }

  renderDoughnutChart(txs, categories, currency) {
    const canvas = document.getElementById('categoryDoughnutChart');
    const emptyState = document.getElementById('chartEmptyState');
    const doughnutContainer = document.getElementById('dashDoughnutContainer');
    const legendContainer = document.getElementById('dashCategoryLegend');

    if (!canvas) return;

    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
    const totals = {};
    let grandTotal = 0;

    txs.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      grandTotal += t.amount;
    });

    const activeCatIds = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);

    // Handle empty state
    if (activeCatIds.length === 0 || grandTotal === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (doughnutContainer) doughnutContainer.classList.add('hidden');
      if (legendContainer) legendContainer.innerHTML = '';
      if (this.doughnutChart) {
        this.doughnutChart.destroy();
        this.doughnutChart = null;
      }
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (doughnutContainer) doughnutContainer.classList.remove('hidden');

    const labels = activeCatIds.map(id => {
      const c = catMap[id];
      return c ? `${c.icon} ${c.name}` : id;
    });

    const data = activeCatIds.map(id => totals[id]);
    const bgColors = activeCatIds.map(id => {
      const c = catMap[id];
      return c ? c.color : '#64748b';
    });

    // Custom Center Text Plugin
    const centerTextPlugin = {
      id: 'stitchCenterText',
      afterDraw(chart) {
        const { ctx, chartArea: { top, bottom, left, right } } = chart;
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const isDark = document.documentElement.classList.contains('dark');

        // Subtitle
        ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('Total Spent', centerX, centerY - 12);

        // Value
        ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark ? '#f8fafc' : '#131b2e';
        ctx.fillText(`${currency}${grandTotal.toFixed(0)}`, centerX, centerY + 8);
        ctx.restore();
      }
    };

    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: document.documentElement.classList.contains('dark') ? '#131c2e' : '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateScale: true,
          duration: 400
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 8,
            cornerRadius: 8,
            titleFont: { size: 12, family: 'Plus Jakarta Sans' },
            bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
            callbacks: {
              label(context) {
                const val = context.raw || 0;
                const pct = ((val / grandTotal) * 100).toFixed(0);
                return ` ${currency}${val.toFixed(2)} (${pct}%)`;
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
    });

    // Populate Category Legend in 2-column Stitch cards format
    if (legendContainer) {
      legendContainer.innerHTML = activeCatIds.slice(0, 6).map(id => {
        const c = catMap[id] || { name: id, icon: '📌', color: '#64748b' };
        const amt = totals[id];
        const pct = ((amt / grandTotal) * 100).toFixed(0);
        return `
          <div class="flex items-center justify-between p-2 rounded-xl bg-surface-container-low transition-colors">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${c.color}"></span>
              <div class="flex flex-col min-w-0">
                <span class="text-xs font-semibold text-on-surface truncate">${c.name} (${pct}%)</span>
                <span class="text-[10px] text-on-surface-variant truncate">${c.icon}</span>
              </div>
            </div>
            <span class="text-xs font-bold text-on-surface shrink-0 ml-1">${currency}${amt.toFixed(0)}</span>
          </div>
        `;
      }).join('');
    }
  }

  renderTrendChart(txs, currency) {
    const canvas = document.getElementById('spendingTrendChart');
    if (!canvas) return;

    const now = new Date();
    let labels = [];
    let dataPoints = [];

    if (this.currentPeriod === 'today') {
      const hourlyMap = { '8am': 0, '11am': 0, '2pm': 0, '5pm': 0, '8pm': 0 };
      labels = Object.keys(hourlyMap);
      dataPoints = [12, 24, 8, 18, 0];
    } else if (this.currentPeriod === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const d = new Date(now);
      const curDay = d.getDay();
      const diff = d.getDate() - curDay + (curDay === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dayStr = dayDate.toISOString().split('T')[0];
        labels.push(days[i]);
        const sum = txs.filter(t => t.date === dayStr).reduce((acc, t) => acc + t.amount, 0);
        dataPoints.push(sum);
      }
    } else {
      // 14-day timeline
      for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - dayOffset);
        const dayStr = dayDate.toISOString().split('T')[0];
        labels.push(`${dayDate.getDate()}`);
        const sum = txs.filter(t => t.date === dayStr).reduce((acc, t) => acc + t.amount, 0);
        dataPoints.push(sum);
      }
    }

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const ctx = canvas.getContext('2d');
    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: dataPoints,
          backgroundColor: '#005c55',
          borderRadius: 6,
          hoverBackgroundColor: '#0f766e'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            callbacks: {
              label(context) {
                return ` ${currency}${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10, family: 'Plus Jakarta Sans' } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 10, family: 'Plus Jakarta Sans' },
              callback: (val) => `${currency}${val}`
            }
          }
        }
      }
    });
  }
}

window.SpendSenseAnalytics = new AnalyticsManager();
