/**
 * SpendSense - Data Store & LocalStorage Manager
 * Handles all CRUD operations, schema defaults, budgeting calculations, and sample data.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'spendsense_transactions',
  CATEGORIES: 'spendsense_categories',
  SETTINGS: 'spendsense_settings'
};

const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#f97316' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 'bills', name: 'Bills & Utilities', icon: '🧾', color: '#8b5cf6' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { id: 'entertainment', name: 'Entertainment', icon: '🍿', color: '#14b8a6' },
  { id: 'health', name: 'Health & Wellness', icon: '💊', color: '#10b981' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#f59e0b' },
  { id: 'other', name: 'Other', icon: '📌', color: '#64748b' }
];

const DEFAULT_SETTINGS = {
  currency: '$',
  dailyBudget: 50,
  monthlyBudget: 1500,
  theme: 'system',
  hapticFeedback: true
};

class Store {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.saveCategories(DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.saveTransactions([]);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    });
  }

  // --- Transactions ---

  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading transactions from localStorage:', e);
      return [];
    }
  }

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  addTransaction({ amount, category, note, date }) {
    const transactions = this.getTransactions();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      category: category || 'other',
      note: (note || '').trim(),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    transactions.unshift(newTx);
    this.saveTransactions(transactions);
    this.notify('transaction_added', newTx);
    return newTx;
  }

  updateTransaction(id, updates) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    transactions[index] = {
      ...transactions[index],
      ...updates,
      amount: updates.amount !== undefined ? parseFloat(parseFloat(updates.amount).toFixed(2)) : transactions[index].amount,
      note: updates.note !== undefined ? updates.note.trim() : transactions[index].note,
      updatedAt: new Date().toISOString()
    };

    this.saveTransactions(transactions);
    this.notify('transaction_updated', transactions[index]);
    return transactions[index];
  }

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    if (filtered.length !== transactions.length) {
      this.saveTransactions(filtered);
      this.notify('transaction_deleted', id);
      return true;
    }
    return false;
  }

  clearTransactions() {
    this.saveTransactions([]);
    this.notify('transactions_cleared');
  }

  // --- Categories ---

  getCategories() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  getCategory(id) {
    const categories = this.getCategories();
    return categories.find(c => c.id === id) || {
      id: 'other',
      name: 'Other',
      icon: '📌',
      color: '#64748b'
    };
  }

  addCategory({ name, icon, color }) {
    const categories = this.getCategories();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 4);
    const newCat = {
      id: slug,
      name: name.trim(),
      icon: icon || '🏷️',
      color: color || '#3b82f6',
      custom: true
    };
    categories.push(newCat);
    this.saveCategories(categories);
    this.notify('category_added', newCat);
    return newCat;
  }

  deleteCategory(id) {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered);

    // Reassign transactions with deleted category to 'other'
    const txs = this.getTransactions();
    let updated = false;
    txs.forEach(t => {
      if (t.category === id) {
        t.category = 'other';
        updated = true;
      }
    });
    if (updated) {
      this.saveTransactions(txs);
    }

    this.notify('category_deleted', id);
  }

  // --- Settings ---

  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const merged = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    this.notify('settings_updated', merged);
    return merged;
  }

  // --- Budget Calculations & Thresholds ---

  getBudgetMetrics(targetDate = new Date()) {
    const settings = this.getSettings();
    const transactions = this.getTransactions();

    const todayStr = targetDate.toISOString().split('T')[0];
    const currentYear = targetDate.getFullYear();
    const currentMonth = targetDate.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Today's total
    const todaySpend = transactions
      .filter(t => t.date === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);

    // This month's total
    const monthSpend = transactions
      .filter(t => t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyLimit = settings.dailyBudget || 50;
    const monthlyLimit = settings.monthlyBudget || 1500;

    const dailyPct = dailyLimit > 0 ? (todaySpend / dailyLimit) * 100 : 0;
    const monthlyPct = monthlyLimit > 0 ? (monthSpend / monthlyLimit) * 100 : 0;

    const getStatus = (pct) => {
      if (pct >= 100) return 'danger';
      if (pct >= 80) return 'warning';
      return 'ok';
    };

    return {
      daily: {
        spent: todaySpend,
        limit: dailyLimit,
        percentage: Math.round(dailyPct),
        remaining: Math.max(0, dailyLimit - todaySpend),
        overBy: Math.max(0, todaySpend - dailyLimit),
        status: getStatus(dailyPct)
      },
      monthly: {
        spent: monthSpend,
        limit: monthlyLimit,
        percentage: Math.round(monthlyPct),
        remaining: Math.max(0, monthlyLimit - monthSpend),
        overBy: Math.max(0, monthSpend - monthlyLimit),
        status: getStatus(monthlyPct)
      },
      currency: settings.currency || '$'
    };
  }

  // --- Sample Data Generator for Demo ---

  loadSampleData() {
    const now = new Date();
    const sampleTxs = [];
    const notesByCategory = {
      food: ['Morning Espresso & Croissant', 'Chipotle Burrito Bowl', 'Sushi Dinner with Team', 'Starbucks Cold Brew', 'Pizza Slice', 'Thai Green Curry Takeout'],
      transport: ['Metro Train Card Reload', 'Uber Ride to Downtown', 'Airport Shuttle', 'Gas Station Fuel', 'Lyft back home'],
      bills: ['Electric Utility Bill', 'High-Speed Home Fiber Internet', 'Mobile Phone Plan', 'Spotify Premium Family'],
      shopping: ['Uniqlo Linen Shirt', 'Amazon Kitchen Essentials', 'New Running Shoes', 'Desk Organizer'],
      entertainment: ['Cinema IMAX Tickets', 'Steam Summer Game', 'Concert Ticket', 'Board Game Cafe'],
      health: ['Gym Monthly Membership', 'Pharmacy Vitamins', 'Dentist Co-pay', 'Organic Protein Powder'],
      groceries: ['Trader Joe\'s Weekly Groceries', 'Whole Foods Organic Veggies', 'Local Farmer Market', 'Supermarket Dairy & Bakery'],
      other: ['Postal Shipping Fee', 'Hardware Tool', 'Donation']
    };

    const amountsByCategory = {
      food: [4.75, 14.50, 48.00, 6.25, 7.50, 22.00],
      transport: [20.00, 18.40, 35.00, 45.00, 15.20],
      bills: [84.50, 65.00, 50.00, 16.99],
      shopping: [39.90, 28.50, 95.00, 19.99],
      entertainment: [32.00, 19.99, 55.00, 14.00],
      health: [60.00, 24.50, 40.00, 34.00],
      groceries: [74.20, 58.10, 32.50, 89.40],
      other: [12.00, 18.50, 25.00]
    };

    // Distribute across last 28 days
    for (let dayOffset = 27; dayOffset >= 0; dayOffset--) {
      const txDate = new Date(now);
      txDate.setDate(now.getDate() - dayOffset);
      const dateStr = txDate.toISOString().split('T')[0];

      // 1 to 3 transactions per day
      const txCount = (dayOffset % 3 === 0) ? 2 : (dayOffset % 2 === 0 ? 1 : (dayOffset === 0 ? 3 : 1));

      for (let i = 0; i < txCount; i++) {
        const catKeys = Object.keys(notesByCategory);
        const catId = catKeys[(dayOffset * 3 + i) % catKeys.length];
        const notes = notesByCategory[catId];
        const amounts = amountsByCategory[catId];

        const note = notes[(dayOffset + i) % notes.length];
        const amount = amounts[(dayOffset + i) % amounts.length];

        sampleTxs.push({
          id: 'tx_sample_' + dayOffset + '_' + i,
          amount: amount,
          category: catId,
          note: note,
          date: dateStr,
          createdAt: txDate.toISOString()
        });
      }
    }

    // Sort newest first
    sampleTxs.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.saveTransactions(sampleTxs);
    this.notify('transactions_cleared');
    this.notify('sample_data_loaded');
    return sampleTxs;
  }
}

// Global Store singleton instance
window.SpendSenseStore = new Store();
