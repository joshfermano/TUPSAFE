'use client';

import { memo, useMemo } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
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
import {
  type CompletePdsData,
} from '../../../../../lib/validations/pds-schema';
import { formatDateForInput, parseDateFromInput } from '../../../../../lib/utils/date-utils';

/**
 * Step 4: Family Background
 * Includes spouse, parents, and children information
 */
export const Family = memo(function Family() {
  const form = useFormContext<CompletePdsData>();
  const civilStatus = useMemo(
    () => form.watch('personalInfo.civilStatus'),
    [form]
  );
  const isMarried = useMemo(
    () => civilStatus === 'married' || civilStatus === 'widowed',
    [civilStatus]
  );

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'family.children',
  });

  return (
    <FormSection
      title="Family Background"
      description="Information about your spouse, parents, and children"
      icon={Users}
      stepNumber={4}>
      <div className="space-y-8">
        {/* Spouse Information */}
        {isMarried && (
          <>
            <div>
              <h4 className="text-base font-medium text-foreground mb-6">
                Spouse Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="family.spouseSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Surname"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Middle Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseNameExtension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name Extension/Suffix</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                            <SelectValue placeholder="None (if applicable)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Jr.">Jr.</SelectItem>
                          <SelectItem value="Sr.">Sr.</SelectItem>
                          <SelectItem value="II">II</SelectItem>
                          <SelectItem value="III">III</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="V">V</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseOccupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Teacher"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseEmployer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer/Business Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., TUP Manila"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseBusinessAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ayala Avenue, Makati City"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.spouseTelephoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone No.</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., (02) 1234-5678"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="border-slate-200/50 dark:border-slate-800/50" />
          </>
        )}

        {/* Parents Information */}
        <div>
          <h4 className="text-base font-medium text-foreground mb-6">
            Parents Information
          </h4>
          <div className="space-y-8">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Father&apos;s Name
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="family.fatherSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Surname"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.fatherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.fatherMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Middle Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.fatherNameExtension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name Extension/Suffix</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                            <SelectValue placeholder="None (if applicable)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Jr.">Jr.</SelectItem>
                          <SelectItem value="Sr.">Sr.</SelectItem>
                          <SelectItem value="II">II</SelectItem>
                          <SelectItem value="III">III</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="V">V</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Mother&apos;s Maiden Name
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="family.motherMaidenSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maiden Surname</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Maiden Surname"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.motherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="family.motherMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Middle Name"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Children */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground">
              Children (Maximum of 12)
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ fullName: '', dateOfBirth: null })}
              disabled={fields.length >= 12}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">
              <p className="text-sm">No children added yet</p>
              <p className="text-sm mt-1">
                Click &quot;Add Child&quot; to add your children
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-start p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`family.children.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Juan Dela Cruz Jr."
                              {...field}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`family.children.${index}.dateOfBirth`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={formatDateForInput(field.value as Date | null)}
                              onChange={(e) => {
                                field.onChange(parseDateFromInput(e.target.value));
                              }}
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
});
