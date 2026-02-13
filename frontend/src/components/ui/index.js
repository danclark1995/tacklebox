/**
 * TackleBox UI Component Library — Barrel Export
 *
 * Single source of truth for all reusable UI components.
 * All imports should come from '@/components/ui'.
 *
 * Rules:
 * 1. No screen defines its own button, card, or input
 * 2. Consistent prop API: variant, size, disabled, className
 * 3. Design tokens are the single styling source
 * 4. New components go here first, then get used
 */

// Core Components
export { default as Button } from './Button'
export { default as ConfirmAction } from './ConfirmAction'
export { default as Input } from './Input'
export { default as Textarea } from './Textarea'
export { default as Select } from './Select'
export { default as Dropdown } from './Dropdown'
export { default as Toggle } from './Toggle'
export { default as DatePicker } from './DatePicker'
export { default as FileUpload } from './FileUpload'

// Layout & Display Components
export { default as Modal } from './Modal'
export { ToastProvider, useToast } from './Toast'
export { default as Badge } from './Badge'
export { default as StatusBadge } from './StatusBadge'
export { default as Avatar } from './Avatar'
export { default as Card } from './Card'
export { default as GlowCard } from './GlowCard'

// Data & Content Components
export { default as DataTable } from './DataTable'
export { default as Spinner } from './Spinner'
export { default as EmberLoader } from './EmberLoader'
export { default as Skeleton } from './Skeleton'
export { default as EmptyState } from './EmptyState'
export { default as PageHeader } from './PageHeader'
export { default as Tabs } from './Tabs'
export { default as ProgressBar } from './ProgressBar'
export { default as WaveProgressBar } from './WaveProgressBar'
export { default as SearchBar } from './SearchBar'
export { default as TaskProgressTracker } from './TaskProgressTracker'
export { default as ColourSwatch } from './ColourSwatch'
export { default as StarRating } from './StarRating'
export { default as SubNav } from './SubNav'
export { default as FilePreview } from './FilePreview'
export { default as FilePreviewModal } from './FilePreviewModal'

// Gamification Components
export { default as FlameIcon } from './FlameIcon'
export { default as CircleProgress } from './CircleProgress'
