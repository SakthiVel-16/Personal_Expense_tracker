import './env.js'; // loads .env before anything else
import savingsRouter from './routes/savings.js';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/init.js';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import budgetsRouter from './routes/budgets.js';
import analyticsRouter from './routes/analytics.js';
import aiRouter from './routes/ai.js';
import netWorthRouter from './routes/networth.js';
import exportRouter from './routes/export.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/savings', savingsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/networth', netWorthRouter);
app.use('/api/export', exportRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});