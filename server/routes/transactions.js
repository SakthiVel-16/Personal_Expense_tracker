import express from 'express';
import { getDb, saveDatabase } from '../database/init.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const db = getDb();
    const { start, end, category, type, search, limit = 500, offset = 0 } = req.query;
    console.log('GET /transactions - Filters:', { start, end, category, type, search });
    
    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    let countQuery = `SELECT COUNT(*) FROM transactions t`;

    const whereClauses = [];
    const whereParams = [];

    if (start) { whereClauses.push(`t.date >= ?`); whereParams.push(start); }
    if (end) { whereClauses.push(`t.date <= ?`); whereParams.push(end); }
    if (category) { whereClauses.push(`t.category_id = ?`); whereParams.push(category); }
    if (type) { whereClauses.push(`t.type = ?`); whereParams.push(type); }
    if (search) { whereClauses.push(`(t.description LIKE ? OR t.notes LIKE ?)`); whereParams.push(`%${search}%`, `%${search}%`); }

    if (whereClauses.length > 0) {
      const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
      query += whereString;
      countQuery += whereString;
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`;
    const queryParams = [...whereParams, parseInt(limit), parseInt(offset)];

    const result = await db.exec(query, queryParams);
    const rows = result[0] ? result[0].values.map(row => {
      const cols = result[0].columns;
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      obj.tags = JSON.parse(obj.tags || '[]');
      obj.is_recurring = obj.is_recurring === 1 || obj.is_recurring === true;
      return obj;
    }) : [];

    const countResult = await db.exec(countQuery, whereParams);
    res.json({ transactions: rows, total: countResult[0]?.values[0][0] || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    console.log('POST /transactions body:', req.body);
    
    const { amount, type, category_id, description, date, payment_method, tags, notes, is_recurring, recurring_interval } = req.body;

    if (!amount || !type || !date) {
      return res.status(400).json({ error: 'amount, type and date are required' });
    }

    await db.run(
      `INSERT INTO transactions (amount, type, category_id, description, date, payment_method, tags, notes, is_recurring, recurring_interval)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(amount),
        type,
        category_id ? Number(category_id) : null,
        description || '',
        date,
        payment_method || 'cash',
        JSON.stringify(tags || []),
        notes || '',
        is_recurring ? 1 : 0,
        recurring_interval || null
      ]
    );

    saveDatabase();
    const result = await db.exec(`SELECT last_insert_rowid() as id`);
    const id = result[0].values[0][0];
    console.log('Transaction inserted with id:', id);
    res.json({ id, message: 'Transaction added' });
  } catch (err) {
    console.error('Transaction insert error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    console.log('PUT body:', req.body);
    
    const {
      amount, type, category_id, description,
      date, payment_method, tags, notes, is_recurring
    } = req.body;

    await db.run(
      `UPDATE transactions 
       SET amount=?, type=?, category_id=?, description=?, 
           date=?, payment_method=?, tags=?, notes=?, is_recurring=?
       WHERE id=?`,
      [
        Number(amount),
        type,
        category_id ? Number(category_id) : null,
        description || '',
        date,
        payment_method || 'cash',
        JSON.stringify(tags || []),
        notes || '',
        is_recurring ? 1 : 0,  
        req.params.id
      ]
    );
    saveDatabase();
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.run(`DELETE FROM transactions WHERE id=?`, [req.params.id]);
    saveDatabase();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;