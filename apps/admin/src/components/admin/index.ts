/**
 * Admin UI Components
 *
 * Reusable components for the admin portal with clean, professional,
 * minimalistic design using shadcn/ui.
 *
 * @module components/admin
 */

export { StatusBadge, type StatusType } from './StatusBadge';
export { UserAvatar, type AvatarSize } from './UserAvatar';
export { StatCard } from './StatCard';
export { EmptyState } from './EmptyState';
export { LoadingCard, LoadingCardGrid } from './LoadingCard';
export { ErrorAlert } from './ErrorAlert';

// Dialog Components
export { ReviewDialog, type ReviewDialogProps } from './ReviewDialog';
export { ConfirmationDialog, type ConfirmationDialogProps } from './ConfirmationDialog';

// Section Components
export {
  SectionCard,
  SectionCardField,
  SectionCardGrid,
  type SectionCardProps,
} from './SectionCard';

// Timeline Component
export { Timeline, type TimelineEvent } from './Timeline';
