# TackleBox — Component Library Reference

> Every UI and feature component, its props, and when to use it.
> Updated: February 2026 | 35 UI components + 30 feature components

---

## Design System Rules

- **Black and white only.** Inverted neutral scale: `colours.neutral[50]` = darkest, `[900]` = white.
- **Brand accent:** `colours.brand.primary` (warm amber `#e5a44d`) for notifications, active states.
- **Status colours:** `colours.status.success/danger/warning/info` + muted variants for backgrounds.
- **Inline styles only.** No CSS modules, no className. Tokens from `@/config/tokens`.
- **Lucide icons only.** No other icon library.
- **Import from barrel:** `import { Button, Input, GlowCard } from '@/components/ui'`

---

## UI Components (`components/ui/`)

### Form Controls

#### Button
Primary action element with variant system and loading state.
```
variant:  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
size:     'sm' | 'md' | 'lg'
disabled: boolean
loading:  boolean — shows EmberLoader, disables interaction
icon:     ReactNode — rendered before children
fullWidth: boolean
type:     'button' | 'submit'
onClick:  function
```

#### Input
Text input with label, error state, and helper text.
```
label:       string — rendered above input
placeholder: string
value:       string
onChange:    function(e)
type:        'text' | 'email' | 'password' | 'number' | 'url'
error:       string — shown in red below input
disabled:    boolean
```

#### Textarea
Multi-line text input. Same API as Input plus:
```
rows:  number (default: 4)
error: string
```

#### Select
Native dropdown with label and option list.
```
label:       string
value:       string
onChange:    function(e)
options:     Array<{ value, label }>
placeholder: string
disabled:    boolean
error:       string
```

#### Dropdown
Custom styled dropdown with keyboard navigation and search filtering.
```
options:     Array<{ value, label }>
value:       any — matches option.value
onChange:    function(value)
placeholder: string
disabled:    boolean
searchable:  boolean
label:       string
```
**When to use:** Prefer Dropdown over Select for better UX. Use Select only in simple forms where native behaviour is preferred.

#### Toggle
On/off switch with label and helper text.
```
checked:    boolean
onChange:    function(checked)
label:      string
helperText: string
disabled:   boolean
```

#### DatePicker
Date input with optional min/max constraints.
```
label:    string
value:    string (ISO date)
onChange: function(e)
min:      string (ISO date)
max:      string (ISO date)
error:    string
```

#### FileUpload
Drag-and-drop file upload zone with preview.
```
onFilesSelected: function(files)
onUpload:        function
onCancel:        function
accept:          string (MIME types, default: '*')
multiple:        boolean
maxSize:         number (bytes)
```

#### SearchBar
Search input with submit handler and loading indicator.
```
value:       string
onChange:    function(e)
onSubmit:    function
placeholder: string
loading:     boolean
```

---

### Layout & Display

#### GlowCard
Primary container component. Dark surface with optional hover glow effect.
```
glow:        'none' | 'soft' | 'medium' | 'bright' | 'intense'
glowOnHover: boolean (default: true) — glow appears on hover
padding:     string (default: '20px')
onClick:     function
children:    ReactNode
```
**When to use:** Wrap any content section, dashboard card, or form group. This is the most-used container in the app.

#### Card
Simpler container than GlowCard, with padding presets and optional hover state.
```
padding:   'none' | 'sm' | 'md' | 'lg'
hover:     boolean — subtle lift effect on hover
onClick:   function
children:  ReactNode
```

#### Modal
Overlay dialog with backdrop click-to-close.
```
isOpen:   boolean
onClose:  function
title:    string
children: ReactNode
size:     'sm' | 'md' | 'lg' | 'xl'
```

#### PageHeader
Page title bar with optional subtitle, back link, and action buttons.
```
title:    string
subtitle: string
actions:  ReactNode — rendered right-aligned
backLink: string (route path) — renders back arrow
```

#### Tabs
Horizontal tab bar with active state indicator.
```
tabs:      Array<{ key, label }>
activeTab: string — matches tab.key
onChange:  function(key)
```

#### SubNav
Secondary navigation bar (used within pages for section switching).
```
items:  Array<{ key, label }>
active: string
onClick: function(key)
```

---

### Data Display

#### DataTable
Sortable, clickable data table with loading state.
```
columns:      Array<{ key, label, render?, sortable?, width? }>
data:         Array<object>
onRowClick:   function(row)
emptyMessage: string
loading:      boolean
sortable:     boolean
```
`columns[].render` is a function `(value, row) => ReactNode` for custom cell rendering.

