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
    const result = await db.exec(`SELECT * FROM categories ORDER BY type, name`);
    res.json(toObj(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { name, icon, color, type } = req.body;
    await db.run(`INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)`,
      [name, icon || '📦', color || '#6366f1', type || 'expense']);
    saveDatabase();
    res.json({ message: 'Category created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.run(`DELETE FROM categories WHERE id=?`, [req.params.id]);
    saveDatabase();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;