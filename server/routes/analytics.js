import express from 'express';
import { getDb } from '../database/init.js';

const router = express.Router();
const toObj = (result) => result[0] ? result[0].values.map(row => {
  const obj = {};
  result[0].columns.forEach((c, i) => obj[c] = row[i]);
  return obj;
}) : [];

router.get('/summary', async (req, res) => {
  try {
    const db = getDb();
    const { start, end } = req.query;
    const now = new Date();
    const s = start || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const e = end || now.toISOString().split('T')[0];

    const totals = await db.exec(`
      SELECT type, SUM(amount) as total FROM transactions
      WHERE date >= ? AND date <= ? GROUP BY type`, [s, e]);
    const byCategory = await db.exec(`
      SELECT c.name, c.icon, c.color, c.group_name, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY t.category_id ORDER BY total DESC`, [s, e]);
    const daily = await db.exec(`
      SELECT date, type, SUM(amount) as total FROM transactions
      WHERE date >= ? AND date <= ?
      GROUP BY date, type ORDER BY date ASC`, [s, e]);
    const topExpenses = await db.exec(`
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, c.group_name as category_group
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      ORDER BY t.amount DESC LIMIT 5`, [s, e]);

    let income = 0, expense = 0;
    toObj(totals).forEach(r => {
      if (r.type === 'income') income = r.total;
      if (r.type === 'expense') expense = r.total;
    });

    // Detect anomalies (z-score)
    const allAmounts = await db.exec(`SELECT amount FROM transactions WHERE type='expense' AND date >= ? AND date <= ?`, [s, e]);
    const amounts = allAmounts[0] ? allAmounts[0].values.map(r => r[0]) : [];
    const mean = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const std = amounts.length > 1 ? Math.sqrt(amounts.map(x => (x - mean) ** 2).reduce((a, b) => a + b) / amounts.length) : 0;
    const anomalies = await db.exec(`
      SELECT t.*, c.name as category_name FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.type='expense' AND t.date >= ? AND t.date <= ?`, [s, e]);
    const anomalyList = toObj(anomalies).filter(t => std > 0 && Math.abs(t.amount - mean) / std > 2);

    // Health score
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : (expense > 0 ? -100 : 0);
    const budgetResult = await db.exec(`SELECT COUNT(*) as total FROM budgets`);
    const overBudgetResult = await db.exec(`
      SELECT COUNT(*) as over FROM budgets b WHERE
      (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE category_id=b.category_id AND type='expense' AND date >= ? AND date <= ?) > b.amount`, [s, e]);
    const totalBudgets = budgetResult[0] ? budgetResult[0].values[0][0] : 0;
    const overBudgets = overBudgetResult[0] ? overBudgetResult[0].values[0][0] : 0;
    let healthScore = 50;
    if (savingsRate >= 20) healthScore += 25;
    else if (savingsRate >= 10) healthScore += 15;
    else if (savingsRate < 0) healthScore -= 20;
    if (totalBudgets > 0) healthScore += Math.round(((totalBudgets - overBudgets) / totalBudgets) * 25);

    res.json({
      income, expense, savings: income - expense, savingsRate: Math.round(savingsRate),
      byCategory: toObj(byCategory),
      daily: toObj(daily),
      topExpenses: toObj(topExpenses),
      anomalies: anomalyList,
      healthScore: Math.min(100, Math.max(0, healthScore))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recurring', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.exec(`
      SELECT description, amount, COUNT(*) as occurrences,
        AVG(amount) as avg_amount, MAX(date) as last_date
      FROM transactions WHERE is_recurring=1
      GROUP BY description ORDER BY avg_amount DESC`);
    const toObj = (r) => r[0] ? r[0].values.map(row => {
      const obj = {}; r[0].columns.forEach((c, i) => obj[c] = row[i]); return obj;
    }) : [];
    res.json(toObj(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/velocity', async (req, res) => {
  try {
    const db = getDb()
    const { start, end } = req.query

    // Calculate previous period of same length
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    const prevEnd = new Date(startDate)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - diffDays)

    const prevStartStr = prevStart.toISOString().split('T')[0]
    const prevEndStr = prevEnd.toISOString().split('T')[0]

    // Current period totals by category
    const current = toObj(await db.exec(`
      SELECT c.name, c.icon, c.color, c.group_name, SUM(t.amount) as total
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type = 'expense'
      GROUP BY t.category_id ORDER BY total DESC`, [start, end]
    ))

    // Previous period totals by category
    const previous = toObj(await db.exec(`
      SELECT c.name, c.group_name, SUM(t.amount) as total
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type = 'expense'
      GROUP BY t.category_id`, [prevStartStr, prevEndStr]
    ))

    // Overall totals
    const currTotal = current.reduce((s, c) => s + c.total, 0)
    const prevMap = {}
    previous.forEach(p => prevMap[p.name] = p.total)
    const prevTotal = previous.reduce((s, p) => s + p.total, 0)

    // Calculate velocity per category
    const categories = current.map(c => {
      const prev = prevMap[c.name] || 0
      const velocity = prev > 0
        ? Math.round(((c.total - prev) / prev) * 100)
        : null
      return { ...c, prev, previousAmount: prev, velocity }
    })

    // Overall velocity
    const overallVelocity = prevTotal > 0
      ? Math.round(((currTotal - prevTotal) / prevTotal) * 100)
      : null

    res.json({
      current: currTotal,
      previous: prevTotal,
      overallVelocity,
      categories,
      currentPeriod: { start, end },
      previousPeriod: { start: prevStartStr, end: prevEndStr }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


export default router;