# TackleBox — Technical Project Documentation

**Version:** 3.0  
**Date:** February 2026  
**Status:** Build-Ready  

---

## Table of Contents

1. [Master Roadmap (Phased)](#1-master-roadmap-phased)
2. [Phase 1 Sub-Phases & Checklist](#2-phase-1-sub-phases--checklist)
3. [Tech Stack & Architecture Principles](#3-tech-stack--architecture-principles)
4. [Component Architecture](#4-component-architecture)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [User Journeys](#6-user-journeys)
7. [Task & Workflow Specification](#7-task--workflow-specification)
8. [Projects & Campaigns](#8-projects--campaigns)
9. [Task Categories & Templates](#9-task-categories--templates)
10. [Client Brand Profiles](#10-client-brand-profiles)
11. [Time Tracking Specification](#11-time-tracking-specification)
12. [Post-Task Review & Reflection](#12-post-task-review--reflection)
13. [Gamification System](#13-gamification-system)
14. [Analytics Dashboard](#14-analytics-dashboard)
15. [Search](#15-search)
16. [Data Model (MVP-Level)](#16-data-model-mvp-level)
17. [Design & UI Requirements](#17-design--ui-requirements)
18. [Security, Validation & Error Handling](#18-security-validation--error-handling)
19. [Testing & Deployment Strategy](#19-testing--deployment-strategy)
20. [Cloudflare Cost Estimation](#20-cloudflare-cost-estimation)
21. [Future Updates Documentation Strategy](#21-future-updates-documentation-strategy)
22. [Handoff to Claude Code](#22-handoff-to-claude-code)

---

## 1. Master Roadmap (Phased)

TackleBox is built in sequential phases. Phase 1 is the pre-launch build — everything needed before showing the company owner. Later phases add authentication, notifications, AI expansion, education, and external use cases.

---

### Phase 1: Foundation (Pre-Launch MVP)

**Goal:** A complete, working platform that demonstrates the full vision: client portals with brand profiles, project-based task management with categories, contractor dashboards with gamification, admin analytics, time tracking, and post-task reviews. Premium feel, personalized approach, story-driven design.

Sub-phases:
- **1A:** Infrastructure, component system, database, auth placeholder
- **1B:** Task engine, projects, categories, all three portals, brand profiles
- **1C:** Time tracking, post-task reviews, templates, file storage + preview
- **1D:** Gamification, analytics, search, Workers AI test case, onboarding, polish

**Out of Scope:**
- OAuth (Google/Apple) — placeholder auth, abstracted for Phase 2
- Email notifications (Resend) — no-op stub only
- Payment / invoicing
- Third-party integrations beyond Cloudflare
- Mobile-native apps
- Public-facing / white-label modes

---

### Phase 2: Authentication & Notifications

**Goal:** Production auth + email notifications.

**Features:**
- Custom auth with Google/Apple OAuth
- Password login fallback
- Session management, token refresh, password reset
- Email notifications via Resend
- Notification preferences per user

---

### Phase 3: Automation & AI Expansion

**Goal:** Use Phase 1 data (time logs, reviews, task history) to power automation.

**Features:**
- AI-assisted task assignment
- Estimated time predictions from historical data
- Smart template suggestions
- Automated reminders and escalation
- AI brief analysis
- Advanced analytics: trends, forecasting

---

### Phase 4: Brand Education & Storytelling

**Goal:** Client-facing educational content and brand tools.

**Features:**
- Interactive brand guide builder
- Client learning modules
- Client gamification (brand understanding levels)
- Searchable content/asset library
- AI brand consistency checking

---

### Phase 5: HR / External Use Cases

**Goal:** HR workflows, invoicing, white-label, external API.

**Features:**
- Employee onboarding workflows
- Invoicing (from time tracking data)
- White-label portal
- External API access

---

## 2. Phase 1 Sub-Phases & Checklist

Each sub-phase is independently deployable. Do not start N+1 until N works.

---

### Phase 1A: Infrastructure & Foundation

- [ ] GitHub repo with folder structure (Section 4)
- [ ] Cloudflare Pages deploying
- [ ] Cloudflare Workers API deploying
- [ ] D1 database provisioned
- [ ] R2 bucket provisioned
- [ ] Environment config (dev/prod)
- [ ] Design tokens file (colours, spacing, typography — one file)
- [ ] Master component library with barrel export
- [ ] All base components: Button, Input, Textarea, Select, DatePicker, FileUpload, Modal, Toast, Badge, StatusBadge, Avatar, Card, DataTable, Spinner, Skeleton, EmptyState, PageHeader, Tabs, ProgressBar, Chart, TimeEntry, StarRating, SearchBar, FilePreview
- [ ] Layout components: Sidebar, MainLayout, AuthLayout
- [ ] Auth placeholder behind service abstraction
- [ ] Role detection + protected route middleware
- [ ] All database tables deployed (Section 16)
- [ ] API scaffolding: health check, CRUD structure
- [ ] Error handling patterns (API responses, frontend boundaries)
- [ ] File storage service (R2 abstraction)

**Verify:** Login with test account, see role-based empty dashboard, component library renders.

---

### Phase 1B: Core Platform

- [ ] API: full CRUD for Users, Tasks, Projects, Task Categories, Task Comments, Task Attachments, Task History, Brand Profiles, Brand Guides
- [ ] Task state machine with role guards
- [ ] Project CRUD: create, list, assign tasks to projects
- [ ] Task categories: admin-managed list, required on task creation
- [ ] Client Brand Profile: logo, colours, voice, values, mission — editable by Admin
- [ ] Client Portal: login, dashboard, task submission (with project + category selection), task list, task detail, brand profile viewer, brand guide viewer, profile
- [ ] Contractor Portal: login, dashboard, task detail, status updates, deliverable upload, profile, brand profile quick-access
- [ ] Admin Portal: login, dashboard, task management, user management, project management, category management, brand profile editor, brand guide upload
- [ ] Comments with visibility flag (all / internal)
- [ ] Attachments: upload on submission + deliverable upload
- [ ] Task history: audit log on every state change
- [ ] Role-based sidebar navigation
- [ ] Empty states, loading states, inline validation, toast notifications

**Verify:** Full task lifecycle works: Client submits (with project + category), Admin assigns, Contractor delivers, Admin approves and closes. Brand profile displays correctly.

---

### Phase 1C: Time Tracking, Reviews & Templates

- [ ] Time tracking UI: 15-minute increment manual entry on task detail
- [ ] Time log list + running total per task
- [ ] API: CRUD for time entries
- [ ] Post-task review trigger on Close
- [ ] Contractor reflection form
- [ ] Admin reflection form
- [ ] Reviews stored independently, visibility rules enforced
- [ ] Review completion status on task detail
- [ ] Task templates: Admin creates reusable templates per category
- [ ] Template selection on task creation (pre-fills title, description, priority)
- [ ] File preview: inline image/PDF preview on task detail and brand guides
- [ ] Chunked upload support for large files (up to 5 GB via R2 multipart)

**Verify:** Time entries log correctly. Reviews trigger and store independently. Templates pre-fill forms. Large files upload with progress. Images/PDFs preview inline.

---

### Phase 1D: Gamification, Analytics, Search & Polish

- [ ] Gamification engine: XP from tasks completed, on-time delivery, quality, speed
- [ ] Contractor stats page: XP bar, level, badges, leaderboard preview
- [ ] Leaderboard (Admin view)
- [ ] Badge definitions seeded
- [ ] Badge auto-award on qualifying events
- [ ] Analytics dashboard: task volume, turnaround, contractor performance, time summaries, category breakdowns, project progress
- [ ] Analytics charts (lightweight library)
- [ ] Global search: tasks (by title, description, category, project), users (by name, email), brand guides (by title)
- [ ] Search results page with filters
- [ ] Client onboarding flow: guided first-login experience (welcome, profile overview, how to submit, brand profile tour)
- [ ] Workers AI test case: one integration (task summary, categorisation, or brief analysis)
- [ ] AI service layer: `src/services/ai.js`
- [ ] Responsive pass (tablet + mobile)
- [ ] Accessibility pass (keyboard nav, focus, contrast, labels)
- [ ] Error states, 404, unauthorised pages
- [ ] Favicon, page titles, meta tags
- [ ] Full smoke test: every user journey

**Verify:** Platform is presentation-ready. Gamification shows progress. Analytics has real data. Search finds things. Onboarding guides new clients. Owner can see a complete product.

---

## 3. Tech Stack & Architecture Principles

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Cloudflare Pages (React + Vite) | Application hosting |
| Backend API | Cloudflare Workers | Serverless API |
| Database | Cloudflare D1 (SQLite) | Structured data |
| File Storage | Cloudflare R2 | Files, assets, brand guides |
| AI | Cloudflare Workers AI | Phase 1 test case + future |
| Email (Phase 2) | Resend | Transactional emails |
| Auth (Phase 2) | Custom + OAuth | User authentication |
| Repo | GitHub | Version control |

### Architecture Principles

**1. Single Source of Truth for UI** — All reusable components in master directory. No screen defines its own button, card, or input.

**2. Abstracted Services** — Auth, storage, email, AI, notifications each behind a service interface. Swap providers without touching UI or API logic.

**3. Additive-Only Changes** — New files, new columns (with defaults), new endpoints. Never restructure existing working code.

**4. Feature Isolation** — Each feature in its own directory. Cross-feature communication through shared services.

**5. Convention Over Configuration** — Naming, structure, and patterns established in 1A, followed forever.

**6. Data Is an Asset** — Time logs, reviews, categories, and history are datasets that feed future AI and pricing accuracy.

**7. Fail Gracefully** — Every API call can fail. Always show clear, actionable state. Never blank screens or infinite spinners.

### Environment Management

| Environment | Purpose | Database | URL |
|------------|---------|----------|-----|
| Development | Local | D1 local/test | localhost:5173 |
| Production | Live | D1 production | app.tacklebox.app |

All env-specific values in config files. Nothing hardcoded.

---

## 4. Component Architecture

### File Structure

```
src/
  components/
    ui/                        ← Master components (single source of truth)
      index.js                 ← Barrel export
      Button.jsx
      Input.jsx
      Textarea.jsx
      Select.jsx
      DatePicker.jsx
      FileUpload.jsx
      FilePreview.jsx          ← Inline image/PDF preview
      Modal.jsx
      Toast.jsx
      Badge.jsx
      StatusBadge.jsx
      Avatar.jsx
      Card.jsx
      DataTable.jsx
      Spinner.jsx
      Skeleton.jsx
      EmptyState.jsx
      PageHeader.jsx
      Tabs.jsx
      ProgressBar.jsx
      Chart.jsx
      TimeEntry.jsx
      StarRating.jsx
      SearchBar.jsx            ← Global search input
      ColourSwatch.jsx         ← Brand colour display
    layout/
      Sidebar.jsx
      MainLayout.jsx
      AuthLayout.jsx
    features/
      tasks/
        TaskCard.jsx
        TaskDetail.jsx
        TaskForm.jsx
        TaskList.jsx
        TaskHistory.jsx
        TaskTimeLogs.jsx
        TaskReviewForm.jsx
        TaskReviewSummary.jsx
      projects/
        ProjectCard.jsx
        ProjectDetail.jsx
        ProjectForm.jsx
        ProjectList.jsx
      brand/
        BrandProfileView.jsx
        BrandProfileEditor.jsx
        BrandGuideCard.jsx
        BrandGuideViewer.jsx
      templates/
        TemplateForm.jsx
        TemplateList.jsx
        TemplateSelector.jsx
      users/
        UserTable.jsx
        UserForm.jsx
      gamification/
        XPBar.jsx
        BadgeCard.jsx
        BadgeGrid.jsx
        Leaderboard.jsx
        ContractorStats.jsx
      analytics/
        AnalyticsDashboard.jsx
        StatCard.jsx
        TaskVolumeChart.jsx
        TurnaroundChart.jsx
        CategoryBreakdown.jsx
        ContractorPerformanceTable.jsx
        TimeTrackingSummary.jsx
        ProjectProgressChart.jsx
      onboarding/
        OnboardingWizard.jsx
        WelcomeStep.jsx
        ProfileStep.jsx
        SubmitTaskStep.jsx
        BrandTourStep.jsx
      search/
        SearchResults.jsx
        SearchFilters.jsx
  services/
    auth.js
    storage.js
    ai.js
    notifications.js           ← No-op Phase 1
    gamification.js
    analytics.js
    search.js
  config/
    tokens.js                  ← Design tokens
    constants.js               ← Statuses, priorities, categories
    env.js
  hooks/
    useAuth.js
    useToast.js
    useTasks.js
    useProjects.js
    useTimeTracking.js
    useAnalytics.js
    useSearch.js
    useOnboarding.js
  utils/
    validators.js
    formatters.js
    permissions.js
```

### Rules

1. All imports from barrel file `@/components/ui`
2. Consistent prop API: `variant`, `size`, `disabled`, `className`
3. Design tokens are the single styling source — no raw hex values
4. Feature components compose UI components — never define own styling
5. No inline styles on shared components
6. New components go to master file first, then used

---

## 5. User Roles & Permissions

| Permission | Client | Contractor | Admin |
|-----------|--------|-----------|-------|
| View own tasks | ✓ | ✓ | ✓ |
| View all tasks | ✗ | ✗ | ✓ |
| Submit new task | ✓ | ✗ | ✓ |
| Update task status | ✗ | ✓ (assigned) | ✓ (any) |
| Assign tasks | ✗ | ✗ | ✓ |
| Upload deliverables | ✗ | ✓ | ✓ |
| Add comments | ✓ (own) | ✓ (assigned) | ✓ (any) |
| Log time | ✗ | ✓ (assigned) | ✓ (any) |
| Complete review | ✗ | ✓ (own) | ✓ (own) |
| View reviews | ✗ | Own only | All |
| View brand profile | ✓ (own) | ✓ (assigned client) | ✓ (all) |
| Edit brand profile | ✗ | ✗ | ✓ |
| View brand guides | ✓ | ✓ | ✓ |
| Upload brand guides | ✗ | ✗ | ✓ |
| View/create projects | ✓ (own) | ✗ | ✓ |
| Manage categories | ✗ | ✗ | ✓ |
| Manage templates | ✗ | ✗ | ✓ |
| View gamification | ✗ | ✓ (own) | ✓ (all) |
| View analytics | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| Use search | ✓ (own data) | ✓ (own data) | ✓ (all) |

---

## 6. User Journeys

---

### Client Journey 1: First Login & Onboarding

**Entry Point:** Client receives credentials from Admin.

1. Client logs in → **Onboarding Wizard** triggers (first login only):
   - **Step 1 — Welcome**: "Welcome to TackleBox, [Name]. Let's get you set up." Brief explanation of the platform.
   - **Step 2 — Your Brand Profile**: Shows their brand profile (logo, colours, voice, values) — "This is how we understand your brand. Everything we create starts here."
   - **Step 3 — How to Submit Work**: Quick walkthrough of the task form with example.
   - **Step 4 — Your Brand Hub**: Tour of brand guides and assets. "Everything you need in one place."
   - "You're all set" → redirects to Dashboard.
2. Subsequent logins skip onboarding → straight to **Dashboard**:
   - Welcome message with name and company
   - Summary cards: active tasks, awaiting feedback, recently completed
   - Projects list with progress indicators
   - Task list with status badges
   - "New Task" button
   - Sidebar: Dashboard, Projects, My Tasks, Brand Hub, Profile
3. If no tasks: Empty State with call-to-action.

**Exit Point:** Submit a task or browse Brand Hub.

---

### Client Journey 2: Submitting a Task

**Entry Point:** Client clicks "New Task."

1. **Task Submission Form**:
   - **Project** (required, dropdown of client's projects — or "Create New Project")
   - **Category** (required, dropdown: Logo Design, Social Media, Brand Strategy, Packaging, Print, Digital, Other...)
   - **Template** (optional — if a template exists for this category, it appears: "Use template: Social Media Post Brief?" Clicking it pre-fills title, description, and priority)
   - **Title** (required, pre-filled if template selected)
   - **Description** (required, pre-filled if template selected)
   - **Priority** (required, dropdown: Low / Medium / High / Urgent)
   - **Deadline** (optional, date picker)
   - **Attachments** (optional, multi-file, drag-and-drop)
2. Inline validation. Submit → loading → Toast → redirect to Task Detail.
3. Task shows: all submitted data, status **Submitted** (grey), timeline, attachments with **inline preview** for images/PDFs.

**Exit Point:** Dashboard or submit another.

---

### Client Journey 3: Tracking Tasks & Projects

**Entry Point:** Dashboard or "Projects" in sidebar.

1. **Projects view**: list of projects with progress bars (X of Y tasks complete), status summary.
2. Click project → **Project Detail**: all tasks in this project, filtered/sorted.
3. Click task → **Task Detail**: status, timeline, attachments (with preview), comments, deliverables.
4. Client can comment for feedback.
5. Closed tasks show final deliverables highlighted.

**Exit Point:** Dashboard.

---

### Client Journey 4: Brand Hub

**Entry Point:** "Brand Hub" in sidebar.

1. **Brand Profile** at top: company logo, brand colours (visual swatches), voice description, values, mission statement, target audience. This feels personalized — the platform *knows* them.
2. **Brand Guides** below: grid of guide cards with thumbnails. Click → inline viewer with PDF preview.
3. Download option on all guides.

**Exit Point:** Dashboard.

---

### Contractor Journey 1: Dashboard

**Entry Point:** Login.

1. **Dashboard**:
   - Gamification summary: XP bar, level badge, quick stats
   - Summary cards: assigned, in progress, awaiting action
   - Task list sorted by priority → deadline
   - Sidebar: Dashboard, My Tasks, Brand Guides, My Stats, Profile
2. No tasks → Empty State.

---

### Contractor Journey 2: Starting Work

**Entry Point:** Click Assigned task.

1. **Task Detail**:
   - Brief: title, description, priority, deadline
   - **Category badge** (e.g., "Logo Design")
   - **Project name** (clickable, shows other tasks in same project for context)
   - Client name and company
   - **Brand Profile quick-access**: "View [Client]'s Brand Profile" link → shows colours, voice, values inline or in modal. Contractor understands the brand before starting.
   - Client attachments with **inline preview**
   - Brand guides linked to client
   - "Start Work" button
   - Time Tracking section (empty)
2. Click "Start Work" → In Progress. Time tracking activates.

---

### Contractor Journey 3: Logging Time

1. "Log Time" → form: Date (today default), Duration (15-min dropdown), Description (required).
2. Save → entry in list. Running total visible.
3. Multiple entries per day. Edit/delete own entries.

---

### Contractor Journey 4: Submitting Deliverables

1. Upload files → preview inline for images/PDFs.
2. Add comment. "Submit for Review" (requires ≥1 file).
3. Status → Review. Toast confirmation.

---

### Contractor Journey 5: Handling Revisions

1. Task in Revision → open detail. Admin feedback pinned.
2. "Resume Work" → In Progress. Log more time. Upload revised files. Resubmit.

---

### Contractor Journey 6: Post-Task Review

1. Task closed → "1 review pending" on Dashboard.
2. Reflection form: total time (pre-filled), difficulty (1–5), what went well, what to improve, blockers.
3. Submit → checkmark. Cannot see Admin's review.

---

### Contractor Journey 7: Gamification Stats

1. "My Stats" → XP bar, level, stats grid, badges earned/available, leaderboard preview (rank + top 5).

---

### Admin Journey 1: Dashboard

1. System-wide overview: tasks by status, active clients/contractors, quick stats, activity feed, pending reviews alert.
2. Full task list with filters: status, client, contractor, priority, project, category, date range.
3. Sidebar: Dashboard, All Tasks, Projects, Users, Brand Profiles, Templates, Categories, Analytics, Settings.

---

### Admin Journey 2: Assigning Tasks

1. Open Submitted task → review brief, category, project, client brand profile.
2. "Assign" → contractor dropdown: name, task count, level/XP, skills.
3. Confirm → Assigned. Internal note option.

---

### Admin Journey 3: Reviewing Work

1. Filter by Review status.
2. Open task: brief, deliverables (inline preview), contractor comment, time summary, history.
3. Approve → Approved → Close → triggers reviews. Or Request Revision (required feedback).

---

### Admin Journey 4: Post-Task Review

1. Close task → prompted for reflection.
2. Form: quality (1–5), time assessment (under/right/over), estimated future time (15-min dropdown), client feedback, what to improve, internal notes.
3. Can see both reviews side by side.

---

### Admin Journey 5: Managing Projects

1. "Projects" → all projects across all clients. Filter by client, status.
2. Create project: name, description, client, status (active/complete/on-hold).
3. Project detail: all tasks, progress bar, time totals, category breakdown.

---

### Admin Journey 6: Managing Templates & Categories

1. **Categories**: list of task types. Add/edit/deactivate. Each has: name, description, default priority, icon.
2. **Templates**: create reusable briefs per category. Each has: name, category, default title, description, priority, checklist items. Templates appear as options during task creation.

---

### Admin Journey 7: Managing Brand Profiles

1. "Brand Profiles" or click into a client → Brand Profile tab.
2. **Brand Profile Editor**: logo upload, brand colours (hex values with visual swatches), voice/tone description, core values, mission statement, target audience, dos and don'ts.
3. This profile is what contractors see before starting work. It's the personalized, story-driven foundation.

---

### Admin Journey 8: Analytics

1. Analytics Dashboard (Section 14): task volume, turnaround, contractor performance, time tracking, **category breakdowns** (which types of work take longest?), **project progress**, review insights.
2. Filters: date range, client, contractor, category, project.

---

### Admin Journey 9: Managing Users

1. User table: name, email, role, status, created, task count.
2. Add/edit/deactivate users. Search by name or email.

---

## 7. Task & Workflow Specification

### Task Lifecycle States

| State | Description | Set By |
|-------|-------------|--------|
| Submitted | Created. Awaiting assignment. | Client/Admin |
| Assigned | Assigned to Contractor. | Admin |
| In Progress | Contractor working. Time tracking active. | Contractor |
| Review | Deliverables submitted. | Contractor |
| Revision | Changes requested. | Admin |
| Approved | Deliverables approved. | Admin |
| Closed | Complete. Triggers reviews. | Admin |
| Cancelled | Cancelled. | Admin |

### Transitions

| From | To | By | Conditions |
|------|----|-------|------------|
| Submitted | Assigned | Admin | Contractor selected |
| Submitted | Cancelled | Admin | — |
| Assigned | In Progress | Contractor | Starts work |
| Assigned | Cancelled | Admin | — |
| In Progress | Review | Contractor | ≥1 deliverable |
| In Progress | Cancelled | Admin | — |
| Review | Approved | Admin | Approves |
| Review | Revision | Admin | Feedback required |
| Revision | In Progress | Contractor | Resumes |
| Approved | Closed | Admin | Triggers reviews |

### Task Data

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Auto | — |
| title | String (255) | Yes | — |
| description | Text | Yes | Full brief |
| status | Enum | Auto | Lifecycle state |
| priority | Enum | Yes | low, medium, high, urgent |
| category_id | FK → Categories | Yes | What type of work |
| project_id | FK → Projects | Yes | Parent project |
| client_id | FK → Users | Yes | Owning client |
| contractor_id | FK → Users | No | Assigned (nullable) |
| created_by | FK → Users | Auto | Decoupled from client_id |
| template_id | FK → Templates | No | Template used (nullable) |
| deadline | Date | No | — |
| ai_metadata | JSON | No | Workers AI output |
| created_at | Timestamp | Auto | — |
| updated_at | Timestamp | Auto | — |

---

## 8. Projects & Campaigns

### Purpose

Projects group related tasks under a single umbrella. A "Brand Refresh" project might contain tasks for logo design, social templates, business cards, and brand guidelines — all trackable as one unit.

### Project Fields

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Project name |
| description | Text | Brief / scope |
| client_id | FK → Users | Owning client |
| status | Enum | active, on_hold, completed, archived |
| created_by | FK → Users | Admin who created |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Rules
- Every task belongs to a project
- Clients can see their own projects only
- Admin can see all projects
- Project progress = tasks completed / total tasks
- Projects can be filtered and sorted in dashboard views
- A client can have multiple active projects

---

## 9. Task Categories & Templates

### Categories

Admin-defined task types that enable structured analytics and accurate time/pricing data.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | e.g., "Logo Design", "Social Media" |
| description | Text | What this category covers |
| default_priority | Enum | Suggested priority |
| icon | String | Icon reference |
| is_active | Boolean | Can be deactivated |
| created_at | Timestamp | Auto |

**Initial categories** (Admin can add more):
Logo Design, Social Media, Brand Strategy, Packaging, Print Design, Digital Design, Illustration, Photography, Copywriting, Web Design, Other

### Templates

Reusable task briefs that speed up submissions and ensure consistency.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | String | Template name |
| category_id | FK → Categories | Associated category |
| default_title | String | Pre-filled title |
| default_description | Text | Pre-filled brief |
| default_priority | Enum | Pre-filled priority |
| checklist | JSON | Optional checklist items |
| created_by | FK → Users | Admin who created |
| is_active | Boolean | — |
| created_at | Timestamp | Auto |

### How Templates Work
1. Client selects a category on task form
2. If templates exist for that category, a "Use template" dropdown appears
3. Selecting a template pre-fills title, description, and priority
4. Client can edit all pre-filled values
5. The task stores `template_id` for analytics (which templates are used most?)

---

## 10. Client Brand Profiles

### Purpose

This is the premium, personalized heart of TackleBox. Every client has a living brand profile that tells contractors who this client is, what their brand sounds like, and what they care about. It replaces the generic "here's a PDF" approach with structured, accessible brand context.

### Brand Profile Fields

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| client_id | FK → Users | One per client |
| logo_path | String | R2 path to logo file |
| brand_colours | JSON | Array of {name, hex} — e.g., [{"name": "Primary", "hex": "#0F7173"}] |
| voice_tone | Text | How the brand speaks |
| core_values | Text | What the brand believes |
| mission_statement | Text | Why the brand exists |
| target_audience | Text | Who they serve |
| dos | Text | Brand usage dos |
| donts | Text | Brand usage don'ts |
| additional_notes | Text | Anything else (nullable) |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Rules
- One brand profile per client (1:1 relationship)
- Created and edited by Admin only
- Visible to: Client (read-only), Contractor (read-only, for assigned tasks), Admin (read/write)
- Displayed on: Client's Brand Hub, Task Detail view (quick-access for Contractor), Admin's client management
- Brand colours render as visual swatches, not just hex codes
- Logo displays at actual size/quality

### Brand Guides (Separate, Linked)

Brand guides (PDFs, images) remain as uploaded files linked to the client. The Brand Profile is the structured summary; Brand Guides are the detailed documents. Both appear together in the Brand Hub.

---

## 11. Time Tracking Specification

### Design
- Manual entry only, 15-minute increments
- Multiple entries per task per day
- Editable by author (contractor) and Admin
- Running total always visible

### Duration Options

0:15, 0:30, 0:45, 1:00 ... up to 8:00 in 15-minute steps. Max 8 hours per entry.

### Validation
- Duration: multiple of 15, range 15–480
- Date: not in future, not before task creation
- Description: required, min 5 chars
- Only assigned contractor or Admin can log

---

## 12. Post-Task Review & Reflection

### Trigger
Task moves to **Closed** → both Contractor and Admin prompted independently.

### Contractor Form
- Total time (pre-filled, editable) | Difficulty (1–5) | What went well | What to improve | Blockers

### Admin Form
- Quality (1–5) | Time assessment (under/right/over) | Estimated future time (15-min dropdown) | Client feedback | What to improve | Internal notes (hidden from contractor)

### Visibility
- Contractor: own only. Admin: both side by side. Client: none.
- Immutable once submitted.

### Data Value
- Pricing accuracy from time + estimated future time
- Quality tracking per contractor
- Difficulty baselines
- Process improvement themes
- Phase 3 AI predictions

---

## 13. Gamification System

### Scoring Dimensions

| Dimension | Measures | Calculation |
|-----------|---------|-------------|
| Tasks Completed | Volume | +XP per close |
| On-Time Delivery | Deadlines | +Bonus if on/before deadline |
| Client Satisfaction | Quality | From Admin quality_rating |
| Speed vs Estimated | Efficiency | Actual vs estimated_time_future |

### Levels
- XP thresholds stored in database (configurable)
- Level names/icons configurable

### Badges (Initial)

| Badge | Criteria |
|-------|----------|
| First Catch | Complete first task |
| On the Clock | 100% on-time, 5 consecutive |
| Five Star | 5-star quality rating |
| Speed Demon | 3 tasks under estimated |
| Streak Master | 10 tasks, no revisions |
| Heavy Lifter | 100+ hours logged |
| Feedback Champ | 10 consecutive reviews completed |

Badges in database — new badges = new row, no code change.

### Leaderboard
- Admin: full ranking by XP
- Contractor: own rank + top 5

---

## 14. Analytics Dashboard

### Sections

**1. Task Overview** — volume over time, status distribution, avg time per state

**2. Turnaround** — created→closed avg (overall + per priority), trend, completed per period

**3. Category Breakdown** — tasks per category, avg time per category, avg quality per category. *This is the pricing accuracy engine.*

**4. Project Progress** — projects by completion %, time invested per project, active vs completed

**5. Contractor Performance** — table: name, tasks, on-time %, quality avg, time avg, level

**6. Time Tracking** — total hours, hours by contractor/client/category, avg hours per task type

**7. Review Insights** — completion rate, avg difficulty, avg quality

### Filters
- Date range, client, contractor, category, project

---

## 15. Search

### Scope
- **Tasks**: title, description, category name, project name, status
- **Users**: name, email
- **Brand Guides**: title, client name
- **Projects**: name, client name

### Behaviour
- Global search bar in header (always visible)
- Typing triggers debounced search (300ms)
- Results grouped by type with counts
- Click result → navigate to detail view
- Respects role permissions: clients only see own data, contractors see assigned data, admin sees everything
- Empty state: "No results for [query]"

### Implementation
- API endpoint: `GET /api/v1/search?q=...&type=...`
- Server-side search using D1 `LIKE` queries (Phase 1)
- Future: full-text search index if needed for scale

---

## 16. Data Model (MVP-Level)

### Users

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| email | String | Unique |
| password_hash | String | Bcrypt/Argon2 |
| role | Enum | client, contractor, admin |
| display_name | String | Full name |
| company | String | Nullable |
| avatar_url | String | Nullable |
| is_active | Boolean | Soft delete |
| has_completed_onboarding | Boolean | Default false |
| auth_provider | String | "local" (Phase 1) |
| auth_provider_id | String | Nullable (Phase 2) |
| storage_used_bytes | Integer | Running file storage total |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Projects

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | Project name |
| description | Text | Scope/brief |
| client_id | FK → Users | Owning client |
| status | Enum | active, on_hold, completed, archived |
| created_by | FK → Users | Admin |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Task Categories

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | Category name |
| description | Text | — |
| default_priority | Enum | Nullable |
| icon | String | Nullable |
| is_active | Boolean | — |
| created_at | Timestamp | Auto |

### Task Templates

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | Template name |
| category_id | FK → Categories | — |
| default_title | String | Pre-fill |
| default_description | Text | Pre-fill |
| default_priority | Enum | Pre-fill |
| checklist | JSON | Optional items |
| created_by | FK → Users | Admin |
| is_active | Boolean | — |
| created_at | Timestamp | Auto |

### Tasks

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| title | String (255) | — |
| description | Text | Full brief |
| status | Enum | 8 states |
| priority | Enum | low, medium, high, urgent |
| category_id | FK → Categories | Required |
| project_id | FK → Projects | Required |
| client_id | FK → Users | — |
| contractor_id | FK → Users | Nullable |
| created_by | FK → Users | Decoupled |
| template_id | FK → Templates | Nullable |
| deadline | Date | Nullable |
| ai_metadata | JSON | Nullable |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Task Comments

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| task_id | FK → Tasks | — |
| user_id | FK → Users | Author |
| content | Text | — |
| visibility | Enum | all, internal |
| created_at | Timestamp | Auto |

### Task Attachments

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| task_id | FK → Tasks | — |
| uploaded_by | FK → Users | — |
| file_name | String | Original name |
| file_path | String | R2 key |
| file_type | String | MIME |
| file_size | Integer | Bytes |
| upload_type | Enum | submission, deliverable |
| created_at | Timestamp | Auto |

### Task History

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| task_id | FK → Tasks | — |
| changed_by | FK → Users | — |
| from_status | Enum | — |
| to_status | Enum | — |
| note | Text | Nullable |
| created_at | Timestamp | Auto |

### Time Entries

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| task_id | FK → Tasks | — |
| user_id | FK → Users | — |
| date | Date | Work date |
| duration_minutes | Integer | Multiple of 15 |
| description | String | Required |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Task Reviews

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| task_id | FK → Tasks | — |
| reviewer_id | FK → Users | — |
| reviewer_role | Enum | contractor, admin |
| quality_rating | Integer | 1–5, Admin (nullable) |
| difficulty_rating | Integer | 1–5, Contractor (nullable) |
| time_assessment | Enum | under, about_right, over. Admin (nullable) |
| estimated_time_future | Integer | Minutes. Admin (nullable) |
| total_time_actual | Integer | Minutes. Contractor (nullable) |
| what_went_well | Text | Nullable |
| what_to_improve | Text | Nullable |
| blockers_encountered | Text | Contractor (nullable) |
| client_feedback_summary | Text | Admin (nullable) |
| internal_notes | Text | Admin only (nullable) |
| created_at | Timestamp | Auto |

### Brand Profiles

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| client_id | FK → Users | One per client |
| logo_path | String | R2 key |
| brand_colours | JSON | [{name, hex}] |
| voice_tone | Text | Nullable |
| core_values | Text | Nullable |
| mission_statement | Text | Nullable |
| target_audience | Text | Nullable |
| dos | Text | Nullable |
| donts | Text | Nullable |
| additional_notes | Text | Nullable |
| created_at | Timestamp | Auto |
| updated_at | Timestamp | Auto |

### Brand Guides

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| client_id | FK → Users | — |
| title | String | — |
| file_path | String | R2 key |
| file_type | String | MIME |
| uploaded_by | FK → Users | Admin |
| created_at | Timestamp | Auto |

### Contractor XP

| Field | Type | Notes |
|-------|------|-------|
| user_id | FK → Users | PK |
| total_xp | Integer | Running total |
| current_level | Integer | From thresholds |
| tasks_completed | Integer | Count |
| on_time_count | Integer | — |
| total_tasks_with_deadline | Integer | For % |
| avg_quality_rating | Float | Rolling avg |
| updated_at | Timestamp | Auto |

### XP Levels

| Field | Type | Notes |
|-------|------|-------|
| level | Integer | PK |
| name | String | e.g., "Rookie" |
| xp_threshold | Integer | XP required |
| icon | String | Nullable |

### Badges

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | — |
| description | Text | — |
| criteria_type | String | — |
| criteria_value | Integer | Threshold |
| icon | String | Nullable |

### User Badges

| Field | Type | Notes |
|-------|------|-------|
| user_id | FK → Users | — |
| badge_id | FK → Badges | — |
| awarded_at | Timestamp | — |

**Total: 18 tables**

---

## 17. Design & UI Requirements

All components from master system. Structure, not styling.

### Global Layout
- Sidebar (persistent desktop, collapsible mobile), main content, header with search bar + avatar + logout
- Sidebar varies by role

### Dashboard
- Summary cards (clickable filters), task list, quick actions
- Contractor: gamification summary (XP bar, level)
- Client: project progress cards
- Admin: system overview + pending alerts

### Task Detail
- Tabbed: Overview | Attachments (with inline preview) | Comments | Time Log | Reviews | History
- Brand Profile quick-access (contractor/admin view)
- Action buttons per role/status

### File Preview
- Images: inline thumbnail with click-to-expand
- PDFs: embedded viewer or first-page preview
- Other files: icon + download link

### Brand Profile View
- Logo display, colour swatches (visual), voice/tone section, values, mission, audience, dos/don'ts
- Clean, magazine-style layout — this should feel premium

### Search
- Search bar in header, always visible
- Dropdown results as you type, grouped by type
- Full results page on Enter

### Onboarding
- Step-by-step wizard (4 steps), progress indicator
- Skippable but encouraged
- Only shows on first login

---

## 18. Security, Validation & Error Handling

### File Upload Rules

| Rule | Value |
|------|-------|
| Max file size (single) | 5 GB |
| Max files per upload | 10 |
| Allowed (attachments) | .pdf, .png, .jpg, .jpeg, .gif, .svg, .ai, .psd, .doc, .docx, .xls, .xlsx, .zip |
| Allowed (brand guides) | .pdf, .png, .jpg, .jpeg |
| Filename handling | Sanitise, strip special chars, prepend UUID |

> Files approaching 5 GB must use chunked/multipart uploads (R2 native). Progress bars required for large uploads.

### Client Storage Tiers (Future Billing)

Phase 1 tracks per-client storage usage (no enforcement). Future tiers:

| Tier | Allowance | Use Case |
|------|-----------|----------|
| Starter | 50 GB | Small clients, light assets |
| Standard | 100 GB | Mid-size, regular flow |
| Professional | 250 GB | High-volume, large assets |
| Enterprise | 1,000 GB | Full-service, heavy media |

Pay for what you use. `storage_used_bytes` on Users table updates on upload/delete.

### Input Validation (Client + Server)

| Field | Rules |
|-------|-------|
| Email | Valid format, unique, max 255 |
| Password | Min 8, 1 upper, 1 lower, 1 number |
| Task title | Required, 3–255 chars, XSS sanitised |
| Task description | Required, min 10 chars |
| Comment | Required, 1–5000 chars |
| Time entry description | Required, 5–500 chars |
| Time duration | Multiple of 15, 15–480 |
| Dates | No future (time entries), no past (deadlines) |

### API Security
- Auth token required (except login)
- Role-based permission checks per request
- Rate limiting: 100 req/min/user
- Parameterised queries (D1)
- CORS: frontend domain only
- UUIDs for all IDs
- Server-side file validation

### Error Strategy
- Consistent API format: `{ success, data/error }`
- Global error boundary
- Toast for recoverable errors
- Inline form validation
- Network failure banner with retry
- 30s API timeout, 120s file upload timeout
- Never raw errors or infinite spinners

---

## 19. Testing & Deployment Strategy

### Testing (Phase 1)
- Manual smoke tests per sub-phase
- API endpoint validation (CRUD, state transitions, permissions)
- Form validation edge cases
- Role-based access testing (every endpoint/view as each role)
- File upload testing (max size, wrong type, multi-file)
- Search testing (by role, empty results)
- Responsive: desktop (1920), tablet (768), mobile (375)

### Deployment

```
Local dev → push to GitHub → Production (auto-deploy from main)
```

- Branches: `main` (prod), feature branches
- Feature branches → `main` via PR after local testing
- Migrations: sequential, idempotent, run on deploy
- Rollback: revert commit + redeploy

### Backup
- D1: Cloudflare automatic backups
- R2: enable versioning
- Admin export endpoint (JSON dump)

---

## 20. Cloudflare Cost Estimation

### Pricing Summary (as of early 2026)

| Service | Free Tier | Paid Plan (Workers $5/mo) | Overage |
|---------|-----------|--------------------------|---------|
| **Workers** | 100K req/day | 10M req/month included | $0.30/million |
| **Pages** | Unlimited static | Functions billed as Workers | — |
| **D1** | 5M reads/day, 100K writes/day, 5 GB | 25B reads, 50M writes, 5 GB included | $0.001/M reads, $1.00/M writes, $0.75/GB |
| **R2 Storage** | 10 GB | $0.015/GB-month | — |
| **R2 Class A ops** | 1M/month | $4.50/million | — |
| **R2 Class B ops** | 10M/month | $0.36/million | — |
| **R2 Egress** | Free | Free | Always free |
| **Workers AI** | 10K Neurons/day | $0.011/1K Neurons | — |

### Scenario Estimates

**Early Phase 1 (5 users, light usage)**

| Service | Usage | Cost |
|---------|-------|------|
| Workers Paid Plan | Base | $5.00 |
| D1 | Well within included | $0.00 |
| R2 Storage | ~5 GB | Free (under 10 GB) |
| R2 Operations | Minimal | Free |
| Workers AI | Light testing | Free |
| **Total** | | **~$5/month** |

**Growth Phase (20 users, 50 tasks/month, 50 GB storage)**

| Service | Usage | Cost |
|---------|-------|------|
| Workers Paid Plan | Base | $5.00 |
| D1 | Within 25B reads | $0.00 |
| R2 Storage | 50 GB | $0.60 (40 GB × $0.015) |
| R2 Operations | ~500K Class A, ~2M Class B | Free |
| Workers AI | Moderate | ~$1–2 |
| **Total** | | **~$7–8/month** |

**Scale Phase (50+ users, 200 tasks/month, 250 GB storage)**

| Service | Usage | Cost |
|---------|-------|------|
| Workers Paid Plan | Base | $5.00 |
| D1 | Within included | $0.00 |
| R2 Storage | 250 GB | $3.60 |
| R2 Operations | ~2M Class A, ~10M Class B | ~$5–6 |
| Workers AI | Heavy | ~$5–10 |
| **Total** | | **~$20–25/month** |

### Key Cost Advantages
- **Zero egress fees** on R2 — file downloads never cost extra regardless of volume
- **D1 is extremely cheap** — 25 billion row reads included in the $5 plan
- **Pages static hosting is free** — only API calls (Workers) incur cost
- **Workers AI included free tier** — 10K Neurons/day covers light Phase 1 testing

### Cost Optimisation Tips
- Index D1 tables properly to reduce row reads
- Use R2 presigned URLs for direct client uploads (bypass Workers for large files)
- Cache frequently-accessed data (brand profiles, categories) at the edge
- Monitor usage via Cloudflare dashboard — set billing alerts

---

## 21. Future Updates Documentation Strategy

### Feature Spec Required
- Name + description, phase, affected entities, new entities, permission changes, dependencies, out-of-scope

### Database: Additive Only
- New columns with defaults, new tables. Never rename/remove. Sequential idempotent migrations.

### API: Versioned
- Phase 1 under `/api/v1/`. Breaking changes → new version.

### Components: Extended, Never Deleted

### AI: Service Pattern
- `ai_metadata` on Tasks, `services/ai.js` as entry point, UI → API → AI → store → display

### Notifications: Stub Ready
- State changes emit events, `services/notifications.js` no-op → Resend

### Gamification: Config-Driven
- XP, thresholds, badges all in database. Tune without code.

---

## 22. Handoff to Claude Code

### Build Readiness Checklist

- [x] Master Roadmap with scope per phase
- [x] Phase 1 in 4 sub-phases with checklists
- [x] Tech stack: Cloudflare Pages/Workers/D1/R2 + GitHub
- [x] Component architecture with master system
- [x] Roles & Permissions (20 permissions × 3 roles)
- [x] User journeys: Client × 4, Contractor × 7, Admin × 9
- [x] Task lifecycle: 8 states, 10 transitions
- [x] Projects & campaigns system
- [x] Task categories + templates
- [x] Client brand profiles (structured, living)
- [x] Time tracking: manual, 15-min increments
- [x] Post-task reviews: dual independent
- [x] Gamification: 4 dimensions, 7 badges, XP/levels
- [x] Analytics: 7 sections with category + project breakdowns
- [x] Global search specification
- [x] Client onboarding flow
- [x] File preview (inline image/PDF)
- [x] Data model: 18 tables
- [x] Security + validation + error handling
- [x] Testing + deployment
- [x] Cost estimation
- [x] Future update patterns

### Build Order

1. GitHub repo + Cloudflare setup
2. Folder structure + master components
3. Design tokens
4. Base UI components + barrel export
5. Layout components
6. Database schema (18 tables)
7. Auth placeholder + service abstraction
8. API: Users + Categories + Projects CRUD
9. API: Tasks CRUD + state machine
10. Client Portal views
11. Contractor Portal views (with brand profile access)
12. Admin Portal views (task mgmt, user mgmt, project mgmt, category mgmt)
13. Brand Profile editor + viewer
14. Comments + Attachments (R2) + file preview
15. Brand guide upload + viewer
16. Templates: CRUD + selector on task form
17. Time tracking UI + API
18. Post-task reviews + API
19. Gamification engine
20. Analytics dashboard (with category + project breakdowns)
21. Global search
22. Client onboarding wizard
23. Workers AI test case
24. Responsive pass
25. Accessibility pass
26. Error states + polish
27. Smoke test: every journey

### What Must NOT Be Built

- No OAuth — placeholder auth, abstracted service
- No Resend — no-op stub
- No payment/invoicing
- No integrations outside Cloudflare
- No native apps
- No public/white-label
- No AI beyond one test case

### Assumptions to Avoid

| Assumption | Why |
|-----------|-----|
| "One role per user" | May become multi-role |
| "Tasks always client-initiated" | Admins create too |
| "Auth stays password-based" | OAuth Phase 2 |
| "UI won't go public" | White-label Phase 5 |
| "File storage is simple" | R2 behind service |
| "States are final" | Extensible enum |
| "Inline styles OK" | Master components + tokens only |
| "Gamification values fixed" | All configurable |
| "Time tracking is display-only" | Feeds analytics, AI, pricing |
| "Reviews optional" | Tracked, prompted, gamified |
| "Categories won't change" | Admin-managed, soft-deletable |
| "One project per client" | Multiple active projects supported |

**Each step independently deployable. Do not start N+1 until N works.**
