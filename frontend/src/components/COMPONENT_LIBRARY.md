# Component Library

All UI elements must use these master components. Never build one-off versions.

Import from the barrel file:
```js
import { Button, GlowCard, Input } from '@/components/ui'
```

---

## UI Components (`@/components/ui/`)

### Button

Standard button with variants, sizes, and loading state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary'` \| `'secondary'` \| `'outline'` \| `'ghost'` \| `'danger'` | `'primary'` | Visual style |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Button size (32px / 40px / 48px) |
| disabled | `bool` | `false` | Disable interaction |
| loading | `bool` | `false` | Show EmberLoader, disable click |
| icon | `node` | `null` | Icon element to render before children |
| children | `node` | **required** | Button label |
| onClick | `func` | | Click handler |
| type | `'button'` \| `'submit'` \| `'reset'` | `'button'` | HTML button type |
| fullWidth | `bool` | `false` | Stretch to 100% width |
| className | `string` | `''` | CSS class |

**Variant styles:**
- `primary` -- white background, dark text
- `secondary` -- transparent, white text, grey border
- `outline` -- same as secondary
- `ghost` -- transparent, no border, muted text
- `danger` -- transparent, red text, red border

**Used in:** Every page and feature component.

---

### ConfirmAction

Inline confirmation pattern for destructive actions. Shows trigger element, then swaps to Confirm + Cancel buttons. Auto-reverts after 5 seconds.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| trigger | `node` | **required** | Element that starts the action |
| message | `string` | | Confirmation text above buttons |
| confirmLabel | `string` | `'Confirm'` | Confirm button label |
| cancelLabel | `string` | `'Cancel'` | Cancel button label |
| confirmVariant | `string` | `'primary'` | Button variant for confirm |
| onConfirm | `func` | | Called on confirm |
| onCancel | `func` | | Called on cancel |

**Used in:** Admin task/user management, delete actions.

---

### Input

Standard text input with label, icon, error, and sizing.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | | Label text |
| placeholder | `string` | `''` | Placeholder text |
| value | `string` | | Controlled value |
| onChange | `func` | | Change handler |
| type | `'text'` \| `'email'` \| `'password'` \| `'number'` | `'text'` | Input type |
| error | `string` | `''` | Error message |
| disabled | `bool` | `false` | Disable interaction |
| required | `bool` | `false` | Show required indicator |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Input size (32px / 40px / 48px) |
| icon | `node` | `null` | Icon element (renders left) |
| className | `string` | `''` | CSS class |

Spreads remaining props to the native `<input>` element.

**Used in:** TaskForm, ProjectForm, UserForm, BrandProfileEditor, login page.

---

### Textarea

Standard textarea with label, error, character counter, and resizable.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | | Label text |
| value | `string` | | Controlled value |
| onChange | `func` | | Change handler |
| rows | `number` | `4` | Visible rows |
| error | `string` | `''` | Error message |
| disabled | `bool` | `false` | Disable interaction |
| required | `bool` | `false` | Show required indicator |
| maxLength | `number` | `null` | Character limit (shows counter) |
| placeholder | `string` | `''` | Placeholder text |
| className | `string` | `''` | CSS class |

**Used in:** TaskForm, ProjectForm, BrandProfileEditor, comments, reviews.

---

### Select

Labelled dropdown select. Wraps the Dropdown component and synthesizes `{ target: { value } }` events for backward compatibility.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | | Label text |
| value | `string` \| `number` | | Selected value |
| onChange | `func` | | Receives synthetic `{ target: { value } }` |
| options | `[{ value, label }]` | `[]` | Option list |
| placeholder | `string` | `'Select an option'` | Placeholder text |
| error | `string` | `''` | Error message |
| disabled | `bool` | `false` | Disable interaction |
| required | `bool` | `false` | Show required indicator |
| className | `string` | `''` | CSS class |

**Used in:** TaskForm, ProjectForm, UserForm, filter bars, analytics.

---

### Dropdown

Custom select replacement with keyboard navigation, search highlighting, and animated dropdown menu.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| options | `[{ value, label }]` | `[]` | Option list |
| value | `string` \| `number` | | Selected value |
| onChange | `func` | | Receives raw value (not event) |
| placeholder | `string` | `'Select an option'` | Placeholder text |
| disabled | `bool` | `false` | Disable interaction |
| className | `string` | `''` | CSS class |
| style | `object` | | Style override |

