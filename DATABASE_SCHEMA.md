# Database Schema

Cloudflare D1 (SQLite). Database name: `tacklebox-db`.

## Migration History

| File | Description |
|------|-------------|
| `0001_initial_schema.sql` | 16 base tables: users, projects, categories, templates, tasks, comments, attachments, history, time entries, reviews, brand profiles, brand guides, contractor XP, XP levels, badges, user badges. Seeds XP levels (6-tier), badges (7), categories (11). |
| `0002_content_engine.sql` | brand_logos, generations, content_examples tables. Adds 14 columns to brand_profiles for full brand guide data. |
| `0003_scaling_system.sql` | Replaces 6-tier XP levels with 12-tier system. Replaces 7 badges with 12 camp-aligned badges. Adds complexity_level and campfire_eligible to tasks. |
| `0004_campfire.sql` | Adds campfire_eligible column to tasks (duplicate-safe). |
| `0005_communication.sql` | support_messages table. |
| `0006_toolbox.sql` | tool_links table with 10 seed entries. |
| `seed_test_users.sql` | 3 test users (admin, client, contractor), 1 project, 1 task, 1 XP record. |
| `seed_rstudios_brand.sql` | Sample brand profile data. |

## Tables

### users
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| email | TEXT | NOT NULL, UNIQUE | |
| password_hash | TEXT | NOT NULL | |
| role | TEXT | NOT NULL, CHECK ('client','contractor','admin') | |
| display_name | TEXT | NOT NULL | |
| company | TEXT | | |
| avatar_url | TEXT | | |
| is_active | INTEGER | NOT NULL | 1 |
| has_completed_onboarding | INTEGER | NOT NULL | 0 |
| auth_provider | TEXT | NOT NULL | 'local' |
| auth_provider_id | TEXT | | |
| storage_used_bytes | INTEGER | NOT NULL | 0 |
| created_at | TEXT | NOT NULL | datetime('now') |
| updated_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_users_email, idx_users_role, idx_users_is_active

### projects
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| client_id | TEXT | NOT NULL, FK users(id) | |
| status | TEXT | NOT NULL, CHECK ('active','on_hold','completed','archived') | 'active' |
| created_by | TEXT | NOT NULL, FK users(id) | |
| created_at | TEXT | NOT NULL | datetime('now') |
| updated_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_projects_client_id, idx_projects_status, idx_projects_created_by

### task_categories
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| default_priority | TEXT | CHECK ('low','medium','high','urgent') | |
| icon | TEXT | | |
| is_active | INTEGER | NOT NULL | 1 |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_categories_is_active

**Seed data:** 11 categories (Logo Design, Social Media, Brand Strategy, Packaging, Print Design, Digital Design, Illustration, Photography, Copywriting, Web Design, Other)

### task_templates
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| name | TEXT | NOT NULL | |
| category_id | TEXT | NOT NULL, FK task_categories(id) | |
| default_title | TEXT | | |
| default_description | TEXT | | |
| default_priority | TEXT | CHECK ('low','medium','high','urgent') | |
| checklist | TEXT | | (JSON array) |
| created_by | TEXT | NOT NULL, FK users(id) | |
| is_active | INTEGER | NOT NULL | 1 |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_templates_category_id, idx_task_templates_is_active

### tasks
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| title | TEXT | NOT NULL | |
| description | TEXT | NOT NULL | |
| status | TEXT | NOT NULL, CHECK ('submitted','assigned','in_progress','review','revision','approved','closed','cancelled') | 'submitted' |
| priority | TEXT | NOT NULL, CHECK ('low','medium','high','urgent') | |
| category_id | TEXT | NOT NULL, FK task_categories(id) | |
| project_id | TEXT | NOT NULL, FK projects(id) | |
| client_id | TEXT | NOT NULL, FK users(id) | |
| contractor_id | TEXT | FK users(id) | |
| created_by | TEXT | NOT NULL, FK users(id) | |
| template_id | TEXT | FK task_templates(id) | |
| deadline | TEXT | | |
| ai_metadata | TEXT | | (JSON) |
| complexity_level | INTEGER | | NULL |
| campfire_eligible | INTEGER | | 0 |
| created_at | TEXT | NOT NULL | datetime('now') |
| updated_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_tasks_status, idx_tasks_priority, idx_tasks_category_id, idx_tasks_project_id, idx_tasks_client_id, idx_tasks_contractor_id, idx_tasks_created_by, idx_tasks_deadline

