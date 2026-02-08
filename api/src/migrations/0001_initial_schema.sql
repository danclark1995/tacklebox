-- TackleBox Database Schema — Initial Migration
-- All 18 tables from Section 16 of the spec
-- Cloudflare D1 (SQLite)
-- Run: wrangler d1 execute tacklebox-db --file=src/migrations/0001_initial_schema.sql

-- ============================================================
-- 1. Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'contractor', 'admin')),
  display_name TEXT NOT NULL,
  company TEXT,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  has_completed_onboarding INTEGER NOT NULL DEFAULT 0,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  auth_provider_id TEXT,
  storage_used_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================
-- 2. Projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- ============================================================
-- 3. Task Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS task_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  icon TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_categories_is_active ON task_categories(is_active);

-- ============================================================
-- 4. Task Templates
-- ============================================================
CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES task_categories(id),
  default_title TEXT,
  default_description TEXT,
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  checklist TEXT, -- JSON array of checklist items
  created_by TEXT NOT NULL REFERENCES users(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_active ON task_templates(is_active);

-- ============================================================
-- 5. Tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'review', 'revision', 'approved', 'closed', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category_id TEXT NOT NULL REFERENCES task_categories(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  client_id TEXT NOT NULL REFERENCES users(id),
  contractor_id TEXT REFERENCES users(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  template_id TEXT REFERENCES task_templates(id),
  deadline TEXT,
  ai_metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contractor_id ON tasks(contractor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

-- ============================================================
-- 6. Task Comments
-- ============================================================
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'internal')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- ============================================================
-- 7. Task Attachments
-- ============================================================
CREATE TABLE IF NOT EXISTS task_attachments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('submission', 'deliverable')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_attachments_upload_type ON task_attachments(upload_type);

-- ============================================================
-- 8. Task History
-- ============================================================
CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  changed_by TEXT NOT NULL REFERENCES users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_changed_by ON task_history(changed_by);

-- ============================================================
-- 9. Time Entries
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480 AND duration_minutes % 15 = 0),
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- ============================================================
-- 10. Task Reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS task_reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('contractor', 'admin')),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  time_assessment TEXT CHECK (time_assessment IN ('under', 'about_right', 'over')),
  estimated_time_future INTEGER,
  total_time_actual INTEGER,
  what_went_well TEXT,
  what_to_improve TEXT,
  blockers_encountered TEXT,
  client_feedback_summary TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_reviewer_id ON task_reviews(reviewer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_reviews_unique ON task_reviews(task_id, reviewer_id);

-- ============================================================
-- 11. Brand Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_profiles (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  logo_path TEXT,
  brand_colours TEXT, -- JSON array of {name, hex}
  voice_tone TEXT,
  core_values TEXT,
  mission_statement TEXT,
  target_audience TEXT,
  dos TEXT,
  donts TEXT,
  additional_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_profiles_client_id ON brand_profiles(client_id);

-- ============================================================
-- 12. Brand Guides
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_guides (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brand_guides_client_id ON brand_guides(client_id);

-- ============================================================
-- 13. Contractor XP
-- ============================================================
CREATE TABLE IF NOT EXISTS contractor_xp (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  on_time_count INTEGER NOT NULL DEFAULT 0,
  total_tasks_with_deadline INTEGER NOT NULL DEFAULT 0,
  avg_quality_rating REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 14. XP Levels
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_levels (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  xp_threshold INTEGER NOT NULL,
  icon TEXT
);

-- ============================================================
-- 15. Badges
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  icon TEXT
);

-- ============================================================
-- 16. User Badges
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL REFERENCES badges(id),
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================================
-- Seed: XP Levels
-- ============================================================
INSERT OR IGNORE INTO xp_levels (level, name, xp_threshold, icon) VALUES
  (1, 'Rookie', 0, 'seedling'),
  (2, 'Apprentice', 500, 'sprout'),
  (3, 'Craftsman', 1500, 'hammer'),
  (4, 'Expert', 3500, 'star'),
  (5, 'Master', 7000, 'crown'),
  (6, 'Legend', 12000, 'trophy');

-- ============================================================
-- Seed: Initial Badges
-- ============================================================
INSERT OR IGNORE INTO badges (id, name, description, criteria_type, criteria_value, icon) VALUES
  ('badge_first_catch', 'First Catch', 'Complete your first task', 'tasks_completed', 1, 'award'),
  ('badge_on_the_clock', 'On the Clock', '100% on-time delivery, 5 consecutive tasks', 'on_time_streak', 5, 'clock'),
  ('badge_five_star', 'Five Star', 'Receive a 5-star quality rating', 'quality_rating', 5, 'star'),
  ('badge_speed_demon', 'Speed Demon', 'Complete 3 tasks under estimated time', 'under_estimated', 3, 'zap'),
  ('badge_streak_master', 'Streak Master', 'Complete 10 tasks with no revisions', 'no_revision_streak', 10, 'trending-up'),
  ('badge_heavy_lifter', 'Heavy Lifter', 'Log 100+ hours of work', 'hours_logged', 6000, 'shield'),
  ('badge_feedback_champ', 'Feedback Champ', 'Complete 10 consecutive post-task reviews', 'review_streak', 10, 'message-circle');

-- ============================================================
-- Seed: Initial Task Categories
-- ============================================================
INSERT OR IGNORE INTO task_categories (id, name, description, default_priority, icon, is_active) VALUES
  ('cat_logo_design', 'Logo Design', 'Logo creation and brand mark design', 'medium', 'palette', 1),
  ('cat_social_media', 'Social Media', 'Social media graphics, templates, and campaigns', 'medium', 'share', 1),
  ('cat_brand_strategy', 'Brand Strategy', 'Brand positioning, messaging, and strategy', 'high', 'target', 1),
  ('cat_packaging', 'Packaging', 'Product packaging and label design', 'medium', 'package', 1),
  ('cat_print_design', 'Print Design', 'Business cards, brochures, flyers, and print materials', 'medium', 'printer', 1),
  ('cat_digital_design', 'Digital Design', 'Digital assets, banners, email templates', 'medium', 'monitor', 1),
  ('cat_illustration', 'Illustration', 'Custom illustrations and artwork', 'medium', 'pen-tool', 1),
  ('cat_photography', 'Photography', 'Photo editing, retouching, and direction', 'low', 'camera', 1),
  ('cat_copywriting', 'Copywriting', 'Brand copy, taglines, and written content', 'medium', 'file-text', 1),
  ('cat_web_design', 'Web Design', 'Website design, UI/UX, and prototyping', 'high', 'layout', 1),
  ('cat_other', 'Other', 'Other creative work not listed above', 'medium', 'more-horizontal', 1);
