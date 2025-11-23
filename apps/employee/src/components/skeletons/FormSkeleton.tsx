import React from 'react';

interface FormSkeletonProps {
  /**
   * Number of input fields to display
   * @default 5
   */
  fields?: number;
  /**
   * Whether to show section headers
   * @default false
   */
  hasSections?: boolean;
  /**
   * Whether to show form actions (buttons)
   * @default true
   */
  hasActions?: boolean;
  /**
   * Layout style
   * @default 'single'
   */
  layout?: 'single' | 'two-column' | 'mixed';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function FormSkeleton({
  fields = 5,
  hasSections = false,
  hasActions = true,
  layout = 'single',
  className = '',
}: FormSkeletonProps) {
  // Calculate fields distribution based on layout
  const getFieldsPerSection = () => {
    if (!hasSections) return [fields];

    // Divide fields into 2-3 sections
    const sectionCount = Math.min(3, Math.ceil(fields / 4));
    const fieldsPerSection = Math.ceil(fields / sectionCount);

    return Array.from({ length: sectionCount }, (_, i) => {
      const remaining = fields - i * fieldsPerSection;
      return Math.min(fieldsPerSection, remaining);
    });
  };

  const sections = getFieldsPerSection();

  return (
    <div className={`space-y-8 ${className}`}>
      {sections.map((sectionFieldCount, sectionIndex) => (
        <div
          key={sectionIndex}
          className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 md:p-8 overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

          {/* Section header */}
          {hasSections && (
            <div className="mb-6 space-y-2">
              <div className="h-6 w-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-4 w-96 max-w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
              <div className="h-px bg-gray-200 dark:bg-gray-800 mt-4" />
            </div>
          )}

          {/* Form fields */}
          <div
            className={
              layout === 'two-column'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                : layout === 'mixed'
                ? 'space-y-6'
                : 'space-y-6'
            }
          >
            {Array.from({ length: sectionFieldCount }).map((_, fieldIndex) => {
              // For mixed layout, make some fields full-width
              const isFullWidth = layout === 'mixed' && fieldIndex % 4 === 3;

              return (
                <div
                  key={fieldIndex}
                  className={`space-y-2 ${
                    isFullWidth ? 'md:col-span-2' : ''
                  }`}
                >
                  {/* Label */}
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"
                      style={{ width: `${80 + (fieldIndex % 3) * 20}px` }}
                    />
                    {/* Required indicator */}
                    {fieldIndex % 3 === 0 && (
                      <div className="h-4 w-4 rounded-full bg-red-200 dark:bg-red-900/50 animate-pulse" />
                    )}
                  </div>

                  {/* Input field */}
                  {fieldIndex % 5 === 4 ? (
                    // Textarea variant
                    <div className="h-24 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 animate-pulse" />
                  ) : fieldIndex % 5 === 3 ? (
                    // Select/dropdown variant
                    <div className="h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 animate-pulse flex items-center justify-between px-3">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                      <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    </div>
                  ) : (
                    // Regular input variant
                    <div className="h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 animate-pulse" />
                  )}

                  {/* Helper text (occasionally) */}
                  {fieldIndex % 4 === 0 && (
                    <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Form actions */}
      {hasActions && (
        <div className="flex items-center justify-between gap-4 pt-4">
          <div className="h-10 w-24 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
            <div className="h-10 w-32 rounded-lg bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-900 dark:to-blue-950 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Multi-step form skeleton
 */
export function MultiStepFormSkeleton({
  steps = 4,
  fieldsPerStep = 5,
}: {
  steps?: number;
  fieldsPerStep?: number;
}) {
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: steps }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2">
                {/* Step circle */}
                <div
                  className={`h-10 w-10 rounded-full animate-pulse ${
                    i === 0
                      ? 'bg-blue-200 dark:bg-blue-900'
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                />
                {/* Step label */}
                <div
                  className={`h-3 w-16 rounded animate-pulse ${
                    i === 0
                      ? 'bg-blue-100 dark:bg-blue-950'
                      : 'bg-gray-100 dark:bg-gray-900'
                  }`}
                />
              </div>
              {/* Connector line */}
              {i < steps - 1 && (
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form content */}
      <FormSkeleton
        fields={fieldsPerStep}
        hasSections={false}
        hasActions={true}
        layout="mixed"
      />
    </div>
  );
}

/**
 * Compact form skeleton for dialogs/modals
 */
export function CompactFormSkeleton({
  fields = 3,
}: Pick<FormSkeletonProps, 'fields'>) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2 mb-6">
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 w-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
        <div className="h-10 w-24 rounded-lg bg-blue-200 dark:bg-blue-900 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Login/Auth form skeleton
 */
export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-8">
      {/* Logo/Header */}
      <div className="flex flex-col items-center space-y-3 mb-8">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-900 dark:to-blue-950 animate-pulse" />
        <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-11 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Forgot password */}
      <div className="flex justify-end">
        <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
      </div>

      {/* Submit button */}
      <div className="h-11 rounded-lg bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-900 dark:to-blue-950 animate-pulse" />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <div className="h-4 w-8 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
        </div>
      </div>

      {/* Alternative action */}
      <div className="flex justify-center gap-2">
        <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-900 animate-pulse" />
        <div className="h-4 w-16 rounded bg-blue-200 dark:bg-blue-900 animate-pulse" />
      </div>
    </div>
  );
}
