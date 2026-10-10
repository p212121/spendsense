/**
 * SpendSense - Data Export & Import Module
 * Supports RFC 4180 CSV export/import & full JSON backup/restore.
 */

const ExportImportManager = {
  /**
   * Export all transactions to CSV file
   */
  exportToCSV() {
    const store = window.SpendSenseStore;
    const transactions = store.getTransactions();
    const settings = store.getSettings();
    const categories = store.getCategories();
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = ['Date', 'Category ID', 'Category Name', 'Amount', 'Currency', 'Note', 'ID', 'Created At'];
    const rows = transactions.map(t => [
      t.date,
      t.category,
      `"${(catMap[t.category] || t.category).replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      settings.currency,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.id,
      t.createdAt || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `spendsense_expenses_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export complete backup to JSON
   */
  exportToJSON() {
    const store = window.SpendSenseStore;
    const backup = {
      app: 'SpendSense',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: store.getSettings(),
      categories: store.getCategories(),
      transactions: store.getTransactions()
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `spendsense_backup_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Parse CSV string into array of transaction objects
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV file is empty or missing headers.');

    // Simple robust RFC 4180 line parser
    const parseLine = (text) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur);
      return result;
    };

    const headerCols = parseLine(lines[0]).map(h => h.trim().toLowerCase());
    const dateIdx = headerCols.findIndex(h => h.includes('date'));
    const amountIdx = headerCols.findIndex(h => h.includes('amount'));
    const catIdx = headerCols.findIndex(h => h === 'category id' || h === 'category' || h.includes('cat'));
    const noteIdx = headerCols.findIndex(h => h.includes('note') || h.includes('desc'));

    if (amountIdx === -1) {
      throw new Error('CSV missing required "Amount" column.');
    }

    const txs = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = parseLine(lines[i]);
      const rawAmt = parseFloat(cols[amountIdx]);
      if (isNaN(rawAmt)) continue;

      const dateStr = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].trim() : new Date().toISOString().split('T')[0];
      const categoryStr = catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim().toLowerCase() : 'other';
      const noteStr = noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx].trim() : '';

      txs.push({
        id: 'tx_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        amount: Math.abs(rawAmt),
        category: categoryStr,
        note: noteStr,
        date: dateStr.length === 10 ? dateStr : new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    return txs;
  },

  /**
   * Handle File Upload for Restore (JSON or CSV)
   */
  async handleFileUpload(file, mode = 'merge') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const store = window.SpendSenseStore;

          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content);
            if (!data.transactions && !Array.isArray(data)) {
              throw new Error('Invalid SpendSense JSON backup format.');
            }

            const importedTxs = Array.isArray(data) ? data : data.transactions;
            const importedCats = data.categories || [];
            const importedSettings = data.settings || {};

            if (mode === 'replace') {
              store.saveTransactions(importedTxs);
              if (importedCats.length) store.saveCategories(importedCats);
              if (Object.keys(importedSettings).length) store.saveSettings(importedSettings);
            } else {
              // Merge
              const currentTxs = store.getTransactions();
              const existingIds = new Set(currentTxs.map(t => t.id));
              const merged = [...currentTxs];

              importedTxs.forEach(tx => {
                if (!existingIds.has(tx.id)) {
                  merged.push(tx);
                  existingIds.add(tx.id);
                }
              });
              store.saveTransactions(merged);

              // Merge categories if present
              if (importedCats.length) {
                const currentCats = store.getCategories();
                const existingCatIds = new Set(currentCats.map(c => c.id));
                importedCats.forEach(c => {
                  if (!existingCatIds.has(c.id)) {
                    currentCats.push(c);
                  }
                });
                store.saveCategories(currentCats);
              }
            }

            store.notify('data_imported', { count: importedTxs.length });
            resolve({ success: true, count: importedTxs.length, type: 'JSON' });
          } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            const importedTxs = ExportImportManager.parseCSV(content);
            if (importedTxs.length === 0) {
              throw new Error('No valid transactions found in CSV.');
            }

            if (mode === 'replace') {
              store.saveTransactions(importedTxs);
            } else {
              const currentTxs = store.getTransactions();
              store.saveTransactions([...importedTxs, ...currentTxs]);
            }

            store.notify('data_imported', { count: importedTxs.length });
            resolve({ success: true, count: importedTxs.length, type: 'CSV' });
          } else {
            throw new Error('Unsupported file format. Please upload .json or .csv');
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }
};

window.SpendSenseExportImport = ExportImportManager;
