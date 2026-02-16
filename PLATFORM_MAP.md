# TackleBox — Platform Map

> Complete reference of every route, page, service, and API endpoint.
> Updated: February 2026 | Commit: 614895c

---

## 1. Route Map

### Public Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Email/password authentication |
| `/forbidden` | ForbiddenPage | Unauthorized access landing |
| `*` | NotFoundPage | 404 catch-all |

### Admin Routes (`/admin/*`)

Protected by `ProtectedRoute roles={['admin']}`. Wrapped in MainLayout with Sidebar.

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | AdminDashboard | Platform overview — active tasks, user counts, revenue summary tiles (task payouts, campsite share, bonuses), leaderboard, recent notifications |
| `/admin/tasks` | AdminTasksPage | Task list with status filters, search, bulk actions. Wraps AdminTasks |
| `/admin/tasks/new` | AdminTaskNew | Create task — template selection auto-fills pricing fields |
| `/admin/tasks/:id` | AdminTaskDetail | Full task management — status transitions, comments (internal + all), attachments, time logs, reviews, AI assistant panel, history |
| `/admin/campers` | AdminUsers | User directory — all roles, search, deactivate, filter by role |
| `/admin/brands` | AdminBrandProfiles | Brand profile grid — one per client, click to edit |
| `/admin/brands/new` | BrandOnboarding | 6-step wizard to create client account + brand profile in one flow |
| `/admin/brands/:clientId/edit` | AdminBrandProfileEdit | Brand profile editor — identity, voice, logos, PDF guide upload/extract, booklet preview |
| `/admin/journey` | AdminJourney | Gamification management — level definitions, badge system |
| `/admin/tools` | AdminToolsPage | AI content creation hub — links to social/document/presentation/ad generators, creation history |
| `/admin/tools/social` | CreateSocial | AI social image generator (platform + format selection) |
| `/admin/tools/document` | CreateDocument | AI document generator (type + key points) |
| `/admin/tools/presentation` | CreatePresentation | AI presentation generator (topic, audience, slides, tone) |
| `/admin/tools/ad` | CreateAd | AI ad creative generator (format, headline, CTA) |
| `/admin/settings` | AdminSettings | Platform configuration — categories, templates |
| `/admin/calendar` | CalendarPage | Weekly calendar — all users' scheduled blocks, smart scheduling |

Also uses:
- AdminAnalytics (rendered within AdminDashboard or linked from journey)
- AdminCategories (rendered within AdminSettings)
- AdminTemplates (rendered within AdminSettings)
- AdminGuidance (AI prompt best practices editor)

### Client Routes (`/client/*`)

Protected by `ProtectedRoute roles={['client']}`.

| Route | Page | Purpose |
|-------|------|---------|
| `/client` | ClientDashboard | Credit balance card (available/held), upcoming deadlines with urgency badges, active task progress, recent notifications |
| `/client/tasks` | ClientTasks | Task list — submitted, in progress, completed |
| `/client/tasks/new` | ClientTaskNew | Submit new task — shows credit cost preview, handles 402 insufficient credits |
| `/client/tasks/:id` | ClientTaskDetail | Task detail — status tracker, comments (public only), attachments, reviews |
| `/client/brand-hub` | ClientBrandHub | Brand profile viewer + guide PDF list |
| `/client/credits` | ClientCredits | Credit balance, 12 Keeper Fish pack purchase grid, transaction history |
| `/client/profile` | ClientProfile | Account settings — display name, company, avatar |

### Contractor Routes (`/camper/*`)

Protected by `ProtectedRoute roles={['contractor']}`. UI calls contractors "Campers".

| Route | Page | Purpose |
|-------|------|---------|
| `/camper` | ContractorDashboard | XP bar, fire stage badge, campfire tasks (claimable, level-filtered), toolbox grid, recent notifications |
| `/camper/tasks` | ContractorTasks | Active + completed tasks, search, status filters |
| `/camper/tasks/:id` | ContractorTaskDetail | Task detail — status transitions (in_progress → review), comments, attachments, time logging, AI assistant panel |
| `/camper/brands` | ContractorBrandGuides | Browse brand guide PDFs for assigned clients |
| `/camper/journey` | CamperJourney | XP progress, level circle, badge grid, fire stage timeline, leaderboard |
| `/camper/earnings` | CamperEarnings | Earnings balance, cashout requests, earning history with type icons |
| `/camper/calendar` | CalendarPage | Personal weekly calendar, smart scheduling suggestions |
| `/camper/profile` | ContractorProfile | Account settings, avatar |

### Shared Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/search` | SearchResults | Global search — tasks, users, brands. Role-filtered results |

---

## 2. Data Flow Architecture

```
Pages/Components
      │
      ▼
  Services (frontend/src/services/*.js)
      │  — centralised URL construction, error handling, response unwrapping
      ▼
  apiFetch.js
      │  — adds auth headers, 30s timeout, res.ok checking, JSON parsing
      ▼
  Cloudflare Workers API (api/src/routes/*.js)
      │  — auth middleware, role checking, input validation
      ▼
  Cloudflare D1 (SQLite)  +  Cloudflare R2 (file storage)
```

