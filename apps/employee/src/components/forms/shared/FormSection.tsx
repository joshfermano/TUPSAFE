'use client';

import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BlurFade } from '@/components/ui/blur-fade';

interface FormSectionProps {
  /**
   * Section title displayed at the top
   */
  title: string;

  /**
   * Optional description text below the title
   */
  description?: string;

  /**
   * Form fields and content
   */
  children: ReactNode;

  /**
   * Optional icon to display next to title
   */
  icon?: LucideIcon;

  /**
   * Whether this section is required to complete the form
   */
  required?: boolean;

  /**
   * Whether this section is completed (for progress tracking)
   */
  completed?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Optional step number for multi-step forms
   */
  stepNumber?: number;
}

/**
 * Reusable form section wrapper component with clean card styling
 *
 * Features:
 * - Clean, readable design without distracting effects
 * - Optional icon and step number display
 * - Completion status indicator
 * - Required field badge
 * - Optimized with React.memo
 */
export const FormSection = memo<FormSectionProps>(function FormSection({
  title,
  description,
  children,
  icon: Icon,
  required = false,
  completed = false,
  className,
  stepNumber,
}) {
  return (
    <BlurFade delay={0.1} inView>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card
          className={cn(
            'p-6 sm:p-8',
            'bg-white dark:bg-slate-900',
            'border border-slate-200 dark:border-slate-800',
            'transition-all duration-300',
            'hover:border-primary/20 hover:shadow-sm',
            completed && 'border-primary/30 shadow-sm',
            className
          )}
        >
      {/* Section Header */}
      <div className="mb-6 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Step Number */}
            {stepNumber !== undefined && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
            )}

            {/* Icon */}
            {Icon && (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  completed
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary/10 text-primary/70'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}

            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            {required && !completed && (
              <Badge
                variant="outline"
                className="border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
              >
                Required
              </Badge>
            )}
            {completed && (
              <Badge
                variant="default"
                className="border-primary/50 bg-primary/10 text-primary"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="space-y-6">{children}</div>
        </Card>
      </motion.div>
    </BlurFade>
  );
});
