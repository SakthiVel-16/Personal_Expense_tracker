import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

let tursoClient;

export async function initializeDatabase() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing Turso credentials in .env");
  }
  
  tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  console.log('✅ Database connected successfully to Turso cloud');
}

export function getDb() {
  if (!tursoClient) throw new Error('Database not initialized');
  return {
    run: async (sql, params = []) => {
      await tursoClient.execute({ sql, args: params });
    },
    exec: async (sql, params = []) => {
      const result = await tursoClient.execute({ sql, args: params });
      
      // Mimic sql.js output: [{ columns: [...], values: [[...]] }]
      if (result.rows.length === 0) {
        return [];
      }
      
      const columns = result.columns;
      const values = result.rows.map(row => columns.map(col => row[col]));
      
      return [{ columns, values }];
    }
  };
}

export function saveDatabase() {
  // No-op for Turso, since the cloud handles persistence
}