import express from 'express';
import { getDb } from '../database/init.js';

const router = express.Router();
const toObj = (r) => r[0] ? r[0].values.map(row => {
  const obj = {}; r[0].columns.forEach((c, i) => obj[c] = row[i]); return obj;
}) : [];

router.get('/csv', (req, res) => {
  try {
    const db = getDb();
    const { start, end } = req.query;
    let query = `SELECT t.date, t.type, t.amount, t.description, c.name as category, t.payment_method, t.notes
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1`;
    const params = [];
    if (start) { query += ` AND t.date >= ?`; params.push(start); }
    if (end) { query += ` AND t.date <= ?`; params.push(end); }
    query += ` ORDER BY t.date DESC`;

    const rows = toObj(db.exec(query, params));
    const csv = ['Date,Type,Amount,Description,Category,Payment Method,Notes',
      ...rows.map(r => `${r.date},${r.type},${r.amount},"${r.description || ''}","${r.category || ''}",${r.payment_method},"${r.notes || ''}"`)
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/json', (req, res) => {
  try {
    const db = getDb();
    const transactions = toObj(db.exec(`
      SELECT t.*, c.name as category_name FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id ORDER BY t.date DESC`));
    const categories = toObj(db.exec(`SELECT * FROM categories`));
    const budgets = toObj(db.exec(`SELECT * FROM budgets`));
    const netWorth = toObj(db.exec(`SELECT * FROM net_worth`));
    res.json({ transactions, categories, budgets, netWorth, exported_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;