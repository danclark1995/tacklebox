# Architecture

## System Overview

```
Browser (React SPA)
    |
    | HTTPS (REST JSON)
    |
Cloudflare Pages          Cloudflare Workers
(frontend static)  --->   (API: /api/v1/*)
                              |
                     +--------+--------+
                     |        |        |
                   D1 DB    R2 Storage  Workers AI
                  (SQLite)  (files)    (Llama/Flux)
```

## Frontend Architecture

### Framework
- React 19 with Vite 7 (ES modules, HMR)
- React Router 7 for client-side routing
- No state management library -- local state + context only

### Routing
All routes defined in `App.jsx`. Three role-based route groups wrapped in `ProtectedRoute`:

| Path Prefix | Role | Layout |
|-------------|------|--------|
| `/admin/*` | admin | MainLayout (sidebar + content) |
| `/client/*` | client | MainLayout |
| `/camper/*` | contractor | MainLayout |
| `/login` | none | Standalone |
| `/search` | any authenticated | MainLayout |

`RoleRedirect` at `/` sends users to their role-specific dashboard.

### Auth Flow
1. User submits email + password to `POST /api/v1/auth/login`
2. API returns `{ token, user }` -- Phase 1 token = user ID
3. Frontend stores token + user in localStorage via `AuthContext`
4. All API calls include `Authorization: Bearer {token}` via `getAuthHeaders()`
5. `ProtectedRoute` checks `useAuth()` for authentication and role

### Layout System
- `MainLayout` = `Sidebar` + content area
- `Sidebar` renders role-specific navigation links
- `AuthLayout` = centered card for login page

### Styling
- **Inline styles only** -- no CSS-in-JS, no CSS modules, no Tailwind
- Design tokens imported from `@/config/tokens`
- Animation keyframes in `<style>` tags or `animations.css`
- Responsive: tokens include breakpoints but media queries are minimal

### State Management
- `AuthContext` -- user session, login/logout
- `ToastContext` -- toast notification queue
- Page-level `useState` + `useEffect` for data fetching
- Custom hooks (`useTasks`, `useProjects`, etc.) encapsulate API calls

## Backend Architecture

### Entry Point
`api/src/index.js` exports a Cloudflare Worker `fetch` handler:
1. Sets CORS headers (allows localhost dev + production domains)
2. Handles OPTIONS preflight
3. Routes `/api/v1/*` to `handleApiRequest()`
4. Returns JSON error for unknown paths

### Router
`api/src/routes/index.js` -- simple path prefix matching:
- `/auth/*` -- no auth required (login/register)
- `/generate/content/*` -- no auth required (public content serving by UUID)
- All other paths -- `authenticate()` called first, auth object passed to handlers

### Authentication
`api/src/middleware/auth.js`:
- `authenticate(request, env)` -- extracts Bearer token, looks up user in D1
- `requireAuth(authResult)` -- checks `authenticated` flag
- `requireRole(authResult, ...roles)` -- checks user role (rest params, NOT array)

### Roles
| Role | DB Value | UI Name | Capabilities |
|------|----------|---------|-------------|
| Admin | `admin` | Admin | Full access, user management, brand profiles, analytics |
| Client | `client` | Client | Submit tasks, view own tasks/projects, brand hub |
| Contractor | `contractor` | Camper | Claim tasks, submit deliverables, time tracking, XP |

### Task State Machine
```
submitted -> assigned -> in_progress -> review -> approved -> closed
                |             |           |
                v             v           v
            cancelled     cancelled    revision -> in_progress
```
Each transition has role requirements and optional field requirements. Validated in `validateTransition()`.

### AI Integration
- **Brief Analysis:** `POST /ai/analyse-brief/:taskId` -- Llama 3.1 8B analyzes task briefs
- **Content Generation:** `POST /generate/{social|document|presentation|ad}` -- generates branded content
  - Text generation: `@cf/meta/llama-3.1-8b-instruct`
  - Image generation: Flux model via Workers AI
  - Generated files stored in R2, tracked in `generations` table

### File Storage (R2)
- Attachments: `attachments/{taskId}/{uuid}_{filename}`
- Brand guides: `brand-guides/{clientId}/{uuid}_{filename}`
- Generated content: `generations/{uuid}/{filename}`
- Served via `/api/v1/storage/preview/` (inline) and `/api/v1/storage/download/` (attachment)

### Notifications
`api/src/services/notifications.js` -- stub functions for:
- Task status change notifications
- New comment notifications
- @mention notifications
- Support message notifications

Currently log-only. Ready for email/push integration.

## Route Map

### Public Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register (admin auth required) |
| GET | `/api/v1/generate/content/:id` | Public content preview |
| GET | `/api/v1/generate/content/:id/download` | Public content download |

### User Routes (admin only for list/create)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | admin | List users (filter: ?role=) |
| GET | `/users/:id` | admin or self | Get user |
| POST | `/users` | admin | Create user |
| PUT | `/users/:id` | admin or self | Update user |
| PATCH | `/users/:id/deactivate` | admin | Deactivate user |

### Project Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/projects` | any | List projects (role-filtered) |
| GET | `/projects/:id` | admin or owner | Get project |
| POST | `/projects` | admin, client | Create project |
| PUT | `/projects/:id` | admin | Update project |
| GET | `/projects/:id/tasks` | admin or owner | List project tasks |

