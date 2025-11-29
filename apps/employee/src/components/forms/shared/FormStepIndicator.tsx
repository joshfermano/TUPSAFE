/**
 * FormStepIndicator Component
 *
 * Modern, premium multi-step form progress indicator with TUP Manila crimson theme.
 * Designed for PDS and SALN form modules with smooth animations and accessibility.
 *
 * Features:
 * - Horizontal layout (desktop) / Vertical compact layout (mobile)
 * - Visual progress bar with completion percentage
 * - Step icons/numbers with checkmarks for completed steps
 * - Click navigation to previous steps (future steps disabled)
 * - Smooth transitions using Framer Motion
 * - Glass morphism effects for active step
 * - Magic UI components integration (NumberTicker, AnimatedGradientText, ShineBorder)
 * - Full keyboard navigation and ARIA labels
 * - Light/dark mode adaptive styling
 *
 * @example
 * ```tsx
 * <FormStepIndicator
 *   steps={[
 *     { id: 'personal', label: 'Personal Info', icon: User },
 *     { id: 'family', label: 'Family Background', icon: Users },
 *     { id: 'education', label: 'Education', icon: GraduationCap },
 *   ]}
 *   currentStep={1}
 *   onStepClick={(stepIndex) => console.log('Navigate to', stepIndex)}
 * />
 * ```
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { NumberTicker } from '../../ui/number-ticker';
import { AnimatedGradientText } from '../../ui/animated-gradient-text';
import { ShineBorder } from '../../ui/shine-border';

/**
 * Step definition interface
 */
export interface FormStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Optional description shown on hover or mobile */
  description?: string;
  /** Optional icon component */
  icon?: LucideIcon;
}

/**
 * FormStepIndicator component props
 */
export interface FormStepIndicatorProps {
  /** Array of step definitions */
  steps: FormStep[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Optional callback when a step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Optional array of completed step indices */
  completedSteps?: number[];
  /** Optional className for container customization */
  className?: string;
  /** Show step descriptions (default: false) */
  showDescriptions?: boolean;
  /** Compact mode for smaller spaces (default: false) */
  compact?: boolean;
}

// Animation variants extracted as constants for performance
const STEP_VARIANTS = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
} as const;

const CONNECTOR_VARIANTS = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1 },
} as const;

const CHECKMARK_VARIANTS = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  exit: { scale: 0, rotate: 180 },
} as const;

/**
 * FormStepIndicator Component
 *
 * Premium step indicator with smooth animations and accessibility features.
 * Optimized with React.memo for performance in multi-step forms.
 */
export const FormStepIndicator = React.memo<FormStepIndicatorProps>(
  ({
    steps,
    currentStep,
    onStepClick,
    completedSteps = [],
    className,
    showDescriptions = false,
    compact = false,
  }) => {
    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
      const completed = completedSteps.length;
      const total = steps.length;
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    }, [completedSteps.length, steps.length]);

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

    // Get step status for styling
    const getStepStatus = useCallback(
      (stepIndex: number) => {
        if (isStepCompleted(stepIndex)) return 'completed';
        if (stepIndex === currentStep) return 'active';
        if (stepIndex < currentStep) return 'previous';
        return 'upcoming';
      },
      [currentStep, isStepCompleted]
    );

    return (
      <div
        className={cn(
          'w-full theme-aware-container',
          compact ? 'py-4' : 'py-6',
          className
        )}
        role="navigation"
        aria-label="Form progress">
        {/* Progress Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">
              Form Progress
            </h3>
            <div className="flex items-baseline gap-2">
              <AnimatedGradientText
                className="text-2xl font-bold"
                speed={1.5}
                colorFrom="var(--primary)"
                colorTo="oklch(0.40 0.18 15)">
                <NumberTicker value={progressPercentage} />%
              </AnimatedGradientText>
              <span className="text-sm text-muted-foreground">
                ({completedSteps.length} of {steps.length} completed)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-tup"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* Step Indicators - Horizontal on desktop, vertical on mobile */}
        <div
          className={cn(
            'flex gap-4',
            'flex-col sm:flex-row sm:items-center sm:justify-between',
            compact && 'gap-2'
          )}>
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = isStepClickable(index);
            const isCompleted = isStepCompleted(index);
            const isActive = index === currentStep;
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                {/* Step Item */}
                <motion.div
                  className={cn(
                    'relative flex items-center gap-3 sm:flex-1',
                    'transition-all duration-200'
                  )}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={STEP_VARIANTS}
                  transition={{ delay: index * 0.1 }}>
                  {/* Step Circle/Icon */}
                  <motion.button
                    type="button"
                    className={cn(
                      'relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
                      'border-2 transition-all duration-300',
                      'focus-tup',
                      isClickable && 'cursor-pointer',
                      !isClickable && 'cursor-not-allowed opacity-50',
                      // Status-based styling
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground shadow-md',
                      isActive &&
                        !isCompleted &&
                        'border-primary bg-background text-primary shadow-lg',
                      status === 'upcoming' &&
                        'border-muted-foreground/30 bg-muted/30 text-muted-foreground',
                      // Hover effects
                      isClickable && 'hover:shadow-lg'
                    )}
                    onClick={() => handleStepClick(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    disabled={!isClickable}
                    whileHover={isClickable ? 'hover' : undefined}
                    whileTap={isClickable ? 'tap' : undefined}
                    variants={STEP_VARIANTS}
                    aria-label={`Step ${index + 1}: ${step.label}${
                      isCompleted ? ' (completed)' : ''
                    }${isActive ? ' (current)' : ''}`}
                    aria-current={isActive ? 'step' : undefined}>
                    {/* Active step shine border effect */}
                    {isActive && (
                      <ShineBorder
                        borderWidth={2}
                        duration={3}
                        shineColor={['var(--primary)', 'oklch(0.40 0.18 15)']}
                      />
                    )}

                    {/* Glass morphism overlay for active step */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full glass-tup" />
                    )}

                    {/* Step number or checkmark */}
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          variants={CHECKMARK_VARIANTS}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}>
                          <Check
                            className="h-6 w-6 relative z-10"
                            strokeWidth={3}
                          />
                        </motion.div>
                      ) : Icon ? (
                        <Icon className="h-6 w-6 relative z-10" />
                      ) : (
                        <span className="text-lg font-semibold relative z-10">
                          {index + 1}
                        </span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Step Label and Description */}
                  <div className="flex-1 min-w-0 sm:text-center">
                    <p
                      className={cn(
                        'text-sm font-medium transition-colors duration-200',
                        isActive && 'text-primary font-semibold',
                        isCompleted && 'text-foreground',
                        status === 'upcoming' && 'text-muted-foreground'
                      )}>
                      {step.label}
                    </p>
                    {showDescriptions && step.description && (
                      <p
                        className={cn(
                          'text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-1',
                          compact && 'hidden sm:block'
                        )}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Connector Line (hidden for last item and on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:px-2">
                    <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <motion.div
                        className={cn(
                          'absolute inset-y-0 left-0 h-full',
                          isStepCompleted(index)
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'
                        )}
                        variants={CONNECTOR_VARIANTS}
                        initial="initial"
                        animate="animate"
                        transition={{
                          delay: index * 0.1 + 0.2,
                          duration: 0.4,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile Progress Indicator (vertical line on left side) */}
        <div className="sm:hidden absolute left-6 top-0 bottom-0 w-0.5 bg-muted/50 -z-10">
          <motion.div
            className="absolute inset-x-0 top-0 bg-primary"
            initial={{ height: 0 }}
            animate={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }
);

FormStepIndicator.displayName = 'FormStepIndicator';
