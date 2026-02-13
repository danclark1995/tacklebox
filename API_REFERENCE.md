# API Reference

Base URL: `https://tacklebox-api.square-sunset-3584.workers.dev/api/v1`

All responses: `{ success: boolean, data?: any, error?: string }`

Auth: `Authorization: Bearer {token}` (Phase 1: token = user ID)

---

## Auth

### POST /auth/login
No auth required.

**Request:** `{ email, password }`
**Response:** `{ token, user: { id, email, role, display_name, company, avatar_url } }`
**Errors:** 400 missing fields, 401 invalid credentials

### POST /auth/register
Auth: admin only.

**Request:** `{ email, password, role, display_name, company? }`
**Response:** 201 `{ id, email, role, display_name, company }`
**Errors:** 400 missing fields / email exists, 403 not admin

---

## Users

### GET /users
Auth: admin. Query: `?role=client|contractor|admin`

**Response:** `[{ id, email, role, display_name, company, avatar_url, is_active, created_at }]`

### GET /users/:id
Auth: admin or self.

**Response:** `{ id, email, role, display_name, company, avatar_url, is_active, has_completed_onboarding, storage_used_bytes, created_at, updated_at }`

### POST /users
Auth: admin.

**Request:** `{ email, password, role, display_name, company? }`
**Response:** 201 user object

### PUT /users/:id
Auth: admin or self. Self can only update: `display_name`, `company`, `avatar_url`. Admin can also update: `email`, `role`, `is_active`.

**Request:** `{ display_name?, company?, avatar_url?, email?, role?, is_active? }`
**Response:** updated user

### PATCH /users/:id/deactivate
Auth: admin.

**Response:** `{ id, is_active: false }`

---

## Projects

### GET /projects
Auth: any. Query: `?status=active|on_hold|completed|archived`
Role filtering: client sees own, admin sees all.

**Response:** `[{ ...project, client_name, client_email }]`

### GET /projects/:id
Auth: admin or owning client.

### POST /projects
Auth: admin, client. Client creates for self. Admin must provide `client_id`.

**Request:** `{ name, description?, client_id? (admin), status? }`
**Response:** 201 project object

### PUT /projects/:id
Auth: admin.

**Request:** `{ name?, description?, status?, client_id? }`

### GET /projects/:id/tasks
Auth: admin or owning client.

**Response:** `[{ ...task, client_name, contractor_name, category_name }]`

---

## Categories

### GET /categories
Auth: any. Query: `?include_inactive=true` (admin only)

### POST /categories
Auth: admin. **Request:** `{ name, description?, default_priority?, icon? }`

### PUT /categories/:id
Auth: admin. **Request:** `{ name?, description?, default_priority?, icon?, is_active? }`

### DELETE /categories/:id
Auth: admin. Fails if tasks reference this category.

### PATCH /categories/:id/deactivate
Auth: admin.

---

## Templates

### GET /templates
Auth: any. Query: `?category_id=`

### GET /templates/:id
Auth: any.

### POST /templates
Auth: admin.

**Request:** `{ name, category_id, default_title?, default_description?, default_priority?, checklist?: string[] }`

### PUT /templates/:id
Auth: admin.

**Request:** `{ name?, category_id?, default_title?, default_description?, default_priority?, checklist?, is_active? }`

### DELETE /templates/:id
Auth: admin.

---

## Tasks

### GET /tasks
Auth: any. Role filtering: client sees own, contractor sees assigned, admin sees all.

Query: `?status=&priority=&category_id=&project_id=&client_id=&contractor_id=` (client_id and contractor_id filters admin only)

**Response:** `[{ ...task, client_name, client_email, contractor_name, category_name, project_name }]`

### GET /tasks/:id
Auth: admin, assigned client, or assigned contractor.

### POST /tasks
Auth: admin, client. Client creates for self. Admin must provide `client_id`.

**Request:** `{ title, description, priority, category_id, project_id, client_id? (admin), template_id?, deadline?, campfire_eligible?, complexity_level? }`
**Response:** 201 task object
**Errors:** 400 missing fields, 400 invalid priority, 400 project doesn't belong to client

### PUT /tasks/:id
Auth: admin (most fields), contractor (deadline only). Cannot change status via PUT.

**Request:** `{ title?, description?, priority?, category_id?, project_id?, deadline?, campfire_eligible?, complexity_level? }`
**Errors:** 400 "Use PATCH /tasks/:id/status to change status"

### PATCH /tasks/:id/status
Auth: role-dependent per transition.

**Request:** `{ status, contractor_id? (for assign), note? (for revision) }`

**State machine transitions:**
| From | To | Allowed Roles | Requirements |
|------|-----|--------------|--------------|
| submitted | assigned | admin | contractor_id |
| submitted | cancelled | admin | |
| assigned | in_progress | contractor | |
| assigned | cancelled | admin | |
| in_progress | review | contractor | at least 1 deliverable attachment |
| in_progress | cancelled | admin | |
| review | approved | admin | |
| review | revision | admin | note |
| revision | in_progress | contractor | |
| approved | closed | admin | |