### Category Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | any | List categories |
| POST | `/categories` | admin | Create category |
| PUT | `/categories/:id` | admin | Update category |
| DELETE | `/categories/:id` | admin | Delete category |
| PATCH | `/categories/:id/deactivate` | admin | Deactivate category |

### Template Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/templates` | any | List templates (filter: ?category_id=) |
| GET | `/templates/:id` | any | Get template |
| POST | `/templates` | admin | Create template |
| PUT | `/templates/:id` | admin | Update template |
| DELETE | `/templates/:id` | admin | Delete template |

### Task Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tasks` | any | List tasks (role-filtered, query filters) |
| GET | `/tasks/:id` | admin, assigned client/contractor | Get task |
| POST | `/tasks` | admin, client | Create task |
| PUT | `/tasks/:id` | admin (most fields), contractor (deadline) | Update task |
| PATCH | `/tasks/:id/status` | role-dependent | Transition task status |
| DELETE | `/tasks/:id` | admin | Delete task + related records |
| GET | `/tasks/campfire` | contractor, admin | List claimable campfire tasks |
| POST | `/tasks/:id/claim` | contractor | Claim campfire task |
| POST | `/tasks/:id/pass` | contractor | Pass on assigned task |

### Comment Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/comments?task_id=` | task participant | List comments (visibility-filtered) |
| POST | `/comments` | task participant | Create comment |

### Attachment Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/attachments?task_id=` | task participant | List attachments |
| POST | `/attachments` | task participant | Upload file (FormData) |
| DELETE | `/attachments/:id` | admin or uploader | Delete attachment |

### Brand Profile Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/brand-profiles` | any | List brand profiles (role-filtered) |
| GET | `/brand-profiles/:clientId` | admin, client (own), contractor (assigned) | Get profile |
| POST | `/brand-profiles` | admin | Create/upsert profile |
| PUT | `/brand-profiles/:clientId` | admin | Update profile fields |
| POST | `/brand-profiles/:clientId/extract` | admin | Extract from PDF (FormData) |
| GET | `/brand-profiles/:clientId/logos` | any | List logos |
| POST | `/brand-profiles/:clientId/logos` | admin | Add logo |
| DELETE | `/brand-profiles/:clientId/logos/:logoId` | admin | Delete logo |

### Brand Guide Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/brand-guides?client_id=` | any (role-filtered) | List brand guides |
| POST | `/brand-guides` | admin | Upload guide (FormData) |
| DELETE | `/brand-guides/:id` | admin | Delete guide |

### Storage Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/storage/download/{key}` | any | Download file |
| GET | `/storage/preview/{key}` | any | Preview file inline |

### Time Entry Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/time-entries?task_id=` | task participant | List entries |
| GET | `/time-entries/total?task_id=` | task participant | Get total minutes |
| POST | `/time-entries` | contractor, admin | Create entry |
| PUT | `/time-entries/:id` | own entry or admin | Update entry |
| DELETE | `/time-entries/:id` | own entry or admin | Delete entry |

### Review Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews?task_id=` | admin (all), contractor (own) | List reviews |
| GET | `/reviews/:id` | admin or own reviewer | Get review |
| POST | `/reviews` | contractor, admin | Create review (task must be closed) |

### Gamification Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gamification/me` | any | Full journey data for current user |
| GET | `/gamification/levels` | any | All XP levels |
| GET | `/gamification/badges` | any | All available badges |
| GET | `/gamification/badges/:userId` | admin or self | User's badges |
| GET | `/gamification/xp/:userId` | admin or self | User's XP profile |
| GET | `/gamification/leaderboard` | any | Leaderboard (admin: all, contractor: top 5 + own) |
| POST | `/gamification/recalculate/:userId` | admin | Recalculate XP + award badges |

### Analytics Routes (admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/tasks` | Task overview (counts, by status, per month) |
| GET | `/analytics/turnaround` | Turnaround times |
| GET | `/analytics/categories` | Category breakdown |
| GET | `/analytics/projects` | Project progress |
| GET | `/analytics/contractors` | Contractor performance |
| GET | `/analytics/time` | Time tracking summary |
| GET | `/analytics/reviews` | Review insights |

All analytics endpoints accept optional filters: `date_from`, `date_to`, `client_id`, `contractor_id`, `category_id`, `project_id`.

### Content Generation Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generate/social` | admin, contractor | Generate social media image |
| POST | `/generate/document` | admin, contractor | Generate branded document |
| POST | `/generate/presentation` | admin, contractor | Generate presentation |
| POST | `/generate/ad` | admin, contractor | Generate ad creative |
| GET | `/generate/history` | any (role-filtered) | Generation history |
| GET | `/generate/:id` | any (access-checked) | Get single generation |
| DELETE | `/generate/:id` | admin or own | Delete generation |
| POST | `/generate/attach-to-task` | admin, contractor | Attach generation to task |
| GET | `/generate/stats` | admin | AI generation statistics |

### AI Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/analyse-brief/:taskId` | admin | AI brief analysis |

### Search Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=&type=` | any (role-scoped) | Global search |

### Support Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/support` | any | Create support message |
| GET | `/support` | admin | List all messages |
| PUT | `/support/:id` | admin | Update message status |

### Tool Link Routes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tools` | any | List active tool links |
| POST | `/tools` | admin | Create tool link |
| PUT | `/tools/:id` | admin | Update tool link |
| DELETE | `/tools/:id` | admin | Delete tool link |
