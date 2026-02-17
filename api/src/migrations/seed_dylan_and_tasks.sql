-- ============================================================
-- Seed Dylan Lawrence (Owner) + R Studios Tasks + Cleanup
-- Run via: npx wrangler d1 execute tacklebox-db --remote --file=src/migrations/seed_dylan_and_tasks.sql
-- ============================================================

-- ── 0. Cleanup old test data ──
-- Rename Alice Admin to generic test account
UPDATE users SET display_name = 'Admin Test', company = 'TackleBox' WHERE id = 'user_admin_01';

-- Delete old Acme demo task (clean up child records first)
DELETE FROM task_comments WHERE task_id = 'task_demo_01';
DELETE FROM task_history WHERE task_id = 'task_demo_01';
DELETE FROM task_attachments WHERE task_id = 'task_demo_01';
DELETE FROM time_entries WHERE task_id = 'task_demo_01';
DELETE FROM task_reviews WHERE task_id = 'task_demo_01';
DELETE FROM task_schedule WHERE task_id = 'task_demo_01';
DELETE FROM tasks WHERE id = 'task_demo_01';

-- Ensure Gil Scales name is correct (was seeded as 'Dana Designer')
UPDATE users SET display_name = 'Gil Scales' WHERE id = 'user_contractor_01';

-- Bump Gil to L2 Apprentice (500 XP)
UPDATE contractor_xp SET total_xp = 500, current_level = 2, tasks_completed = 3 WHERE user_id = 'user_contractor_01';

-- ── 1. Create Dylan Lawrence — Platform Owner, L7 Camp Leader ──
INSERT OR IGNORE INTO users (id, email, password_hash, role, display_name, company, is_active, has_completed_onboarding)
VALUES ('user_dylan_01', 'dylan@tacklebox.app', '08f36263c88c6b2979be8a227ef5f10d02c26db3c76707f3e2f468e5801046b1', 'admin', 'Dylan Lawrence', 'TackleBox', 1, 1);

-- Set Dylan at L7 Camp Leader (20000+ XP, 15 tasks completed)
INSERT OR IGNORE INTO contractor_xp (user_id, total_xp, current_level, tasks_completed)
VALUES ('user_dylan_01', 24000, 7, 15);

-- ── 2. Ensure Connie McInnes is correct as R Studios client ──
UPDATE users SET
  display_name = 'Connie McInnes',
  company = 'R Studios',
  role = 'client',
  is_active = 1
WHERE id = 'user_client_01';

-- ── 3. Ensure R Studios Brand Refresh project exists ──
UPDATE projects SET
  name = 'R Studios Brand Refresh',
  description = 'Complete brand identity unification for R Studios boutique fitness locations. Refreshed brand tools, metaphorical narrative, and enhanced visual elements.',
  status = 'active'
WHERE id = 'proj_demo_01';

-- ── 4. R Studios Tasks — realistic creative work at various levels ──
-- Assigned to Gil Scales (user_contractor_01) under Connie (user_client_01)

-- Task 1: Social Media Templates (L2, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_001',
  'Design R Studios social media template pack',
  'Create a set of 6 Instagram post templates and 3 Instagram Story templates using the R Studios brand guidelines. Templates should use dark backgrounds with gold kintsugi accents (#998542), Eurostile font family, and incorporate the lightning/storm motifs. Include: announcement template, class schedule template, motivational quote template, testimonial template, new location template, and event template. Stories: class countdown, instructor spotlight, community highlight. All templates must work for all R Studios locations (R Rival, R Rio, R Rinse, etc.).',
  'assigned',
  'medium',
  'cat_social_media',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  2,
  8,
  240.00,
  '2026-02-28'
);

-- Task 2: Brand Guidelines Document (L4, in_progress)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_002',
  'Compile comprehensive brand guidelines PDF',
  'Assemble the full R Studios brand guidelines into a polished, professional PDF document. Must include: brand story and values (Authenticity, Connection, Teamwork, Passion), visual identity system (logo usage, colour palette with Pantone references, typography specs for Eurostile family), photography direction (diverse bodies, no mirrors, powerful/resilient imagery), metaphor system (The Storm and Kintsugi narratives), messaging framework (pillars, taglines, voice & tone), archetype profiles (The Everyman, The Outlaw, The Magician), and location-specific branding guidelines. Document should be 30-40 pages with brand-consistent design throughout.',
  'in_progress',
  'high',
  'cat_brand_strategy',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  4,
  16,
  640.00,
  '2026-03-07'
);

