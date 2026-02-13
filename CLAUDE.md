# CLAUDE.md -- TackleBox Project Guide

**Read this file before every coding session.** It contains critical rules that prevent common bugs.

## Project Overview

TackleBox is a creative design consultancy platform connecting admins, clients, and contractors (called "Campers" in the UI). It manages brand profiles, task workflows, AI content generation, gamification, and time tracking. The platform is deployed on Cloudflare infrastructure.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7, React Router 7, Recharts 3 |
| Backend | Cloudflare Workers + Hono-style routing (raw fetch handler) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (file uploads, brand guides, generated content) |
| AI | Cloudflare Workers AI (Llama 3.1 8B for text, Flux for images) |
| Icons | Lucide React (only icon library allowed) |
| Deployment | Cloudflare Pages (frontend), Cloudflare Workers (API) |

## Critical Rules

### Design System
- **Black and white only.** No colour. The entire UI uses an inverted neutral scale (50=darkest, 900=lightest/white). All values come from `@/config/tokens`.
- **No emojis anywhere** in the codebase or UI.
- **Lucide icons only.** Never use any other icon library.
- **Inline styles only.** No CSS modules, no className-based styling. Animation keyframes use `<style>` tags or `animations.css`.
- **Design tokens are the single source of truth.** Import from `@/config/tokens` -- never use raw hex values.

### Components
- **Use master UI components for everything.** Never create one-off buttons, inputs, textareas, selects, or cards. Import from `@/components/ui`.
- **Barrel file imports:** `import { Button, GlowCard, Input } from '@/components/ui'`

### Naming & Language
- Database column: `contractor` / `contractor_id` -- never change this.
- UI label: **"Camper"** -- never show "contractor" to users.
- Client portal: **No camp terminology.** No "campfire", "ember", "flame" language. Keep it professional.
- Admin + Camper portals: Camp metaphors are OK (campfire, journey, ember, flame).

### API
- Production API URL: `https://tacklebox-api.square-sunset-3584.workers.dev`
- All endpoints under `/api/v1/`
- Response format: `{ success: boolean, data?: any, error?: string }`
- Auth: Bearer token in Authorization header. Phase 1 uses user ID as token.
- `requireRole()` uses rest params: `requireRole(auth, 'admin')` not `requireRole(auth, ['admin'])`

### Deployment
- Frontend: `npx wrangler pages deploy dist --project-name=tacklebox --branch=main --commit-dirty=true`
- API: `npx wrangler deploy` from the `api/` directory
- Build: `VITE_API_URL='https://tacklebox-api.square-sunset-3584.workers.dev' npm run build` from `frontend/`
- On Windows PowerShell, set env vars with `$env:VITE_API_URL='...'` before `npm run build`

### Database
- D1 database name: `tacklebox-db`
- D1 database ID: `e6e06ffe-3456-4954-89f1-30fbbbe2bbaf`
- R2 bucket: `tacklebox-storage`
- All IDs are UUIDs (TEXT PRIMARY KEY)
- Timestamps are TEXT with `datetime('now')` defaults
- Boolean fields use INTEGER (0/1)

### Environment
- Frontend env file: `@/config/env.js` -- auto-detects dev/prod
- Dev API: `http://localhost:8787` (Vite proxy)
- Prod API: `https://tacklebox-api.square-sunset-3584.workers.dev`
- Frontend URL: `https://tacklebox-3mu.pages.dev`

## Master UI Components

### Form Controls
Button, Input, Textarea, Select, Dropdown, Toggle, DatePicker, FileUpload, ConfirmAction

### Layout & Display
Card, GlowCard, Modal, Badge, StatusBadge, Avatar, PageHeader, Tabs, SubNav

### Data & Feedback
DataTable, Spinner, EmberLoader, Skeleton, EmptyState, SearchBar, ProgressBar, WaveProgressBar, TaskProgressTracker, ColourSwatch, StarRating, FilePreview, FilePreviewModal

### Gamification
FlameIcon, CircleProgress

### Toast System
`ToastProvider` wraps the app. Use `useToast()` hook: `toast.success('Done')`, `toast.error('Failed')`

## Project Structure

