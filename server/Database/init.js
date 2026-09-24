import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../database.sqlite');

let db;

export async function initializeDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '📦',
      color TEXT DEFAULT '#6366f1',
      type TEXT DEFAULT 'expense',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      category_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      tags TEXT DEFAULT '[]',
      is_recurring INTEGER DEFAULT 0,
      recurring_interval TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      amount REAL NOT NULL,
      period TEXT DEFAULT 'monthly',
      start_date TEXT,
      end_date TEXT,
      alert_threshold REAL DEFAULT 80,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS net_worth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('asset','liability')),
      amount REAL NOT NULL,
      category TEXT DEFAULT 'other',
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      interval TEXT NOT NULL,
      next_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🎯',
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    deadline TEXT,
    color TEXT DEFAULT '#6366f1',
    category TEXT DEFAULT 'general',
    notes TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS savings_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id)
  )
`)

  // Migrate Family → Snacks BEFORE category insert (keeps all transactions intact)
  // This handles the case where both might exist in the database
  try {
    // Get IDs of both categories if they exist
    const snacksQuery = db.exec(`SELECT id FROM categories WHERE name='Snacks'`)
    const familyQuery = db.exec(`SELECT id FROM categories WHERE name='Family'`)
    
    const snacksId = snacksQuery[0]?.values[0]?.[0]
    const familyId = familyQuery[0]?.values[0]?.[0]

    if (familyId && snacksId) {
      // Both exist - merge by reassigning Family transactions to Snacks
      db.run(`UPDATE transactions SET category_id=? WHERE category_id=?`, [snacksId, familyId])
      db.run(`DELETE FROM categories WHERE id=?`, [familyId])
    } else if (familyId && !snacksId) {
      // Only Family exists - rename it to Snacks
      db.run(
        `UPDATE categories SET name='Snacks', icon='🍿', color='#fd7e14' WHERE id=?`,
        [familyId]
      )
    }
  } catch (e) {
    console.warn('Migration warning:', e.message)
  }

  // Always run this — adds missing categories safely using INSERT OR IGNORE
  // Your existing data is NEVER touched — only adds if not exists
  const allCategories = [
    ['Food & Dining',     '🍽️', '#f59e0b', 'expense'],
    ['Groceries',         '🛒', '#65a30d', 'expense'],
    ['Transport',         '🚗', '#3b82f6', 'expense'],
    ['Shopping',          '🛍️', '#ec4899', 'expense'],
    ['Entertainment',     '🎬', '#8b5cf6', 'expense'],
    ['Health',            '🏥', '#10b981', 'expense'],
    ['Utilities',         '💡', '#f97316', 'expense'],
    ['Rent',              '🏠', '#ef4444', 'expense'],
    ['Education',         '📚', '#06b6d4', 'expense'],
    ['Savings',           '💰', '#84cc16', 'expense'],
    ['Mobile & Internet', '📱', '#0ea5e9', 'expense'],
    ['Petrol',            '⛽', '#fb923c', 'expense'],
    ['Personal Care',     '🪥', '#f472b6', 'expense'],
    ['Gifts',             '🎁', '#f97316', 'expense'],
    ['Snacks',            '🍿', '#fd7e14', 'expense'],
    ['Miscellaneous',     '📦', '#94a3b8', 'expense'],
    ['Salary',            '💼', '#22c55e', 'income'],
    ['Freelance',         '💻', '#a855f7', 'income'],
    ['Investment',        '📈', '#14b8a6', 'income'],
    ['Other Income',      '💵', '#64748b', 'income'],
  ];

  for (const [name, icon, color, type] of allCategories) {
    db.run(
      `INSERT OR IGNORE INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)`,
      [name, icon, color, type]
    );
  }

  // Category classification table for 50/30/20 bucketing
  db.run(`
    CREATE TABLE IF NOT EXISTS category_classification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE,
      bucket TEXT NOT NULL CHECK(bucket IN ('needs','wants','savings','ignore'))
    )
  `)

  // Seed default classifications
  const existing = db.exec(`SELECT COUNT(*) as c FROM category_classification`)
  if (existing[0]?.values[0][0] === 0) {
    const defaults = [
      ['Rent',             'needs'],
      ['Food & Dining',    'needs'],
      ['Groceries',        'needs'],
      ['Utilities',        'needs'],
      ['Mobile & Internet','needs'],
      ['Transport',        'needs'],
      ['Petrol',           'needs'],
      ['Health',           'needs'],
      ['Shopping',         'wants'],
      ['Entertainment',    'wants'],
      ['Personal Care',    'wants'],
      ['Gifts',            'wants'],
      ['Education',        'wants'],
      ['Snacks',           'wants'],
      ['Miscellaneous',    'wants'],
      ['Savings',          'savings'],
    ]
    for (const [name, bucket] of defaults) {
      db.run(
        `INSERT OR IGNORE INTO category_classification (category_name, bucket) VALUES (?, ?)`,
        [name, bucket]
      )
    }
  } else {
    // Migrate Family → Snacks in classifications too (only if Family exists)
    try {
      const familyClass = db.exec(`SELECT COUNT(*) as c FROM category_classification WHERE category_name='Family'`)
      const snacksClass = db.exec(`SELECT COUNT(*) as c FROM category_classification WHERE category_name='Snacks'`)
      
      if (familyClass[0]?.values[0][0] > 0) {
        if (snacksClass[0]?.values[0][0] > 0) {
          // Both exist - delete Family, keep Snacks
          db.run(`DELETE FROM category_classification WHERE category_name='Family'`)
        } else {
          // Only Family exists - rename it
          db.run(`UPDATE category_classification SET category_name='Snacks' WHERE category_name='Family'`)
        }
      }
    } catch (e) {
      console.warn('Classification migration warning:', e.message)
    }
  }

  saveDatabase();
  console.log('✅ Database initialized successfully');
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}