-- Task 3: Location Launch Kit (L3, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_003',
  'Create new location launch kit for R Rinse',
  'Design a complete launch kit for the new R Rinse location. Kit includes: location-specific logo lockup (R + Rinse), grand opening poster (A2), social media announcement series (5 posts), instructor introduction cards (4), window vinyl mockups, and a one-page flyer. All materials must follow brand guidelines — dark backgrounds, gold accents, Eurostile typography, storm/kintsugi motifs. Include both print-ready (CMYK) and digital (RGB) versions.',
  'assigned',
  'high',
  'cat_print_design',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  3,
  12,
  396.00,
  '2026-03-14'
);

-- Task 4: Website Hero Section Redesign (L5, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_004',
  'Redesign website hero section and landing pages',
  'Redesign the main website hero section and 3 key landing pages for R Studios. Hero must convey "The Future of Fitness is Human" with powerful imagery, animated gold kintsugi crack effects, and clear CTAs. Landing pages: (1) About/Our Story — founder story with kintsugi narrative, (2) Locations — map view with R Rival/Rio/Rinse cards, (3) Class Timetable — clean schedule grid with instructor bios. Design in Figma with responsive breakpoints (mobile, tablet, desktop). Include interaction states, hover effects, and loading animations. Must be developer-ready with proper spacing and component structure.',
  'assigned',
  'urgent',
  'cat_web_design',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  5,
  20,
  1200.00,
  '2026-03-01'
);

-- Task 5: Copywriting — Class Descriptions (L2, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_005',
  'Write class descriptions for all R Studios formats',
  'Write engaging, brand-voice-aligned descriptions for each R Studios class format. Classes include: HIIT, Yoga Flow, Boxing, Pilates Reformer, Spin, Barre, Stretch & Recover. Each description should be 80-120 words, use first person plural (we/us/our), incorporate storm/resilience metaphors naturally, and emphasise inclusivity (all beings, all bodies). Also write a 30-word social-friendly version of each. Voice: empowering, inclusive, poetic but grounded — never preachy. Include suggested hashtags per class type.',
  'assigned',
  'medium',
  'cat_copywriting',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  2,
  6,
  180.00,
  '2026-02-25'
);

-- Task 6: Photography Direction Brief (L3, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_006',
  'Create photography direction brief and shot list',
  'Develop a comprehensive photography direction brief for the upcoming R Studios brand shoot. Must include: mood board (20+ reference images), shot list organised by category (instructors in action, community moments, studio interiors, detail shots), lighting direction (dramatic, gold-toned, storm-inspired), styling notes (diverse bodies, authentic movement, no posed stock-photo aesthetics), specific shots for each location (R Rival, R Rio, R Rinse), and model direction guidance. Brief should embody the kintsugi philosophy — showing real people, real effort, real connection. No mirrors.',
  'assigned',
  'medium',
  'cat_photography',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  3,
  10,
  360.00,
  '2026-03-10'
);

-- Task 7: Custom Illustrations (L4, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_007',
  'Design custom kintsugi illustration set',
  'Create a set of 8 custom illustrations based on the kintsugi (gold crack repair) metaphor for use across R Studios brand materials. Set should include: (1) abstract kintsugi crack pattern (tileable), (2) lightning bolt with gold veins, (3) human silhouette with gold repair lines, (4) storm-to-sunshine transformation sequence (3 stages), (5) community hands illustration, (6) foundation/building blocks with gold mortar. Style: minimalist line art with gold (#998542) and black, suitable for both print and digital. Provide as SVG and PNG at 300dpi. Must feel powerful, resilient, and warm — not fragile.',
  'assigned',
  'medium',
  'cat_illustration',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  4,
  14,
  560.00,
  '2026-03-21'
);

-- Task 8: Packaging — Merch Design (L3, assigned)
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by, complexity_level, estimated_hours, total_payout, deadline)
VALUES (
  'task_rs_008',
  'Design R Studios merchandise collection',
  'Design a branded merchandise collection for R Studios members. Items: (1) Water bottle wrap — gold kintsugi crack pattern on matte black, (2) Gym towel — embroidered R Studios logo with tagline, (3) Tote bag — ''All Beings, All Bodies'' typography design, (4) Tank top — front: minimal R logo, back: ''The Future of Fitness is Human'', (5) Hoodie — storm/lightning motif with gold foil detail. Provide production-ready files with Pantone colour specs, placement guides, and mockups on product blanks. Each item in both black and cream colourways.',
  'assigned',
  'low',
  'cat_packaging',
  'proj_demo_01',
  'user_client_01',
  'user_contractor_01',
  'user_dylan_01',
  3,
  10,
  330.00,
  '2026-04-01'
);
