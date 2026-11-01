import express from 'express';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();
const toObj = (result) => result[0] ? result[0].values.map(row => {
  const obj = {};
  result[0].columns.forEach((c, i) => obj[c] = row[i]);
  return obj;
}) : [];

function getBudgetDates(period, reqStart, reqEnd) {
  const ref = reqEnd ? new Date(reqEnd) : new Date();

  if (period === 'weekly') {
    const day = ref.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const mon = new Date(ref);
    mon.setDate(ref.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      start: mon.toISOString().split('T')[0],
      end: sun.toISOString().split('T')[0]
    };
  }

  if (period === 'yearly') {
    const y = ref.getFullYear();
    return {
      start: `${y}-01-01`,
      end: `${y}-12-31`
    };
  }

  // Monthly
  if (reqStart && reqEnd) {
    return { start: reqStart, end: reqEnd };
  }
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
  return { start, end };
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { start, end } = req.query;

    const rows = toObj(await db.exec(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color, c.group_name as category_group
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
    `));

    const budgets = await Promise.all(rows.map(async b => {
      const dates = getBudgetDates(b.period, start, end);
      const spentRes = await db.exec(`
        SELECT COALESCE(SUM(amount), 0) as spent FROM transactions
        WHERE category_id = ? AND type = 'expense'
        AND date >= ? AND date <= ?
      `, [b.category_id, dates.start, dates.end]);
      const spent = spentRes[0]?.values[0]?.[0] || 0;
      return {
        ...b,
        spent,
        percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
        remaining: b.amount - spent,
        is_over: spent > b.amount,
        period_start: dates.start,
        period_end: dates.end
      };
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

    if (!category_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid category and positive amount are required' });
    }

    await db.run(`INSERT INTO budgets (category_id, amount, period, alert_threshold) VALUES (?, ?, ?, ?)`,
      [category_id, Number(amount), period || 'monthly', alert_threshold || 80]);
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

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }

    await db.run(`UPDATE budgets SET category_id=?, amount=?, period=?, alert_threshold=? WHERE id=?`,
      [category_id, Number(amount), period, alert_threshold, req.params.id]);
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
