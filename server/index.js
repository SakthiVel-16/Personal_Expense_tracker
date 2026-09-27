import './env.js'; // loads .env before anything else
import savingsRouter from './routes/savings.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './database/init.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import budgetsRouter from './routes/budgets.js';
import analyticsRouter from './routes/analytics.js';
import aiRouter from './routes/ai.js';
import netWorthRouter from './routes/networth.js';
import exportRouter from './routes/export.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use('/api/auth', authRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Protected routes
app.use('/api/savings', requireAuth, savingsRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/categories', requireAuth, categoriesRouter);
app.use('/api/budgets', requireAuth, budgetsRouter);
app.use('/api/analytics', requireAuth, analyticsRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/networth', requireAuth, netWorthRouter);
app.use('/api/export', requireAuth, exportRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});