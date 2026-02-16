-- Migration 0011: Calendar Events
-- Personal time blocks and appointments (separate from task_schedule)

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('personal', 'appointment')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'slate',
  -- Appointment-specific fields
  location TEXT,
  meeting_link TEXT,
  attendees TEXT,
  related_task_id TEXT REFERENCES tasks(id),
  -- Recurrence
  recurrence TEXT CHECK (recurrence IN (NULL, 'daily', 'weekdays', 'weekly')),
  recurrence_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cal_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_cal_events_type ON calendar_events(event_type);
