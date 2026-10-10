/**
 * SpendSense - Main Application Controller
 * Wires up UI, event listeners, budget alerts, modals, and transaction management.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.SpendSenseStore;
  const analytics = window.SpendSenseAnalytics;
  const exportImport = window.SpendSenseExportImport;

  // Cache DOM Elements
  const elements = {
    // Top Bar
    settingsBtn: document.getElementById('settingsBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),

    // Budget Overview Cards
    monthSpentVal: document.getElementById('monthSpentVal'),
    monthLimitVal: document.getElementById('monthLimitVal'),
    monthProgressFill: document.getElementById('monthProgressFill'),
    monthProgressPct: document.getElementById('monthProgressPct'),
    monthAlertBanner: document.getElementById('monthAlertBanner'),

    daySpentVal: document.getElementById('daySpentVal'),
    dayLimitVal: document.getElementById('dayLimitVal'),
    dayProgressFill: document.getElementById('dayProgressFill'),
    dayProgressPct: document.getElementById('dayProgressPct'),
    dayAlertBanner: document.getElementById('dayAlertBanner'),

    // Quick Add Expense Form
    expenseForm: document.getElementById('expenseForm'),
    amountInput: document.getElementById('expenseAmount'),
    currencyPrefix: document.getElementById('currencyPrefix'),
    categorySelect: document.getElementById('expenseCategory'),
    categoryChipsContainer: document.getElementById('categoryChipsContainer'),
    noteInput: document.getElementById('expenseNote'),
    dateInput: document.getElementById('expenseDate'),
    quickChips: document.querySelectorAll('.chip-quick-amount'),
    dateQuickPills: document.querySelectorAll('.pill-quick-date'),
    noteSuggestions: document.querySelectorAll('.suggestion-pill'),

    // Analytics / Period Controls
    chartPeriodTabs: document.querySelectorAll('.tab-period'),

    // History Log
    historyContainer: document.getElementById('historyContainer'),
    searchTxInput: document.getElementById('searchTxInput'),
    filterCategorySelect: document.getElementById('filterCategorySelect'),
    filterPeriodSelect: document.getElementById('filterPeriodSelect'),
    txCountBadge: document.getElementById('txCountBadge'),
    historyEmptyState: document.getElementById('historyEmptyState'),

    // Modals
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsForm: document.getElementById('settingsForm'),
    currencySelect: document.getElementById('currencySelect'),
    dailyBudgetInput: document.getElementById('dailyBudgetInput'),
    monthlyBudgetInput: document.getElementById('monthlyBudgetInput'),
    themeSelect: document.getElementById('themeSelect'),

    // Custom Category Section in Settings
    categoryListContainer: document.getElementById('categoryListContainer'),
    newCatNameInput: document.getElementById('newCatNameInput'),
    newCatIconInput: document.getElementById('newCatIconInput'),
    newCatColorInput: document.getElementById('newCatColorInput'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),

    // Backup & Demo buttons
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    importFileInput: document.getElementById('importFileInput'),
    importTriggerBtn: document.getElementById('importTriggerBtn'),
    loadSampleDataBtn: document.getElementById('loadSampleDataBtn'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),

    // Edit Transaction Modal
    editTxModal: document.getElementById('editTxModal'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    editTxForm: document.getElementById('editTxForm'),
    editTxId: document.getElementById('editTxId'),
    editAmountInput: document.getElementById('editAmountInput'),
    editCurrencyPrefix: document.getElementById('editCurrencyPrefix'),
    editCategorySelect: document.getElementById('editCategorySelect'),
    editNoteInput: document.getElementById('editNoteInput'),
    editDateInput: document.getElementById('editDateInput'),
    deleteTxModalBtn: document.getElementById('deleteTxModalBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  let selectedCategory = 'food';
  let txSearchQuery = '';
  let txCategoryFilter = 'all';
  let txPeriodFilter = 'all';

  // --- Initial Setup ---
  initTheme();
  initFormDates();
  renderCategoryPickers();
  updateBudgetOverview();
  renderHistory();
  analytics.render();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    });
  }

  // Store Event Subscription
  store.subscribe((event, data) => {
    updateBudgetOverview();
    renderHistory();
    analytics.render();
    if (event === 'category_added' || event === 'category_deleted') {
      renderCategoryPickers();
      renderCategoryManagementList();
    }
  });

  // --- Toast Notification Helper ---
  function showToast(message, type = 'success') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-up`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-text">${message}</span>
    `;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function triggerHaptic() {
    if (store.getSettings().hapticFeedback && navigator.vibrate) {
      try { navigator.vibrate(25); } catch (e) {}
    }
  }

  // --- Theme Handling ---
  function initTheme() {
    const settings = store.getSettings();
    applyTheme(settings.theme || 'system');
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System
      root.classList.remove('dark');
      root.classList.remove('light');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!elements.themeIcon) return;
    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    elements.themeIcon.innerHTML = isDark
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
  }

  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      const current = store.getSettings().theme;
      const next = current === 'dark' ? 'light' : 'dark';
      store.saveSettings({ theme: next });
      applyTheme(next);
      analytics.render();
      triggerHaptic();
    });
  }

  // --- Dates Setup ---
  function initFormDates() {
    const today = new Date().toISOString().split('T')[0];
    if (elements.dateInput) elements.dateInput.value = today;
  }

  // --- Categories UI (Chips & Selects) ---
  function renderCategoryPickers() {
    const categories = store.getCategories();

    // 1. Render Category Chips for Quick-Add
    if (elements.categoryChipsContainer) {
      elements.categoryChipsContainer.innerHTML = categories.map(cat => `
        <button type="button" class="category-chip ${cat.id === selectedCategory ? 'active' : ''}" data-cat-id="${cat.id}" style="--cat-color: ${cat.color}">
          <span class="chip-icon">${cat.icon}</span>
          <span class="chip-label">${cat.name}</span>
        </button>
      `).join('');

      elements.categoryChipsContainer.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          selectedCategory = chip.dataset.catId;
          elements.categoryChipsContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          if (elements.categorySelect) elements.categorySelect.value = selectedCategory;
          triggerHaptic();
        });
      });
    }

    // 2. Render Dropdown options
    const optionsHtml = categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
    if (elements.categorySelect) {
      elements.categorySelect.innerHTML = optionsHtml;
      elements.categorySelect.value = selectedCategory;
    }
    if (elements.editCategorySelect) {
      elements.editCategorySelect.innerHTML = optionsHtml;
    }
    if (elements.filterCategorySelect) {
      elements.filterCategorySelect.innerHTML = `<option value="all">All Categories</option>` + optionsHtml;
      elements.filterCategorySelect.value = txCategoryFilter;
    }
  }

  // Category select fallback sync
  if (elements.categorySelect) {
    elements.categorySelect.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      if (elements.categoryChipsContainer) {
        elements.categoryChipsContainer.querySelectorAll('.category-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.catId === selectedCategory);
        });
      }
    });
  }

  // Quick Amount Chips (+5, +10, etc.)
  elements.quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const addVal = parseFloat(chip.dataset.amount || 0);
      const curVal = parseFloat(elements.amountInput.value || 0);
      elements.amountInput.value = (curVal + addVal).toFixed(2);
      triggerHaptic();
    });
  });

  // Quick Date Pills (Today, Yesterday)
  elements.dateQuickPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const d = new Date();
      if (pill.dataset.offset === '-1') {
        d.setDate(d.getDate() - 1);
      }
      elements.dateInput.value = d.toISOString().split('T')[0];
      elements.dateQuickPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      triggerHaptic();
    });
  });

  // Quick Note Suggestions
  elements.noteSuggestions.forEach(sug => {
    sug.addEventListener('click', () => {
      elements.noteInput.value = sug.textContent.trim();
      elements.noteInput.focus();
      triggerHaptic();
    });
  });

  // --- Budget Limits & Alert Calculation (FR-03) ---
  function updateBudgetOverview() {
    const metrics = store.getBudgetMetrics();
    const cur = metrics.currency;

    if (elements.currencyPrefix) elements.currencyPrefix.textContent = cur;
    if (elements.editCurrencyPrefix) elements.editCurrencyPrefix.textContent = cur;

    // Monthly Budget Bar & Alerts
    const month = metrics.monthly;
    if (elements.monthSpentVal) elements.monthSpentVal.textContent = `${cur}${month.spent.toFixed(2)}`;
    if (elements.monthLimitVal) elements.monthLimitVal.textContent = `${cur}${month.limit.toFixed(2)}`;
    if (elements.monthProgressPct) elements.monthProgressPct.textContent = `${month.percentage}%`;

    if (elements.monthProgressFill) {
      const cappedPct = Math.min(100, month.percentage);
      elements.monthProgressFill.style.width = `${cappedPct}%`;
      elements.monthProgressFill.className = `progress-bar-fill fill-${month.status}`;
    }

    if (elements.monthAlertBanner) {
      elements.monthAlertBanner.className = `budget-alert-banner alert-${month.status}`;
      if (month.status === 'danger') {
        elements.monthAlertBanner.innerHTML = `
          <span class="alert-icon">🚨</span>
          <span class="alert-text"><strong>Over Budget!</strong> Exceeded monthly ceiling by ${cur}${month.overBy.toFixed(2)} (${month.percentage}%)</span>
        `;
        elements.monthAlertBanner.classList.remove('hidden');
      } else if (month.status === 'warning') {
        elements.monthAlertBanner.innerHTML = `
          <span class="alert-icon">⚠️</span>
          <span class="alert-text"><strong>Near monthly limit!</strong> ${cur}${month.remaining.toFixed(2)} remaining (${month.percentage}% used)</span>
        `;
        elements.monthAlertBanner.classList.remove('hidden');
      } else {
        elements.monthAlertBanner.innerHTML = `
          <span class="alert-icon">✓</span>
          <span class="alert-text"><strong>On Track:</strong> ${cur}${month.remaining.toFixed(2)} remaining this month</span>
        `;
        elements.monthAlertBanner.classList.remove('hidden');
      }
    }

    // Daily Budget Bar & Alerts
    const daily = metrics.daily;
    if (elements.daySpentVal) elements.daySpentVal.textContent = `${cur}${daily.spent.toFixed(2)}`;
    if (elements.dayLimitVal) elements.dayLimitVal.textContent = `${cur}${daily.limit.toFixed(2)}`;
    if (elements.dayProgressPct) elements.dayProgressPct.textContent = `${daily.percentage}%`;

    if (elements.dayProgressFill) {
      const cappedPct = Math.min(100, daily.percentage);
      elements.dayProgressFill.style.width = `${cappedPct}%`;
      elements.dayProgressFill.className = `progress-bar-fill fill-${daily.status}`;
    }

    if (elements.dayAlertBanner) {
      elements.dayAlertBanner.className = `budget-alert-banner alert-${daily.status}`;
      if (daily.status === 'danger') {
        elements.dayAlertBanner.innerHTML = `
          <span class="alert-icon">🚨</span>
          <span class="alert-text"><strong>Over Daily Budget:</strong> Exceeded today's limit by ${cur}${daily.overBy.toFixed(2)}!</span>
        `;
        elements.dayAlertBanner.classList.remove('hidden');
      } else if (daily.status === 'warning') {
        elements.dayAlertBanner.innerHTML = `
          <span class="alert-icon">⚠️</span>
          <span class="alert-text"><strong>Approaching Daily Limit:</strong> ${cur}${daily.remaining.toFixed(2)} left today (${daily.percentage}%)</span>
        `;
        elements.dayAlertBanner.classList.remove('hidden');
      } else {
        elements.dayAlertBanner.classList.add('hidden');
      }
    }
  }

  // --- Quick Expense Input Submission (FR-01) ---
  if (elements.expenseForm) {
    elements.expenseForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountVal = parseFloat(elements.amountInput.value);

      if (isNaN(amountVal) || amountVal <= 0) {
        showToast('Please enter a valid amount greater than 0', 'warning');
        elements.amountInput.focus();
        return;
      }

      const noteVal = elements.noteInput.value;
      const dateVal = elements.dateInput.value || new Date().toISOString().split('T')[0];
      const categoryVal = selectedCategory || elements.categorySelect.value || 'food';

      // Record transaction
      const newTx = store.addTransaction({
        amount: amountVal,
        category: categoryVal,
        note: noteVal,
        date: dateVal
      });

      // Reset form fields
      elements.amountInput.value = '';
      elements.noteInput.value = '';
      initFormDates();
      elements.amountInput.focus();

      triggerHaptic();
      showToast(`Logged ${store.getSettings().currency}${newTx.amount.toFixed(2)} under ${store.getCategory(newTx.category).name}!`, 'success');
    });
  }

  // --- Analytics Period Tabs (Day / Week / Month / All) ---
  elements.chartPeriodTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.chartPeriodTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const period = tab.dataset.period || 'month';
      analytics.setPeriod(period);
      triggerHaptic();
    });
  });

  // --- Transaction History Filter & Render (FR-05) ---
  function getFilteredTransactions() {
    const all = store.getTransactions();
    const query = txSearchQuery.toLowerCase().trim();
    const catMap = Object.fromEntries(store.getCategories().map(c => [c.id, c.name.toLowerCase()]));
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return all.filter(t => {
      // 1. Search Query filter (matches note or category name)
      if (query) {
        const matchesNote = (t.note || '').toLowerCase().includes(query);
        const matchesCat = (catMap[t.category] || t.category).includes(query);
        if (!matchesNote && !matchesCat) return false;
      }

      // 2. Category Dropdown Filter
      if (txCategoryFilter !== 'all' && t.category !== txCategoryFilter) {
        return false;
      }

      // 3. Period Filter
      if (txPeriodFilter === 'today' && t.date !== todayStr) {
        return false;
      } else if (txPeriodFilter === 'week') {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff)).toISOString().split('T')[0];
        if (t.date < startOfWeek || t.date > todayStr) return false;
      } else if (txPeriodFilter === 'month') {
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!t.date.startsWith(monthPrefix)) return false;
      }

      return true;
    });
  }

  function renderHistory() {
    const filtered = getFilteredTransactions();
    const cur = store.getSettings().currency;

    if (elements.txCountBadge) {
      elements.txCountBadge.textContent = `${filtered.length} entries`;
    }

    if (!elements.historyContainer) return;

    if (filtered.length === 0) {
      elements.historyContainer.innerHTML = '';
      if (elements.historyEmptyState) elements.historyEmptyState.classList.remove('hidden');
      return;
    }

    if (elements.historyEmptyState) elements.historyEmptyState.classList.add('hidden');

    // Group transactions by date
    const groups = {};
    filtered.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });

    // Format date headers
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let html = '';
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateStr => {
      let dateLabel = dateStr;
      if (dateStr === todayStr) dateLabel = 'Today';
      else if (dateStr === yesterdayStr) dateLabel = 'Yesterday';
      else {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          dateLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      const dayTotal = groups[dateStr].reduce((sum, t) => sum + t.amount, 0);

      html += `
        <div class="history-group">
          <div class="history-group-header">
            <span class="group-date-label">${dateLabel}</span>
            <span class="group-day-total">Total: ${cur}${dayTotal.toFixed(2)}</span>
          </div>
          <div class="history-group-items">
            ${groups[dateStr].map(tx => {
              const cat = store.getCategory(tx.category);
              return `
                <div class="history-item" data-id="${tx.id}">
                  <div class="item-cat-icon" style="background-color: ${cat.color}20; color: ${cat.color}">
                    <span>${cat.icon}</span>
                  </div>
                  <div class="item-details">
                    <div class="item-title">${escapeHtml(tx.note || cat.name)}</div>
                    <div class="item-meta">
                      <span class="item-cat-badge" style="border-color: ${cat.color}40; color: ${cat.color}">${cat.name}</span>
                    </div>
                  </div>
                  <div class="item-amount">-${cur}${tx.amount.toFixed(2)}</div>
                  <div class="item-actions">
                    <button type="button" class="action-btn edit-tx-btn" title="Edit Expense" data-id="${tx.id}">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" class="action-btn delete-tx-btn" title="Delete Expense" data-id="${tx.id}">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    elements.historyContainer.innerHTML = html;

    // Attach listeners for Edit & Delete buttons
    elements.historyContainer.querySelectorAll('.delete-tx-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Delete this expense?')) {
          store.deleteTransaction(id);
          triggerHaptic();
          showToast('Expense deleted', 'info');
        }
      });
    });

    elements.historyContainer.querySelectorAll('.edit-tx-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        openEditModal(id);
      });
    });
  }

  // Escape HTML helper
  function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
  }

  // History search & filters
  if (elements.searchTxInput) {
    elements.searchTxInput.addEventListener('input', (e) => {
      txSearchQuery = e.target.value;
      renderHistory();
    });
  }

  if (elements.filterCategorySelect) {
    elements.filterCategorySelect.addEventListener('change', (e) => {
      txCategoryFilter = e.target.value;
      renderHistory();
    });
  }

  if (elements.filterPeriodSelect) {
    elements.filterPeriodSelect.addEventListener('change', (e) => {
      txPeriodFilter = e.target.value;
      renderHistory();
    });
  }

  // --- Edit Transaction Modal ---
  function openEditModal(txId) {
    const tx = store.getTransactions().find(t => t.id === txId);
    if (!tx || !elements.editTxModal) return;

    elements.editTxId.value = tx.id;
    elements.editAmountInput.value = tx.amount.toFixed(2);
    elements.editCategorySelect.value = tx.category;
    elements.editNoteInput.value = tx.note || '';
    elements.editDateInput.value = tx.date;

    elements.editTxModal.classList.remove('hidden');
    elements.editAmountInput.focus();
  }

  function closeEditModal() {
    if (elements.editTxModal) elements.editTxModal.classList.add('hidden');
  }

  if (elements.closeEditModalBtn) {
    elements.closeEditModalBtn.addEventListener('click', closeEditModal);
  }

  if (elements.editTxModal) {
    elements.editTxModal.addEventListener('click', (e) => {
      if (e.target === elements.editTxModal) closeEditModal();
    });
  }

  if (elements.editTxForm) {
    elements.editTxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = elements.editTxId.value;
      const amountVal = parseFloat(elements.editAmountInput.value);

      if (isNaN(amountVal) || amountVal <= 0) {
        showToast('Please enter a valid amount', 'warning');
        return;
      }

      store.updateTransaction(id, {
        amount: amountVal,
        category: elements.editCategorySelect.value,
        note: elements.editNoteInput.value,
        date: elements.editDateInput.value
      });

      closeEditModal();
      triggerHaptic();
      showToast('Expense updated successfully!', 'success');
    });
  }

  if (elements.deleteTxModalBtn) {
    elements.deleteTxModalBtn.addEventListener('click', () => {
      const id = elements.editTxId.value;
      if (confirm('Are you sure you want to delete this expense?')) {
        store.deleteTransaction(id);
        closeEditModal();
        triggerHaptic();
        showToast('Expense deleted', 'info');
      }
    });
  }

  // --- Settings & Custom Categories Modal ---
  function openSettingsModal() {
    if (!elements.settingsModal) return;
    const settings = store.getSettings();

    if (elements.currencySelect) elements.currencySelect.value = settings.currency;
    if (elements.dailyBudgetInput) elements.dailyBudgetInput.value = settings.dailyBudget;
    if (elements.monthlyBudgetInput) elements.monthlyBudgetInput.value = settings.monthlyBudget;
    if (elements.themeSelect) elements.themeSelect.value = settings.theme || 'system';

    renderCategoryManagementList();
    elements.settingsModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    if (elements.settingsModal) elements.settingsModal.classList.add('hidden');
  }

  if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', openSettingsModal);
  if (elements.closeSettingsBtn) elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);

  if (elements.settingsModal) {
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) closeSettingsModal();
    });
  }

  if (elements.settingsForm) {
    elements.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newSettings = {
        currency: elements.currencySelect.value,
        dailyBudget: parseFloat(elements.dailyBudgetInput.value) || 50,
        monthlyBudget: parseFloat(elements.monthlyBudgetInput.value) || 1500,
        theme: elements.themeSelect.value
      };

      store.saveSettings(newSettings);
      applyTheme(newSettings.theme);
      closeSettingsModal();
      triggerHaptic();
      showToast('Settings saved successfully!', 'success');
    });
  }

  // --- Custom Categories Management (FR-07) ---
  function renderCategoryManagementList() {
    if (!elements.categoryListContainer) return;
    const categories = store.getCategories();

    elements.categoryListContainer.innerHTML = categories.map(cat => `
      <div class="category-mgmt-item">
        <span class="cat-mgmt-badge" style="background-color: ${cat.color}25; color: ${cat.color}; border: 1px solid ${cat.color}">
          ${cat.icon} ${cat.name}
        </span>
        ${cat.custom ? `
          <button type="button" class="cat-delete-btn" data-cat-id="${cat.id}" title="Delete Category">
            ✕
          </button>
        ` : `<span class="default-cat-badge">Default</span>`}
      </div>
    `).join('');

    elements.categoryListContainer.querySelectorAll('.cat-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.catId;
        if (confirm(`Delete category? Any expenses in this category will move to "Other".`)) {
          store.deleteCategory(id);
          triggerHaptic();
          showToast('Category deleted', 'info');
        }
      });
    });
  }

  if (elements.addCategoryBtn) {
    elements.addCategoryBtn.addEventListener('click', () => {
      const name = elements.newCatNameInput.value.trim();
      const icon = elements.newCatIconInput.value.trim() || '🏷️';
      const color = elements.newCatColorInput.value || '#3b82f6';

      if (!name) {
        showToast('Please provide a category name', 'warning');
        elements.newCatNameInput.focus();
        return;
      }

      store.addCategory({ name, icon, color });
      elements.newCatNameInput.value = '';
      elements.newCatIconInput.value = '';
      triggerHaptic();
      showToast(`Added custom category "${name}"!`, 'success');
    });
  }

  // --- Data Export & Import Handlers (FR-06) ---
  if (elements.exportCsvBtn) {
    elements.exportCsvBtn.addEventListener('click', () => {
      exportImport.exportToCSV();
      triggerHaptic();
    });
  }

  if (elements.exportJsonBtn) {
    elements.exportJsonBtn.addEventListener('click', () => {
      exportImport.exportToJSON();
      triggerHaptic();
    });
  }

  if (elements.importTriggerBtn && elements.importFileInput) {
    elements.importTriggerBtn.addEventListener('click', () => {
      elements.importFileInput.click();
    });

    elements.importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const shouldReplace = confirm(
        'Do you want to MERGE this file with current records?\nClick "OK" to Merge, or "Cancel" to Overwrite/Replace all data.'
      );
      const mode = shouldReplace ? 'merge' : 'replace';

      try {
        const result = await exportImport.handleFileUpload(file, mode);
        showToast(`Successfully imported ${result.count} transactions (${result.type})!`, 'success');
        elements.importFileInput.value = '';
      } catch (err) {
        alert('Import Error: ' + err.message);
      }
    });
  }

  // Load Sample Data (Demo)
  if (elements.loadSampleDataBtn) {
    elements.loadSampleDataBtn.addEventListener('click', () => {
      if (confirm('Load sample demonstration data? (Will populate ~30 realistic expenses over the past month)')) {
        const sampleTxs = store.loadSampleData();
        closeSettingsModal();
        triggerHaptic();
        showToast(`Loaded ${sampleTxs.length} sample transactions!`, 'success');
      }
    });
  }

  // Clear All Data
  if (elements.clearAllDataBtn) {
    elements.clearAllDataBtn.addEventListener('click', () => {
      if (confirm('WARNING: Are you sure you want to delete ALL logged expenses? This cannot be undone.')) {
        store.clearTransactions();
        closeSettingsModal();
        triggerHaptic();
        showToast('All transactions cleared.', 'warning');
      }
    });
  }

  // Global Keybindings (Escape to close modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeSettingsModal();
    }
  });
});
