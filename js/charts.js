/**
 * SpendSense - Interactive Visual Analytics with Chart.js
 * Renders category breakdown doughnut chart and daily spending trend bar chart.
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

  getFilteredTransactions() {
    const store = window.SpendSenseStore;
    const allTxs = store.getTransactions();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (this.currentPeriod === 'today') {
      return allTxs.filter(t => t.date === todayStr);
    }

    if (this.currentPeriod === 'week') {
      // Start of current week (Monday)
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      return allTxs.filter(t => t.date >= startOfWeekStr && t.date <= todayStr);
    }

    if (this.currentPeriod === 'month') {
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return allTxs.filter(t => t.date.startsWith(currentMonthStr));
    }

    // 'all'
    return allTxs;
  }

  render() {
    const txs = this.getFilteredTransactions();
    const store = window.SpendSenseStore;
    const settings = store.getSettings();
    const categories = store.getCategories();
    const currency = settings.currency || '$';

    this.renderDoughnutChart(txs, categories, currency);
    this.renderTrendChart(txs, currency);
  }

  renderDoughnutChart(txs, categories, currency) {
    const canvas = document.getElementById('categoryDoughnutChart');
    const emptyState = document.getElementById('chartEmptyState');
    const chartWrapper = document.getElementById('doughnutChartWrapper');
    const legendContainer = document.getElementById('categoryLegendContainer');

    if (!canvas) return;

    // Calculate category totals
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
      if (chartWrapper) chartWrapper.classList.add('hidden');
      if (legendContainer) legendContainer.innerHTML = '';
      if (this.doughnutChart) {
        this.doughnutChart.destroy();
        this.doughnutChart = null;
      }
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (chartWrapper) chartWrapper.classList.remove('hidden');

    const labels = activeCatIds.map(id => {
      const c = catMap[id];
      return c ? `${c.icon} ${c.name}` : id;
    });

    const data = activeCatIds.map(id => totals[id]);
    const bgColors = activeCatIds.map(id => {
      const c = catMap[id];
      return c ? c.color : '#64748b';
    });

    // Custom center text plugin for total
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw(chart) {
        const { ctx, chartArea: { top, bottom, left, right } } = chart;
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const isDark = document.documentElement.classList.contains('dark') ||
          (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Subtitle
        ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('TOTAL SPENT', centerX, centerY - 14);

        // Total Amount
        ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
        ctx.fillText(`${currency}${grandTotal.toFixed(2)}`, centerX, centerY + 10);
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
          borderColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 600
        },
        plugins: {
          legend: {
            display: false // We render custom interactive legend below
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 13 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label(context) {
                const val = context.raw || 0;
                const pct = ((val / grandTotal) * 100).toFixed(1);
                return ` ${currency}${val.toFixed(2)} (${pct}%)`;
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
    });

    // Render interactive legend pills
    if (legendContainer) {
      legendContainer.innerHTML = activeCatIds.map(id => {
        const c = catMap[id] || { name: id, icon: '📌', color: '#64748b' };
        const amt = totals[id];
        const pct = ((amt / grandTotal) * 100).toFixed(0);
        return `
          <div class="legend-chip" title="${c.name}">
            <span class="legend-color-dot" style="background-color: ${c.color}"></span>
            <span class="legend-label">${c.icon} ${c.name}</span>
            <span class="legend-pct">${pct}%</span>
            <span class="legend-amount">${currency}${amt.toFixed(2)}</span>
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
      // Show hourly breakdown for today or last 6 hours
      const hourlyMap = {};
      for (let h = 8; h <= 22; h += 2) {
        const key = `${h}:00`;
        hourlyMap[key] = 0;
      }
      txs.forEach(t => {
        if (t.createdAt) {
          const hour = new Date(t.createdAt).getHours();
          const bucket = Math.floor(hour / 2) * 2;
          const key = `${bucket}:00`;
          if (hourlyMap[key] !== undefined) {
            hourlyMap[key] += t.amount;
          }
        }
      });
      labels = Object.keys(hourlyMap);
      dataPoints = Object.values(hourlyMap);
    } else if (this.currentPeriod === 'week') {
      // 7 days of the week: Mon to Sun
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];
      const d = new Date(now);
      const curDay = d.getDay();
      const diff = d.getDate() - curDay + (curDay === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dayStr = dayDate.toISOString().split('T')[0];
        labels.push(`${days[i]} ${dayDate.getDate()}`);
        const sum = txs.filter(t => t.date === dayStr).reduce((acc, t) => acc + t.amount, 0);
        dataPoints.push(sum);
      }
    } else {
      // 'month' or 'all': Show daily aggregation over last 14 days or this month's days
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const limitDays = Math.min(daysInMonth, currentDay);

      // Aggregate by date for the month
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      for (let day = 1; day <= limitDays; day++) {
        const dayStr = `${currentMonthPrefix}-${String(day).padStart(2, '0')}`;
        labels.push(`${day}`);
        const sum = txs.filter(t => t.date === dayStr).reduce((acc, t) => acc + t.amount, 0);
        dataPoints.push(sum);
      }
    }

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const ctx = canvas.getContext('2d');
    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Spending',
          data: dataPoints,
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          hoverBackgroundColor: '#2563eb'
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
            ticks: {
              color: textColor,
              font: { size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              callback: (value) => `${currency}${value}`
            }
          }
        }
      }
    });
  }
}

window.SpendSenseAnalytics = new AnalyticsManager();
