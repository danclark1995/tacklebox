-- Phase 2B: 12-Tier Scaling System Migration

-- 1. Recreate xp_levels with 12 tiers
CREATE TABLE IF NOT EXISTS xp_levels_new (
  id INTEGER PRIMARY KEY,
  level INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  rate_min INTEGER DEFAULT 0,
  rate_max INTEGER DEFAULT 0,
  fire_stage TEXT,
  description TEXT
);

INSERT INTO xp_levels_new (level, name, xp_required, rate_min, rate_max, fire_stage, description) VALUES
  (1,  'Volunteer',    0,      0,    12,  'Strike the Match',  'Learning the basics, step-by-step guidance'),
  (2,  'Apprentice',   500,    12,   24,  'Strike the Match',  'Using tools, building foundations'),
  (3,  'Junior',       1500,   24,   36,  'Find Kindling',     'Minimal complexity, growing skills'),
  (4,  'Intermediate', 3500,   36,   60,  'Light First Flame', 'Average complexity, gaining confidence'),
  (5,  'Senior',       7000,   60,   96,  'Feed the Fire',     'High complexity work'),
  (6,  'Specialist',   12000,  96,   120, 'Choose Your Wood',  'Custom work from brand guidelines'),
  (7,  'Camp Leader',  20000,  120,  120, 'Build the Blaze',   'The transition - leading own projects'),
  (8,  'Guide',        30000,  120,  240, 'Build the Blaze',   'Leading teams, creating blueprints'),
  (9,  'Trailblazer',  45000,  240,  360, 'Share the Warmth',  'Advanced leadership, mapping new paths'),
  (10, 'Pioneer',      65000,  360,  600, 'Share the Warmth',  'Innovation and originality'),
  (11, 'Legend',       90000,  600,  960, 'Tend the Embers',   'Industry-level impact'),
  (12, 'Legacy',       120000, 960,  0,   'Tend the Embers',   'Building your own campsite');

DROP TABLE IF EXISTS xp_levels;
ALTER TABLE xp_levels_new RENAME TO xp_levels;

-- 2. Recreate badges with camp-aligned badges
CREATE TABLE IF NOT EXISTS badges_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  trigger_type TEXT,
  trigger_value INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO badges_new (id, name, description, icon_name, trigger_type, trigger_value) VALUES
  ('first-spark',      'First Spark',      'Completed your first task',            'flame',              'tasks_completed',   1),
  ('kindling',         'Kindling',         'Completed 5 tasks',                    'layers',             'tasks_completed',   5),
  ('flame-keeper',     'Flame Keeper',     'Completed 25 tasks',                   'fire-extinguisher',  'tasks_completed',   25),
  ('blaze-builder',    'Blaze Builder',    'Completed 50 tasks',                   'zap',                'tasks_completed',   50),
  ('warmth-sharer',    'Warmth Sharer',    'Gave your first review',               'heart-handshake',    'reviews_given',     1),
  ('ember-tender',     'Ember Tender',     'Completed 100 tasks',                  'sparkles',           'tasks_completed',   100),
  ('keeper-fish',      'Keeper Fish',      'Reached Level 7 - Camp Leader',        'fish',               'level_reached',     7),
  ('gold-standard',    'Gold Standard',    'Achieved 5-star average rating',       'star',               'avg_rating',        5),
  ('trailblazer',      'Trailblazer',      'Worked across 5+ categories',          'compass',            'categories_worked', 5),
  ('community-pillar', 'Community Pillar', 'Helped 10+ clients',                   'tent',               'clients_helped',    10),
  ('forest-builder',   'Forest Builder',   'Reached Level 10 - Pioneer',           'tree-pine',          'level_reached',     10),
  ('legacy-maker',     'Legacy Maker',     'Reached Level 12 - Legacy',            'trees',              'level_reached',     12);

-- Clear user_badges that reference old badge IDs
DELETE FROM user_badges WHERE badge_id NOT IN (SELECT id FROM badges_new);

DROP TABLE IF EXISTS badges;
ALTER TABLE badges_new RENAME TO badges;

-- 3. Add complexity columns to tasks
ALTER TABLE tasks ADD COLUMN complexity_level INTEGER DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN campfire_eligible INTEGER DEFAULT 0;
