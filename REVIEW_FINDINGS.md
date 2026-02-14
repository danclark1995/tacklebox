# Platform Self-Review Findings

**Date:** 2026-02-12
**Scope:** Full review of frontend pages, API routes, shared components, hooks, services, and configs.

---

## Critical Issues (Broken Functionality)

### C1. API: Task deletion references wrong table name
**File:** `api/src/routes/tasks.js:878`
`DELETE FROM reviews` references a non-existent table. The correct table is `task_reviews` (per migration 0001). Task deletion will fail at runtime with "no such table" error.

### C2. API: Task deletion does not clean up attachments
**File:** `api/src/routes/tasks.js:874-879`
DELETE handler cleans up comments, history, and time entries but does NOT delete `task_attachments` records or their corresponding R2 storage objects. Orphaned files and records remain.

### C3. API: brand-guides GET/DELETE have no try/catch
**File:** `api/src/routes/brand-guides.js:22-53, 113-126`
Three separate DB query branches in the GET handler and the entire DELETE handler lack try/catch. Any DB error causes an unhandled exception crash.

### C4. Client brand guide PDF viewer is non-functional
**File:** `frontend/src/pages/client/ClientBrandHub.jsx:96`
`BrandGuideCard` is rendered without an `onView` prop. The "View" button calls `onView && onView(guide)` -- which is a no-op. `BrandGuidePDFViewer` is only imported in the admin portal. Clients cannot view brand guide PDFs.

### C5. Camper portal has no PDF viewer access
**File:** `frontend/src/pages/contractor/ContractorBrandGuides.jsx`
Campers only get `BrandBooklet` (section-based viewer), not `BrandGuidePDFViewer`. They cannot view the actual uploaded brand guide PDFs from R2.

### C6. SearchResults shows "contractor" to users
**File:** `frontend/src/pages/SearchResults.jsx:180`
Displays raw `user.role` string which shows "contractor" instead of "Camper" for contractor users. Violates CLAUDE.md naming rules.

### C7. Admin notification for comments is broken
**File:** `api/src/routes/comments.js:184`
Uses literal string `'admin'` as a user ID instead of querying for users with `role = 'admin'`. Admin users are never notified of new comments.

---

## Medium Issues (Inconsistencies, Missing Features, Security)

### Security

### M1. API: No per-file authorization on storage routes
**File:** `api/src/routes/storage.js:14-55`
Only checks `requireAuth` but not whether the user has permission to access the specific file. Any authenticated user can download any file in R2 by knowing/guessing the key path.

### M2. API: No ownership check on brand guide PDF access
**File:** `api/src/routes/brand-profiles.js:281-313`
GET guide-pdf endpoint checks `requireAuth` but not whether the user is the client owner, an assigned contractor, or admin. Any authenticated user can access any client's brand guide.

### M3. API: Contractor guide-pdf upload has no client association check
**File:** `api/src/routes/brand-profiles.js:315-379`
A contractor at level 7+ can upload a brand guide PDF for ANY client, not just clients whose tasks they are assigned to.

### M4. API: Contractors can see all projects
**File:** `api/src/routes/projects.js:38-43`
GET /projects only restricts clients. Contractors see all projects (same as admin), exposing project info for unrelated clients.

### M5. API: Clients can view contractor gamification data
**File:** `api/src/routes/gamification.js:23-264`
Leaderboard, badges, and XP endpoints allow any authenticated role including clients. Exposes internal contractor performance data.

### M6. API: No role validation on user registration
**File:** `api/src/routes/auth.js:107-113`
Register accepts any value for `role` without validating against allowed values (client, contractor, admin).

### Data Integrity

### M7. API: Review unique constraint mismatch
**File:** `api/src/routes/reviews.js:167 vs migration 0001:203`
DB has unique index on `(task_id, reviewer_id)` but code checks uniqueness on `(task_id, reviewer_role)`. Two different admins could conflict or bypass validation.

