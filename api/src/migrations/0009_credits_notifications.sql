-- Migration 0009: Client credits, notifications, template pricing, kickback tracking
-- Run: npx wrangler d1 execute tacklebox-db --remote --file=src/migrations/0009_credits_notifications.sql

-- ============================================================
-- CLIENT CREDITS SYSTEM
-- ============================================================

-- Credit packs (Keeper Fish tiers from the Scaling System)
CREATE TABLE IF NOT EXISTS credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  price REAL NOT NULL,
  hours_per_week REAL,
  savings_percent REAL DEFAULT 0,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client credit balances
CREATE TABLE IF NOT EXISTS client_credits (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  total_credits REAL NOT NULL DEFAULT 0,
  available_credits REAL NOT NULL DEFAULT 0,
  held_credits REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Credit transaction ledger
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'admin_grant', 'task_hold', 'task_release', 'task_deduct', 'refund')),
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  task_id TEXT REFERENCES tasks(id),
  pack_id TEXT REFERENCES credit_packs(id),
  description TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_task ON credit_transactions(task_id);

-- Seed Keeper Fish credit packs from the Scaling System
INSERT OR IGNORE INTO credit_packs (id, name, tier, credits, price, hours_per_week, savings_percent, description) VALUES
  ('pack-01', 'Minnow', 1, 4800, 4000, 1, 17, '1 task block per week (40 weeks)'),
  ('pack-02', 'Perch', 2, 14400, 12000, 3, 17, '1 time block per week (40 weeks)'),
  ('pack-03', 'Bass', 3, 28800, 24000, 6, 17, '2 time blocks per week (40 weeks)'),
  ('pack-04', 'Trout', 4, 43200, 36000, 9, 17, '3 time blocks per week (40 weeks)'),
  ('pack-05', 'Salmon', 5, 57600, 48000, 12, 17, '4 time blocks per week (40 weeks)'),
  ('pack-06', 'Pike', 6, 72000, 60000, 15, 17, '5 time blocks per week (40 weeks)'),
  ('pack-07', 'Keeper Fish', 7, 86400, 72000, 18, 17, '6 time blocks per week (40 weeks)'),
  ('pack-08', 'Marlin', 8, 115200, 84000, 24, 27, '8 time blocks per week (40 weeks)'),
  ('pack-09', 'Swordfish', 9, 144000, 96000, 30, 33, '10 time blocks per week (40 weeks)'),
  ('pack-10', 'Tuna', 10, 172800, 108000, 36, 38, '12 time blocks per week (40 weeks)'),
  ('pack-11', 'Shark', 11, 201600, 120000, 42, 40, '14 time blocks per week (40 weeks)'),
  ('pack-12', 'Whale', 12, 230400, 132000, 46, 43, '16 time blocks per week (40 weeks)');


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_status', 'comment', 'bonus', 'deadline', 'credits_low', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);


-- ============================================================
-- TEMPLATE PRICING (add pricing fields to task_templates)
-- ============================================================

ALTER TABLE task_templates ADD COLUMN estimated_hours REAL;
ALTER TABLE task_templates ADD COLUMN hourly_rate REAL;
ALTER TABLE task_templates ADD COLUMN min_level INTEGER DEFAULT 1;


-- ============================================================
-- KICKBACK TRACKING (Level 7+ campsite share — admin-only)
-- ============================================================

-- Add kickback fields to earnings table
ALTER TABLE earnings ADD COLUMN campsite_share REAL DEFAULT 0;
ALTER TABLE earnings ADD COLUMN camper_share REAL DEFAULT 0;

-- Add credit_cost to tasks (the credit amount deducted from client)
ALTER TABLE tasks ADD COLUMN credit_cost REAL;
