'use client';

import * as React from 'react';
import { ChevronDown, Edit } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  /** Section title */
  title: string;
  /** Optional icon to display before title */
  icon?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** If true, section can be collapsed/expanded (default: false) */
  collapsible?: boolean;
  /** If true, section starts collapsed (default: false) */
  defaultCollapsed?: boolean;
  /** Callback when edit button is clicked */
  onEdit?: () => void;
  /** Label for edit button (default: "Edit") */
  editLabel?: string;
  /** Additional CSS classes for the card */
  className?: string;
}

/**
 * SectionCard Component
 *
 * Reusable card component for displaying form sections in view pages.
 *
 * Features:
 * - Card with optional icon and title
 * - Content area with proper spacing
 * - Optional collapse/expand functionality with smooth animation
 * - Optional edit button in header
 * - Keyboard shortcuts (Enter/Space to toggle collapse)
 * - Professional shadcn/ui styling
 * - Dark mode support
 * - Accessible focus management and ARIA attributes
 * - Customizable className for flexibility
 *
 * @example
 * ```tsx
 * // Simple section card
 * <SectionCard title="Personal Information" icon={<User className="h-5 w-5" />}>
 *   <div className="grid gap-4">
 *     <div>
 *       <dt className="text-sm text-muted-foreground">Full Name</dt>
 *       <dd className="text-base font-medium">John Doe</dd>
 *     </div>
 *   </div>
 * </SectionCard>
 *
 * // Collapsible section with edit
 * <SectionCard
 *   title="Educational Background"
 *   icon={<GraduationCap className="h-5 w-5" />}
 *   collapsible
 *   defaultCollapsed
 *   onEdit={() => router.push('/edit')}
 *   editLabel="Edit Education"
 * >
 *   {educationContent}
 * </SectionCard>
 * ```
 */
export function SectionCard({
  title,
  icon,
  children,
  collapsible = false,
  defaultCollapsed = false,
  onEdit,
  editLabel = 'Edit',
  className,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Toggle collapse state
  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed((prev) => !prev);
    }
  };

  // Handle keyboard events for collapse toggle
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleCollapse();
    }
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-200', className)}>
      <CardHeader
        className={cn(
          'border-b',
          collapsible && 'cursor-pointer select-none hover:bg-muted/50 transition-colors'
        )}
        onClick={collapsible ? toggleCollapse : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={collapsible ? 0 : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
        aria-label={collapsible ? `${isCollapsed ? 'Expand' : 'Collapse'} ${title}` : undefined}
      >
        <div className="flex items-center gap-3">
          {/* Optional Icon */}
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              {icon}
            </div>
          )}

          {/* Title */}
          <CardTitle className="flex-1 text-lg">{title}</CardTitle>

          {/* Actions */}
          {(collapsible || onEdit) && (
            <CardAction className="flex items-center gap-2">
              {/* Edit Button */}
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent collapse toggle when clicking edit
                    onEdit();
                  }}
                  className="gap-2"
                  aria-label={editLabel}
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">{editLabel}</span>
                </Button>
              )}

              {/* Collapse Toggle */}
              {collapsible && (
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 text-muted-foreground',
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  )}
                  aria-hidden="true"
                />
              )}
            </CardAction>
          )}
        </div>
      </CardHeader>

      {/* Content with collapse animation */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-6">{children}</CardContent>
        </div>
      </div>
    </Card>
  );
}

/**
 * SectionCardField Component
 *
 * Helper component for displaying labeled fields within a SectionCard.
 *
 * @example
 * ```tsx
 * <SectionCard title="Personal Information">
 *   <div className="grid gap-4 sm:grid-cols-2">
 *     <SectionCardField label="First Name" value="John" />
 *     <SectionCardField label="Last Name" value="Doe" />
 *   </div>
 * </SectionCard>
 * ```
 */
export function SectionCardField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </dd>
    </div>
  );
}

/**
 * SectionCardGrid Component
 *
 * Helper component for creating responsive grid layouts within a SectionCard.
 *
 * @example
 * ```tsx
 * <SectionCard title="Contact Information">
 *   <SectionCardGrid>
 *     <SectionCardField label="Email" value="john@example.com" />
 *     <SectionCardField label="Phone" value="+63 912 345 6789" />
 *   </SectionCardGrid>
 * </SectionCard>
 * ```
 */
export function SectionCardGrid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'sm:grid-cols-1': columns === 1,
          'sm:grid-cols-2': columns === 2,
          'sm:grid-cols-3': columns === 3,
          'sm:grid-cols-4': columns === 4,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
