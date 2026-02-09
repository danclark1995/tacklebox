-- 0002_content_engine.sql
-- Expanded brand profiles for AI content generation engine

-- Brand logo variants per brand profile
CREATE TABLE IF NOT EXISTS brand_logos (
  id TEXT PRIMARY KEY,
  brand_profile_id TEXT NOT NULL REFERENCES brand_profiles(id),
  variant_name TEXT,
  file_path TEXT NOT NULL,
  background_type TEXT DEFAULT 'transparent',
  logo_type TEXT DEFAULT 'primary',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brand_logos_profile ON brand_logos(brand_profile_id);

-- AI generation tracking
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  client_id TEXT REFERENCES users(id),
  brand_profile_id TEXT REFERENCES brand_profiles(id),
  content_type TEXT NOT NULL,
  sub_type TEXT,
  user_prompt TEXT,
  ai_prompt TEXT,
  result_path TEXT,
  result_type TEXT,
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'generating',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_client ON generations(client_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);

-- Reference content examples / templates
CREATE TABLE IF NOT EXISTS content_examples (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  sub_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  is_template INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_examples_type ON content_examples(content_type);

-- Expand brand_profiles with full brand guide fields
ALTER TABLE brand_profiles ADD COLUMN industry TEXT;
ALTER TABLE brand_profiles ADD COLUMN tagline TEXT;
ALTER TABLE brand_profiles ADD COLUMN strategic_tasks TEXT;
ALTER TABLE brand_profiles ADD COLUMN founder_story TEXT;
ALTER TABLE brand_profiles ADD COLUMN brand_narrative TEXT;
ALTER TABLE brand_profiles ADD COLUMN metaphors TEXT;
ALTER TABLE brand_profiles ADD COLUMN brand_values TEXT;
ALTER TABLE brand_profiles ADD COLUMN archetypes TEXT;
ALTER TABLE brand_profiles ADD COLUMN messaging_pillars TEXT;
ALTER TABLE brand_profiles ADD COLUMN colours_primary TEXT;
ALTER TABLE brand_profiles ADD COLUMN colours_secondary TEXT;
ALTER TABLE brand_profiles ADD COLUMN typography TEXT;
ALTER TABLE brand_profiles ADD COLUMN imagery_guidelines TEXT;
ALTER TABLE brand_profiles ADD COLUMN brand_guide_path TEXT;
