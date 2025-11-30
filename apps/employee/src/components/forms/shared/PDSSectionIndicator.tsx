'use client';

/**
 * PDS Section Indicator Component
 *
 * Design: Minimalistic, premium, professional
 * - Clean horizontal layout on desktop, vertical on mobile
 * - Visual progress bar with section completion
 * - Click navigation to previous sections
 * - Subtle animations using Framer Motion
 * - TUP Manila color theme (blue primary)
 * - Full keyboard navigation and ARIA labels
 * - Light/dark mode support
 * - Removed: ShineBorder (too flashy for government form)
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Section definition interface
 */
export interface PDSSection {
  /** Unique identifier for the section */
  id: string;
  /** Display label for the section (e.g., "Section I") */
  label: string;
  /** Section title (e.g., "Personal Information") */
  title: string;
  /** Optional icon component */
  icon?: LucideIcon;
}

/**
 * PDSSectionIndicator component props
 */
export interface PDSSectionIndicatorProps {
  /** Array of section definitions */
  sections: PDSSection[];
  /** Current active section index (0-based) */
  currentSection: number;
  /** Optional callback when a section is clicked */
  onSectionClick?: (sectionIndex: number) => void;
  /** Optional array of completed section indices */
  completedSections?: number[];
  /** Optional className for container customization */
  className?: string;
}

/**
 * PDSSectionIndicator Component
 *
 * Clean, minimalistic section indicator optimized for the PDS form.
 */
export const PDSSectionIndicator = React.memo<PDSSectionIndicatorProps>(
  ({
    sections,
    currentSection,
    onSectionClick,
    completedSections = [],
    className,
  }) => {
    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
      // Progress is based on current section + 1 (since we're on that section)
      const progress = Math.min(currentSection + 1, sections.length);
      return Math.round((progress / sections.length) * 100);
    }, [currentSection, sections.length]);

    // Check if a section is completed
    const isSectionCompleted = useCallback(
      (sectionIndex: number) => completedSections.includes(sectionIndex),
      [completedSections]
    );

    // Check if a section is clickable (current or previous sections only)
    const isSectionClickable = useCallback(
      (sectionIndex: number) => sectionIndex <= currentSection,
      [currentSection]
    );

    // Handle section click with accessibility
    const handleSectionClick = useCallback(
      (sectionIndex: number) => {
        if (isSectionClickable(sectionIndex) && onSectionClick) {
          onSectionClick(sectionIndex);
        }
      },
      [isSectionClickable, onSectionClick]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, sectionIndex: number) => {
        if (
          (e.key === 'Enter' || e.key === ' ') &&
          isSectionClickable(sectionIndex)
        ) {
          e.preventDefault();
          handleSectionClick(sectionIndex);
        }
      },
      [handleSectionClick, isSectionClickable]
    );

    return (
      <div
        className={cn('w-full', className)}
        role="navigation"
        aria-label="PDS form sections">
        {/* Progress Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Section Progress
            </span>
            <span className="text-lg font-bold text-primary">
              {currentSection + 1} / {sections.length}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {progressPercentage}% Complete
          </span>
        </div>

        {/* Progress Bar - Clean, solid design */}
        <div className="mb-6 relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        {/* Section Indicators - Horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-2 -mx-1">
          <div className="flex gap-2 min-w-max px-1">
            {sections.map((section, index) => {
              const isClickable = isSectionClickable(index);
              const isCompleted = isSectionCompleted(index);
              const isActive = index === currentSection;
              const Icon = section.icon;

              return (
                <motion.button
                  key={section.id}
                  type="button"
                  onClick={() => handleSectionClick(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2.5 rounded-lg',
                    'border transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50',
                    // Active state - clean, professional
                    isActive &&
                      'bg-primary/5 border-primary text-primary shadow-sm',
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
                  aria-label={`${section.label}: ${section.title}${
                    isCompleted ? ' (completed)' : ''
                  }${isActive ? ' (current)' : ''}`}
                  aria-current={isActive ? 'step' : undefined}>
                  {/* Section number/icon/check */}
                  <div
                    className={cn(
                      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                      'text-xs font-semibold transition-colors',
                      isActive &&
                        'bg-primary text-primary-foreground',
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

                  {/* Section label and title */}
                  <div className="text-left">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isActive && 'text-primary',
                        isCompleted && !isActive && 'text-emerald-600 dark:text-emerald-400',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}>
                      {section.label}
                    </p>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isActive && 'text-primary',
                        !isActive && 'text-foreground'
                      )}>
                      {section.title}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Current Section Display (Mobile) */}
        <div className="mt-4 sm:hidden">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              {currentSection + 1}
            </div>
            <div>
              <p className="text-xs font-medium text-primary">
                {sections[currentSection]?.label}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {sections[currentSection]?.title}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PDSSectionIndicator.displayName = 'PDSSectionIndicator';
