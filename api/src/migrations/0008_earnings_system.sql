-- Migration 0008: Earnings system, task pricing, and calendar scheduling
-- Adds: estimated_hours, hourly_rate, total_payout, min_level to tasks
-- Adds: earnings table, cashout_requests table
-- Adds: total_earnings, available_balance to contractor_xp
-- Adds: task_schedule table for calendar

-- 1. Add pricing columns to tasks
ALTER TABLE tasks ADD COLUMN estimated_hours REAL;
ALTER TABLE tasks ADD COLUMN hourly_rate REAL;
ALTER TABLE tasks ADD COLUMN total_payout REAL;
ALTER TABLE tasks ADD COLUMN min_level INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN scheduled_start TEXT;
ALTER TABLE tasks ADD COLUMN scheduled_end TEXT;

-- 2. Earnings ledger — every dollar earned or awarded
CREATE TABLE IF NOT EXISTS earnings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  task_id TEXT REFERENCES tasks(id),
  type TEXT NOT NULL CHECK (type IN ('task_completion', 'bonus_cash', 'bonus_xp')),
  amount REAL NOT NULL DEFAULT 0,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  awarded_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_earnings_user ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_task ON earnings(task_id);
CREATE INDEX IF NOT EXISTS idx_earnings_type ON earnings(type);

-- 3. Cashout requests — Stripe-ready
CREATE TABLE IF NOT EXISTS cashout_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  stripe_payout_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  processed_by TEXT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_cashout_user ON cashout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cashout_status ON cashout_requests(status);

-- 4. Add cached balance columns to contractor_xp
ALTER TABLE contractor_xp ADD COLUMN total_earnings REAL NOT NULL DEFAULT 0;
ALTER TABLE contractor_xp ADD COLUMN available_balance REAL NOT NULL DEFAULT 0;

-- 5. Task schedule — calendar events for campers
CREATE TABLE IF NOT EXISTS task_schedule (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_schedule_user ON task_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_task ON task_schedule(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_start ON task_schedule(start_time);
