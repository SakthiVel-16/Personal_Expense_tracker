import './env.js';
import { initializeDatabase, getDb, saveDatabase } from './database/init.js';

async function debugDB() {
  await initializeDatabase();
  const db = getDb();
  
  console.log('\n=== ALL TRANSACTIONS IN DATABASE ===');
  const result = db.exec(`SELECT id, date, description, amount, type FROM transactions ORDER BY date DESC`);
  
  if (result[0]) {
    const cols = result[0].columns;
    const rows = result[0].values;
    console.log('\nColumns:', cols);
    console.log(`Total transactions: ${rows.length}\n`);
    
    rows.forEach((row, idx) => {
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      console.log(`${idx + 1}. ID: ${obj.id}, Date: "${obj.date}", Description: ${obj.description}, Amount: ${obj.amount}, Type: ${obj.type}`);
    });
  } else {
    console.log('No transactions found');
  }
  
  console.log('\n=== TEST DATE FILTER ===');
  console.log('Testing filter: start=2026-08-01, end=2026-08-31');
  const filtered = db.exec(
    `SELECT id, date, description, amount FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC`,
    ['2026-08-01', '2026-08-31']
  );
  
  if (filtered[0]) {
    const cols = filtered[0].columns;
    const rows = filtered[0].values;
    console.log(`Filtered results: ${rows.length} transactions\n`);
    rows.forEach((row, idx) => {
      const obj = {};
      cols.forEach((c, i) => obj[c] = row[i]);
      console.log(`${idx + 1}. ID: ${obj.id}, Date: "${obj.date}", Description: ${obj.description}`);
    });
  } else {
    console.log('No matching transactions found for August 2026');
  }
}

debugDB().catch(console.error);
