'use client';

/**
 * Section V: Voluntary Work & Learning Development
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 */

import { memo, useCallback } from 'react';
import { Heart, BookOpen, Plus, X, GraduationCap } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { Button } from '../../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import { autoSortWithNotification } from '../../../../../lib/utils/pds-sort';

export const SectionV = memo(function SectionV() {
  const form = useFormContext<CompletePdsData>();

  const {
    fields: voluntaryFields,
    append: appendVoluntary,
    remove: removeVoluntary,
    replace: replaceVoluntary,
  } = useFieldArray({
    control: form.control,
    name: 'voluntaryWork',
  });

  const {
    fields: trainingFields,
    append: appendTraining,
    remove: removeTraining,
    replace: replaceTraining,
  } = useFieldArray({
    control: form.control,
    name: 'learningDevelopment',
  });

  /**
   * Sort voluntary work entries by date (latest first)
   */
  const sortVoluntaryWorkEntries = useCallback(() => {
    const currentValues = form.getValues('voluntaryWork');
    if (!currentValues || currentValues.length <= 1) return;

    const { sorted, wasReordered } = autoSortWithNotification(currentValues);
    if (wasReordered) {
      replaceVoluntary(sorted);
      toast.info('Voluntary work sorted by date (latest first)');
    }
  }, [form, replaceVoluntary]);

  /**
   * Sort training entries by date (latest first)
   */
  const sortTrainingEntries = useCallback(() => {
    const currentValues = form.getValues('learningDevelopment');
    if (!currentValues || currentValues.length <= 1) return;

    const { sorted, wasReordered } = autoSortWithNotification(currentValues);
    if (wasReordered) {
      replaceTraining(sorted);
      toast.info('Training programs sorted by date (latest first)');
    }
  }, [form, replaceTraining]);

  /**
   * Handle adding new voluntary work with auto-sort
   */
  const handleAddVoluntaryWork = useCallback(() => {
    appendVoluntary({
      organizationName: '',
      organizationAddress: '',
      dateFrom: new Date(),
      dateTo: null,
      numberOfHours: null,
      positionNature: '',
    });
    setTimeout(sortVoluntaryWorkEntries, 100);
  }, [appendVoluntary, sortVoluntaryWorkEntries]);

  /**
   * Handle adding new training with auto-sort
   */
  const handleAddTraining = useCallback(() => {
    appendTraining({
      title: '',
      dateFrom: new Date(),
      dateTo: new Date(),
      hours: null,
      typeOfLd: '',
      conductedBy: '',
    });
    setTimeout(sortTrainingEntries, 100);
  }, [appendTraining, sortTrainingEntries]);

  /**
   * Handle blur event on voluntary work date fields to trigger auto-sort
   */
  const handleVoluntaryDateBlur = useCallback(() => {
    sortVoluntaryWorkEntries();
  }, [sortVoluntaryWorkEntries]);

  /**
   * Handle blur event on training date fields to trigger auto-sort
   */
  const handleTrainingDateBlur = useCallback(() => {
    sortTrainingEntries();
  }, [sortTrainingEntries]);

  return (
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section V</p>
            <h2 className="text-2xl font-bold text-foreground">
              Voluntary Work & Learning Development
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Voluntary work involvement and training programs attended
            </p>
          </div>
        </div>
      </div>

      {/* Voluntary Work Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Voluntary Work or Involvement
                </h3>
                <p className="text-xs text-muted-foreground">
                  Civic/Non-Government/People/Voluntary Organizations
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVoluntaryWork}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Voluntary Work
            </Button>
          </div>

          {voluntaryFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No voluntary work added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Voluntary Work&quot; to add your volunteer
                experience
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {voluntaryFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Voluntary Work #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVoluntary(index)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`voluntaryWork.${index}.organizationName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Organization Name{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Red Cross Philippines"
                              {...field}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`voluntaryWork.${index}.organizationAddress`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Manila, Philippines"
                              {...field}
                              value={field.value ?? ''}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`voluntaryWork.${index}.dateFrom`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            From <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
                              onBlur={handleVoluntaryDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`voluntaryWork.${index}.dateTo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To (leave blank if ongoing)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
                              onBlur={handleVoluntaryDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`voluntaryWork.${index}.numberOfHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="e.g., 120"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
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
                      name={`voluntaryWork.${index}.positionNature`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position / Nature of Work</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Volunteer Coordinator"
                              {...field}
                              value={field.value ?? ''}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
          )}
        </div>
      </div>

      {/* Learning & Development Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Learning and Development Interventions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Training programs attended
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTraining}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Training
            </Button>
          </div>

          {trainingFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No learning and development interventions added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Training&quot; to add training programs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trainingFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Training #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTraining(index)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`learningDevelopment.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title of Training/Seminar{' '}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Advanced Teaching Methodologies"
                            {...field}
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
                      name={`learningDevelopment.${index}.dateFrom`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            From <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
                              onBlur={handleTrainingDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`learningDevelopment.${index}.dateTo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            To <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
                              onBlur={handleTrainingDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`learningDevelopment.${index}.hours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="e.g., 40"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : null
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
                      name={`learningDevelopment.${index}.typeOfLd`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type of L&D</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Managerial">
                                Managerial
                              </SelectItem>
                              <SelectItem value="Supervisory">
                                Supervisory
                              </SelectItem>
                              <SelectItem value="Technical">
                                Technical
                              </SelectItem>
                              <SelectItem value="Foundation">
                                Foundation
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`learningDevelopment.${index}.conductedBy`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Conducted / Sponsored By</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., CHED"
                              {...field}
                              value={field.value ?? ''}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
          )}
        </div>
      </div>

      {/* Info Notice - Clean, subtle styling */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Training & Voluntary Work Records
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Include all relevant training programs and voluntary work experience.
            Entries will be automatically sorted by date (latest first).
          </p>
        </div>
      </div>
    </div>
  );
});