### DELETE /tasks/:id
Auth: admin. Cascades: deletes comments, history, time entries, reviews.

### GET /tasks/campfire
Auth: contractor, admin.

**Response:** `[{ id, title, description, priority, complexity_level, created_at, category_name, client_name }]`
Returns tasks with `status='submitted'`, `contractor_id IS NULL`, `campfire_eligible=1`.

### POST /tasks/:id/claim
Auth: contractor only. Claims a campfire task (submitted -> assigned).

### POST /tasks/:id/pass
Auth: contractor only. Returns an assigned task to the campfire (assigned -> submitted).

---

## Comments

### GET /comments?task_id=
Auth: task participant. Clients see only `visibility='all'`. Admin/contractor see all.

**Response:** `[{ ...comment, user_name, user_role, user_avatar }]`

### POST /comments
Auth: task participant. Clients can only post `visibility='all'`.

**Request:** `{ task_id, content, visibility?: 'all'|'internal' }`
**Response:** 201 comment object

Automatically parses `@mentions` and sends notifications (stub).

---

## Attachments

### GET /attachments?task_id=
Auth: task participant.

**Response:** `[{ ...attachment, uploader_name }]`

### POST /attachments
Auth: task participant. Clients can only upload `submission` type. **FormData**, not JSON.

**FormData fields:** `file` (File), `task_id` (string), `upload_type?` ('submission'|'deliverable')
**Response:** 201 attachment object

### DELETE /attachments/:id
Auth: admin or uploader. Deletes from R2 and updates storage_used_bytes.

---

## Brand Profiles

### GET /brand-profiles
Auth: any. Role filtering: admin sees all, client sees own, contractor sees profiles for assigned clients.

**Response:** `[{ ...profile, client_name, client_company }]` (JSON fields auto-parsed)

### GET /brand-profiles/:clientId
Auth: admin, client (own), contractor (if has assigned task for that client).

### POST /brand-profiles
Auth: admin. Creates or upserts.

**Request:** `{ client_id, logo_path?, voice_tone?, core_values?, mission_statement?, target_audience?, dos?, donts?, additional_notes?, industry?, tagline?, strategic_tasks?, founder_story?, brand_narrative?, metaphors?, brand_values?, archetypes?, messaging_pillars?, colours_primary?, colours_secondary?, typography?, imagery_guidelines?, brand_guide_path? }`

### PUT /brand-profiles/:clientId
Auth: admin. Auto-creates profile if not exists.

**Request:** Any brand profile field.

### POST /brand-profiles/:clientId/extract
Auth: admin. **FormData** with `file` (PDF).

Extracts text from PDF, sends to Workers AI (Llama 3.1 8B), returns structured brand data.

**Response:** `{ industry, tagline, mission_statement, target_audience, ..., brand_guide_path, _company_name }`

### GET /brand-profiles/:clientId/logos
Auth: any.

### POST /brand-profiles/:clientId/logos
Auth: admin.

**Request:** `{ file_path, variant_name?, background_type?, logo_type? }`

### DELETE /brand-profiles/:clientId/logos/:logoId
Auth: admin.

---

## Brand Guides

### GET /brand-guides
Auth: any (role-filtered). Query: `?client_id=`

### POST /brand-guides
Auth: admin. **FormData:** `file` (PDF/PNG/JPG), `client_id`, `title`

### DELETE /brand-guides/:id
Auth: admin.

---

## Storage

### GET /storage/download/{key}
Auth: any. Returns file with `Content-Disposition: attachment`.

### GET /storage/preview/{key}
Auth: any. Returns file with `Content-Disposition: inline`. 1-hour cache.

---

## Time Entries

### GET /time-entries?task_id=
Auth: task participant.

### GET /time-entries/total?task_id=
Auth: task participant. **Response:** `{ total_minutes }`

### POST /time-entries
Auth: contractor (assigned) or admin. Clients cannot log time.

**Request:** `{ task_id, date, duration_minutes, description }`
**Validation:** duration_minutes: integer, 15-480, multiple of 15. description: min 5 chars. date: not future, not before task creation.

### PUT /time-entries/:id
Auth: own entry or admin.

**Request:** `{ date?, duration_minutes?, description? }`

### DELETE /time-entries/:id
Auth: own entry or admin.

---

## Reviews

### GET /reviews?task_id=
Auth: admin sees all, contractor sees own role only, client gets empty array.

### GET /reviews/:id
Auth: admin or own reviewer. Clients denied.

### POST /reviews
Auth: contractor, admin. Task must be `status='closed'`. One review per role per task.

**Contractor review request:** `{ task_id, total_time_actual?, difficulty_rating? (1-5), what_went_well?, what_to_improve?, blockers_encountered? }`

**Admin review request:** `{ task_id, quality_rating? (1-5), time_assessment? ('under'|'about_right'|'over'), estimated_time_future?, client_feedback_summary?, what_to_improve?, internal_notes? }`

---

