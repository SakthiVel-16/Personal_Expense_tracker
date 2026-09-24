import express from 'express';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();
const toObj = (r) => r[0] ? r[0].values.map(row => {
  const obj = {}; r[0].columns.forEach((c, i) => obj[c] = row[i]); return obj;
}) : [];

router.get('/', (req, res) => {
  try {
    const db = getDb();
    
    // Get manual net worth items
    const items = toObj(db.exec(`SELECT * FROM net_worth ORDER BY type, name`));
    const manualAssets = items.filter(i => i.type === 'asset').reduce((s, i) => s + i.amount, 0);
    const manualLiabilities = items.filter(i => i.type === 'liability').reduce((s, i) => s + i.amount, 0);
    
    // Calculate dynamic net worth from transactions (all time)
    const incomeResult = db.exec(`SELECT SUM(amount) as total FROM transactions WHERE type = 'income'`);
    const expenseResult = db.exec(`SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'`);
    
    const totalIncome = incomeResult[0]?.values[0]?.[0] || 0;
    const totalExpense = expenseResult[0]?.values[0]?.[0] || 0;
    const dynamicNetWorth = totalIncome - totalExpense;
    
    // Combine dynamic + manual
    const totalAssets = manualAssets + Math.max(dynamicNetWorth, 0); // Only add positive net worth as asset
    const totalLiabilities = manualLiabilities + Math.max(-dynamicNetWorth, 0); // Only add negative net worth as liability
    
    res.json({ 
      items, 
      manualAssets, 
      manualLiabilities,
      dynamicNetWorth,
      assets: totalAssets, 
      liabilities: totalLiabilities, 
      net_worth: totalAssets - totalLiabilities 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { name, type, amount, category, date, notes } = req.body;
    db.run(`INSERT INTO net_worth (name, type, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, amount, category || 'other', date || new Date().toISOString().split('T')[0], notes]);
    saveDatabase();
    res.json({ message: 'Added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getDb();
    const { name, amount, category, notes } = req.body;
    db.run(`UPDATE net_worth SET name=?, amount=?, category=?, notes=? WHERE id=?`,
      [name, amount, category, notes, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.run(`DELETE FROM net_worth WHERE id=?`, [req.params.id]);
    saveDatabase();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;