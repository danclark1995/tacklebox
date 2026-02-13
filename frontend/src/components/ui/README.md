# TackleBox Master UI Components

All UI elements must use these master components. Never build one-off versions.

## Layout & Cards
- **GlowCard** — Standard card with configurable glow. Props: glow, glowOnHover, padding, onClick, children
- **Card** — Basic card container. Props: padding, children, className

## Form Controls
- **Input** — Standard text input. Props: value, onChange, placeholder, label, error, disabled, icon, size
- **Textarea** — Standard textarea. Props: value, onChange, placeholder, label, rows, error, maxLength
- **Select** — Dropdown select. Props: options, value, onChange, placeholder, label, disabled
- **Dropdown** — Custom select replacement. Props: options, value, onChange, placeholder
- **Toggle** — Boolean switch. Props: checked, onChange, label, helperText
- **DatePicker** — Date input. Props: value, onChange, disabled
- **FileUpload** — File upload zone. Props: onFilesChange, multiple, disabled, accept

## Buttons
- **Button** — Standard button. Props: variant ('primary'|'secondary'|'outline'|'ghost'|'danger'), size ('sm'|'md'|'lg'), icon, children, onClick, disabled, loading, type, fullWidth
- **ConfirmAction** — Inline confirmation pattern. Props: trigger, message, confirmLabel, cancelLabel, confirmVariant, onConfirm, onCancel

## Feedback
- **EmberLoader** — Loading dots. Props: size, text
- **Toast** — Notification toast (via ToastProvider + useToast hook)
- **Spinner** — Simple spinner. Props: size

## Data Display
- **DataTable** — Reusable table. Props: columns, data, onRowClick, loading, emptyMessage
- **Badge** — Label badge. Props: variant, children
- **StatusBadge** — Task status badge. Props: status, size
- **Avatar** — User avatar. Props: name, src, size
- **WaveProgressBar** — Progress bar. Props: progress, label, sublabel, size, showPercentage
- **ProgressBar** — Simple progress bar. Props: progress, size
- **TaskProgressTracker** — Status step tracker. Props: status
- **ColourSwatch** — Colour display chip. Props: colour, size
- **StarRating** — Rating display. Props: rating, size
- **Skeleton** — Loading placeholder. Props: height, width, count

## Navigation
- **Tabs** — Horizontal tab bar. Props: tabs, activeTab, onChange
- **SubNav** — Secondary tab bar. Props: tabs, activeTab, onTabChange
- **PageHeader** — Page title with optional actions. Props: title, actions
- **SearchBar** — Search input. Props: value, onChange, placeholder

## Modal & Overlay
- **Modal** — Dialog overlay. Props: isOpen, onClose, title, size, children

## File Handling
- **FilePreview** — Inline file preview. Props: file, onRemove
- **FilePreviewModal** — Full preview overlay. Props: file, isOpen, onClose

## Gamification
- **FlameIcon** — Animated flame. Props: level, size, animated
- **CircleProgress** — 12-point progression wheel. Props: currentLevel, levels, size, showLabels

## Feature Components (src/components/features/)
- **BrandBooklet** — Page-turn brand guide viewer. Props: brandProfile, clientName, companyName, logos, onClose, inline
- **BrandProfileView** — Full brand profile read-only display
- **BrandProfileEditor** — Admin brand profile editor
- **ToolboxGrid** — External tool link grid
- **AIAssistantPanel** — AI generation panel
- **TaskDetail** — Shared task detail view
- **TaskCard** — Compact task card
- **TaskList** — Task list with cards
- **TaskForm** — Task creation/edit form

## Usage

Import from the barrel file:
```js
import { Button, GlowCard, ConfirmAction } from '@/components/ui'
```