Supports keyboard: ArrowDown/Up to navigate, Enter to select, Escape to close.

**Used in:** Wrapped by Select. Also used directly in BrandProfileEditor, AIAssistantPanel.

---

### Toggle

Boolean switch with label and helper text.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `bool` | `false` | Toggle state |
| onChange | `func` | | Receives new boolean value |
| label | `string` | | Label text |
| helperText | `string` | | Helper text below label |
| disabled | `bool` | `false` | Disable interaction |

**Used in:** TaskForm (campfire eligible), TaskDetail (internal comments).

---

### DatePicker

Date input with label, min/max constraints, and error display.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | | Label text |
| value | `string` | | ISO date string |
| onChange | `func` | | Receives date string value |
| min | `string` | `''` | Minimum date |
| max | `string` | `''` | Maximum date |
| error | `string` | `''` | Error message |
| disabled | `bool` | `false` | Disable interaction |
| required | `bool` | `false` | Show required indicator |
| className | `string` | `''` | CSS class |

**Used in:** TaskForm (deadline), TimeLogSection (date entry).

---

### FileUpload

Drag-and-drop file upload zone with progress tracking, chunked upload for large files (>100MB), and cancel support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onFilesSelected | `func` | | Called with array of selected File objects |
| onUpload | `func` | | Called with `(file, { onProgress, signal })` |
| onCancel | `func` | | Called with File when upload cancelled |
| accept | `string` | `'*'` | File type filter |
| multiple | `bool` | `false` | Allow multiple files |
| maxFiles | `number` | `10` | Maximum file count |
| maxSize | `number` | `5368709120` | Max file size in bytes (5GB) |
| disabled | `bool` | `false` | Disable interaction |
| className | `string` | `''` | CSS class |
| showUploadButton | `bool` | `false` | Show explicit upload button (vs auto-upload) |

Chunked upload activates at 100MB. Chunk size is 10MB.

**Used in:** TaskForm (attachments), AttachmentList, BrandProfileEditor (brand guide PDF).

---

### Modal

Dialog overlay with escape-to-close and click-outside-to-close.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `bool` | **required** | Show/hide modal |
| onClose | `func` | **required** | Close handler |
| title | `string` | **required** | Modal title |
| children | `node` | **required** | Modal body content |
| size | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Width (400/560/720/900px) |
| showCloseButton | `bool` | `true` | Show X close button |

Locks body scroll when open. Animations: fadeIn overlay, slideUp content.

**Used in:** TaskDetail (assign modal), UserForm, ProjectForm, FilePreviewModal.

---

### Toast / ToastProvider / useToast

Notification toast system. Wrap app in `<ToastProvider>`, use `useToast()` hook.

**Toast variants:** `'success'` | `'error'` | `'warning'` | `'info'`

**Hook API:**
```js
const toast = useToast()
toast.success('Task created')
toast.error('Something went wrong')
toast.warning('Approaching deadline')
toast.info('New comment added')
```

Toasts auto-dismiss after 5 seconds. Positioned top-right. Slide-in animation.

**Used in:** Every page via ToastContext.

---

### Badge

Label badge with variants and sizes.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `node` | **required** | Badge content |
| variant | `'primary'` \| `'secondary'` \| `'success'` \| `'warning'` \| `'error'` \| `'info'` \| `'neutral'` | `'primary'` | Visual style |
| size | `'sm'` \| `'md'` | `'md'` | Badge size |
| className | `string` | `''` | CSS class |

**Used in:** TaskCard (priority), Tabs (count), UserTable (role), BadgeGrid.

---

### StatusBadge

Task status badge. Maps task status to styled pill.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | `string` | **required** | Task status value from `TASK_STATUSES` |

Supported statuses: `submitted`, `assigned`, `in_progress`, `review`, `revision`, `approved`, `closed`, `cancelled`.

**Used in:** TaskCard, TaskDetail, TaskHistory, ProjectCard, SearchDropdown.

---

### Avatar

User avatar with image or initial fallback.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | `string` | | Image URL |
| name | `string` | | User name (for initials + colour) |
| size | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Size (32/40/56/80px) |
| className | `string` | `''` | CSS class |