### task_comments
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| task_id | TEXT | NOT NULL, FK tasks(id) | |
| user_id | TEXT | NOT NULL, FK users(id) | |
| content | TEXT | NOT NULL | |
| visibility | TEXT | NOT NULL, CHECK ('all','internal') | 'all' |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_comments_task_id, idx_task_comments_user_id

### task_attachments
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| task_id | TEXT | NOT NULL, FK tasks(id) | |
| uploaded_by | TEXT | NOT NULL, FK users(id) | |
| file_name | TEXT | NOT NULL | |
| file_path | TEXT | NOT NULL | |
| file_type | TEXT | NOT NULL | |
| file_size | INTEGER | NOT NULL | |
| upload_type | TEXT | NOT NULL, CHECK ('submission','deliverable') | |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_attachments_task_id, idx_task_attachments_uploaded_by, idx_task_attachments_upload_type

### task_history
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| task_id | TEXT | NOT NULL, FK tasks(id) | |
| changed_by | TEXT | NOT NULL, FK users(id) | |
| from_status | TEXT | | |
| to_status | TEXT | NOT NULL | |
| note | TEXT | | |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_history_task_id, idx_task_history_changed_by

### time_entries
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| task_id | TEXT | NOT NULL, FK tasks(id) | |
| user_id | TEXT | NOT NULL, FK users(id) | |
| date | TEXT | NOT NULL | |
| duration_minutes | INTEGER | NOT NULL, CHECK (>= 15, <= 480, % 15 = 0) | |
| description | TEXT | NOT NULL | |
| created_at | TEXT | NOT NULL | datetime('now') |
| updated_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_time_entries_task_id, idx_time_entries_user_id, idx_time_entries_date

### task_reviews
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| task_id | TEXT | NOT NULL, FK tasks(id) | |
| reviewer_id | TEXT | NOT NULL, FK users(id) | |
| reviewer_role | TEXT | NOT NULL, CHECK ('contractor','admin') | |
| quality_rating | INTEGER | CHECK (1-5) | |
| difficulty_rating | INTEGER | CHECK (1-5) | |
| time_assessment | TEXT | CHECK ('under','about_right','over') | |
| estimated_time_future | INTEGER | | |
| total_time_actual | INTEGER | | |
| what_went_well | TEXT | | |
| what_to_improve | TEXT | | |
| blockers_encountered | TEXT | | |
| client_feedback_summary | TEXT | | |
| internal_notes | TEXT | | |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_task_reviews_task_id, idx_task_reviews_reviewer_id
**Unique:** idx_task_reviews_unique (task_id, reviewer_id)

### brand_profiles
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| client_id | TEXT | NOT NULL, UNIQUE, FK users(id) | |
| logo_path | TEXT | | |
| brand_colours | TEXT | | (JSON) |
| voice_tone | TEXT | | |
| core_values | TEXT | | |
| mission_statement | TEXT | | |
| target_audience | TEXT | | |
| dos | TEXT | | |
| donts | TEXT | | |
| additional_notes | TEXT | | |
| industry | TEXT | | (added 0002) |
| tagline | TEXT | | (added 0002) |
| strategic_tasks | TEXT | | (added 0002) |
| founder_story | TEXT | | (added 0002) |
| brand_narrative | TEXT | | (added 0002) |
| metaphors | TEXT | | (added 0002, JSON) |
| brand_values | TEXT | | (added 0002, JSON) |
| archetypes | TEXT | | (added 0002, JSON) |
| messaging_pillars | TEXT | | (added 0002, JSON) |
| colours_primary | TEXT | | (added 0002, JSON) |
| colours_secondary | TEXT | | (added 0002, JSON) |
| typography | TEXT | | (added 0002, JSON) |
| imagery_guidelines | TEXT | | (added 0002, JSON) |
| brand_guide_path | TEXT | | (added 0002) |
| created_at | TEXT | NOT NULL | datetime('now') |
| updated_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_brand_profiles_client_id (UNIQUE)

### brand_guides
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| client_id | TEXT | NOT NULL, FK users(id) | |
| title | TEXT | NOT NULL | |
| file_path | TEXT | NOT NULL | |
| file_type | TEXT | NOT NULL | |
| uploaded_by | TEXT | NOT NULL, FK users(id) | |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_brand_guides_client_id