### M8. API: Deactivation endpoints don't verify existence
**Files:** `api/src/routes/users.js:288-316`, `api/src/routes/categories.js:196-225`
PATCH deactivate runs UPDATE without checking if the record exists. Returns `{ success: true }` even for non-existent IDs.

### M9. API: Error message lists wrong allowed fields
**File:** `api/src/routes/users.js:211`
Says "You can only update display_name and avatar_url" but `allowedFields` also includes `company`.

### Systemic Frontend Issues

### M10. No `res.ok` check before `res.json()` across entire frontend
Only 2 locations check `res.ok` (`services/auth.js:27`, `BrandGuidePDFViewer.jsx:50`). All other ~48 files call `res.json()` directly. Non-JSON error responses (502, 503 from Cloudflare) will throw `SyntaxError: Unexpected token '<'` instead of meaningful errors.

### M11. Services layer completely bypassed
5 of 7 services are never imported: `storage.js`, `ai.js`, `notifications.js`, `gamification.js`, `search.js`. All components make direct `fetch(apiEndpoint(...))` calls instead of using the service layer.

### M12. 6 of 8 hooks are dead code
`useTasks`, `useProjects`, `useTimeTracking`, `useAnalytics`, `useSearch`, `useOnboarding` are defined as stubs but never imported anywhere. Only `useAuth` and `useToast` are used.

### M13. Feature flags defined but never checked
**File:** `frontend/src/config/env.js`
`config.features.aiEnabled`, `config.features.gamificationEnabled`, `config.features.onboardingEnabled` exist but no component reads them. AI features render unconditionally.

### M14. No request timeout on API calls
Only `services/storage.js` uses `AbortController`. All other fetch calls have no timeout. `API_TIMEOUT_MS` (30000ms) exists in `constants.js` but is never imported.

### M15. Camp terminology ("EmberLoader") in client portal
**Files:** 7 of 8 client page files use `EmberLoader`. CLAUDE.md forbids "ember" language in the client portal. Should use `Spinner` or a neutrally-named loader.

### Unreachable Pages

### M16. Admin pages with no routes
**Files:** `AdminProjects.jsx`, `AdminProjectDetail.jsx` exist on disk but are not imported or routed in `App.jsx`. Completely unreachable dead code.

### M17. Client pages with no routes
**Files:** `ClientProjects.jsx`, `ClientProjectDetail.jsx` exist on disk but are not imported or routed in `App.jsx`. Completely unreachable dead code.

### M18. Orphaned feature components
**Files:** `BrandProfileView.jsx`, `CampfireLayout.jsx`, `OnboardingWizard.jsx` exist but are imported by zero pages or components.

---

## Low Issues (Cleanup, Style, Dead Code)

### Raw Hex Colors Instead of Design Tokens

Approximately 100+ instances across the codebase. Most prevalent files:

| File | Approx. Count |
|------|--------------|
| `BrandBooklet.jsx` | 40+ |
| `BrandOnboarding.jsx` | 18 |
| `AdminJourney.jsx` / `CamperJourney.jsx` | 12 each |
| `AdminGuidance.jsx` | 8 |
| `TaskDetail.jsx` | 17 |
| `AdminToolsPage.jsx` | 3 |
| `AdminBrandProfileEdit.jsx` | 2 |
| `AdminDashboard.jsx` | 1 (`#ff4444`) |
| `ContractorTasks.jsx` / `ContractorDashboard.jsx` | 5 each |
| `LoginPage.jsx` | 3 (`#ff4444` for errors) |
| All Create pages | In unused dead styles |

### Raw HTML Elements Instead of Master UI Components

