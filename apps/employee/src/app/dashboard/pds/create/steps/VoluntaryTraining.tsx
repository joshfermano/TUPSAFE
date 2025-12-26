'use client';

import { memo, useCallback } from 'react';
import { Heart, BookOpen, Plus, X } from 'lucide-react';
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
import { Separator } from '../../../../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { FormSection } from '../../../../../components/forms/shared/FormSection';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import { autoSortWithNotification } from '../../../../../lib/utils/pds-sort';
import { formatDateForInput, parseDateFromInput } from '../../../../../lib/utils/date-utils';

/**
 * Step 7: Voluntary Work & Learning Development
 */
export const VoluntaryTraining = memo(function VoluntaryTraining() {
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
   * Note: Dates start as null - user must explicitly fill them
   */
  const handleAddVoluntaryWork = useCallback(() => {
    appendVoluntary({
      organizationName: '',
      organizationAddress: '',
      dateFrom: null,
      dateTo: null,
      numberOfHours: null,
      positionNature: '',
    });
    // Sort after a brief delay to ensure the new entry is added
    setTimeout(sortVoluntaryWorkEntries, 100);
  }, [appendVoluntary, sortVoluntaryWorkEntries]);

  /**
   * Handle adding new training with auto-sort
   * Note: Dates start as null - user must explicitly fill them
   */
  const handleAddTraining = useCallback(() => {
    appendTraining({
      title: '',
      dateFrom: null,
      dateTo: null,
      hours: null,
      typeOfLd: '',
      conductedBy: '',
    });
    // Sort after a brief delay to ensure the new entry is added
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
    <FormSection
      title="Voluntary Work & Training"
      description="Voluntary work involvement and learning and development interventions"
      icon={Heart}
      stepNumber={7}>
      <div className="space-y-8">
        {/* Voluntary Work */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Voluntary Work or Involvement
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVoluntaryWork}>
              <Plus className="h-4 w-4 mr-2" />
              Add Voluntary Work
            </Button>
          </div>

          {voluntaryFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No voluntary work added yet
            </div>
          ) : (
            <div className="space-y-4">
              {voluntaryFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Voluntary Work #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVoluntary(index)}>
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
                            Organization Name <span className="text-destructive">*</span>
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
                              value={formatDateForInput(field.value as Date | null)}
                              onChange={(e) => {
                                field.onChange(parseDateFromInput(e.target.value));
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
                              value={formatDateForInput(field.value as Date | null)}
                              onChange={(e) => {
                                field.onChange(parseDateFromInput(e.target.value));
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Learning & Development */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Learning and Development Interventions
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTraining}>
              <Plus className="h-4 w-4 mr-2" />
              Add Training
            </Button>
          </div>

          {trainingFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No learning and development interventions added yet
            </div>
          ) : (
            <div className="space-y-4">
              {trainingFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Training #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTraining(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`learningDevelopment.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title of Training/Seminar <span className="text-destructive">*</span>
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
                              value={formatDateForInput(field.value as Date | null)}
                              onChange={(e) => {
                                field.onChange(parseDateFromInput(e.target.value));
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
                              value={formatDateForInput(field.value as Date | null)}
                              onChange={(e) => {
                                field.onChange(parseDateFromInput(e.target.value));
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
                              <SelectItem value="Managerial">Managerial</SelectItem>
                              <SelectItem value="Supervisory">Supervisory</SelectItem>
                              <SelectItem value="Technical">Technical</SelectItem>
                              <SelectItem value="Foundation">Foundation</SelectItem>
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
    </FormSection>
  );
});