**Rule:** Zero direct `apiFetch()` calls exist outside the service layer. Pages import from `@/services/*` only.

---

## 3. Service Layer

21 service modules in `frontend/src/services/`:

| Service | Functions | Used By |
|---------|-----------|---------|
| **auth** | login, logout, getToken, getCurrentUser, isAuthenticated, getAuthHeaders, hasRole | AuthContext, ProtectedRoute |
| **apiFetch** | apiFetch (wrapper) | All other services (internal only) |
| **tasks** | listTasks, getTask, createTask, updateTask, deleteTask, updateTaskStatus, claimTask, passTask, getTaskHistory, analyseBrief, getCampfireTasks, searchAll | All task pages, dashboard |
| **brands** | createProfile, getProfile, updateProfile, extractProfile, getLogos, uploadLogo, addLogo, deleteLogo, uploadGuidePdf, updateBrandFromProfile, listGuides, listAllProfiles | Brand pages, onboarding |
| **users** | createUser, listUsers, updateProfile, deactivateUser | AdminUsers, profiles, onboarding |
| **credits** | getMyCredits, listPacks, purchasePack, getTransactions, getClientCredits, grantCredits | ClientCredits, ClientDashboard |
| **notifications** | listNotifications, markRead, markAllRead, deleteNotification | NotificationBell, RecentNotifications |
| **earnings** | getMyEarnings, getEarnings, requestCashout, listCashouts, updateCashout, awardBonus, getAnalytics | CamperEarnings, AdminAnalytics, AdminDashboard |
| **generate** | generateContent, generateAd, generateDocument, generatePresentation, generateSocial, getHistory, attachToTask, deleteGeneration | Create pages, AIAssistantPanel |
| **gamification** | getMyGamification, getContractorXP, getLevels, getBadges, getLeaderboard | Sidebar, Journey pages, Dashboard |
| **schedule** | listBlocks, createBlock, updateBlock, deleteBlock, getSuggestions | CalendarPage |
| **comments** | listComments, createComment, deleteComment | TaskDetail pages |
| **attachments** | listAttachments, uploadAttachment, deleteAttachment | TaskDetail pages |
| **reviews** | listReviews, createReview | TaskDetail pages |
| **timeEntries** | listEntries, createEntry, updateEntry, deleteEntry, getTotal | TaskDetail pages |
| **categories** | listCategories, createCategory, updateCategory, deleteCategory, deactivateCategory | AdminCategories, TaskForm |
| **templates** | listTemplates, createTemplate, updateTemplate, deleteTemplate | AdminTemplates, TaskForm |
| **analytics** | getTaskOverview, getTurnaround, getCategoryBreakdown, getProjectProgress, getContractorPerformance, getTimeTracking, getReviewInsights | AdminAnalytics |
| **support** | listMessages, createMessage, updateMessage | Sidebar (admin badge count) |
| **guidance** | listSections, updateSection | AdminGuidance |
| **tools** | listTools, createTool, updateTool, deleteTool | AdminToolsPage |
| **projects** | listProjects | Project-related components |

---

## 4. API Endpoints

Base URL: `https://tacklebox-api.square-sunset-3584.workers.dev`

### Auth (`/auth`)
- `POST /auth/login` — authenticate, returns JWT
- `POST /auth/register` — create account (role validated)

### Tasks (`/tasks`)
- `GET /tasks` — list (filters: status, assigned_to, client_id, search)
- `POST /tasks` — create (admin/client, holds credits if client)
- `GET /tasks/:id` — detail with relations
- `PUT /tasks/:id` — update fields
- `DELETE /tasks/:id` — delete + clean up attachments
- `PATCH /tasks/:id/status` — state machine transition
- `POST /tasks/:id/claim` — contractor claims from campfire (level-gated)
- `POST /tasks/:id/pass` — contractor passes task back
- `GET /tasks/:id/history` — audit log
- `POST /tasks/analyse-brief` — AI brief analysis
- `GET /tasks/campfire` — available tasks filtered by contractor level

### Brand Profiles (`/brand-profiles`)
- `GET /brand-profiles` — list all
- `POST /brand-profiles` — create
- `GET /brand-profiles/:clientId` — get profile
- `PUT /brand-profiles/:clientId` — update
- `POST /brand-profiles/:clientId/extract` — AI extraction from uploaded PDF
- `GET /brand-profiles/:clientId/logos` — list logos
- `POST /brand-profiles/:clientId/logos` — add logo (JSON or FormData)
- `DELETE /brand-profiles/:clientId/logos/:logoId` — remove logo
- `POST /brand-profiles/:clientId/guide-pdf` — upload brand guide PDF

### Credits (`/credits`)
- `GET /credits/me` — client balance + recent transactions
- `GET /credits/packs` — 12 Keeper Fish tiers
- `POST /credits/purchase` — buy pack (Stripe-ready)
- `POST /credits/grant` — admin grants credits
- `GET /credits/:userId` — admin views client balance

### Notifications (`/notifications`)
- `GET /notifications` — list (query: limit, unread)
- `PATCH /notifications/read-all` — mark all read
- `PATCH /notifications/:id/read` — mark one read
- `DELETE /notifications/:id` — delete

