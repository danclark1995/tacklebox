-- Seed test users for local development
-- Passwords: Admin123!, Client123!, Contractor123!

INSERT OR IGNORE INTO users (id, email, password_hash, role, display_name, company, is_active, has_completed_onboarding)
VALUES
  ('user_admin_01', 'admin@tacklebox.app', '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121', 'admin', 'Alice Admin', 'TackleBox Creative', 1, 1),
  ('user_client_01', 'client@tacklebox.app', '598e94d875ce2d6f38c297129b5c059afe1b4f6590682b19e27c3deecf6c4140', 'client', 'Carlos Client', 'Acme Corp', 1, 0),
  ('user_contractor_01', 'contractor@tacklebox.app', 'd38c169862114c24deb5b251c90f6bef2493b2035fe1621db7149cb42befb686', 'contractor', 'Dana Designer', NULL, 1, 1);

-- Seed a project so the client has something to work with
INSERT OR IGNORE INTO projects (id, name, description, client_id, status, created_by)
VALUES
  ('proj_demo_01', 'Acme Brand Refresh', 'Complete brand refresh for Acme Corp including logo, social media, and print materials.', 'user_client_01', 'active', 'user_admin_01');

-- Seed a sample task
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, category_id, project_id, client_id, contractor_id, created_by)
VALUES
  ('task_demo_01', 'Design new logo concepts', 'Create 3 logo concepts for the Acme brand refresh. Include full-color and monochrome versions.', 'assigned', 'high', 'cat_logo_design', 'proj_demo_01', 'user_client_01', 'user_contractor_01', 'user_admin_01');

-- Initialize contractor XP record
INSERT OR IGNORE INTO contractor_xp (user_id, total_xp, current_level, tasks_completed)
VALUES
  ('user_contractor_01', 0, 1, 0);