```
tacklebox/
  api/
    src/
      index.js                    # Worker entry point, CORS
      routes/
        index.js                  # Router -- dispatches to handlers
        auth.js                   # POST /auth/login, /auth/register
        users.js                  # CRUD users
        projects.js               # CRUD projects
        categories.js             # CRUD task categories
        templates.js              # CRUD task templates
        tasks.js                  # CRUD tasks + state machine + campfire
        comments.js               # Task comments with visibility
        attachments.js            # File upload/download via R2
        brand-profiles.js         # Brand profiles + PDF extraction
        brand-guides.js           # Brand guide file management
        storage.js                # R2 file serving (download/preview)
        time-entries.js           # Time tracking CRUD
        reviews.js                # Post-task reviews
        gamification.js           # XP, levels, badges, leaderboard
        analytics.js              # Admin dashboard analytics
        search.js                 # Global search
        ai.js                     # AI brief analysis
        generate.js               # AI content generation
        support.js                # Support messages
        tools.js                  # External tool links
      middleware/
        auth.js                   # authenticate(), requireAuth(), requireRole()
      services/
        content-generator.js      # AI content generation engine
        prompt-builder.js         # AI prompt construction
        template-engine.js        # HTML template rendering
        notifications.js          # Notification stubs
    src/migrations/
      0001_initial_schema.sql     # 16 base tables
      0002_content_engine.sql     # Brand logos, generations, content examples
      0003_scaling_system.sql     # 12-tier XP levels, new badges, complexity
      0004_campfire.sql           # Campfire eligibility column
      0005_communication.sql      # Support messages table
      0006_toolbox.sql            # Tool links table + seed data
      seed_test_users.sql         # Test users, project, task
      seed_rstudios_brand.sql     # Sample brand profile
    wrangler.toml

  frontend/
    src/
      App.jsx                     # All routes, ProtectedRoute, LayoutWrapper
      config/
        env.js                    # API URL, feature flags
        tokens.js                 # Design tokens (colours, spacing, etc.)
      contexts/
        AuthContext.jsx            # Auth state, login/logout, token storage
        ToastContext.jsx           # Toast notification system
      hooks/
        useAuth.js                # Auth context hook
        useToast.js               # Toast hook
        useTasks.js               # Task CRUD hooks
        useProjects.js            # Project hooks
        useTimeTracking.js        # Time entry hooks
        useAnalytics.js           # Analytics data hooks
        useSearch.js              # Search hook
        useOnboarding.js          # Onboarding flow hook
      services/
        auth.js                   # getAuthHeaders(), login(), logout()
        storage.js                # File download/preview URLs
        ai.js                     # AI API calls
        notifications.js          # Notification helpers
        gamification.js           # XP/badge API calls
        analytics.js              # Analytics API calls
        search.js                 # Search API calls
      components/
        ProtectedRoute.jsx        # Auth + role guard
        layout/
          MainLayout.jsx          # Sidebar + content wrapper
          Sidebar.jsx             # Navigation sidebar
          AuthLayout.jsx          # Login page layout
        ui/                       # Master component library (35+ components)
          index.js                # Barrel export
          README.md               # Component documentation
          Button.jsx, Input.jsx, Textarea.jsx, Select.jsx, ...
        features/
          BrandOnboarding.jsx     # 6-step brand profile wizard
          BrandBooklet.jsx        # Page-turn brand guide viewer
          ToolboxGrid.jsx         # External tool link grid
          brand/
            BrandProfileView.jsx  # Read-only brand display
            BrandProfileEditor.jsx # Admin brand editor
          tasks/
            TaskDetail.jsx        # Shared task detail (tabs, comments, etc.)
            TaskCard.jsx           # Compact task summary card
            TaskList.jsx           # Task list with cards
            TaskForm.jsx           # Task creation form
            AIAssistantPanel.jsx   # In-task AI generation
            TimeLogSection.jsx     # Time tracking section
            AttachmentList.jsx     # File attachment grid
      pages/
        LoginPage.jsx
        NotFoundPage.jsx
        ForbiddenPage.jsx
        SearchResults.jsx
        admin/
          AdminDashboard.jsx      # Stats, leaderboard, recent tasks
          AdminTasksPage.jsx      # Task list + filters
          AdminTaskDetail.jsx     # Task detail wrapper
          AdminTaskNew.jsx        # Create task
          AdminUsers.jsx          # User management
          AdminBrandProfiles.jsx  # Brand profile list
          AdminBrandProfileEdit.jsx # Brand profile editor page
          AdminToolsPage.jsx      # Create tools hub + AI generators
          AdminSettings.jsx       # Platform settings
          AdminJourney.jsx        # Admin journey/analytics
          AdminGuidance.jsx       # AI prompt best practices
          AdminTemplates.jsx      # Template CRUD
        client/
          ClientDashboard.jsx     # Client overview
          ClientTasks.jsx         # Client task list
          ClientTaskNew.jsx       # Submit new task
          ClientTaskDetail.jsx    # Client task detail
          ClientBrandHub.jsx      # Brand profile + guides
          ClientProfile.jsx       # Client settings
        contractor/
          ContractorDashboard.jsx # Camper dashboard + campfire
          ContractorTasks.jsx     # Camper task list
          ContractorTaskDetail.jsx # Camper task detail
          ContractorBrandGuides.jsx # Brand guide browser
          ContractorProfile.jsx   # Camper profile
          CamperJourney.jsx       # XP, levels, badges
        create/
          CreateSocial.jsx        # AI social image generator
          CreateDocument.jsx      # AI document generator
          CreatePresentation.jsx  # AI presentation generator
          CreateAd.jsx            # AI ad creative generator
          MyCreations.jsx         # Generation history
```

## Common Pitfalls

1. **requireRole rest params:** `requireRole(auth, 'admin', 'contractor')` NOT `requireRole(auth, ['admin', 'contractor'])`
2. **PowerShell env vars:** Use `$env:VITE_API_URL='...'` then separate `npm run build` command. Cannot use `&&` in PowerShell.
3. **D1 boolean fields:** Use `1` and `0`, not `true`/`false`.
4. **Dark mode tokens are inverted:** `colours.neutral[50]` is the darkest (#0a0a0a), `colours.neutral[900]` is white (#ffffff).
5. **apiEndpoint():** In dev mode returns relative path (Vite proxy), in prod prepends the full API URL.
6. **File uploads:** Use FormData, not JSON. R2 key pattern: `attachments/{taskId}/{uuid}_{filename}`.
7. **Task state machine:** Transitions are strictly validated. See `TRANSITIONS` object in `tasks.js`.
8. **Comment visibility:** `'all'` = everyone sees it. `'internal'` = admin + contractor only. Clients cannot post internal comments.
9. **Login credentials:** The camper test user is camper@tacklebox.app (NOT contractor@tacklebox.app). See credentials table below.

## Login Credentials (Dev/Prod)

Display names: Admin = Alice Admin, Client = R Studios, Camper = Gil Scales

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tacklebox.app | Admin123! |
| Client | client@tacklebox.app | Client123! |
| Contractor (Camper) | camper@tacklebox.app | Camper123! |