| Element | File | Lines |
|---------|------|-------|
| `<button>` | `AdminBrandProfileEdit.jsx` | 345 |
| `<button>` (x7) | `BrandBooklet.jsx` | 93, 132, 151, 168, 189, 208, 369 |
| `<button>` (x5) | `BrandGuidePDFViewer.jsx` | 120, 143, 165, 220, 240 |
| `<button>` | `Sidebar.jsx` | 283 |
| `<textarea>` | `TaskDetail.jsx` | 449 |
| `<input type="color">` | `BrandProfileEditor.jsx` | 307 |
| `<a>` as button | `AttachmentList.jsx` | 186 |
| `<a href="/">` | `NotFoundPage.jsx` | 63 |
| `<a href="/">` | `ForbiddenPage.jsx` | 63 |

### Custom SVG Icons Instead of Lucide

| File | Lines | Should Use |
|------|-------|-----------|
| `AdminAnalytics.jsx` | 554-592 | CheckSquare, Clock, Calendar, Star |
| `AdminTemplates.jsx` | 501, 511 | Square, X |
| `AIAssistantPanel.jsx` | 306-317 | Sparkles, ChevronDown |
| `TimeLogSection.jsx` | 165-195 | Pencil, Trash2, Clock |
| `AttachmentList.jsx` | 19-47 | Download, Trash2, Paperclip |
| `BrandProfileEditor.jsx` | 6-17 | Unicode symbols as nav icons |
| `CreateHub.jsx` | 11-52 | Image, FileText, Monitor, Megaphone |
| `CreateSocial.jsx` | 151, 230 | ChevronLeft, Image |
| `CreateDocument.jsx` | 125, 220 | ChevronLeft, FileText |
| `CreatePresentation.jsx` | 131, 236 | ChevronLeft, Monitor |
| `CreateAd.jsx` | 127, 228 | ChevronLeft, Star |
| `MyCreations.jsx` | 179, 236 | ChevronLeft, FileText |

### className-Based Styling

| File | Lines |
|------|-------|
| `AdminJourney.jsx` | 114, 151, 152, 157, 210, 227-233 |
| `CamperJourney.jsx` | 122, 159, 161, 166, 221, 247-253 |
| `AdminAnalytics.jsx` | 314-319, 446, 597, 617, 747 |
| `TaskDetail.jsx` | 258 |
| `TaskCard.jsx` | 30 |
| `TaskList.jsx` | 56 |
| `TaskHistory.jsx` | 22 |
| `BrandBooklet.jsx` | 367, 385, 391-393 |
| `BrandGuideCard.jsx` | 67 |
| `BrandGuidePDFViewer.jsx` | 198 |
| `Sidebar.jsx` | 244, 253, 231-239 |
| `ForbiddenPage.jsx` | 63 |

Note: Most className usage is for responsive `<style>` media queries, which is the expected workaround when inline styles can't handle breakpoints.

### Unused Imports and Dead Code

| File | Item |
|------|------|
| `AdminUsers.jsx:2` | `useNavigate` imported, never used |
| `AdminAnalytics.jsx:7` | `useAuth` / `user` destructured, never used |
| `ContractorDashboard.jsx:1` | `useRef` imported, never used |
| `ContractorTaskDetail.jsx:16` | `COMMENT_VISIBILITY` imported, never used |
| `TaskCard.jsx:2-3` | `TASK_STATUS_LABELS`, `getInitials` imported, never used |
| `TaskList.jsx:22-42` | `statusOptions`, `priorityOptions`, `handleFilterChange` defined, never used |
| `AIAssistantPanel.jsx:243-261` | `selectStyle`, `textareaStyle`, `inputStyle` defined, never used |
| `BrandOnboarding.jsx:676-688` | `addPillarButtonStyle` defined, never used |
| `BrandBooklet.jsx:3` | `GlowCard` imported, never used |
| `AdminTemplates.jsx:377-408` | `checklistRemoveStyle`, `checklistInputStyle` defined, never used |
| `MyCreations.jsx:104-160` | `selectStyle`, `inputStyle`, `textareaStyle`, `deleteStyle` -- all dead |
| `CreateSocial.jsx:127-137` | `selectStyle`, `textareaStyle` -- dead |
| `CreateDocument.jsx:104-115` | `selectStyle`, `inputStyle`, `textareaStyle` -- dead |
| `CreatePresentation.jsx:106-116` | `selectStyle`, `inputStyle`, `textareaStyle` -- dead |
| `CreateAd.jsx:106-117` | `selectStyle`, `inputStyle`, `textareaStyle` -- dead |
| `ContractorTasks.jsx:161` | `isConfirming` computed, never rendered |
| `ContractorDashboard.jsx:319` | `isConfirming` computed, never rendered |