### Earnings (`/earnings`)
- `GET /earnings/me` — camper balance + history
- `GET /earnings/:userId` — admin view
- `POST /earnings/reward` — award bonus (camp leader 7+ or admin)
- `POST /earnings/cashout` — request cashout
- `GET /earnings/cashouts` — admin list all
- `PATCH /earnings/cashouts/:id` — approve/reject
- `GET /earnings/analytics` — breakdown by level, category, client

### Schedule (`/schedule`)
- `GET /schedule` — blocks (date range filter)
- `POST /schedule` — create block (overlap detection)
- `PUT /schedule/:id` — move/resize
- `DELETE /schedule/:id` — remove
- `GET /schedule/suggestions/:taskId` — smart slot finder

### Generate (`/generate`)
- `POST /generate/social` — AI social image
- `POST /generate/document` — AI document
- `POST /generate/presentation` — AI presentation
- `POST /generate/ad` — AI ad creative
- `POST /generate/attach-to-task` — attach generation to task
- `GET /generate/content/:id` — serve generated content
- `GET /generate/history` — generation history
- `DELETE /generate/:id` — delete generation

### Also: `/comments`, `/attachments`, `/reviews`, `/time-entries`, `/gamification`, `/analytics`, `/search`, `/users`, `/categories`, `/templates`, `/brand-guides`, `/storage`, `/support`, `/tools`, `/guidance`

See `API_REFERENCE.md` for complete endpoint documentation.

---

## 5. Task State Machine

```
submitted → assigned → in_progress → review → approved → closed
                                        ↓ ↑
                                      revision
     (any active state) → cancelled
```

- **submitted:** Client or admin created the task
- **assigned:** Admin assigned a contractor
- **in_progress:** Contractor working on it
- **review:** Contractor submitted for review
- **revision:** Admin sent back for changes
- **approved:** Admin approved the deliverables
- **closed:** Task complete, earnings credited, held credits finalized
- **cancelled:** Task cancelled, held credits released

---

## 6. Credit Flow

```
Client purchases pack → credits added to available_credits
Client creates task → credit_cost held (available decreases, held increases)
Task closed → held credits finalized (deducted permanently)
Task cancelled → held credits released back to available
```

1 credit = $1. Credit cost = estimated_hours × hourly_rate.

---

## 7. Earnings Flow (Level 7+ Kickback)

```
Task closed → total_payout credited to contractor
  Level 1-6: 100% to camper
  Level 7+:  60% camper_share + 40% campsite_share (business revenue)
```

Campers only see their share. Admins see both splits in analytics.

---

## 8. Notification Triggers

| Event | Recipients | Type |
|-------|-----------|------|
| Task assigned | Contractor | task_assigned |
| Status change | Client + contractor | task_status |
| New comment | All task participants | comment |
| @mention in comment | Mentioned user | comment |
| Bonus awarded | Camper | bonus |
| Credits granted | Client | credits_low |
| Task passed (campfire) | Client | task_status |
| Support message | All admins | system |

---

## 9. File Structure

```
tacklebox/
├── api/
│   └── src/
│       ├── index.js              # Worker entry point + router
│       ├── middleware/auth.js     # JWT auth + role checking
│       ├── routes/               # 18 route handlers
│       ├── services/             # Business logic (gamification, notifications, content-generator)
│       └── migrations/           # 9 D1 SQL migrations
├── frontend/
│   └── src/
│       ├── App.jsx               # Route definitions
│       ├── config/
│       │   ├── tokens.js         # Design tokens (colours, spacing, typography)
│       │   ├── constants.js      # Task statuses, roles, transitions
│       │   └── env.js            # API endpoint resolution
│       ├── components/
│       │   ├── ui/               # 35 reusable UI components (see Component Reference)
│       │   ├── features/         # Domain-specific components
│       │   │   ├── tasks/        # TaskForm, TaskDetail, TaskCard, AIAssistantPanel
│       │   │   ├── brand/        # BrandProfileEditor, BrandBooklet, BrandGuidePDFViewer
│       │   │   ├── gamification/ # XPBar, BadgeGrid, Leaderboard, FireStageTimeline
│       │   │   ├── notifications/ # NotificationBell, RecentNotifications
│       │   │   ├── analytics/    # StatCard
│       │   │   ├── projects/     # ProjectCard, ProjectForm, ProjectList, ProjectDetail
│       │   │   ├── search/       # SearchDropdown
│       │   │   └── users/        # UserForm, UserTable
│       │   └── layout/           # MainLayout, AuthLayout, Sidebar
│       ├── contexts/             # AuthContext (global auth state)
│       ├── hooks/                # useAuth, useToast
│       ├── services/             # 21 API service modules
│       └── pages/                # 35 page components
│           ├── admin/            # 15 pages
│           ├── client/           # 7 pages
│           ├── contractor/       # 8 pages
│           ├── create/           # 6 pages
│           └── shared/           # 1 page (CalendarPage)
└── docs/
    ├── SPEC.md                   # Original product specification
    └── TackleBox_Setup_Guide.md  # Development setup
```
