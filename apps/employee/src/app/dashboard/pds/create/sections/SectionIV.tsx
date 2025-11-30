'use client';

/**
 * Section IV: Civil Service Eligibility & Work Experience
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 */

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
import { Checkbox } from '../../../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import { autoSortWithNotification } from '../../../../../lib/utils/pds-sort';

export const SectionIV = memo(function SectionIV() {
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
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section IV</p>
            <h2 className="text-2xl font-bold text-foreground">
              Civil Service Eligibility & Work Experience
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Civil service eligibility and employment history
            </p>
          </div>
        </div>
      </div>

      {/* Civil Service Eligibility Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Civil Service Eligibility
              </h3>
            </div>
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
              }
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Eligibility
            </Button>
          </div>

          {eligibilityFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Award className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No civil service eligibility added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Eligibility&quot; to add your eligibilities
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eligibilityFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Eligibility #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEligibility(index)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eligibility.${index}.eligibilityName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Eligibility Name{' '}
                          <span className="text-destructive">*</span>
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
                                  e.target.value
                                    ? parseFloat(e.target.value)
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
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
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
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
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

      {/* Work Experience Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Work Experience
                </h3>
                <p className="text-xs text-muted-foreground">
                  Include all relevant work experience (latest first)
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddWorkExperience}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>

          {workFields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No work experience added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Work Experience&quot; to add your employment
                history
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Work Experience #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWork(index)}
                      className="text-muted-foreground hover:text-destructive">
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
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
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
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value
                                    ? new Date(e.target.value)
                                    : null
                                );
                              }}
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
                            Position Title{' '}
                            <span className="text-destructive">*</span>
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
                            Department / Agency{' '}
                            <span className="text-destructive">*</span>
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
                                  e.target.value
                                    ? parseFloat(e.target.value)
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
                      name={`workExperience.${index}.salaryGrade`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Grade/Step (if gov&apos;t)</FormLabel>
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
                              <SelectItem value="Contractual">
                                Contractual
                              </SelectItem>
                              <SelectItem value="Casual">Casual</SelectItem>
                              <SelectItem value="Co-terminus">
                                Co-terminus
                              </SelectItem>
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

      {/* Info Notice - Clean, subtle styling */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Briefcase className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Work Experience Records
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            List your work experience starting from the most recent. Include all
            positions held, whether in government or private sector. Work
            experiences will be automatically sorted by date.
          </p>
        </div>
      </div>
    </div>
  );
});
