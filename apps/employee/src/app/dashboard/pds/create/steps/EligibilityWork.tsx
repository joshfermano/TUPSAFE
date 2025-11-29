'use client';

import { memo, useCallback } from 'react';
import { Briefcase, Plus, X, Award } from 'lucide-react';
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
import { Checkbox } from '../../../../../components/ui/checkbox';
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

/**
 * Step 6: Civil Service Eligibility & Work Experience
 */
export const EligibilityWork = memo(function EligibilityWork() {
  const form = useFormContext<CompletePdsData>();

  const {
    fields: eligibilityFields,
    append: appendEligibility,
    remove: removeEligibility,
  } = useFieldArray({
    control: form.control,
    name: 'eligibility',
  });

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
    replace: replaceWork,
  } = useFieldArray({
    control: form.control,
    name: 'workExperience',
  });

  /**
   * Auto-sort work experiences by date (latest first)
   * Shows a toast notification if items were reordered
   */
  const sortWorkExperiencesWithNotification = useCallback(() => {
    const currentWorkExperiences = form.getValues('workExperience');
    if (currentWorkExperiences.length <= 1) return;

    const { sorted, wasReordered } = autoSortWithNotification(
      currentWorkExperiences
    );
    if (wasReordered) {
      replaceWork(sorted);
      toast.info('Work experiences sorted by date (latest first)');
    }
  }, [form, replaceWork]);

  /**
   * Handle adding a new work experience entry
   * Adds the entry and then sorts all entries
   */
  const handleAddWorkExperience = useCallback(() => {
    appendWork({
      positionTitle: '',
      departmentAgency: '',
      monthlySalary: null,
      salaryGrade: '',
      statusOfAppointment: '',
      isGovernment: false,
      dateFrom: new Date(),
      dateTo: null,
    });
    // Sort after a small delay to ensure the new entry is added to the form state
    setTimeout(() => {
      sortWorkExperiencesWithNotification();
    }, 0);
  }, [appendWork, sortWorkExperiencesWithNotification]);

  /**
   * Handle blur event on date fields to trigger auto-sort
   */
  const handleDateBlur = useCallback(() => {
    sortWorkExperiencesWithNotification();
  }, [sortWorkExperiencesWithNotification]);

  return (
    <FormSection
      title="Eligibility & Work Experience"
      description="Civil service eligibility and employment history"
      icon={Briefcase}
      stepNumber={6}>
      <div className="space-y-8">
        {/* Civil Service Eligibility */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Civil Service Eligibility
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendEligibility({
                  eligibilityName: '',
                  rating: null,
                  dateOfExam: null,
                  placeOfExam: '',
                  licenseNo: '',
                  licenseValidityDate: null,
                })
              }>
              <Plus className="h-4 w-4 mr-2" />
              Add Eligibility
            </Button>
          </div>

          {eligibilityFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No civil service eligibility added yet
            </div>
          ) : (
            <div className="space-y-4">
              {eligibilityFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Eligibility #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEligibility(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eligibility.${index}.eligibilityName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Eligibility Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Career Service Professional"
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
                      name={`eligibility.${index}.rating`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating (if applicable)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="e.g., 85.50"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : null
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
                      name={`eligibility.${index}.dateOfExam`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Examination/Conferment</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? new Date(e.target.value) : null
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
                      name={`eligibility.${index}.placeOfExam`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place of Examination/Conferment</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Manila"
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
                      name={`eligibility.${index}.licenseNo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number (if applicable)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 1234567"
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
                      name={`eligibility.${index}.licenseValidityDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Validity Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? new Date(e.target.value) : null
                                )
                              }
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

        {/* Work Experience */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Work Experience
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddWorkExperience}>
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>

          {workFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No work experience added yet
            </div>
          ) : (
            <div className="space-y-4">
              {workFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Work Experience #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWork(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.dateFrom`}
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
                              onChange={(e) =>
                                field.onChange(new Date(e.target.value))
                              }
                              onBlur={handleDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.dateTo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To (leave blank if present)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? new Date(e.target.value) : null
                                )
                              }
                              onBlur={handleDateBlur}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.positionTitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Position Title <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Professor"
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
                      name={`workExperience.${index}.departmentAgency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Department / Agency <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., TUP Manila"
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
                      name={`workExperience.${index}.monthlySalary`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Salary (PHP)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 45000.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? parseFloat(e.target.value) : null
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
                      name={`workExperience.${index}.salaryGrade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Grade/Step (if gov't)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., SG-24 Step 1"
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
                      name={`workExperience.${index}.statusOfAppointment`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status of Appointment</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Permanent">Permanent</SelectItem>
                              <SelectItem value="Temporary">Temporary</SelectItem>
                              <SelectItem value="Contractual">Contractual</SelectItem>
                              <SelectItem value="Casual">Casual</SelectItem>
                              <SelectItem value="Co-terminus">Co-terminus</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.isGovernment`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border border-slate-200 dark:border-slate-800 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Government Service (Y/N)
                          </FormLabel>
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
