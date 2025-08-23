# Components Organization

This directory contains all React components organized by feature and purpose.

## Directory Structure

### `/auth`
Authentication-related components
- `auth-form.tsx` - Login/signup form
- `user-nav.tsx` - User navigation dropdown

### `/clients`
Client management components
- `client-list.tsx` - Client list display
- `client-modal.tsx` - Add/edit client modal
- `client-selector.tsx` - Client selection dropdown

### `/layout`
Page layout components
- `page-layout.tsx` - Main page wrapper with navigation
- `navigation.tsx` - App navigation bar

### `/meeting`
Meeting and coaching session components
- `batch-save-status.tsx` - Batch save status indicator
- `bot-status.tsx` - Recall bot connection status
- `coaching-panel.tsx` - Real-time coaching suggestions panel
- `debug-panel.tsx` - Debug information panel
- `meeting-error.tsx` - Meeting error display
- `meeting-form-simple.tsx` - Simple meeting URL form
- `meeting-loading.tsx` - Meeting loading state
- `meeting-state-panel.tsx` - Meeting state display
- `transcript-viewer.tsx` - Real-time transcript display
- `websocket-status.tsx` - WebSocket connection status

### `/sessions`
Session history components
- `session-card.tsx` - Session summary card

### `/ui`
Reusable UI components (Radix UI based)

#### Core Components
- `button.tsx` - Button component
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line text input
- `badge.tsx` - Status badges
- `alert.tsx` - Alert messages
- `toast.tsx` - Toast notifications

#### Navigation & Layout
- `dropdown-menu.tsx` - Dropdown menu
- `tabs.tsx` - Tab navigation
- `separator.tsx` - Visual separator
- `scroll-area.tsx` - Scrollable container

#### Data Display
- `avatar.tsx` - User avatar
- `progress.tsx` - Progress indicator
- `skeleton.tsx` - Loading skeleton
- `switch.tsx` - Toggle switch

#### Custom Components (New)
- `loading-spinner.tsx` - Animated loading spinner
- `loading-state.tsx` - Full loading state with message
- `empty-state.tsx` - Empty/error state display
- `page-header.tsx` - Page header with title and actions
- `section-header.tsx` - Section header with title
- `stat-card.tsx` - Statistics display card
- `client-card.tsx` - Client information card
- `action-button.tsx` - Button with icon
- `quick-actions.tsx` - Quick action buttons group

## Component Guidelines

1. **Naming Convention**: Use kebab-case for files, PascalCase for exports
2. **Organization**: Group components by feature/domain
3. **Reusability**: UI components should be generic and reusable
4. **Props**: Use TypeScript interfaces for all component props
5. **Styling**: Use Tailwind CSS classes with cn() utility for conditional styles

## Import Examples

```typescript
// Layout components
import PageLayout from '@/components/layout/page-layout'

// Meeting components
import { CoachingPanel } from '@/components/meeting/coaching-panel'

// UI components
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'

// Session components
import { SessionCard } from '@/components/sessions/session-card'
```