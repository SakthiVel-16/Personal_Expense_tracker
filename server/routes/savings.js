import express from 'express';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();

const toObj = (r) => r[0] ? r[0].values.map(row => {
  const obj = {};
  r[0].columns.forEach((c, i) => obj[c] = row[i]);
  return obj;
}) : [];

// Get all goals
router.get('/goals', async (req, res) => {
  try {
    const db = getDb()
    const goals = toObj(await db.exec(`
      SELECT g.*,
        COALESCE((
          SELECT SUM(amount) FROM savings_contributions 
          WHERE goal_id = g.id
        ), 0) as contributed,
        (
          SELECT date FROM savings_contributions
          WHERE goal_id = g.id
          ORDER BY date ASC
          LIMIT 1
        ) as first_contribution_date
      FROM savings_goals g
      ORDER BY g.is_completed ASC, g.created_at DESC
    `))

    const enriched = goals.map(g => {
      const pct = g.target_amount > 0
        ? Math.min(Math.round((g.contributed / g.target_amount) * 100), 100)
        : 0
      const remaining = Math.max(0, g.target_amount - g.contributed)

      let monthsLeft = null
      let monthlyNeeded = null
      if (g.deadline) {
        const now = new Date()
        const dl = new Date(g.deadline)
        
        if (dl > now) {
          const diffTime = dl.getTime() - now.getTime();
          // Use floating point months for an accurate monthly rate
          const floatMonthsLeft = diffTime / (1000 * 3600 * 24 * 30.4375);
          
          // For display, we can show the ceiling of the months left
          monthsLeft = Math.ceil(floatMonthsLeft);
          
          monthlyNeeded = floatMonthsLeft > 0
            ? Math.ceil(remaining / floatMonthsLeft)
            : remaining;
        } else {
          // Deadline has passed
          monthsLeft = 0;
          monthlyNeeded = remaining;
        }
      }
      
      let avgMonthlyContribution = 0;
      if (g.contributed > 0 && g.first_contribution_date) {
        const firstDate = new Date(g.first_contribution_date);
        const now = new Date();
        const monthsPassed = Math.max(1, (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1);
        avgMonthlyContribution = g.contributed / monthsPassed;
      }

      let projectedMonths = null;
      if (avgMonthlyContribution > 0 && remaining > 0) {
        projectedMonths = Math.ceil(remaining / avgMonthlyContribution);
      }

      // Milestone markers
      const milestones = [25, 50, 75, 100]
      const reachedMilestones = milestones.filter(m => pct >= m)
      const nextMilestone = milestones.find(m => pct < m) || null

      return {
        ...g,
        pct,
        remaining,
        monthsLeft,
        monthlyNeeded,
        avgMonthlyContribution,
        projectedMonths,
        reachedMilestones,
        nextMilestone,
        amountToNextMilestone: nextMilestone
          ? Math.ceil((nextMilestone / 100) * g.target_amount) - g.contributed
          : 0
      }
    })

    res.json(enriched)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create goal
router.post('/goals', async (req, res) => {
  try {
    const db = getDb()
    const { name, icon, target_amount, deadline, color, category, notes } = req.body
    await db.run(
      `INSERT INTO savings_goals 
       (name, icon, target_amount, deadline, color, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, icon || '🎯', target_amount,
       deadline || null, color || '#6366f1',
       category || 'short', notes || '']
    )
    saveDatabase()
    res.json({ message: 'Goal created' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update goal
router.put('/goals/:id', async (req, res) => {
  try {
    const db = getDb()
    const { name, icon, target_amount, deadline, color, notes, is_completed, category } = req.body
    await db.run(
      `UPDATE savings_goals 
       SET name=?, icon=?, target_amount=?,
       deadline=?, color=?, notes=?, 
       is_completed=?, category=?
       WHERE id=?`,
      [name, icon, target_amount, deadline,
       color, notes, is_completed ? 1 : 0, // is_completed is no longer used in frontend, but kept for schema compatibility
       category || 'short', req.params.id]
    )
    saveDatabase()
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete goal
router.delete('/goals/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.run(`DELETE FROM savings_contributions WHERE goal_id=?`, [req.params.id])
    await db.run(`DELETE FROM savings_goals WHERE id=?`, [req.params.id])
    saveDatabase()
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add contribution
router.post('/goals/:id/contribute', async (req, res) => {
  try {
    const db = getDb()
    const { amount, note, date } = req.body
    await db.run(
      `INSERT INTO savings_contributions (goal_id, amount, note, date)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, amount, note || '',
       date || new Date().toISOString().split('T')[0]]
    )

    // Auto complete if reached target
    const result = await db.exec(`
      SELECT g.target_amount,
        COALESCE((
          SELECT SUM(amount) 
          FROM savings_contributions 
          WHERE goal_id = g.id
        ), 0) as total
      FROM savings_goals g WHERE g.id = ?`,
      [req.params.id]
    )
    if (result[0]) {
      const [target, total] = result[0].values[0]
      if (total >= target) {
        await db.run(`UPDATE savings_goals SET is_completed=1 WHERE id=?`,
          [req.params.id])
      }
    }

    saveDatabase()
    res.json({ message: 'Contribution added' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get contribution history
router.get('/goals/:id/history', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.exec(
      `SELECT * FROM savings_contributions 
       WHERE goal_id=? ORDER BY date DESC`,
      [req.params.id]
    )
    res.json(toObj(result))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Overview — health score, 50/30/20, history
router.get('/overview', async (req, res) => {
  try {
    const db = getDb()
    const now = new Date()

    // Last 6 months savings history
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const start = `${y}-${m}-01`
      const lastDay = new Date(y, d.getMonth() + 1, 0).getDate()
      const end = `${y}-${m}-${lastDay}`
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })

      const totals = toObj(await db.exec(
        `SELECT type, SUM(amount) as total FROM transactions
         WHERE date >= ? AND date <= ? GROUP BY type`,
        [start, end]
      ))
      let income = 0, expense = 0
      totals.forEach(t => {
        if (t.type === 'income') income = t.total
        if (t.type === 'expense') expense = t.total
      })
      months.push({
        label, income, expense,
        saved: income - expense,
        rate: income > 0
          ? Math.round(((income - expense) / income) * 100)
          : 0
      })
    }

    // Accept date range from query params — fallback to current month
    const reqStart = req.query.start
    const reqEnd = req.query.end
    const currStart = reqStart || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const currEnd = reqEnd || now.toISOString().split('T')[0]

    // Load classifications from DB
    const classifications = toObj(await db.exec(
      `SELECT category_name, bucket FROM category_classification`
    ))
    const bucketMap = {}
    classifications.forEach(c => bucketMap[c.category_name] = c.bucket)

    const allExpenses = toObj(await db.exec(`
      SELECT c.name, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY c.name`, [currStart, currEnd]
    ))

    const currIncome = toObj(await db.exec(
      `SELECT SUM(amount) as total FROM transactions
       WHERE date >= ? AND date <= ? AND type='income'`,
      [currStart, currEnd]
    ))[0]?.total || 0

    let needs = 0, wants = 0
    allExpenses.forEach(e => {
      const bucket = bucketMap[e.name] || 'wants'
      if (bucket === 'needs') needs += e.total
      else if (bucket === 'wants') wants += e.total
    })
    const currSavings = currIncome - needs - wants

    // Health score calculation
    const savingsRate = currIncome > 0
      ? ((currIncome - (needs + wants)) / currIncome) * 100
      : 0
    const positiveMonths = months.filter(m => m.saved > 0).length
    const consistencyScore = (positiveMonths / months.length) * 100

    // Budget adherence
    const budgets = toObj(await db.exec(`
      SELECT b.amount,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.category_id = b.category_id 
          AND t.type='expense'
          AND t.date >= ? AND t.date <= ?
        ), 0) as spent
      FROM budgets b`, [currStart, currEnd]
    ))
    const budgetScore = budgets.length > 0
      ? (budgets.filter(b => b.spent <= b.amount).length / budgets.length) * 100
      : 50

    let healthScore = 0
    healthScore += Math.min(40, savingsRate * 1.5)
    healthScore += Math.min(30, consistencyScore * 0.3)
    healthScore += Math.min(30, budgetScore * 0.3)
    healthScore = Math.round(Math.min(100, Math.max(0, healthScore)))

    const healthLevel =
      healthScore >= 85 ? 'Wealth Builder' :
      healthScore >= 70 ? 'Excellent' :
      healthScore >= 55 ? 'Strong' :
      healthScore >= 40 ? 'Stable' :
      healthScore >= 25 ? 'Weak' : 'Critical'

    const healthColor =
      healthScore >= 85 ? '#10b981' :
      healthScore >= 70 ? '#6366f1' :
      healthScore >= 55 ? '#3b82f6' :
      healthScore >= 40 ? '#f59e0b' :
      healthScore >= 25 ? '#f97316' : '#ef4444'

    res.json({
      months,
      healthScore,
      healthLevel,
      healthColor,
      goalStats: {
        total: toObj(await db.exec(`SELECT COUNT(*) as c FROM savings_goals`))[0]?.c || 0,
        completed: toObj(await db.exec(
          `SELECT COUNT(*) as c FROM savings_goals WHERE is_completed=1`
        ))[0]?.c || 0,
        total_contributed: toObj(await db.exec(
          `SELECT COALESCE(SUM(amount),0) as c FROM savings_contributions`
        ))[0]?.c || 0
      },
      breakdown503020: {
        income: currIncome,
        needs, wants,
        savings: Math.max(0, currSavings),
        needsPct: currIncome > 0
          ? Math.round((needs / currIncome) * 100) : 0,
        wantsPct: currIncome > 0
          ? Math.round((wants / currIncome) * 100) : 0,
        savingsPct: currIncome > 0
          ? Math.round((currSavings / currIncome) * 100) : 0,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Money leak detector
router.get('/leaks', async (req, res) => {
  try {
    const db = getDb()
    const now = new Date()

    // Current month
    const currStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const currEnd = now.toISOString().split('T')[0]

    // Previous month
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevStartStr = prevStart.toISOString().split('T')[0]
    const prevEndStr = prevEnd.toISOString().split('T')[0]

    // High frequency low-value transactions this month
    const frequent = toObj(await db.exec(`
      SELECT t.description, c.name as category,
        COUNT(*) as count, 
        SUM(t.amount) as total,
        AVG(t.amount) as avg_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? 
      AND t.type = 'expense'
      GROUP BY LOWER(t.description)
      HAVING COUNT(*) >= 3
      ORDER BY total DESC
      LIMIT 5`, [currStart, currEnd]
    ))

    // Categories growing vs last month
    const currCats = toObj(await db.exec(`
      SELECT c.name, c.icon, SUM(t.amount) as total
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY c.name`, [currStart, currEnd]
    ))

    const prevCats = toObj(await db.exec(`
      SELECT c.name, SUM(t.amount) as total
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY c.name`, [prevStartStr, prevEndStr]
    ))

    const prevMap = {}
    prevCats.forEach(p => prevMap[p.name] = p.total)

    const growing = currCats
      .filter(c => prevMap[c.name] && c.total > prevMap[c.name] * 1.2)
      .map(c => ({
        ...c,
        prev: prevMap[c.name],
        growth: Math.round(((c.total - prevMap[c.name]) / prevMap[c.name]) * 100)
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 3)

    // Subscriptions (marked as recurring in DB)
    const subscriptions = toObj(await db.exec(`
      SELECT description, 
        COUNT(*) as months,
        AVG(amount) as avg_amount,
        SUM(amount) as total
      FROM transactions
      WHERE type = 'expense'
      AND is_recurring = 1
      GROUP BY LOWER(description)
      ORDER BY avg_amount DESC
      LIMIT 5`
    ))

    res.json({ frequent, growing, subscriptions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Savings challenges — generated from spending data
router.get('/challenges', async (req, res) => {
  try {
    const db = getDb()
    const now = new Date()
    const currStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const currEnd = now.toISOString().split('T')[0]

    // Get top spending categories
    const topCats = toObj(await db.exec(`
      SELECT c.name, c.icon, SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 5`, [currStart, currEnd]
    ))

    // Generate challenges based on actual data
    const challenges = []

    topCats.forEach(cat => {
      if (cat.name === 'Food & Dining' || cat.name === 'Groceries') {
        const weekly = Math.round(cat.total / 4)
        const saving = Math.round(weekly * 0.3)
        challenges.push({
          id: `food_${Date.now()}`,
          icon: '🍱',
          title: 'Cook More, Order Less',
          description: `You spent ₹${cat.total.toLocaleString('en-IN')} on food this month. Skip ${Math.ceil(cat.count * 0.3)} orders this week.`,
          potential_saving: saving,
          category: cat.name,
          duration: '7 days',
          type: 'reduce',
          difficulty: 'medium'
        })
      }

      if (cat.name === 'Shopping') {
        const saving = Math.round(cat.total * 0.4)
        challenges.push({
          id: `shopping_${Date.now()}`,
          icon: '🛍️',
          title: 'No Impulse Shopping Week',
          description: `You spent ₹${cat.total.toLocaleString('en-IN')} on shopping. Try a 7-day no impulse purchase challenge.`,
          potential_saving: saving,
          category: cat.name,
          duration: '7 days',
          type: 'pause',
          difficulty: 'hard'
        })
      }

      if (cat.name === 'Entertainment') {
        const saving = Math.round(cat.total * 0.5)
        challenges.push({
          id: `ent_${Date.now()}`,
          icon: '🎬',
          title: 'Free Entertainment Week',
          description: `Spent ₹${cat.total.toLocaleString('en-IN')} on entertainment. Try free alternatives for 7 days.`,
          potential_saving: saving,
          category: cat.name,
          duration: '7 days',
          type: 'pause',
          difficulty: 'medium'
        })
      }

      if (cat.name === 'Transport' || cat.name === 'Petrol') {
        const saving = Math.round(cat.total * 0.25)
        challenges.push({
          id: `transport_${Date.now()}`,
          icon: '🚶',
          title: 'Walk or Carpool Week',
          description: `You spent ₹${cat.total.toLocaleString('en-IN')} on transport. Try walking or carpooling 3 days this week.`,
          potential_saving: saving,
          category: cat.name,
          duration: '7 days',
          type: 'reduce',
          difficulty: 'easy'
        })
      }
    })

    // Always add a universal challenge
    challenges.push({
      id: `daily_${Date.now()}`,
      icon: '💰',
      title: '₹100/Day Savings Challenge',
      description: 'Save exactly ₹100 every day for 30 days. Small consistent actions build powerful habits.',
      potential_saving: 3000,
      category: 'general',
      duration: '30 days',
      type: 'save',
      difficulty: 'easy'
    })

    res.json(challenges.slice(0, 4))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// AI savings insight
router.post('/ai-insight', async (req, res) => {
  try {
    const db = getDb()
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    const now = new Date()
    const currStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
    const currEnd = now.toISOString().split('T')[0]

    const totals = toObj(await db.exec(
      `SELECT type, SUM(amount) as total FROM transactions
       WHERE date >= ? AND date <= ? GROUP BY type`,
      [currStart, currEnd]
    ))
    let income = 0, expense = 0
    totals.forEach(r => {
      if (r.type === 'income') income = r.total
      if (r.type === 'expense') expense = r.total
    })

    const byCategory = toObj(await db.exec(`
      SELECT c.name, SUM(t.amount) as total, COUNT(*) as count
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY c.name ORDER BY total DESC`,
      [currStart, currEnd]
    ))

    const goals = toObj(await db.exec(`
      SELECT g.name, g.target_amount, g.deadline,
        COALESCE((
          SELECT SUM(amount) FROM savings_contributions 
          WHERE goal_id = g.id
        ), 0) as contributed
      FROM savings_goals g WHERE g.is_completed = 0
    `))

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are an encouraging, positive personal finance coach for a 22-year-old Indian professional earning ₹80,000/month.

Financial snapshot this month:
- Income: ₹${income}
- Expenses: ₹${expense}
- Saved: ₹${income - expense}
- Savings rate: ${income > 0 ? Math.round(((income-expense)/income)*100) : 0}%

Top spending:
${byCategory.slice(0,5).map(c => `- ${c.name}: ₹${c.total} (${c.count} transactions)`).join('\n')}

Active savings goals:
${goals.map(g => `- ${g.name}: ₹${g.contributed} of ₹${g.target_amount}`).join('\n')}

Generate 3 personalized insights. CRITICAL RULES:
1. NEVER say "you overspent" or make user feel guilty
2. ALWAYS be encouraging, forward-looking, empowering
3. Use actual numbers from the data
4. Be specific and actionable
5. Speak like a supportive friend, not a bank

Return raw JSON only:
{
  "insights": [
    {
      "tone": "positive|tip|action",
      "message": "encouraging insight with specific numbers and action"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    let text = result.response.text()
      .replace(/\`\`\`json/g, '')
      .replace(/\`\`\`/g, '')
      .trim()

    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (err) {
    console.error('Savings AI error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get all category classifications
router.get('/classifications', async (req, res) => {
  try {
    const db = getDb()
    // Get all categories with their current classification
    const cats = toObj(await db.exec(`SELECT * FROM categories ORDER BY type, name`))
    const classifications = toObj(await db.exec(
      `SELECT * FROM category_classification`
    ))
    const classMap = {}
    classifications.forEach(c => classMap[c.category_name] = c.bucket)

    const result = cats.map(c => ({
      ...c,
      bucket: classMap[c.name] || (c.type === 'income' ? 'ignore' : 'wants')
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update category classification
router.put('/classifications/:name', async (req, res) => {
  try {
    const db = getDb()
    const { bucket } = req.body
    const name = decodeURIComponent(req.params.name)
    await db.run(
      `INSERT INTO category_classification (category_name, bucket)
       VALUES (?, ?)
       ON CONFLICT(category_name) DO UPDATE SET bucket = ?`,
      [name, bucket, bucket]
    )
    saveDatabase()
    res.json({ message: 'Updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router