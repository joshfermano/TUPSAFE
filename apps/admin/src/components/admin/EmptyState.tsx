import { memo, type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionConfig {
  /** Action button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional variant */
  variant?: 'default' | 'outline' | 'secondary';
}

interface EmptyStateProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Descriptive text */
  description: string | ReactNode;
  /** Optional action button */
  action?: ActionConfig;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmptyState Component
 *
 * Professional empty state placeholder with icon, title, description, and optional action.
 * Used when no data is available or a section is empty.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={FileText}
 *   title="No submissions yet"
 *   description="Create your first submission to get started."
 *   action={{
 *     label: 'Create Submission',
 *     onClick: () => router.push('/create'),
 *   }}
 * />
 * ```
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-4 min-h-[400px]',
        className,
      )}
    >
      <div className="mb-6 p-6 rounded-full bg-muted/50">
        <Icon className="h-16 w-16 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      <div className="text-muted-foreground max-w-md mb-6">
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          size="lg"
          className="transition-all hover:scale-105"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
