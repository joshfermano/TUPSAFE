'use client';

/**
 * SALN Step Indicator Component
 *
 * Design: Minimalistic, premium, professional
 * - Clean horizontal scroll layout (all 7 steps visible)
 * - Visual progress bar with step completion
 * - Click navigation to previous steps
 * - Subtle animations using Framer Motion
 * - TUP Manila color theme (amber primary for SALN)
 * - Full keyboard navigation and ARIA labels
 * - Light/dark mode support
 * - Optimized for 7-step SALN form
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Step definition interface
 */
export interface SALNStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step (e.g., "Declarant Info") */
  label: string;
  /** Step description */
  description?: string;
  /** Optional icon component */
  icon?: LucideIcon;
}

/**
 * SALNStepIndicator component props
 */
export interface SALNStepIndicatorProps {
  /** Array of step definitions */
  steps: SALNStep[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Optional callback when a step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Optional array of completed step indices */
  completedSteps?: number[];
  /** Optional className for container customization */
  className?: string;
  /** Progress percentage (0-100) based on actual form data */
  progressPercentage?: number;
}

/**
 * SALNStepIndicator Component
 *
 * Clean, minimalistic step indicator optimized for the 7-step SALN form.
 * Uses horizontal scroll on mobile to ensure all steps are accessible.
 */
export const SALNStepIndicator = React.memo<SALNStepIndicatorProps>(
  ({
    steps,
    currentStep,
    onStepClick,
    completedSteps = [],
    className,
    progressPercentage,
  }) => {
    // Calculate progress percentage if not provided
    const calculatedProgress = useMemo(() => {
      if (progressPercentage !== undefined) return progressPercentage;
      // Fallback: Calculate based on completed steps
      return Math.round((completedSteps.length / steps.length) * 100);
    }, [progressPercentage, completedSteps.length, steps.length]);

    // Check if a step is completed
    const isStepCompleted = useCallback(
      (stepIndex: number) => completedSteps.includes(stepIndex),
      [completedSteps]
    );

    // Check if a step is clickable (current or previous steps only)
    const isStepClickable = useCallback(
      (stepIndex: number) => stepIndex <= currentStep,
      [currentStep]
    );

    // Handle step click with accessibility
    const handleStepClick = useCallback(
      (stepIndex: number) => {
        if (isStepClickable(stepIndex) && onStepClick) {
          onStepClick(stepIndex);
        }
      },
      [isStepClickable, onStepClick]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, stepIndex: number) => {
        if (
          (e.key === 'Enter' || e.key === ' ') &&
          isStepClickable(stepIndex)
        ) {
          e.preventDefault();
          handleStepClick(stepIndex);
        }
      },
      [handleStepClick, isStepClickable]
    );

    return (
      <div
        className={cn('w-full', className)}
        role="navigation"
        aria-label="SALN form steps">
        {/* Progress Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Step Progress
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {calculatedProgress}% ({completedSteps.length} of {steps.length} completed)
          </span>
        </div>

        {/* Progress Bar - Clean, solid design with amber theme */}
        <div className="mb-6 relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${calculatedProgress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Step Indicators - Horizontal scroll on mobile, full width on desktop */}
        <div className="overflow-x-auto pb-2 -mx-1">
          <div className="flex gap-2 min-w-max px-1">
            {steps.map((step, index) => {
              const isClickable = isStepClickable(index);
              const isCompleted = isStepCompleted(index);
              const isActive = index === currentStep;
              const Icon = step.icon;

              return (
                <motion.button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex items-center gap-2 px-3 py-2.5 rounded-lg',
                    'border transition-all duration-200 flex-shrink-0',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50',
                    // Active state - amber theme
                    isActive &&
                      'bg-amber-50 border-amber-300 text-amber-700 shadow-sm dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400',
                    // Completed state
                    isCompleted &&
                      !isActive &&
                      'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800',
                    // Default state
                    !isActive &&
                      !isCompleted &&
                      'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
                    // Hover
                    isClickable &&
                      !isActive &&
                      'hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  )}
                  whileHover={isClickable ? { scale: 1.01 } : undefined}
                  whileTap={isClickable ? { scale: 0.99 } : undefined}
                  aria-label={`Step ${index + 1}: ${step.label}${
                    step.description ? ` - ${step.description}` : ''
                  }${isCompleted ? ' (completed)' : ''}${
                    isActive ? ' (current)' : ''
                  }`}
                  aria-current={isActive ? 'step' : undefined}>
                  {/* Step number/icon/check */}
                  <div
                    className={cn(
                      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                      'text-xs font-semibold transition-colors',
                      isActive &&
                        'bg-amber-600 text-white dark:bg-amber-500',
                      isCompleted &&
                        !isActive &&
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                      !isActive &&
                        !isCompleted &&
                        'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}>
                    {isCompleted && !isActive ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : Icon ? (
                      <Icon className="h-3.5 w-3.5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step label */}
                  <div className="text-left">
                    <p
                      className={cn(
                        'text-sm font-medium whitespace-nowrap',
                        isActive && 'text-amber-700 dark:text-amber-400',
                        isCompleted &&
                          !isActive &&
                          'text-emerald-600 dark:text-emerald-400',
                        !isActive &&
                          !isCompleted &&
                          'text-foreground'
                      )}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p
                        className={cn(
                          'text-xs text-muted-foreground whitespace-nowrap hidden md:block'
                        )}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Current Step Display (Mobile - Below scroll) */}
        <div className="mt-4 sm:hidden">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-white font-bold dark:bg-amber-500">
              {currentStep + 1}
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Current Step
              </p>
              <p className="text-sm font-semibold text-foreground">
                {steps[currentStep]?.label}
              </p>
              {steps[currentStep]?.description && (
                <p className="text-xs text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint for mobile (only show if steps overflow) */}
        <div className="mt-2 flex justify-center sm:hidden">
          <p className="text-xs text-muted-foreground">
            Swipe to see all steps
          </p>
        </div>
      </div>
    );
  }
);

SALNStepIndicator.displayName = 'SALNStepIndicator';