## Gamification

### GET /gamification/me
Auth: any. Returns full journey data in one call.

**Response:** `{ total_xp, current_level, tasks_completed, on_time_count, total_tasks_with_deadline, avg_quality_rating, current_level_details, next_level, xp_to_next_level, categories_worked, badges: [{ ...badge, earned }], levels, ...adminStats? }`

### GET /gamification/levels
Auth: any. **Response:** All 12 XP levels.

### GET /gamification/badges
Auth: any. **Response:** All available badges.

### GET /gamification/badges/:userId
Auth: admin or self. **Response:** All badges with earned status.

### GET /gamification/xp/:userId
Auth: admin or self. **Response:** XP profile + current/next level details.

### GET /gamification/leaderboard
Auth: any. Admin: full list with ranks. Contractor: top 5 + own rank.

### POST /gamification/recalculate/:userId
Auth: admin. Recalculates all XP from source data, determines level, awards earned badges.

**XP rewards:** Task completed: 100, On time: 50, 5-star: 75, Under estimated: 25, Review completed: 10.

---

## Analytics (Admin Only)

All endpoints accept optional query params: `date_from`, `date_to`, `client_id`, `contractor_id`, `category_id`, `project_id`.

### GET /analytics/tasks
**Response:** `{ total_tasks, by_status, per_month, avg_time_in_status }`

### GET /analytics/turnaround
**Response:** `{ avg_days_overall, avg_by_priority, completed_per_month, trend }`

### GET /analytics/categories
**Response:** `{ tasks_per_category, avg_time_per_category, avg_quality_per_category }`

### GET /analytics/projects
**Response:** `[{ ...project, total_tasks, completed_tasks, completion_pct, total_time_minutes }]`

### GET /analytics/contractors
**Response:** `[{ ...contractor, total_xp, current_level, level_name, tasks_completed, on_time_pct, avg_quality, total_hours_minutes }]`

### GET /analytics/time
**Response:** `{ total_minutes, by_contractor, by_client, by_category, avg_minutes_per_task }`

### GET /analytics/reviews
**Response:** `{ total_reviews, closed_tasks, reviewed_tasks, completion_rate_pct, avg_difficulty, avg_quality }`

---

## Content Generation

### POST /generate/social
Auth: admin, contractor.

**Request:** `{ brand_profile_id, platform, format?, prompt }`
Platforms: instagram, linkedin, facebook, twitter. Formats: post, story, banner, carousel, cover.

### POST /generate/document
Auth: admin, contractor.

**Request:** `{ brand_profile_id, document_type?, prompt, key_points?, recipient? }`
Types: proposal, brief, one_pager, letterhead, report_cover.

### POST /generate/presentation
Auth: admin, contractor.

**Request:** `{ brand_profile_id, topic, audience?, num_slides?, key_points?, tone? }`
Tones: professional, casual, inspirational, technical, storytelling.

### POST /generate/ad
Auth: admin, contractor.

**Request:** `{ brand_profile_id, ad_format, headline?, cta_text?, offer?, prompt? }`
Formats: social_square, social_story, leaderboard, medium_rectangle, wide_skyscraper.

### GET /generate/history
Auth: any (role-filtered). Query: `?client_id=&content_type=&page=&limit=`

**Response:** `{ data: [...], pagination: { page, limit, total, pages } }`

### GET /generate/:id
Auth: any (access-checked).

### DELETE /generate/:id
Auth: admin or own. Deletes R2 files.

### POST /generate/attach-to-task
Auth: admin, contractor.

**Request:** `{ generation_id, task_id }`
Copies generated file to task attachments.

### GET /generate/stats
Auth: admin.

**Response:** `{ ai_assisted_tasks, total_generations }`

### GET /generate/content/:id (Public, no auth)
Returns generated content inline for preview.

### GET /generate/content/:id/download (Public, no auth)
Returns generated content as download.

---

## AI

### POST /ai/analyse-brief/:taskId
Auth: admin.

Sends task description to Workers AI for analysis. Returns summary, deliverables, suggested category, complexity, questions. Stores result in task's `ai_metadata` field.

---

## Search

### GET /search?q=&type=
Auth: any (role-scoped). Query min 2 chars. Types: tasks, users, projects, brand_guides.

Role scoping: admin sees all, client sees own tasks/projects, contractor sees assigned tasks.

**Response:** `{ tasks, users, projects, brand_guides, counts }`

---

## Support

### POST /support
Auth: any. **Request:** `{ subject, message }`

### GET /support
Auth: admin. Lists all messages with user info.

### PUT /support/:id
Auth: admin. **Request:** `{ status: 'open'|'resolved' }`

---

## Tool Links

### GET /tools
Auth: any. Returns active tool links ordered by display_order.

### POST /tools
Auth: admin. **Request:** `{ name, url, description?, icon_name? }`

### PUT /tools/:id
Auth: admin. **Request:** `{ name?, description?, url?, icon_name?, display_order?, is_active? }`

### DELETE /tools/:id
Auth: admin.
