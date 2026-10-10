/**
 * SpendSense Automated Test Suite
 * Tests Core Store, Budget Alerts, CSV Parsing, JSON Backup, and Categories
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup Mock Window and LocalStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.window = global;

// Load store and export-import scripts
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/export-import.js'), 'utf8'));

const store = global.SpendSenseStore;
const exportImport = global.SpendSenseExportImport;

let passed = 0;
let failed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n--- Running SpendSense Test Suite ---\n');

// 1. Initial State
it('Initializes with default categories and settings', () => {
  const cats = store.getCategories();
  assert.strictEqual(cats.length, 8, 'Should have 8 default categories');
  assert.ok(cats.find(c => c.id === 'food'), 'Should contain food category');

  const settings = store.getSettings();
  assert.strictEqual(settings.currency, '$');
  assert.strictEqual(settings.dailyBudget, 50);
  assert.strictEqual(settings.monthlyBudget, 1500);
});

// 2. Transaction CRUD (FR-01, FR-05)
it('Adds, retrieves, updates, and deletes transactions', () => {
  store.clearTransactions();
  const tx = store.addTransaction({
    amount: 15.50,
    category: 'food',
    note: 'Coffee & Pastry',
    date: '2026-10-10'
  });

  assert.ok(tx.id.startsWith('tx_'));
  assert.strictEqual(tx.amount, 15.50);
  assert.strictEqual(tx.category, 'food');
  assert.strictEqual(tx.note, 'Coffee & Pastry');

  const list = store.getTransactions();
  assert.strictEqual(list.length, 1);

  // Update
  const updated = store.updateTransaction(tx.id, {
    amount: 18.00,
    note: 'Double Coffee & Pastry'
  });
  assert.strictEqual(updated.amount, 18.00);
  assert.strictEqual(updated.note, 'Double Coffee & Pastry');

  // Delete
  const deleted = store.deleteTransaction(tx.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(store.getTransactions().length, 0);
});

// 3. Budget Limits and Threshold Alerts (FR-03)
it('Calculates budget thresholds and triggers warning / danger statuses accurately', () => {
  store.clearTransactions();
  store.saveSettings({ dailyBudget: 50, monthlyBudget: 1000, currency: '$' });

  const testDate = new Date('2026-10-10T12:00:00Z');

  // Case 1: Healthy (< 80%)
  store.addTransaction({ amount: 20.00, category: 'food', note: 'Breakfast', date: '2026-10-10' });
  let metrics = store.getBudgetMetrics(testDate);
  assert.strictEqual(metrics.daily.spent, 20.00);
  assert.strictEqual(metrics.daily.percentage, 40);
  assert.strictEqual(metrics.daily.status, 'ok', 'Status should be ok for 40%');

  // Case 2: Approaching warning (>= 80% and < 100%)
  store.addTransaction({ amount: 22.00, category: 'transport', note: 'Uber', date: '2026-10-10' });
  metrics = store.getBudgetMetrics(testDate);
  assert.strictEqual(metrics.daily.spent, 42.00); // 42 / 50 = 84%
  assert.strictEqual(metrics.daily.percentage, 84);
  assert.strictEqual(metrics.daily.status, 'warning', 'Status should be warning for 84%');

  // Case 3: Exceeded limit (>= 100%)
  store.addTransaction({ amount: 15.00, category: 'shopping', note: 'T-shirt', date: '2026-10-10' });
  metrics = store.getBudgetMetrics(testDate);
  assert.strictEqual(metrics.daily.spent, 57.00); // 57 / 50 = 114%
  assert.strictEqual(metrics.daily.percentage, 114);
  assert.strictEqual(metrics.daily.status, 'danger', 'Status should be danger for 114%');
  assert.strictEqual(metrics.daily.overBy, 7.00);
});

// 4. Custom Categories Management (FR-07)
it('Adds custom category and reassigns transactions when category is deleted', () => {
  const newCat = store.addCategory({ name: 'Gaming', icon: '🎮', color: '#8b5cf6' });
  assert.ok(newCat.id);
  assert.strictEqual(newCat.name, 'Gaming');
  assert.strictEqual(newCat.icon, '🎮');

  // Log expense under custom category
  const tx = store.addTransaction({ amount: 49.99, category: newCat.id, note: 'RPG Game', date: '2026-10-10' });
  assert.strictEqual(tx.category, newCat.id);

  // Delete category -> should reassign to 'other'
  store.deleteCategory(newCat.id);
  const updatedTx = store.getTransactions().find(t => t.id === tx.id);
  assert.strictEqual(updatedTx.category, 'other', 'Expense should be reassigned to other');
});

// 5. CSV Parsing & Import (FR-06)
it('Parses RFC 4180 CSV logs with commas and quotes correctly', () => {
  const sampleCSV = `Date,Category,Amount,Note
2026-10-09,food,14.50,"Dinner, with friends"
2026-10-08,transport,22.00,Airport Taxi`;

  const parsed = exportImport.parseCSV(sampleCSV);
  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].amount, 14.50);
  assert.strictEqual(parsed[0].note, 'Dinner, with friends');
  assert.strictEqual(parsed[1].amount, 22.00);
  assert.strictEqual(parsed[1].category, 'transport');
});

// 6. Sample Data Generator
it('Generates comprehensive sample data for demonstration', () => {
  const sampleData = store.loadSampleData();
  assert.ok(sampleData.length >= 25, 'Should generate at least 25 sample transactions');
  const allTxs = store.getTransactions();
  assert.strictEqual(allTxs.length, sampleData.length);
});

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
process.exit(failed > 0 ? 1 : 0);
