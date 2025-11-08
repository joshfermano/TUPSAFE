import { memo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();

  // Gentle icon animation variants
  const iconVariants = shouldReduceMotion
    ? {
        initial: { scale: 1 },
        animate: { scale: 1 },
        hover: { scale: 1 },
      }
    : {
        initial: { scale: 0.8, opacity: 0 },
        animate: {
          scale: 1,
          opacity: 1,
          transition: {
            duration: 0.4,
            ease: 'easeOut' as const,
          },
        },
        hover: {
          scale: 1.05,
          transition: {
            duration: 0.2,
            ease: 'easeInOut' as const,
          },
        },
      };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-20 px-6 min-h-[400px]',
        className,
      )}
    >
      <motion.div
        variants={iconVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className="mb-8 p-6 rounded-full bg-muted/50 backdrop-blur-sm"
      >
        <Icon className="h-16 w-16 text-muted-foreground" />
      </motion.div>

      <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">
        {title}
      </h3>

      <div className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>

      {action && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            size="lg"
            className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';
