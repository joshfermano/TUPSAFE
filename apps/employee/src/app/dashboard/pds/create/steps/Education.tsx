'use client';

import { memo, useEffect, useMemo } from 'react';
import { GraduationCap } from 'lucide-react';
import { useFormContext, type FieldPath } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { Separator } from '../../../../../components/ui/separator';
import { FormSection } from '../../../../../components/forms/shared/FormSection';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';

/**
 * Step 5: Educational Background
 * Elementary, Secondary, Vocational, College, and Graduate Studies
 */
export const Education = memo(function Education() {
  const form = useFormContext<CompletePdsData>();

  const educationLevels = useMemo(
    () => [
      { key: 'elementary', label: 'Elementary' },
      { key: 'secondary', label: 'Secondary' },
      { key: 'vocational', label: 'Vocational / Trade Course' },
      { key: 'college', label: 'College' },
      { key: 'graduate', label: 'Graduate Studies' },
    ],
    []
  );

  // Automatically set the level field when user fills in the school name
  useEffect(() => {
    educationLevels.forEach((level) => {
      const schoolName = form.watch(`education.${level.key}.schoolName` as FieldPath<CompletePdsData>);
      const currentLevel = form.getValues(`education.${level.key}.level` as FieldPath<CompletePdsData>);
      if (schoolName && !currentLevel) {
        form.setValue(
          `education.${level.key}.level` as FieldPath<CompletePdsData>,
          level.key as 'elementary' | 'secondary' | 'vocational' | 'college' | 'graduate'
        );
      }
    });
  }, [form, educationLevels]);

  return (
    <FormSection
      title="Educational Background"
      description="List your educational attainment from elementary to graduate studies"
      icon={GraduationCap}
      stepNumber={5}>
      <div className="space-y-8">
        {educationLevels.map((level, index) => (
          <div key={level.key}>
            {index > 0 && (
              <Separator className="mb-8 border-slate-200/50 dark:border-slate-800/50" />
            )}
            <h4 className="text-base font-medium text-foreground mb-6">
              {level.label}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name={
                  `education.${level.key}.schoolName` as FieldPath<CompletePdsData>
                }
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`e.g., ${
                          level.key === 'elementary'
                            ? 'Manila Elementary School'
                            : level.key === 'secondary'
                            ? 'Manila Science High School'
                            : 'Technological University of the Philippines'
                        }`}
                        {...field}
                        value={(field?.value as string) || ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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
                    <FormLabel>Period From</FormLabel>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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
                    <FormLabel>Period To</FormLabel>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={
                  `education.${level.key}.highestLevelEarned` as FieldPath<CompletePdsData>
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highest Level Earned</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="If not graduated (e.g., 4th Year)"
                        {...field}
                        value={(field?.value as string) || ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={
                  `education.${level.key}.honorsReceived` as FieldPath<CompletePdsData>
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honors Received</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Cum Laude, Dean's Lister"
                        {...field}
                        value={(field?.value as string) || ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
});
