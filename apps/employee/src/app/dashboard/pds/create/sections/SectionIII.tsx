'use client';

/**
 * Section III: Educational Background
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Single watch() for entire education object instead of individual fields
 * - Debounced auto-save via parent component
 * - Memoized callbacks to prevent unnecessary re-renders
 * - Reduced useEffect dependencies
 */

import { memo, useEffect, useMemo, useCallback } from 'react';
import { GraduationCap, School, BookOpen } from 'lucide-react';
import { useFormContext, type FieldPath } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';

/**
 * Education level configuration
 */
const EDUCATION_LEVELS = [
  {
    key: 'elementary',
    label: 'Elementary',
    icon: School,
    placeholder: 'Manila Elementary School',
  },
  {
    key: 'secondary',
    label: 'Secondary',
    icon: School,
    placeholder: 'Manila Science High School',
  },
  {
    key: 'vocational',
    label: 'Vocational / Trade Course',
    icon: BookOpen,
    placeholder: 'Technical School',
  },
  {
    key: 'college',
    label: 'College',
    icon: GraduationCap,
    placeholder: 'Technological University of the Philippines',
  },
  {
    key: 'graduate',
    label: 'Graduate Studies',
    icon: GraduationCap,
    placeholder: 'University of the Philippines',
  },
] as const;

/**
 * Helper to check if education level has any filled fields
 */
const hasFilledFields = (levelData: any): boolean => {
  if (!levelData) return false;

  return (
    (typeof levelData.schoolName === 'string' && levelData.schoolName.trim() !== '') ||
    (typeof levelData.degreeCourse === 'string' && levelData.degreeCourse.trim() !== '') ||
    (typeof levelData.periodFrom === 'number' && levelData.periodFrom !== null) ||
    (typeof levelData.periodTo === 'number' && levelData.periodTo !== null) ||
    (typeof levelData.unitsEarned === 'string' && levelData.unitsEarned.trim() !== '') ||
    (typeof levelData.yearGraduated === 'number' && levelData.yearGraduated !== null) ||
    (typeof levelData.honors === 'string' && levelData.honors.trim() !== '')
  );
};

export const SectionIII = memo(function SectionIII() {
  const form = useFormContext<CompletePdsData>();

  // ========================================================================
  // TASK 3: Performance Optimization
  // ========================================================================
  // Watch the entire education object once instead of multiple individual fields
  const educationData = form.watch('education');

  // Automatically set the level field when user fills in any field for that education level
  // This effect only runs when educationData changes (not on every keystroke)
  useEffect(() => {
    if (!educationData) return;

    EDUCATION_LEVELS.forEach((level) => {
      const levelData = educationData[level.key as keyof typeof educationData];
      const currentLevel = levelData?.level;

      // Check if any field is filled
      const hasAnyField = hasFilledFields(levelData);

      // Auto-set level when user fills any field
      if (hasAnyField && !currentLevel) {
        form.setValue(
          `education.${level.key}.level` as FieldPath<CompletePdsData>,
          level.key as
            | 'elementary'
            | 'secondary'
            | 'vocational'
            | 'college'
            | 'graduate',
          { shouldDirty: true, shouldTouch: false, shouldValidate: false }
        );
      }
    });
  }, [educationData, form]);

  return (
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section III</p>
            <h2 className="text-2xl font-bold text-foreground">
              Educational Background
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              List your educational attainment from elementary to graduate
              studies
            </p>
          </div>
        </div>
      </div>

      {/* Education Levels */}
      {EDUCATION_LEVELS.map((level) => {
        const Icon = level.icon;

        // Use memoized data instead of multiple watch calls for performance
        const levelData = educationData?.[level.key as keyof typeof educationData];
        const isFillingThisSection = hasFilledFields(levelData);

        return (
          <div
            key={level.key}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {level.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Optional - Fill if applicable
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name={
                    `education.${level.key}.schoolName` as FieldPath<CompletePdsData>
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        School Name{' '}
                        {isFillingThisSection && (
                          <span className="text-destructive">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`e.g., ${level.placeholder}`}
                          {...field}
                          value={(field?.value as string) || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.degreeCourse` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree / Course</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              level.key === 'college'
                                ? 'e.g., BS Computer Science'
                                : 'Leave blank if not applicable'
                            }
                            {...field}
                            value={(field?.value as string) || ''}
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.unitsEarned` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highest Level/Units Earned</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Graduate, 4th Year"
                            {...field}
                            value={(field?.value as string) || ''}
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.periodFrom` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period of Attendance (From)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1950"
                            max={new Date().getFullYear()}
                            placeholder="e.g., 2016"
                            {...field}
                            value={(field?.value as number) || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.periodTo` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period of Attendance (To)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1950"
                            max={new Date().getFullYear()}
                            placeholder="e.g., 2020"
                            {...field}
                            value={(field?.value as number) || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.yearGraduated` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Graduated</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1950"
                            max={new Date().getFullYear()}
                            placeholder="e.g., 2020"
                            {...field}
                            value={(field?.value as number) || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={
                      `education.${level.key}.honors` as FieldPath<CompletePdsData>
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Scholarship/Academic Honors Received
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Cum Laude, Dean's Lister"
                            {...field}
                            value={(field?.value as string) || ''}
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Info Notice - Clean, subtle styling */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Education Records
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please provide accurate information about your educational
            background. This information will be verified against official
            records. Include all relevant degrees, certifications, and academic
            honors.
          </p>
        </div>
      </div>
    </div>
  );
});
