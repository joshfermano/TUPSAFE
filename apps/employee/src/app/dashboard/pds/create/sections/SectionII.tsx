'use client';

/**
 * Section II: Family Background
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 */

import { memo, useMemo } from 'react';
import { Users, Plus, X, Heart, UserCircle } from 'lucide-react';
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
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';

export const SectionII = memo(function SectionII() {
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
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section II</p>
            <h2 className="text-2xl font-bold text-foreground">
              Family Background
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Information about your spouse, parents, and children
            </p>
          </div>
        </div>
      </div>

      {/* Spouse Information Card */}
      {isMarried && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Spouse Information
              </h3>
            </div>

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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                    <FormLabel>Name Extension</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Jr., Sr."
                        {...field}
                        value={field.value || ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        placeholder="Complete business address"
                        {...field}
                        value={field.value || ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        placeholder="+63-2-8123-4567"
                        {...field}
                        value={field.value || ''}
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
      )}

      {/* Parents Information Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Parents Information
            </h3>
          </div>

          {/* Father's Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Father&apos;s Name
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="border-slate-200 dark:border-slate-800" />

          {/* Mother's Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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

      {/* Children Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Children
              </h3>
              <span className="text-sm text-muted-foreground">
                (Maximum of 12)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ fullName: '', dateOfBirth: new Date() })}
              disabled={fields.length >= 12}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No children added yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add Child&quot; to add your children
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-start p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                          <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