### brand_logos
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| brand_profile_id | TEXT | NOT NULL, FK brand_profiles(id) | |
| variant_name | TEXT | | |
| file_path | TEXT | NOT NULL | |
| background_type | TEXT | | 'transparent' |
| logo_type | TEXT | | 'primary' |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_brand_logos_profile

### generations
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| user_id | TEXT | NOT NULL, FK users(id) | |
| client_id | TEXT | FK users(id) | |
| brand_profile_id | TEXT | FK brand_profiles(id) | |
| content_type | TEXT | NOT NULL | |
| sub_type | TEXT | | |
| user_prompt | TEXT | | |
| ai_prompt | TEXT | | |
| result_path | TEXT | | |
| result_type | TEXT | | |
| metadata | TEXT | | (JSON) |
| status | TEXT | NOT NULL | 'generating' |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_generations_user, idx_generations_client, idx_generations_status

### content_examples
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| content_type | TEXT | NOT NULL | |
| sub_type | TEXT | | |
| title | TEXT | NOT NULL | |
| description | TEXT | | |
| file_path | TEXT | | |
| is_template | INTEGER | | 0 |
| created_by | TEXT | FK users(id) | |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:** idx_content_examples_type

### contractor_xp
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| user_id | TEXT | PRIMARY KEY, FK users(id) | |
| total_xp | INTEGER | NOT NULL | 0 |
| current_level | INTEGER | NOT NULL | 1 |
| tasks_completed | INTEGER | NOT NULL | 0 |
| on_time_count | INTEGER | NOT NULL | 0 |
| total_tasks_with_deadline | INTEGER | NOT NULL | 0 |
| avg_quality_rating | REAL | NOT NULL | 0 |
| updated_at | TEXT | NOT NULL | datetime('now') |

### xp_levels
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | INTEGER | PRIMARY KEY | |
| level | INTEGER | UNIQUE, NOT NULL | |
| name | TEXT | NOT NULL | |
| xp_required | INTEGER | NOT NULL | |
| rate_min | INTEGER | | 0 |
| rate_max | INTEGER | | 0 |
| fire_stage | TEXT | | |
| description | TEXT | | |

**Seed data (12 tiers):**

| Level | Name | XP Required | Fire Stage |
|-------|------|-------------|------------|
| 1 | Volunteer | 0 | Strike the Match |
| 2 | Apprentice | 500 | Strike the Match |
| 3 | Junior | 1,500 | Find Kindling |
| 4 | Intermediate | 3,500 | Light First Flame |
| 5 | Senior | 7,000 | Feed the Fire |
| 6 | Specialist | 12,000 | Choose Your Wood |
| 7 | Camp Leader | 20,000 | Build the Blaze |
| 8 | Guide | 30,000 | Build the Blaze |
| 9 | Trailblazer | 45,000 | Share the Warmth |
| 10 | Pioneer | 65,000 | Share the Warmth |
| 11 | Legend | 90,000 | Tend the Embers |
| 12 | Legacy | 120,000 | Tend the Embers |

### badges
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| icon_name | TEXT | NOT NULL | |
| trigger_type | TEXT | | |
| trigger_value | INTEGER | | |
| created_at | TEXT | | datetime('now') |

**Seed data (12 badges):** first-spark, kindling, flame-keeper, blaze-builder, warmth-sharer, ember-tender, keeper-fish, gold-standard, trailblazer, community-pillar, forest-builder, legacy-maker

### user_badges
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| user_id | TEXT | NOT NULL, FK users(id) | |
| badge_id | TEXT | NOT NULL, FK badges(id) | |
| awarded_at | TEXT | NOT NULL | datetime('now') |

**Primary Key:** (user_id, badge_id)
**Indexes:** idx_user_badges_user_id, idx_user_badges_badge_id

### support_messages
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| user_id | TEXT | NOT NULL, FK users(id) | |
| subject | TEXT | NOT NULL | |
| message | TEXT | NOT NULL | |
| status | TEXT | | 'open' |
| created_at | TEXT | | datetime('now') |
| resolved_at | TEXT | | |
| resolved_by | TEXT | | |

### tool_links
| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| url | TEXT | NOT NULL | |
| icon_name | TEXT | | 'link' |
| display_order | INTEGER | | 0 |
| is_active | INTEGER | | 1 |
| created_by | TEXT | | |
| created_at | TEXT | | datetime('now') |

**Seed data:** 10 tool links (Adobe Creative Suite, Canva, Figma, Notion, Google Drive, Slack, Loom, Unsplash, Coolors, Type Scale)