#### Badge
Inline label/tag component.
```
variant:  'primary' | 'secondary' | 'success' | 'danger' | 'warning'
size:     'sm' | 'md'
children: ReactNode
```

#### StatusBadge
Task status chip with colour coding per status. Self-contained — just pass the status string.
```
status: string — one of: submitted, assigned, in_progress, review, revision, approved, closed, cancelled
```

#### Avatar
User avatar with fallback to initials.
```
src:  string (image URL) — falls back to initial circle
name: string — used for initials fallback
size: 'sm' | 'md' | 'lg' | 'xl'
```

#### ColourSwatch
Colour preview circle with optional hex label.
```
colour:  string (hex value)
name:    string
size:    'sm' | 'md'
showHex: boolean
```

#### StarRating
Interactive or read-only star rating (1-5).
```
value:    number
onChange: function(rating) — omit for read-only
size:     'sm' | 'md' | 'lg'
readOnly: boolean
```

---

### Progress & Loading

#### EmberLoader
Branded three-dot pulsing loader. The primary loading indicator.
```
size: 'sm' | 'md' | 'lg'
text: string — optional label below dots
```
**When to use:** Full-page loading states, button loading, section loading.

#### Spinner
Simple circular spinner. Alternative to EmberLoader for inline use.
```
size:   'sm' | 'md' | 'lg'
colour: string (default: white)
```

#### Skeleton
Content placeholder for loading states. Renders grey animated blocks.
```
width:   string (default: '100%')
height:  string (default: '20px')
variant: 'rect' | 'circle'
count:   number — renders multiple skeleton lines
```

#### ProgressBar
Horizontal progress bar with optional percentage label.
```
value:         number (0-100)
size:          'sm' | 'md' | 'lg'
colour:        string (default: white)
showLabel:     boolean — shows percentage text
```

#### WaveProgressBar
Animated progress bar with label and sublabel. Used for XP progress.
```
progress:       number (0-100)
label:          string — primary text (e.g. "Level 3")
sublabel:       string — secondary text (e.g. "450 / 1000 XP")
size:           'sm' | 'md' | 'lg'
showPercentage: boolean
```

#### TaskProgressTracker
Visual step indicator for task status pipeline. Shows all stages with current highlighted.
```
status: string — current task status
```
Renders: Submitted → Assigned → In Progress → Review → Approved → Closed. Handles revision and cancelled states specially.

#### CircleProgress
Radial level progress visualization used on the Journey page.
```
currentLevel: number
levels:       Array<{ level, name, min_xp }>
size:         number (px, default: 320)
showLabels:   boolean
```

---

### Feedback

#### Toast
Notification toast (managed via ToastProvider + useToast hook).
```
// Usage:
const { addToast } = useToast()
addToast('Task saved', 'success')  // variants: success, error, info, warning
```

#### ConfirmAction
Inline confirmation pattern — replaces a button with Confirm/Cancel on click. Auto-reverts after 5 seconds.
```
trigger:         ReactNode — the button that starts the flow
message:         string — optional confirmation text
confirmLabel:    string (default: 'Confirm')
cancelLabel:     string (default: 'Cancel')
confirmVariant:  string — Button variant for confirm
onConfirm:       function
```
**When to use:** Delete buttons, destructive actions. Avoids modal fatigue.

#### EmptyState
Placeholder for empty lists/sections.
```
icon:        ReactNode (Lucide icon)
title:       string
description: string
action:      ReactNode — optional CTA button
```

---

### File Handling

#### FilePreview
Thumbnail preview for uploaded files with name and click handler.
```
file:      object { filename, file_type, storage_path }
previewUrl: string
size:       'thumbnail' | 'large'
onClick:    function
showName:   boolean
```

#### FilePreviewModal
Full-screen file preview overlay with download button.
```
file:   object { filename, file_type, storage_path }
isOpen: boolean
onClose: function
```

---

### Gamification (Specialized)

#### FlameIcon
Animated flame icon that changes appearance based on camper level.
```
level:    number (1-12)
size:     'sm' | 'md' | 'lg'
animated: boolean
```

---

## Feature Components (`components/features/`)

### Tasks