Generates initials from name. Background colour deterministic from name hash.

**Used in:** TaskCard, TaskDetail (comments), UserTable, Sidebar.

---

### Card

Basic card container with optional hover effect.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `node` | **required** | Card content |
| padding | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Padding size |
| hover | `bool` | `false` | Enable hover lift + shadow |
| onClick | `func` | | Click handler |
| className | `string` | `''` | CSS class |

**Used in:** Light theme contexts. For dark theme, use GlowCard.

---

### GlowCard

Dark-themed card with configurable glow effect.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| glow | `'none'` \| `'soft'` \| `'medium'` \| `'bright'` \| `'intense'` | `'none'` | Base glow level |
| glowOnHover | `bool` | `true` | Show medium glow on hover |
| padding | `string` | `'20px'` | CSS padding value |
| className | `string` | `''` | CSS class |
| onClick | `func` | | Click handler |
| style | `object` | | Style override |
| children | `node` | | Card content |

Uses glow tokens from `@/config/tokens`. Dark background (#111111) with subtle border animation.

**Used in:** TaskCard, ProjectCard, BrandGuideCard, ToolboxGrid, BadgeGrid, StatCard, BrandBooklet.

---

### DataTable

Reusable table with loading skeletons and empty state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `[{ key, label, render?, sortable? }]` | **required** | Column definitions |
| data | `array` | `[]` | Row data |
| onRowClick | `func` | | Row click handler |
| emptyMessage | `string` | `'No data available'` | Empty state title |
| loading | `bool` | `false` | Show skeleton loading |
| className | `string` | `''` | CSS class |

Column `render(cellValue, row)` function enables custom cell rendering.

**Used in:** UserTable, analytics pages, admin management.

---

### Spinner

Simple CSS spinner.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Size (16/24/40px) |
| colour | `string` | `colours.neutral[900]` | Spinner colour |
| className | `string` | `''` | CSS class |

**Used in:** Inline loading indicators.

---

### EmberLoader

Animated loading dots (3 pulsing dots).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Dot size (4/6/8px) |
| text | `string` | | Loading text below dots |

**Used in:** Button (loading state), SearchBar (loading), CampfireLayout (empty), page loading states.

---

### Skeleton

Shimmer loading placeholder.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | `string` | `'100%'` | CSS width |
| height | `string` | `'20px'` | CSS height |
| variant | `'text'` \| `'circle'` \| `'rect'` | `'rect'` | Shape |
| count | `number` | `1` | Number of skeleton lines |
| className | `string` | `''` | CSS class |

**Used in:** DataTable (loading), TaskList (loading), ProjectList (loading).

---

### EmptyState

Empty state display with icon, title, description, and optional action button.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| icon | `node` | default info icon | Custom icon |
| title | `string` | | Title text |
| description | `string` | | Description text |
| action | `{ label: string, onClick: func }` | | Action button |
| className | `string` | `''` | CSS class |

**Used in:** DataTable (empty), TaskList (empty), ProjectList (empty), AttachmentList (empty).

---

### PageHeader

Page title with optional subtitle, back link, and action buttons.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | **required** | Page title |
| subtitle | `string` | | Subtitle text |
| actions | `node` | | Action buttons (right side) |
| backLink | `{ label: string, onClick: func }` | | Back navigation link |
| className | `string` | `''` | CSS class |

**Used in:** Every page-level component for the page heading.

---

### Tabs

Horizontal tab bar with optional count badges.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | `[{ key, label, count? }]` | **required** | Tab definitions |
| activeTab | `string` | **required** | Active tab key |
| onChange | `func` | **required** | Receives tab key |
| className | `string` | `''` | CSS class |

**Used in:** TaskDetail (overview/comments/attachments/time/reviews), admin pages.

---

### SubNav

Secondary horizontal tab bar with optional icons.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | `[{ key, label, icon? }]` | **required** | Tab definitions |
| activeTab | `string` | **required** | Active tab key |
| onChange | `func` | **required** | Receives tab key |

**Used in:** Admin dashboard sub-navigation, brand profile sections.

---

### ProgressBar

Simple progress bar with optional label.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `number` | `0` | Progress percentage (0-100) |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Bar height (4/8/12px) |
| colour | `string` | `colours.neutral[900]` | Fill colour |
| showLabel | `bool` | `false` | Show percentage text |
| className | `string` | `''` | CSS class |

**Used in:** Analytics pages.

---

### WaveProgressBar

Animated progress bar with gradient fill, edge glow, header label, and sublabel.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| progress | `number` | `0` | Progress percentage (0-100) |
| label | `string` | | Header label (left) |
| sublabel | `string` | | Footer text below bar |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Bar height (4/8/12px) |
| showPercentage | `bool` | `false` | Show percentage in header (right) |
| className | `string` | `''` | CSS class |

Gradient fill from #333333 to #ffffff. Glowing edge dot animates when in progress.

**Used in:** XPBar, ProjectCard, FileUpload (upload progress).

---

### SearchBar

Search input with icon, loading indicator, and Enter-to-submit.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | | Controlled value |
| onChange | `func` | | Change handler |
| onSubmit | `func` | | Called with value on Enter |
| placeholder | `string` | `'Search...'` | Placeholder text |
| loading | `bool` | `false` | Show loading dots |
| className | `string` | `''` | CSS class |

**Used in:** Search page, Sidebar search input.

---

### TaskProgressTracker

Horizontal step tracker showing task status progression through the state machine.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| status | `string` | **required** | Current task status |

Steps: Submitted > Assigned > In Progress > Review > Approved > Closed.
Shows revision indicator badge when status is `revision`.

**Used in:** TaskCard, TaskDetail.

---

### ColourSwatch

Colour display chip with optional name and hex value.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| colour | `string` | **required** | CSS colour value |
| name | `string` | | Colour name label |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Swatch size (24/36/48px) |
| showHex | `bool` | `false` | Show hex value below |
| className | `string` | `''` | CSS class |

**Used in:** BrandProfileView (colour palettes), BrandBooklet.

---

### StarRating

Interactive or read-only star rating.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `number` | `0` | Current rating |
| onChange | `func` | | Receives star number (1-based) |
| max | `number` | `5` | Number of stars |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Star size (16/24/32px) |
| readOnly | `bool` | `false` | Disable interaction |
| className | `string` | `''` | CSS class |

**Used in:** ReviewSection (difficulty/quality rating).

---

### FilePreview

Inline file preview with thumbnail for images, PDF icon, and generic file icon.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| file | `{ file_name, file_path?, file_type?, file_size? }` | | File object |
| previewUrl | `string` | | Override preview URL |
| size | `'thumbnail'` \| `'medium'` \| `'large'` | `'thumbnail'` | Preview size |
| onClick | `func` | | Click handler (receives file) |
| showName | `bool` | `true` | Show file name below |
| className | `string` | `''` | CSS class |

Size dimensions: thumbnail (80x80), medium (200x200), large (100% x 400).

**Used in:** AttachmentList (thumbnails).

---

### FilePreviewModal

Full-size file preview in a modal. Images shown full-size, PDFs in iframe, other files show download prompt.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| file | `{ file_name, file_path?, file_type?, file_size? }` | | File object |
| isOpen | `bool` | **required** | Show/hide modal |
| onClose | `func` | **required** | Close handler |

**Used in:** AttachmentList (click thumbnail to expand).

---

### FlameIcon

Animated flame icon using Lucide `Flame`. Glow intensity and animation speed scale with level.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| level | `number` | `1` | XP level (1-12, affects glow + speed) |
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Icon size (16/24/36px) |
| animated | `bool` | `true` | Enable shimmer + glow animations |

Glow intensity: L1-3 soft, L4-6 medium, L7-9 bright, L10-12 intense.

**Used in:** XPBar, Leaderboard, CircleProgress, FireStageTimeline.

---

### CircleProgress

12-point circular progression wheel. SVG-based with connecting lines, glow effects, and centred FlameIcon.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentLevel | `number` | `1` | Current XP level (1-12) |
| levels | `[{ level, name, description? }]` | `[]` | Level data (defaults to Level 1-12) |
| size | `number` | `320` | SVG size in pixels |
| showLabels | `bool` | `true` | Show level name labels |
| className | `string` | `''` | CSS class |

Points arranged clock-face: level 12 at top, clockwise. Completed levels filled, current glows, future outlined.

**Used in:** Camper journey page.

---

## Feature Components (`@/components/features/`)

### TaskCard

Compact task card for list views. Shows status, priority, complexity level, title, category, project, deadline, assigned contractor, and progress tracker.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| task | `object` | | Full task object with joined fields |
| onClick | `func` | | Click handler |

Uses GlowCard, StatusBadge, Badge, Avatar, TaskProgressTracker internally.
Hides complexity level from clients. Shows overdue indicator when deadline passed.

**Used in:** TaskList, CampfireLayout (campfire tasks).

---

### TaskList

Filterable task list rendering TaskCards with loading skeleton and empty state.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tasks | `array` | `[]` | Task objects |
| loading | `bool` | `false` | Show skeleton loading |
| filters | `object` | `{}` | Current filter values |
| onFilterChange | `func` | | Receives updated filters object |
| onTaskClick | `func` | | Task click handler |
| emptyTitle | `string` | `'No tasks found'` | Empty state title |
| emptyDescription | `string` | `'There are no tasks to display.'` | Empty state description |

**Used in:** Admin/client/camper task pages, ProjectDetail.

---

### TaskForm

Task creation/edit form. Template selection pre-fills fields.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSubmit | `func` | | Submit handler (receives form data) |
| projects | `array` | `[]` | Project options |
| categories | `array` | `[]` | Category options |
| templates | `array` | `[]` | Template options |
| initialData | `object` | `null` | Pre-fill data for editing |
| loading | `bool` | `false` | Disable form during save |
| clientId | `string` | `null` | Client ID (for client-created tasks) |
| isAdmin | `bool` | `false` | Show admin-only fields (campfire, complexity) |

Fields: project, category, template, title, description, priority, deadline, campfire_eligible, complexity_level, attachments.

**Used in:** Admin/client task creation pages.

---

### TaskDetail

Full task detail view with tabbed sections.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| task | `object` | | Full task object |
| comments | `array` | `[]` | Task comments |
| attachments | `array` | `[]` | Task attachments |
| history | `array` | `[]` | Status history entries |
| timeEntries | `array` | `[]` | Time log entries |
| reviews | `array` | `[]` | Post-task reviews |
| totalTimeMinutes | `number` | `0` | Total logged time |
| onStatusChange | `func` | | Status transition handler |
| onComment | `func` | | New comment handler |
| onFileUpload | `func` | | File upload handler |
| onDeleteAttachment | `func` | | Attachment delete handler |
| onAddTimeEntry | `func` | | Add time entry handler |
| onUpdateTimeEntry | `func` | | Update time entry handler |
| onDeleteTimeEntry | `func` | | Delete time entry handler |
| onSubmitReview | `func` | | Submit review handler |
| brandProfile | `object` | `null` | Brand profile for AI panel |
| loading | `bool` | `false` | Loading state |

Tabs: Overview, Comments, Attachments, Time Log, Reviews.
Role-aware: shows different actions per role. Client sees filtered comments. Contractor sees claim/pass for campfire tasks.

**Used in:** Admin/client/camper task detail pages.

---

### TaskHistory

Vertical timeline of task status history entries.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| history | `array` | `[]` | History entries `[{ id, from_status, to_status, changed_by_name, note, created_at }]` |

**Used in:** TaskDetail (overview tab).

---

### TimeLogSection

Time tracking section for task detail. Inline entry form, entry list with edit/delete.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Embedded in TaskDetail | | | Receives handlers via TaskDetail props |

Validates: 15-480 minutes, multiples of 15, min 5 char description. Shows total time header.

**Used in:** TaskDetail (time log tab).

---

### ReviewSection

Post-task review section. Different forms for contractor vs admin roles.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Embedded in TaskDetail | | | Receives handlers via TaskDetail props |

Contractor form: difficulty rating (1-5 stars), what went well, what to improve, blockers.
Admin form: quality rating (1-5 stars), time assessment, estimated future time, client feedback.

**Used in:** TaskDetail (reviews tab).

---

### AttachmentList

File attachment list with previews, grouped by upload type (submission / deliverable).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Embedded in TaskDetail | | | Receives handlers via TaskDetail props |

Thumbnail previews, click-to-expand modal, download/delete buttons. Upload zone for adding files.

**Used in:** TaskDetail (attachments tab).

---

### AIAssistantPanel

AI content generation panel supporting 4 content types.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Standalone page component | | | Uses API directly |

Content types:
- Social media image (platform + format + prompt)
- Document (document type + prompt + key points)
- Presentation (topic + audience + slides + tone)
- Ad creative (format + headline + CTA + offer)

Each generates branded content using the client's brand profile.

**Used in:** Admin/camper AI assistant pages.

---

### BrandBooklet

Interactive page-turn brand guide viewer. Keyboard navigation (left/right arrows).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| brandProfile | `object` | | Full brand profile object |
| clientName | `string` | | Display name |
| companyName | `string` | | Company name |
| logos | `array` | `[]` | Logo variants |
| onClose | `func` | | Close handler (null for inline) |
| inline | `bool` | `false` | Embed without overlay |

Pages built from brand profile data: cover, mission, story, values, colours, typography, voice, guidelines.

**Used in:** Admin/client brand hub pages.

---

### BrandProfileView

Magazine-style read-only brand profile display with full sections.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| profile | `object` | | Brand profile data |
| clientName | `string` | | Client display name |
| companyName | `string` | | Company name |
| logos | `array` | `[]` | Logo variants |

Sections: hero header, mission, identity, story, metaphors, values, archetypes, messaging, colours, typography, imagery, voice, guidelines.

**Used in:** Client brand hub, camper brand reference.

---

### BrandProfileEditor

Admin brand profile editor with section-based navigation and PDF extraction.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| profile | `object` | | Existing profile data |
| clientId | `string` | | Client ID |
| onSaveSection | `func` | | Save handler |
| onExtract | `func` | | PDF extract handler |
| extracting | `bool` | `false` | Extraction loading |
| logos | `array` | `[]` | Existing logos |
| onAddLogo | `func` | | Add logo handler |
| onDeleteLogo | `func` | | Delete logo handler |
| saving | `bool` | `false` | Save loading |

Sections: Identity, Mission, Story, Metaphors, Values, Archetypes, Messaging, Colours, Typography, Imagery, Logos, Brand Guide.

**Used in:** Admin brand profile edit page.

---

### BrandGuideCard

Brand guide document card with thumbnail, title, and actions.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| guide | `object` | | Guide object `{ title, file_type, file_path, created_at }` |
| onView | `func` | | View handler |
| onDelete | `func` | | Delete handler (admin only) |

**Used in:** Admin/client brand hub (guides section).

---

### BrandOnboarding

Multi-step client onboarding wizard for setting up brand profile.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Standalone page component | | | Uses API directly |

6 steps: Client Details, Brand Basics, Brand Story, Brand Identity, Messaging, Review & Create.

**Used in:** Client first-login onboarding flow.

---

### ToolboxGrid

3-column grid of external tool link cards. Opens links in new tab.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tools | `array` | `[]` | Tool link objects `[{ id, name, url, description?, icon_name? }]` |
| editable | `bool` | `false` | Show edit/delete buttons |
| onEdit | `func` | | Edit handler |
| onDelete | `func` | | Delete handler |

Icon mapping: link, pen-tool, layout, figma, book-open, hard-drive, message-square, video, image, palette, type, globe, code, music, camera, mic.

**Used in:** Admin/camper toolbox pages.

---

### ProjectCard

Project summary card with status, client name, progress bar.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| project | `object` | | Project object with `completed_count`, `task_count` |
| onClick | `func` | | Click handler |

**Used in:** ProjectList.

---

### ProjectList

Grid of ProjectCards with status filter.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| projects | `array` | `[]` | Project objects |
| loading | `bool` | `false` | Show skeleton loading |
| onProjectClick | `func` | | Project click handler |
| emptyTitle | `string` | `'No projects found'` | Empty state title |
| emptyDescription | `string` | `'There are no projects to display.'` | Empty state description |

**Used in:** Admin/client project pages.

---

### ProjectForm

Create/edit project form.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSubmit | `func` | | Submit handler (receives form data) |
| clients | `array` | `[]` | Client user options (admin only) |
| initialData | `object` | `null` | Pre-fill data for editing |
| loading | `bool` | `false` | Disable form during save |

Fields: name, description, client (admin only), status.

**Used in:** Admin project create/edit pages.

---

### ProjectDetail

Project detail view with embedded task list.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| project | `object` | | Project object |
| tasks | `array` | `[]` | Project tasks |
| loading | `bool` | `false` | Loading state |
| onTaskClick | `func` | | Task click handler |
| onEditProject | `func` | | Edit button handler |

**Used in:** Admin/client project detail pages.

---

### UserForm

Admin user create/edit form.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| user | `object` | `null` | Existing user (edit mode) |
| onSubmit | `func` | | Submit handler |
| loading | `bool` | `false` | Disable form during save |

Fields: display_name, email, role, company, password (create only).

**Used in:** Admin user management page.

---

### UserTable

Admin user management table built on DataTable.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| users | `array` | `[]` | User objects |
| loading | `bool` | `false` | Show skeleton loading |
| onEdit | `func` | | Edit handler |
| onDeactivate | `func` | | Deactivate handler |

Columns: user (avatar + name), email, role badge, status, created date, actions.

**Used in:** Admin user management page.

---

### StatCard

Analytics stat display card.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | **required** | Stat label |
| value | `string` \| `number` | **required** | Stat value |
| sublabel | `string` | | Additional context text |
| colour | `string` | | Accent colour for value + border |
| icon | `node` | | Icon element |

**Used in:** Admin analytics dashboard (task counts, turnaround times, etc).

---

### XPBar

XP progress display with flame icon, level name, progress bar, and rate info.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| xpData | `{ total_xp, current_level, current_level_details, next_level, xp_to_next_level }` | | XP profile data |
| compact | `bool` | `false` | Compact single-line mode |

**Used in:** Camper dashboard, camper journey page.

---

### Leaderboard

XP leaderboard table with rank, flame icons, and current user highlight.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| entries | `[{ rank, user_id, display_name, total_xp, current_level?, level_name?, tasks_completed? }]` | `[]` | Leaderboard data |
| currentUserId | `string` \| `number` | | Current user ID (for highlighting) |
| compact | `bool` | `false` | Show top 5 + self only |

**Used in:** Camper dashboard (compact), admin analytics (full).

---

### BadgeGrid

Grid of gamification badges with earned/locked states.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| badges | `[{ id, name, description?, icon_name?, earned?, awarded_at? }]` | `[]` | Badge data |
| compact | `bool` | `false` | Horizontal scroll of earned only |

Full mode: grid cards with lock overlay for unearned. Compact mode: horizontal row of earned badges.

**Used in:** Camper journey page, camper dashboard (compact).

---

### FireStageTimeline

Horizontal timeline showing fire stage progression through the 6 fire stages.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| currentStage | `string` | | Current fire stage name |
| currentLevel | `number` | `1` | Current XP level (for flame animation) |

Fire stages: Strike the Match, Find Kindling, Light First Flame, Feed the Fire, Build the Blaze, Choose Your Wood, Share the Warmth, Tend the Embers.

**Used in:** Camper journey page.

---

### CampfireLayout

Radial layout for campfire task display with centre content area.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | `array` | `[]` | Items to render |
| renderItem | `func` | | Render function `(item, index)` |
| centerContent | `node` | | Centre content element |
| emptyMessage | `string` | `'Nothing at the campfire'` | Empty state text |
| maxVisible | `number` | `8` | Maximum items to display |

**Used in:** Camper campfire page.

---

### SearchDropdown

Search results dropdown with categorized results (tasks, users, projects, brand guides).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| results | `object` | | Search results `{ tasks, users, projects, brand_guides, counts }` |
| query | `string` | | Current search query |
| loading | `bool` | | Loading state |
| isOpen | `bool` | | Show/hide dropdown |
| onClose | `func` | | Close handler |
| onNavigate | `func` | | Navigation handler |

**Used in:** Sidebar search, search page.

---

### PromptTips

Contextual prompt tips popover for AI content generation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| contentType | `'social_image'` \| `'document'` \| `'presentation'` \| `'ad_creative'` | | Content type |

Shows tips and example prompts for each content type. Positioned above the trigger icon.

**Used in:** AIAssistantPanel.

---

### OnboardingWizard

Multi-step client onboarding wizard.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| Standalone page component | | | Uses AuthContext + API directly |

6 steps: Welcome, Brand Profile, Tasks, Brand Hub, Support, Complete.
Marks `has_completed_onboarding` on the user record when finished.

**Used in:** Client post-login onboarding route.
