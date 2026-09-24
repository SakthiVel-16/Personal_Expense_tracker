import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, './database.sqlite');

async function clearDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      process.exit(1);
    }

    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    console.log('🔄 Clearing all records from database tables...\n');

    // List of all data tables (excluding system tables)
    const tables = [
      'transactions',
      'budgets',
      'net_worth',
      'ai_insights',
      'recurring_rules',
      'savings_goals',
      'savings_contributions',
      'category_classification',
      'categories'
    ];

    for (const table of tables) {
      try {
        db.run(`DELETE FROM ${table}`);
        console.log(`✅ Cleared: ${table}`);
      } catch (err) {
        console.log(`⚠️  Skipped ${table} (may not exist or protected)`, err.message);
      }
    }

    // Re-insert default categories to maintain structure
    console.log('\n🔧 Restoring default categories...\n');
    
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
    console.log(`✅ Restored ${allCategories.length} default categories`);

    // Restore default category classifications
    console.log('\n🔧 Restoring category classifications...\n');
    
    const classifications = [
      ['Salary', 'savings'],
      ['Freelance', 'savings'],
      ['Investment', 'savings'],
      ['Other Income', 'savings'],
      ['Food & Dining', 'wants'],
      ['Groceries', 'needs'],
      ['Transport', 'needs'],
      ['Shopping', 'wants'],
      ['Entertainment', 'wants'],
      ['Health', 'needs'],
      ['Utilities', 'needs'],
      ['Rent', 'needs'],
      ['Education', 'wants'],
      ['Savings', 'savings'],
      ['Mobile & Internet', 'needs'],
      ['Petrol', 'needs'],
      ['Personal Care', 'wants'],
      ['Gifts', 'wants'],
      ['Snacks', 'wants'],
      ['Miscellaneous', 'ignore'],
    ];

    for (const [categoryName, bucket] of classifications) {
      db.run(
        `INSERT OR IGNORE INTO category_classification (category_name, bucket) VALUES (?, ?)`,
        [categoryName, bucket]
      );
    }
    console.log(`✅ Restored ${classifications.length} category classifications`);

    // Save cleared database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log('\n✨ Database cleared successfully!');
    console.log('📊 Preserved:');
    console.log('   • Table structures (schemas)');
    console.log('   • Default categories');
    console.log('   • Category classifications');
    console.log('\n🗑️  Removed:');
    console.log('   • All transactions');
    console.log('   • All budgets');
    console.log('   • All net worth entries');
    console.log('   • All AI insights');
    console.log('   • All recurring rules');
    console.log('   • All savings goals');
    console.log('   • All savings contributions');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();
