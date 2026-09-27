import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();

// Models to try in order — if one fails, try next
const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash'
]

const toObj = (result) => result[0] ? result[0].values.map(row => {
  const obj = {};
  result[0].columns.forEach((c, i) => obj[c] = row[i]);
  return obj;
}) : [];

function getDefaultRange(start, end) {
  const now = new Date()
  const s = start || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`
  const e = end || now.toISOString().split('T')[0]
  return { s, e }
}

// Tries multiple models with retry — never gives up easily
async function generateWithFallback(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const delays = [10000, 25000, 45000]

  for (const modelName of MODELS) {
    console.log(`Trying model: ${modelName}`)
    const model = genAI.getGenerativeModel({ model: modelName })
    let lastError

    for (let i = 0; i <= delays.length; i++) {
      try {
        const result = await model.generateContent(prompt)
        console.log(`Success with model: ${modelName}`)
        return result
      } catch (err) {
        lastError = err
        if ((err.status === 503 || err.status === 429) && i < delays.length) {
          console.log(`Model ${modelName} status ${err.status} — waiting ${delays[i]/1000}s (attempt ${i+1})...`)
          await new Promise(r => setTimeout(r, delays[i]))
        } else {
          console.log(`Model ${modelName} failed with ${err.status} — trying next model...`)
          break
        }
      }
    }
  }
  throw new Error('All models exhausted. Please try again in a few minutes.')
}

router.post('/insights', async (req, res) => {
  try {
    const db = getDb()
    const { s, e } = getDefaultRange(req.body?.start, req.body?.end)
    console.log('AI insights range:', s, 'to', e)

    // No cache — fetch from Gemini
    const transactions = toObj(await db.exec(`
      SELECT t.amount, t.type, t.description, t.date, c.name as category
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? ORDER BY t.date DESC LIMIT 100`,
      [s, e]
    ))

    if (transactions.length === 0) {
      return res.json({
        summary: "No transactions found for this period. Add some transactions first.",
        insights: []
      })
    }

    const totals = toObj(await db.exec(
      `SELECT type, SUM(amount) as total FROM transactions
       WHERE date >= ? AND date <= ? GROUP BY type`, [s, e]
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
      GROUP BY t.category_id ORDER BY total DESC`, [s, e]
    ))

    const prompt = `You are a personal finance coach for an Indian user. Analyze this data and give 4-5 specific actionable insights.

Period: ${s} to ${e}
Income: ₹${income}
Expenses: ₹${expense}
Savings: ₹${income - expense}
Savings Rate: ${income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%

Spending by category:
${byCategory.map(c => `- ${c.name}: ₹${c.total} (${c.count} transactions)`).join('\n')}

Recent transactions:
${JSON.stringify(transactions.slice(0, 15))}

Respond in raw JSON only — no markdown, no backticks:
{
  "insights": [
    {
      "type": "warning|tip|positive|alert",
      "title": "Short title max 6 words",
      "message": "Specific advice using actual numbers",
      "impact": "high|medium|low"
    }
  ],
  "summary": "2 sentence overall assessment with actual numbers"
}`

    const result = await generateWithFallback(prompt)
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      return res.status(500).json({ error: 'AI returned invalid format. Try again.' })
    }

    res.json(parsed)
  } catch (err) {
    console.error('AI insights error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.post('/chat', async (req, res) => {
  try {
    const db = getDb()
    const { message, start, end } = req.body
    const { s, e } = getDefaultRange(start, end)

    const transactions = toObj(await db.exec(`
      SELECT t.amount, t.type, t.description, t.date, c.name as category
      FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? ORDER BY t.date DESC LIMIT 50`,
      [s, e]
    ))

    const totals = toObj(await db.exec(
      `SELECT type, SUM(amount) as total FROM transactions
       WHERE date >= ? AND date <= ? GROUP BY type`, [s, e]
    ))
    let income = 0, expense = 0
    totals.forEach(r => {
      if (r.type === 'income') income = r.total
      if (r.type === 'expense') expense = r.total
    })

    const byCategory = toObj(await db.exec(`
      SELECT c.name, SUM(t.amount) as total
      FROM transactions t JOIN categories c ON t.category_id = c.id
      WHERE t.date >= ? AND t.date <= ? AND t.type='expense'
      GROUP BY t.category_id ORDER BY total DESC`, [s, e]
    ))

    const prompt = `You are a friendly personal finance assistant for an Indian user.

Financial data for ${s} to ${e}:
- Income: ₹${income}
- Expenses: ₹${expense}
- Savings: ₹${income - expense}
- Savings Rate: ${income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%

Top categories:
${byCategory.map(c => `- ${c.name}: ₹${c.total}`).join('\n')}

Recent transactions:
${JSON.stringify(transactions.slice(0, 15))}

User question: "${message}"

Answer in 2-4 sentences using their actual data. Use ₹. Be friendly and specific.`

    const result = await generateWithFallback(prompt)
    res.json({ reply: result.response.text() })
  } catch (err) {
    console.error('AI chat error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/insights/history', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.exec(`SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT 10`)
    res.json(toObj(result))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router