| Component | Props | Purpose |
|-----------|-------|---------|
| **TaskForm** | onSubmit, projects, categories, templates, initialData, isAdmin, isClient, clientCredits | Full task creation/edit form with template auto-fill, pricing fields, credit cost preview |
| **TaskDetail** | task, comments, attachments, history, timeEntries, reviews, onStatusChange, onComment, onAttach, ... | Complete task view used by all three role-specific detail pages |
| **TaskCard** | task, onClick | Task summary card for lists — shows title, status badge, priority, deadline |
| **TaskList** | tasks, loading, filters, onFilterChange, onTaskClick, emptyMessage | Filterable task list with search, status tabs |
| **AIAssistantPanel** | task, brandProfile, onAttachmentAdded, complexityLevel | AI content generation panel embedded in task detail — social, document, presentation, ad |
| **AttachmentList** | attachments, onDelete, canDelete | File attachment grid with preview and delete |
| **ReviewSection** | reviews, taskId, onReviewSubmit, canReview | Star rating + text review display and submission |
| **TaskHistory** | history | Chronological audit log of task changes |
| **TimeLogSection** | entries, taskId, onAdd, onDelete, canLog | Time entry list with add/delete |

### Brand

| Component | Props | Purpose |
|-----------|-------|---------|
| **BrandProfileEditor** | profile, clientId, onSaveSection, onExtract, extracting, logos, onAddLogo, onDeleteLogo, saving | Multi-section brand editor (identity, voice, colours, logos, values, archetypes, pillars) |
| **BrandOnboarding** | (none — self-contained) | 6-step wizard: client details → brand identity → voice/tone → visual identity → strategy → review & submit |
| **BrandBooklet** | profile, logos | Print-ready brand booklet preview with all brand elements |
| **BrandGuideCard** | guide, onClick | Card preview for brand guide PDF files |
| **BrandGuidePDFViewer** | clientId, guidePath | In-browser PDF viewer with auth headers |

### Gamification

| Component | Props | Purpose |
|-----------|-------|---------|
| **XPBar** | xpData, compact | XP progress bar with level name and points |
| **BadgeGrid** | badges, compact | Grid of earned/unearned badges with descriptions |
| **Leaderboard** | entries, currentUserId, compact | Ranked list of top campers by XP |
| **FireStageTimeline** | levels, currentLevel | Vertical timeline of all 12 fire stages with descriptions |

### Notifications

| Component | Props | Purpose |
|-----------|-------|---------|
| **NotificationBell** | (none — self-contained) | Header bell icon with unread badge, dropdown feed, 30s polling, click-to-navigate, mark all read |
| **RecentNotifications** | limit | Dashboard notification feed — recent items with icons, click-to-navigate, auto-mark-as-read |

### Analytics

| Component | Props | Purpose |
|-----------|-------|---------|
| **StatCard** | label, value, icon, trend | Single metric display card for dashboards |

### Other

| Component | Props | Purpose |
|-----------|-------|---------|
| **ToolboxGrid** | (none) | Admin/camper AI tools grid with category cards |
| **PromptTips** | (none — self-contained) | Collapsible AI prompt best practices tips |
| **SearchDropdown** | results, onSelect, loading | Search results dropdown overlay |

---

## Layout Components

| Component | Purpose |
|-----------|---------|
| **MainLayout** | App shell — Sidebar + content area + NotificationBell header. Wraps all authenticated routes |
| **AuthLayout** | Centered card layout for login page |
| **Sidebar** | Role-based navigation, XP widget (contractors), support count badge (admin), credit balance (clients) |
| **ProtectedRoute** | Route guard — checks auth + role, redirects to /login or /forbidden |

---

## Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| **useAuth** | { user, login, logout, hasRole, loading } | Global auth state from AuthContext |
| **useToast** | { addToast } | Toast notification dispatch. `addToast(message, variant)` |

---

## Design Tokens (`config/tokens.js`)

```javascript
colours.neutral[50-900]     // 50=darkest (#0a0a0a) → 900=white (#ffffff)
colours.surface             // #111111 — card/panel backgrounds
colours.surfaceRaised       // #1a1a1a — elevated surfaces
colours.background          // #0a0a0a — page background
colours.brand.primary       // #e5a44d — amber accent
colours.status.success      // #4ade80 — green
colours.status.danger       // #f87171 — red
colours.status.warning      // #fbbf24 — yellow
colours.status.info         // #60a5fa — blue

glow.soft / .medium / .bright / .intense  // Box-shadow presets

spacing[0-24]               // 0 to 6rem
radii.sm / .md / .lg / .xl / .2xl / .full
typography.fontSize.xs → .4xl
typography.fontWeight.normal / .medium / .semibold / .bold
transitions.fast / .normal / .slow
shadows.sm / .md / .lg / .xl
zIndex.base / .dropdown / .sticky / .overlay / .modal / .toast
```
