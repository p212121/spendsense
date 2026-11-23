/**
 * SpendSense - Stitch Design Application Controller
 * Recreates the 4 screens from "Responsive PRD Mobile Screens":
 * 1. Dashboard, 2. Quick Add Expense, 3. Analytics & Budgets, 4. History & Backup
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.SpendSenseStore;
  const analytics = window.SpendSenseAnalytics;
  const exportImport = window.SpendSenseExportImport;

  // App State
  let currentTab = 'dashboard';
  let inputAmount = '';
  let selectedCategory = 'food';
  let selectedDate = new Date().toISOString().split('T')[0];
  let historySearchQuery = '';
  let historyActiveFilter = 'all';

  // DOM Elements
  const els = {
    // Header & Theme
    headerSubtitle: document.getElementById('headerSubtitle'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    settingsBtn: document.getElementById('settingsBtn'),

    // Views
    views: {
      dashboard: document.getElementById('view-dashboard'),
      add: document.getElementById('view-add'),
      analytics: document.getElementById('view-analytics'),
      history: document.getElementById('view-history')
    },
    navTabs: document.querySelectorAll('.nav-tab'),

    // Dashboard Screen Elements
    dashMonthLabel: document.getElementById('dashMonthLabel'),
    dashMonthSpent: document.getElementById('dashMonthSpent'),
    dashMonthLimit: document.getElementById('dashMonthLimit'),
    dashMonthPctBadge: document.getElementById('dashMonthPctBadge'),
    dashMonthProgressBar: document.getElementById('dashMonthProgressBar'),
    dashMonthTargetSub: document.getElementById('dashMonthTargetSub'),
    dashMonthAlertCallout: document.getElementById('dashMonthAlertCallout'),
    dashMonthAlertIcon: document.getElementById('dashMonthAlertIcon'),
    dashMonthAlertText: document.getElementById('dashMonthAlertText'),
    dashTodaySpent: document.getElementById('dashTodaySpent'),
    dashTodayLimit: document.getElementById('dashTodayLimit'),
    dashTodayPaceBadge: document.getElementById('dashTodayPaceBadge'),
    dashQuickAddBtn: document.getElementById('dashQuickAddBtn'),
    dashRecentTxList: document.getElementById('dashRecentTxList'),
    dashViewAllBtn: document.getElementById('dashViewAllBtn'),
    periodToggleBtns: document.querySelectorAll('.period-toggle-btn'),

    // Quick Add Screen Elements
    addContextDate: document.getElementById('addContextDate'),
    heroCurrencySymbol: document.getElementById('heroCurrencySymbol'),
    heroAmountText: document.getElementById('heroAmountText'),
    cursorCaret: document.getElementById('cursorCaret'),
    keypadClearBtn: document.getElementById('keypadClearBtn'),
    addBudgetFeedback: document.getElementById('addBudgetFeedback'),
    addBudgetFeedbackText: document.getElementById('addBudgetFeedbackText'),
    addCategoryPills: document.getElementById('addCategoryPills'),
    addExpenseNote: document.getElementById('addExpenseNote'),
    addDateToggleBtn: document.getElementById('addDateToggleBtn'),
    addDateLabel: document.getElementById('addDateLabel'),
    keypadBtns: document.querySelectorAll('#numericKeypad .key-btn'),
    saveExpenseBtn: document.getElementById('saveExpenseBtn'),

    // Analytics Screen Elements
    analyticsEditBudgetBtn: document.getElementById('analyticsEditBudgetBtn'),
    analyticsQuickEditBtn: document.getElementById('analyticsQuickEditBtn'),
    analyticsTabs: document.querySelectorAll('.analytics-tab'),
    analyticsHeroTotal: document.getElementById('analyticsHeroTotal'),
    analyticsHeroSub: document.getElementById('analyticsHeroSub'),
    analyticsDailyAvg: document.getElementById('analyticsDailyAvg'),
    analyticsDailyAvgSub: document.getElementById('analyticsDailyAvgSub'),
    analyticsProjectedEnd: document.getElementById('analyticsProjectedEnd'),
    analyticsProjectedSub: document.getElementById('analyticsProjectedSub'),
    guardrailMonthSub: document.getElementById('guardrailMonthSub'),
    guardrailMonthBadge: document.getElementById('guardrailMonthBadge'),
    guardrailMonthBar: document.getElementById('guardrailMonthBar'),
    guardrailMonthRemaining: document.getElementById('guardrailMonthRemaining'),
    guardrailMonthStatus: document.getElementById('guardrailMonthStatus'),
    guardrailDaySub: document.getElementById('guardrailDaySub'),
    guardrailDayBadge: document.getElementById('guardrailDayBadge'),
    guardrailDayBar: document.getElementById('guardrailDayBar'),
    guardrailDayRemaining: document.getElementById('guardrailDayRemaining'),
    guardrailDayStatus: document.getElementById('guardrailDayStatus'),

    // History Screen Elements
    historySearchInput: document.getElementById('historySearchInput'),
    historyClearSearchBtn: document.getElementById('historyClearSearchBtn'),
    historyFilterPills: document.getElementById('historyFilterPills'),
    historyTotalCount: document.getElementById('historyTotalCount'),
    historyListContainer: document.getElementById('historyListContainer'),
    historyEmptyState: document.getElementById('historyEmptyState'),
    historyResetSearchBtn: document.getElementById('historyResetSearchBtn'),
    vaultTxCount: document.getElementById('vaultTxCount'),
    vaultExportBtn: document.getElementById('vaultExportBtn'),
    vaultImportFileInput: document.getElementById('vaultImportFileInput'),
    vaultDemoDataBtn: document.getElementById('vaultDemoDataBtn'),
    vaultClearBtn: document.getElementById('vaultClearBtn'),

    // Modals
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
    settingsForm: document.getElementById('settingsForm'),
    modalCurrencySelect: document.getElementById('modalCurrencySelect'),
    modalDailyBudget: document.getElementById('modalDailyBudget'),
    modalMonthlyBudget: document.getElementById('modalMonthlyBudget'),
    modalThemeSelect: document.getElementById('modalThemeSelect'),
    modalCategoryList: document.getElementById('modalCategoryList'),
    newCatIconInput: document.getElementById('newCatIconInput'),
    newCatNameInput: document.getElementById('newCatNameInput'),
    newCatColorInput: document.getElementById('newCatColorInput'),
    modalAddCatBtn: document.getElementById('modalAddCatBtn'),

    // Edit Modal
    editTxModal: document.getElementById('editTxModal'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    editTxForm: document.getElementById('editTxForm'),
    editTxId: document.getElementById('editTxId'),
    editAmountInput: document.getElementById('editAmountInput'),
    editCategorySelect: document.getElementById('editCategorySelect'),
    editNoteInput: document.getElementById('editNoteInput'),
    editDateInput: document.getElementById('editDateInput'),
    editDeleteTxBtn: document.getElementById('editDeleteTxBtn'),

    // Toast
    toastNotice: document.getElementById('toastNotice'),
    toastNoticeText: document.getElementById('toastNoticeText')
  };

  // --- Initial Setup ---
  initTheme();
  renderAddCategoryPills();
  updateAllScreens();
  initServiceWorker();

  // Subscribe Store Events
  store.subscribe((event) => {
    updateAllScreens();
    if (event === 'category_added' || event === 'category_deleted') {
      renderAddCategoryPills();
      renderModalCategoryList();
    }
  });

  // --- Tab Navigation Switcher ---
  function switchTab(tabName) {
    currentTab = tabName;

    // Show/hide screen views
    Object.keys(els.views).forEach(name => {
      const view = els.views[name];
      if (!view) return;
      if (name === tabName) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    // Update bottom nav icons
    els.navTabs.forEach(tab => {
      const target = tab.dataset.tab;
      tab.classList.toggle('active', target === tabName);
    });

    // Update header subtitle
    const titles = {
      dashboard: 'Dashboard',
      add: 'Quick Add',
      analytics: 'Analytics',
      history: 'History'
    };
    if (els.headerSubtitle) els.headerSubtitle.textContent = titles[tabName] || 'SpendSense';

    // Refresh context if needed
    if (tabName === 'analytics') {
      analytics.render();
      updateAnalyticsScreen();
    } else if (tabName === 'history') {
      renderHistoryScreen();
    } else if (tabName === 'dashboard') {
      updateDashboardScreen();
      analytics.render();
    } else if (tabName === 'add') {
      updateAddFeedback();
    }

    triggerHaptic();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  els.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  if (els.dashQuickAddBtn) {
    els.dashQuickAddBtn.addEventListener('click', () => switchTab('add'));
  }

  if (els.dashViewAllBtn) {
    els.dashViewAllBtn.addEventListener('click', () => switchTab('history'));
  }

  // --- Toast Notice ---
  function showToast(text) {
    if (!els.toastNotice) return;
    els.toastNoticeText.textContent = text;
    els.toastNotice.classList.add('show');
    setTimeout(() => {
      els.toastNotice.classList.remove('show');
    }, 2200);
  }

  function triggerHaptic() {
    if (store.getSettings().hapticFeedback && navigator.vibrate) {
      try { navigator.vibrate(20); } catch (e) {}
    }
  }

  // --- Theme Management ---
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
      root.classList.remove('dark');
      root.classList.remove('light');
    }
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!els.themeIcon) return;
    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    els.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }

  if (els.themeToggleBtn) {
    els.themeToggleBtn.addEventListener('click', () => {
      const cur = store.getSettings().theme;
      const next = cur === 'dark' ? 'light' : 'dark';
      store.saveSettings({ theme: next });
      applyTheme(next);
      analytics.render();
      triggerHaptic();
    });
  }

  // --- PWA Service Worker ---
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // --- Update All Screens Synchronously ---
  function updateAllScreens() {
    updateDashboardScreen();
    updateAnalyticsScreen();
    renderHistoryScreen();
    updateAddFeedback();
    analytics.render();
  }

  // =========================================================================
  // 1. DASHBOARD SCREEN
  // =========================================================================
  function updateDashboardScreen() {
    const metrics = store.getBudgetMetrics();
    const cur = metrics.currency;
    const month = metrics.monthly;
    const daily = metrics.daily;

    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (els.dashMonthLabel) els.dashMonthLabel.textContent = monthName;

    // Monthly Card
    if (els.dashMonthSpent) els.dashMonthSpent.textContent = `${cur}${month.spent.toFixed(2)}`;
    if (els.dashMonthLimit) els.dashMonthLimit.textContent = `${cur}${month.limit.toFixed(0)}`;
    if (els.dashMonthTargetSub) els.dashMonthTargetSub.textContent = `${cur}${month.limit.toFixed(0)}`;

    if (els.dashMonthPctBadge) {
      els.dashMonthPctBadge.textContent = `${month.percentage}%`;
      if (month.status === 'danger') {
        els.dashMonthPctBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container';
      } else if (month.status === 'warning') {
        els.dashMonthPctBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300';
      } else {
        els.dashMonthPctBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container/40 text-on-secondary-container';
      }
    }

    if (els.dashMonthProgressBar) {
      const capped = Math.min(100, month.percentage);
      els.dashMonthProgressBar.style.width = `${capped}%`;
      if (month.status === 'danger') {
        els.dashMonthProgressBar.className = 'h-full rounded-full transition-all duration-700 ease-out shadow-sm bg-gradient-to-r from-red-500 via-red-600 to-rose-700';
      } else if (month.status === 'warning') {
        els.dashMonthProgressBar.className = 'h-full rounded-full transition-all duration-700 ease-out shadow-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600';
      } else {
        els.dashMonthProgressBar.className = 'h-full rounded-full transition-all duration-700 ease-out shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600';
      }
    }

    // Callout alert badge
    if (els.dashMonthAlertCallout) {
      if (month.status === 'danger') {
        els.dashMonthAlertCallout.className = 'flex items-center gap-2.5 p-3 rounded-xl text-xs bg-error-container/40 text-on-error-container';
        els.dashMonthAlertIcon.textContent = 'error';
        els.dashMonthAlertIcon.className = 'material-symbols-outlined text-lg shrink-0 text-error';
        els.dashMonthAlertText.innerHTML = `<strong class="font-bold">Over Budget!</strong> Exceeded monthly limit by ${cur}${month.overBy.toFixed(2)}.`;
      } else if (month.status === 'warning') {
        els.dashMonthAlertCallout.className = 'flex items-center gap-2.5 p-3 rounded-xl text-xs bg-amber-500/15 text-on-surface';
        els.dashMonthAlertIcon.textContent = 'warning';
        els.dashMonthAlertIcon.className = 'material-symbols-outlined text-lg shrink-0 text-amber-600';
        els.dashMonthAlertText.innerHTML = `<strong class="font-bold">Near monthly limit!</strong> ${cur}${month.remaining.toFixed(2)} remaining.`;
      } else {
        els.dashMonthAlertCallout.className = 'flex items-center gap-2.5 p-3 rounded-xl text-xs bg-secondary-container/25 text-on-surface';
        els.dashMonthAlertIcon.textContent = 'check_circle';
        els.dashMonthAlertIcon.className = 'material-symbols-outlined text-lg shrink-0 text-primary';
        els.dashMonthAlertText.innerHTML = `<strong class="font-bold">On Track:</strong> ${cur}${month.remaining.toFixed(2)} remaining this month.`;
      }
    }

    // Daily gauge
    if (els.dashTodaySpent) els.dashTodaySpent.textContent = `${cur}${daily.spent.toFixed(2)}`;
    if (els.dashTodayLimit) els.dashTodayLimit.textContent = `${cur}${daily.limit.toFixed(0)}`;
    if (els.dashTodayPaceBadge) {
      els.dashTodayPaceBadge.textContent = `${daily.percentage}% daily pace`;
      if (daily.status === 'danger') {
        els.dashTodayPaceBadge.className = 'text-[11px] font-bold bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full shadow-sm';
      } else {
        els.dashTodayPaceBadge.className = 'text-[11px] text-primary font-bold bg-surface-container-lowest px-2.5 py-0.5 rounded-full shadow-sm';
      }
    }

    // Recent Transactions in Dashboard (top 4)
    const recent = store.getTransactions().slice(0, 4);
    if (els.dashRecentTxList) {
      if (recent.length === 0) {
        els.dashRecentTxList.innerHTML = `
          <div class="py-4 text-center text-xs text-on-surface-variant">
            No transactions yet. Tap <strong class="text-primary font-semibold cursor-pointer" id="dashEmptyAddBtn">+ Quick Add</strong> to record one!
          </div>
        `;
        const addLink = document.getElementById('dashEmptyAddBtn');
        if (addLink) addLink.onclick = () => switchTab('add');
      } else {
        els.dashRecentTxList.innerHTML = recent.map(tx => {
          const cat = store.getCategory(tx.category);
          return `
            <div class="flex items-center justify-between py-2 min-h-[52px] px-2 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer recent-tx-row" data-id="${tx.id}">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg" style="background-color: ${cat.color}20;">
                  <span>${cat.icon}</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-bold text-on-surface truncate">${escapeHtml(tx.note || cat.name)}</span>
                  <span class="text-[11px] text-on-surface-variant">${cat.name} • ${formatShortDate(tx.date)}</span>
                </div>
              </div>
              <span class="font-bold text-sm text-on-surface shrink-0 ml-2">-${cur}${tx.amount.toFixed(2)}</span>
            </div>
          `;
        }).join('');

        els.dashRecentTxList.querySelectorAll('.recent-tx-row').forEach(row => {
          row.addEventListener('click', () => openEditModal(row.dataset.id));
        });
      }
    }
  }

  // Dashboard Period Toggle Buttons
  els.periodToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.periodToggleBtns.forEach(b => {
        b.className = 'px-2.5 py-1 rounded-lg text-on-surface-variant text-xs font-medium hover:text-on-surface transition-all period-toggle-btn';
      });
      btn.className = 'px-2.5 py-1 rounded-lg bg-surface-container-lowest text-primary text-xs font-semibold shadow-sm transition-all period-toggle-btn';
      analytics.setPeriod(btn.dataset.period || 'month');
      triggerHaptic();
    });
  });

  // =========================================================================
  // 2. QUICK ADD EXPENSE SCREEN (<3s Entry with Tactile Numeric Keypad)
  // =========================================================================
  function renderAddCategoryPills() {
    const categories = store.getCategories();
    if (!els.addCategoryPills) return;

    els.addCategoryPills.innerHTML = categories.map(cat => `
      <button type="button" class="cat-pill shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface shadow-sm border border-surface-container/50 active:scale-95 transition-transform ${cat.id === selectedCategory ? 'active' : ''}" data-cat-id="${cat.id}">
        <span class="text-lg leading-none">${cat.icon}</span>
        <span class="text-xs font-semibold">${cat.name}</span>
      </button>
    `).join('') + `
      <button type="button" class="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-container text-primary shadow-sm active:scale-95 transition-transform text-xs font-semibold" id="addCustomCatChip">
        <span class="material-symbols-outlined text-base">add</span>
        <span>Custom</span>
      </button>
    `;

    els.addCategoryPills.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.catId;
        els.addCategoryPills.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAddFeedback();
        triggerHaptic();
      });
    });

    const customBtn = document.getElementById('addCustomCatChip');
    if (customBtn) {
      customBtn.addEventListener('click', () => openSettingsModal());
    }
  }

  // Update Hero Amount Display
  function updateHeroAmount() {
    const cur = store.getSettings().currency;
    if (els.heroCurrencySymbol) els.heroCurrencySymbol.textContent = cur;

    if (!inputAmount || inputAmount === '0') {
      if (els.heroAmountText) els.heroAmountText.textContent = '0.00';
    } else {
      if (els.heroAmountText) els.heroAmountText.textContent = inputAmount;
    }
    updateAddFeedback();
  }

  function updateAddFeedback() {
    const cur = store.getSettings().currency;
    const cat = store.getCategory(selectedCategory);
    const val = parseFloat(inputAmount) || 0;

    if (els.addContextDate) {
      const isToday = selectedDate === new Date().toISOString().split('T')[0];
      els.addContextDate.textContent = isToday ? 'Today, ' + new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : selectedDate;
    }

    if (els.addBudgetFeedbackText) {
      if (val > 0) {
        els.addBudgetFeedbackText.textContent = `Logging ${cur}${val.toFixed(2)} under ${cat.name}`;
      } else {
        els.addBudgetFeedbackText.textContent = `Select category & amount to save in <3s`;
      }
    }
  }

  // Keypad Click Handlers
  els.keypadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic();
      const val = btn.dataset.val;
      const action = btn.dataset.action;

      if (action === 'backspace') {
        inputAmount = inputAmount.slice(0, -1);
      } else if (val) {
        // Prevent multiple decimals
        if (val === '.' && inputAmount.includes('.')) return;
        // Limit precision to 2 decimal places
        if (inputAmount.includes('.')) {
          const parts = inputAmount.split('.');
          if (parts[1].length >= 2) return;
        }
        if (inputAmount.length > 8) return;
        inputAmount += val;
      }
      updateHeroAmount();
    });
  });

  if (els.keypadClearBtn) {
    els.keypadClearBtn.addEventListener('click', () => {
      inputAmount = '';
      updateHeroAmount();
      triggerHaptic();
    });
  }

  // Quick Date Toggle
  if (els.addDateToggleBtn) {
    els.addDateToggleBtn.addEventListener('click', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];

      if (selectedDate === todayStr) {
        selectedDate = yestStr;
        if (els.addDateLabel) els.addDateLabel.textContent = 'Yesterday';
      } else {
        selectedDate = todayStr;
        if (els.addDateLabel) els.addDateLabel.textContent = 'Today';
      }
      updateAddFeedback();
      triggerHaptic();
    });
  }

  // Save Expense Button (<3s CTA)
  if (els.saveExpenseBtn) {
    els.saveExpenseBtn.addEventListener('click', () => {
      const amountVal = parseFloat(inputAmount);
      if (isNaN(amountVal) || amountVal <= 0) {
        showToast('⚠️ Please enter an amount');
        triggerHaptic();
        return;
      }

      const noteVal = (els.addExpenseNote ? els.addExpenseNote.value : '').trim();

      const newTx = store.addTransaction({
        amount: amountVal,
        category: selectedCategory,
        note: noteVal,
        date: selectedDate
      });

      // Reset Form State
      inputAmount = '';
      if (els.addExpenseNote) els.addExpenseNote.value = '';
      updateHeroAmount();

      triggerHaptic();
      showToast(`✓ Logged ${store.getSettings().currency}${newTx.amount.toFixed(2)} in 180ms!`);

      // Switch back to Dashboard to see results
      setTimeout(() => switchTab('dashboard'), 250);
    });
  }

  // =========================================================================
  // 3. ANALYTICS & BUDGET GUARDRAILS SCREEN
  // =========================================================================
  function updateAnalyticsScreen() {
    const metrics = store.getBudgetMetrics();
    const cur = metrics.currency;
    const month = metrics.monthly;
    const daily = metrics.daily;

    const txs = store.getTransactions();
    const periodTxs = analytics.getFilteredTransactions();
    const periodSum = periodTxs.reduce((sum, t) => sum + t.amount, 0);

    if (els.analyticsHeroTotal) els.analyticsHeroTotal.textContent = `${cur}${periodSum.toFixed(2)}`;
    if (els.analyticsHeroSub) els.analyticsHeroSub.textContent = `${periodTxs.length} transactions in this period`;

    // Daily Average
    const uniqueDates = new Set(txs.map(t => t.date)).size || 1;
    const allTotal = txs.reduce((sum, t) => sum + t.amount, 0);
    const avg = allTotal / uniqueDates;
    if (els.analyticsDailyAvg) els.analyticsDailyAvg.textContent = `${cur}${avg.toFixed(2)}`;

    // Projected Month-End
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = avg * daysInMonth;
    if (els.analyticsProjectedEnd) els.analyticsProjectedEnd.textContent = `${cur}${projected.toFixed(0)}`;
    if (els.analyticsProjectedSub) {
      if (projected > month.limit) {
        els.analyticsProjectedSub.textContent = `Over $${month.limit.toFixed(0)} Cap`;
        els.analyticsProjectedSub.className = 'text-[10px] text-error font-semibold mt-0.5';
      } else {
        els.analyticsProjectedSub.textContent = `Under $${month.limit.toFixed(0)} Cap`;
        els.analyticsProjectedSub.className = 'text-[10px] text-primary font-semibold mt-0.5';
      }
    }

    // Monthly Ceiling Guardrail
    if (els.guardrailMonthSub) els.guardrailMonthSub.textContent = `${cur}${month.spent.toFixed(2)} used of ${cur}${month.limit.toFixed(0)}`;
    if (els.guardrailMonthBadge) {
      els.guardrailMonthBadge.textContent = `${month.percentage}% Consumed`;
      els.guardrailMonthBadge.className = month.status === 'danger'
        ? 'px-2 py-0.5 rounded-full text-xs font-bold bg-error-container text-on-error-container'
        : 'px-2 py-0.5 rounded-full text-xs font-bold bg-secondary-container/40 text-on-secondary-container';
    }
    if (els.guardrailMonthBar) {
      els.guardrailMonthBar.style.width = `${Math.min(100, month.percentage)}%`;
      els.guardrailMonthBar.className = month.status === 'danger' ? 'bg-error h-full rounded-full transition-all' : 'bg-primary h-full rounded-full transition-all';
    }
    if (els.guardrailMonthRemaining) els.guardrailMonthRemaining.textContent = `${cur}${month.remaining.toFixed(2)} left`;
    if (els.guardrailMonthStatus) els.guardrailMonthStatus.textContent = month.status === 'danger' ? 'Over Cap' : month.status === 'warning' ? 'Near Limit' : 'Safe Zone';

    // Daily Target Guardrail
    if (els.guardrailDaySub) els.guardrailDaySub.textContent = `${cur}${daily.spent.toFixed(2)} used of ${cur}${daily.limit.toFixed(0)}`;
    if (els.guardrailDayBadge) els.guardrailDayBadge.textContent = `${daily.percentage}% Consumed`;
    if (els.guardrailDayBar) {
      els.guardrailDayBar.style.width = `${Math.min(100, daily.percentage)}%`;
      els.guardrailDayBar.className = daily.status === 'danger' ? 'bg-error h-full rounded-full transition-all' : 'bg-secondary h-full rounded-full transition-all';
    }
    if (els.guardrailDayRemaining) els.guardrailDayRemaining.textContent = `${cur}${daily.remaining.toFixed(2)} buffer`;
    if (els.guardrailDayStatus) els.guardrailDayStatus.textContent = daily.status === 'danger' ? 'Over Limit' : 'Paced Well';
  }

  els.analyticsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      els.analyticsTabs.forEach(t => {
        t.className = 'analytics-tab flex-1 h-9 rounded-lg text-xs font-semibold transition-all text-on-surface-variant hover:text-on-surface';
      });
      tab.className = 'analytics-tab flex-1 h-9 rounded-lg text-xs font-semibold bg-surface-container-lowest text-primary shadow-sm';
      analytics.setPeriod(tab.dataset.range || 'month');
      updateAnalyticsScreen();
      triggerHaptic();
    });
  });

  if (els.analyticsEditBudgetBtn) els.analyticsEditBudgetBtn.onclick = () => openSettingsModal();
  if (els.analyticsQuickEditBtn) els.analyticsQuickEditBtn.onclick = () => openSettingsModal();

  // =========================================================================
  // 4. TRANSACTION HISTORY & LOCAL VAULT SCREEN (FR-05, FR-06)
  // =========================================================================
  function renderHistoryScreen() {
    const all = store.getTransactions();
    const cur = store.getSettings().currency;

    if (els.vaultTxCount) els.vaultTxCount.textContent = `${all.length} transactions`;
    if (els.historyTotalCount) els.historyTotalCount.textContent = all.length;

    renderHistoryFilterPills();

    const query = historySearchQuery.toLowerCase().trim();
    const catMap = Object.fromEntries(store.getCategories().map(c => [c.id, c.name.toLowerCase()]));

    const filtered = all.filter(t => {
      if (historyActiveFilter !== 'all') {
        if (historyActiveFilter === 'high') {
          if (t.amount <= 50) return false;
        } else if (t.category !== historyActiveFilter) {
          return false;
        }
      }
      if (query) {
        const matchesNote = (t.note || '').toLowerCase().includes(query);
        const matchesCat = (catMap[t.category] || t.category).includes(query);
        if (!matchesNote && !matchesCat) return false;
      }
      return true;
    });

    if (!els.historyListContainer) return;

    if (filtered.length === 0) {
      els.historyListContainer.innerHTML = '';
      if (els.historyEmptyState) els.historyEmptyState.classList.remove('hidden');
      return;
    }

    if (els.historyEmptyState) els.historyEmptyState.classList.add('hidden');

    // Group transactions by date
    const groups = {};
    filtered.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split('T')[0];

    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    els.historyListContainer.innerHTML = sortedDates.map(dateStr => {
      let label = dateStr;
      if (dateStr === todayStr) label = 'TODAY';
      else if (dateStr === yestStr) label = 'YESTERDAY';
      else label = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

      const groupTotal = groups[dateStr].reduce((sum, t) => sum + t.amount, 0);

      return `
        <div class="date-group flex flex-col gap-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">${label}</span>
            <span class="text-xs text-on-surface-variant font-semibold">${cur}${groupTotal.toFixed(2)}</span>
          </div>
          ${groups[dateStr].map(tx => {
            const cat = store.getCategory(tx.category);
            return `
              <div class="transaction-item bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex flex-col gap-2 border border-surface-container/50 hover:shadow-md transition-all" data-id="${tx.id}">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl" style="background-color: ${cat.color}20;">
                      <span>${cat.icon}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-on-surface truncate">${escapeHtml(tx.note || cat.name)}</p>
                      <p class="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        <span>${cat.name}</span>
                        <span>•</span>
                        <span>${formatShortDate(tx.date)}</span>
                      </p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-sm font-extrabold text-on-surface tracking-tight">-${cur}${tx.amount.toFixed(2)}</span>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-1 border-t border-surface-container/40">
                  <button type="button" class="history-edit-btn px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold flex items-center gap-1.5 transition-colors" data-id="${tx.id}">
                    <svg class="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    <span>Edit</span>
                  </button>
                  <button type="button" class="history-delete-btn px-2.5 py-1 rounded-lg bg-error-container/40 text-on-error-container hover:bg-error-container text-xs font-semibold flex items-center gap-1.5 transition-colors" data-id="${tx.id}">
                    <svg class="w-3.5 h-3.5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');

    // Attach Edit and Delete listeners
    els.historyListContainer.querySelectorAll('.history-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    els.historyListContainer.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('Delete this expense?')) {
          store.deleteTransaction(id);
          triggerHaptic();
          showToast('Expense deleted');
        }
      });
    });
  }

  function renderHistoryFilterPills() {
    const categories = store.getCategories();
    if (!els.historyFilterPills) return;

    const baseHtml = `
      <button type="button" class="filter-pill shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${historyActiveFilter === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface'}" data-filter="all">
        All
      </button>
      <button type="button" class="filter-pill shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${historyActiveFilter === 'high' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface'}" data-filter="high">
        💸 &gt; $50
      </button>
    `;

    const catHtml = categories.slice(0, 5).map(c => `
      <button type="button" class="filter-pill shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${historyActiveFilter === c.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface'}" data-filter="${c.id}">
        ${c.icon} ${c.name}
      </button>
    `).join('');

    els.historyFilterPills.innerHTML = baseHtml + catHtml;

    els.historyFilterPills.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        historyActiveFilter = btn.dataset.filter;
        renderHistoryScreen();
        triggerHaptic();
      });
    });
  }

  if (els.historySearchInput) {
    els.historySearchInput.addEventListener('input', (e) => {
      historySearchQuery = e.target.value;
      if (els.historyClearSearchBtn) {
        els.historyClearSearchBtn.classList.toggle('hidden', !historySearchQuery);
      }
      renderHistoryScreen();
    });
  }

  if (els.historyClearSearchBtn) {
    els.historyClearSearchBtn.addEventListener('click', () => {
      els.historySearchInput.value = '';
      historySearchQuery = '';
      els.historyClearSearchBtn.classList.add('hidden');
      renderHistoryScreen();
    });
  }

  if (els.historyResetSearchBtn) {
    els.historyResetSearchBtn.addEventListener('click', () => {
      if (els.historySearchInput) els.historySearchInput.value = '';
      historySearchQuery = '';
      historyActiveFilter = 'all';
      renderHistoryScreen();
    });
  }

  // --- Vault Action Buttons (FR-06) ---
  if (els.vaultExportBtn) {
    els.vaultExportBtn.addEventListener('click', () => {
      const choice = confirm('Click "OK" to export CSV, or "Cancel" to export full JSON backup.');
      if (choice) {
        exportImport.exportToCSV();
      } else {
        exportImport.exportToJSON();
      }
      triggerHaptic();
    });
  }

  if (els.vaultImportFileInput) {
    els.vaultImportFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const shouldMerge = confirm('MERGE imported records with current expenses? (Click Cancel to Overwrite/Replace)');
      const mode = shouldMerge ? 'merge' : 'replace';

      try {
        const res = await exportImport.handleFileUpload(file, mode);
        showToast(`✓ Restored ${res.count} transactions!`);
        els.vaultImportFileInput.value = '';
      } catch (err) {
        alert('Import Error: ' + err.message);
      }
    });
  }

  if (els.vaultDemoDataBtn) {
    els.vaultDemoDataBtn.addEventListener('click', () => {
      if (confirm('Load demonstration data? (Will populate 25+ realistic expenses across categories)')) {
        const data = store.loadSampleData();
        triggerHaptic();
        showToast(`✓ Loaded ${data.length} sample transactions!`);
      }
    });
  }

  if (els.vaultClearBtn) {
    els.vaultClearBtn.addEventListener('click', () => {
      if (confirm('WARNING: Permanently clear all stored transactions from browser localStorage?')) {
        store.clearTransactions();
        triggerHaptic();
        showToast('Vault cleared');
      }
    });
  }

  // =========================================================================
  // 5. MODALS: SETTINGS & EDIT TRANSACTION
  // =========================================================================
  function openSettingsModal() {
    if (!els.settingsModal) return;
    const settings = store.getSettings();

    if (els.modalCurrencySelect) els.modalCurrencySelect.value = settings.currency;
    if (els.modalDailyBudget) els.modalDailyBudget.value = settings.dailyBudget;
    if (els.modalMonthlyBudget) els.modalMonthlyBudget.value = settings.monthlyBudget;
    if (els.modalThemeSelect) els.modalThemeSelect.value = settings.theme || 'system';

    renderModalCategoryList();
    els.settingsModal.classList.add('active');
  }

  function closeSettingsModal() {
    if (els.settingsModal) els.settingsModal.classList.remove('active');
  }

  if (els.settingsBtn) els.settingsBtn.onclick = openSettingsModal;
  if (els.closeSettingsModalBtn) els.closeSettingsModalBtn.onclick = closeSettingsModal;

  if (els.settingsModal) {
    els.settingsModal.addEventListener('click', (e) => {
      if (e.target === els.settingsModal) closeSettingsModal();
    });
  }

  if (els.settingsForm) {
    els.settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        currency: els.modalCurrencySelect.value,
        dailyBudget: parseFloat(els.modalDailyBudget.value) || 50,
        monthlyBudget: parseFloat(els.modalMonthlyBudget.value) || 1500,
        theme: els.modalThemeSelect.value
      };
      store.saveSettings(updated);
      applyTheme(updated.theme);
      closeSettingsModal();
      triggerHaptic();
      showToast('Settings saved successfully');
    });
  }

  function renderModalCategoryList() {
    if (!els.modalCategoryList) return;
    const categories = store.getCategories();

    els.modalCategoryList.innerHTML = categories.map(cat => `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-container-low text-xs border border-surface-container">
        <span>${cat.icon}</span>
        <span class="font-semibold text-on-surface">${cat.name}</span>
        ${cat.custom ? `
          <button type="button" class="modal-del-cat text-error ml-1 font-bold" data-id="${cat.id}">✕</button>
        ` : ''}
      </div>
    `).join('');

    els.modalCategoryList.querySelectorAll('.modal-del-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        store.deleteCategory(btn.dataset.id);
        triggerHaptic();
      });
    });
  }

  if (els.modalAddCatBtn) {
    els.modalAddCatBtn.addEventListener('click', () => {
      const name = els.newCatNameInput.value.trim();
      const icon = els.newCatIconInput.value.trim() || '🏷️';
      const color = els.newCatColorInput.value || '#005c55';

      if (!name) {
        alert('Please specify a category name');
        return;
      }

      store.addCategory({ name, icon, color });
      els.newCatNameInput.value = '';
      els.newCatIconInput.value = '';
      triggerHaptic();
      showToast(`Added custom category "${name}"`);
    });
  }

  // --- Edit Transaction Modal (FR-05) ---
  function openEditModal(txId) {
    const tx = store.getTransactions().find(t => t.id === txId);
    if (!tx || !els.editTxModal) return;

    els.editTxId.value = tx.id;
    els.editAmountInput.value = tx.amount.toFixed(2);
    els.editNoteInput.value = tx.note || '';
    els.editDateInput.value = tx.date;

    const categories = store.getCategories();
    els.editCategorySelect.innerHTML = categories.map(c => `
      <option value="${c.id}" ${c.id === tx.category ? 'selected' : ''}>${c.icon} ${c.name}</option>
    `).join('');

    els.editTxModal.classList.add('active');
  }

  function closeEditModal() {
    if (els.editTxModal) els.editTxModal.classList.remove('active');
  }

  if (els.closeEditModalBtn) els.closeEditModalBtn.onclick = closeEditModal;

  if (els.editTxModal) {
    els.editTxModal.addEventListener('click', (e) => {
      if (e.target === els.editTxModal) closeEditModal();
    });
  }

  if (els.editTxForm) {
    els.editTxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = els.editTxId.value;
      const amt = parseFloat(els.editAmountInput.value);
      if (isNaN(amt) || amt <= 0) return;

      store.updateTransaction(id, {
        amount: amt,
        category: els.editCategorySelect.value,
        note: els.editNoteInput.value,
        date: els.editDateInput.value
      });

      closeEditModal();
      triggerHaptic();
      showToast('✓ Expense updated successfully');
    });
  }

  if (els.editDeleteTxBtn) {
    els.editDeleteTxBtn.addEventListener('click', () => {
      const id = els.editTxId.value;
      if (confirm('Delete this expense?')) {
        store.deleteTransaction(id);
        closeEditModal();
        triggerHaptic();
        showToast('Expense deleted');
      }
    });
  }

  // Helpers
  function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, t => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[t] || t));
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    if (dateStr === yest.toISOString().split('T')[0]) return 'Yesterday';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Keyboard Escape to dismiss modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeSettingsModal();
    }
  });
});