### Dead Config and Constants

| File | Item |
|------|------|
| `config/env.js` | `config.appUrl` -- defined, never imported |
| `config/env.js` | `config.features.*` -- 3 feature flags, never checked |
| `config/constants.js` | `API_TIMEOUT_MS` -- never imported |
| `config/constants.js` | `RATE_LIMIT_PER_MINUTE` -- never imported |
| `config/constants.js` | `AUTH_PROVIDERS` -- never imported |
| `config/constants.js` | `REVIEWER_ROLES` -- never imported |
| `config/constants.js` | `XP_REWARDS` -- never imported |
| `config/constants.js` | `ALLOWED_FILE_TYPES_*` -- never imported |
| `services/auth.js` | `isAuthenticated`, `hasRole`, `updateStoredUser` -- exported, never imported |

### API Response Consistency

These DELETE endpoints return `{ success: true }` without a `data` field, inconsistent with the standard `{ success, data?, error? }` format:
- `api/src/routes/tools.js:149`
- `api/src/routes/categories.js:249`
- `api/src/routes/templates.js:309`
- `api/src/routes/tasks.js:880`

### API Dead Code

**File:** `api/src/routes/generate.js:77, 208, 255, 275`
Top-level `requireRole(auth, 'admin', 'contractor')` blocks clients from all generate routes, but individual handlers still contain unreachable `if (auth.user.role === 'client')` branches.

### CLAUDE.md Structure Mismatches

| Issue | Detail |
|-------|--------|
| `BrandBooklet.jsx` path wrong | Listed as `features/BrandBooklet.jsx`, actual: `features/brand/BrandBooklet.jsx` |
| 20 feature components unlisted | Components in `features/gamification/`, `features/analytics/`, `features/users/`, `features/projects/`, `features/search/`, `features/brand/BrandGuideCard.jsx`, etc. exist on disk but not in CLAUDE.md structure |

---

## Suggested Improvements

1. **Wire up BrandGuidePDFViewer for clients and campers** -- both portals need access to view uploaded brand guide PDFs from R2.

2. **Fix task deletion** -- correct table name (`task_reviews`), add `task_attachments` cleanup with R2 object deletion.

3. **Add `res.ok` checking** -- create a shared `apiFetch()` utility that wraps `fetch`, checks `res.ok`, and throws descriptive errors for non-JSON responses. Use across all components.

4. **Adopt the service layer or remove it** -- either wire all components to use the existing services/hooks, or delete the unused stubs to reduce confusion.

5. **Replace raw hex values with design tokens** -- a systematic sweep of ~100+ instances, prioritizing `BrandBooklet.jsx`, `BrandOnboarding.jsx`, and `TaskDetail.jsx`.

6. **Replace custom SVGs with Lucide icons** -- affects ~12 files, mostly Create pages and task feature components.

7. **Add authorization to storage routes** -- verify the authenticated user has permission to access the specific file (e.g., is the client, assigned contractor, or admin).

8. **Clean up dead code** -- remove the 6 unused hooks, 5 unused services, orphaned page components, and ~30 unused style/variable definitions.

9. **Update CLAUDE.md structure** -- add the 20 unlisted feature components and fix the BrandBooklet path.

10. **Add error boundaries** -- many empty `catch {}` blocks (~27 instances) silently swallow errors with no user feedback.
