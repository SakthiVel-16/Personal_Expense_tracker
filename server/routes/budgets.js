import express from 'express';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();
const toObj = (result) => result[0] ? result[0].values.map(row => {
  const obj = {};
  result[0].columns.forEach((c, i) => obj[c] = row[i]);
  return obj;
}) : [];

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { start, end } = req.query;

    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = start || defaultStart;
    const endDate = end || defaultEnd;

    const result = await db.exec(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.category_id = b.category_id AND t.type = 'expense'
          AND t.date >= ? AND t.date <= ?
        ), 0) as spent
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
    `, [startDate, endDate]);

    const budgets = toObj(result).map(b => ({
      ...b,
      percentage: Math.round((b.spent / b.amount) * 100),
      remaining: b.amount - b.spent,
      is_over: b.spent > b.amount
    }));
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { category_id, amount, period, alert_threshold } = req.body;
    await db.run(`INSERT INTO budgets (category_id, amount, period, alert_threshold) VALUES (?, ?, ?, ?)`,
      [category_id, amount, period || 'monthly', alert_threshold || 80]);
    saveDatabase();
    res.json({ message: 'Budget created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { category_id, amount, period, alert_threshold } = req.body;
    await db.run(`UPDATE budgets SET category_id=?, amount=?, period=?, alert_threshold=? WHERE id=?`,
      [category_id, amount, period, alert_threshold, req.params.id]);
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.run(`DELETE FROM budgets WHERE id=?`, [req.params.id]);
    saveDatabase();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;