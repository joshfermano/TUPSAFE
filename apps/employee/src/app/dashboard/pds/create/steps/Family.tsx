'use client';

import { memo } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormSection } from '@/components/forms/shared/FormSection';
import { type CompletePdsData, type Child } from '@/lib/validations/pds-schema';

/**
 * Step 4: Family Background
 * Includes spouse, parents, and children information
 */
export const Family = memo(function Family() {
  const form = useFormContext<CompletePdsData>();
  const civilStatus = form.watch('personalInfo.civilStatus');
  const isMarried = civilStatus === 'married' || civilStatus === 'widowed';

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'family.children',
  });

  return (
    <FormSection
      title="Family Background"
      description="Information about your spouse, parents, and children"
      icon={Users}
      stepNumber={4}
    >
      <div className="space-y-8">
        {/* Spouse Information */}
        {isMarried && (
          <>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-4">Spouse Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="family.spouseSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input placeholder="Surname" {...field} value={field.value || ''} />
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
                        <Input placeholder="First Name" {...field} value={field.value || ''} />
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
                        <Input placeholder="e.g., Teacher" {...field} value={field.value || ''} />
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Parents Information */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Parents Information</h4>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Father&apos;s Name</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="family.fatherSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input placeholder="Surname" {...field} value={field.value || ''} />
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
                        <Input placeholder="First Name" {...field} value={field.value || ''} />
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
                        <Input placeholder="Middle Name" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">Mother&apos;s Maiden Name</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="family.motherMaidenSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maiden Surname</FormLabel>
                      <FormControl>
                        <Input placeholder="Maiden Surname" {...field} value={field.value || ''} />
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
                        <Input placeholder="First Name" {...field} value={field.value || ''} />
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
                        <Input placeholder="Middle Name" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Children */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">
              Children (Maximum of 12)
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ fullName: '', dateOfBirth: new Date() })
              }
              disabled={fields.length >= 12}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No children added yet</p>
              <p className="text-xs mt-1">Click &quot;Add Child&quot; to add your children</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-4 items-start p-4 rounded-lg border border-border"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`family.children.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Juan Dela Cruz Jr." {...field} />
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
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split('T')[0]
                                  : ''
                              }
                              onChange={(e) => field.onChange(new Date(e.target.value))}
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
                    className="shrink-0"
                  >
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
