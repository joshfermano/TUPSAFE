'use client';

import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { LucideIcon, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { BlurFade } from '../../ui/blur-fade';

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
 * Reusable form section wrapper component with minimalistic, clean styling
 *
 * Features:
 * - Clean, breathable design with no heavy backgrounds
 * - Subtle left border accent for visual hierarchy
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
        className={cn(
          'relative',
          'pl-6 sm:pl-8 py-8 sm:py-10',
          'border-l-2',
          completed
            ? 'border-l-primary/40'
            : 'border-l-slate-200 dark:border-l-slate-800',
          'transition-all duration-300',
          'hover:border-l-primary/30',
          className
        )}>
        {/* Section Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Step Number */}
              {stepNumber !== undefined && (
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    completed
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'
                  )}>
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
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
                    completed
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100/50 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400'
                  )}>
                  <Icon className="h-5 w-5" />
                </div>
              )}

              {/* Title */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
                  className="border-amber-400/40 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-400/30">
                  Required
                </Badge>
              )}
              {completed && (
                <Badge
                  variant="default"
                  className="border-primary/30 bg-primary/10 text-primary dark:bg-primary/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="space-y-8 pr-2">{children}</div>
      </motion.div>
    </BlurFade>
  );
});
