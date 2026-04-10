'use client';

import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { User, Calendar, Shield } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../../../../../components/ui/form';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '../../../../../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Separator } from '../../../../../components/ui/separator';
import { FormSection } from '../../../../../components/forms/shared/FormSection';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import { FormDateInput } from '../../../../../components/forms/shared/FormDateInput';

/**
 * Step 1: Personal Information - Basic Details
 * Includes name, birth info, physical characteristics, government IDs, and citizenship
 */
export const PersonalBasic = memo(function PersonalBasic() {
  const form = useFormContext<CompletePdsData>();
  const citizenshipType = useMemo(
    () => form.watch('personalInfo.citizenship.type'),
    [form]
  );
  const citizenshipAcquisitionMethod = useMemo(
    () => form.watch('personalInfo.citizenship.acquisitionMethod'),
    [form]
  );

  return (
    <FormSection
      title="Personal Information - Basic Details"
      description="Complete your basic personal information as it appears in official documents"
      icon={User}
      required={true}
      stepNumber={1}>
      <div className="space-y-8">
        {/* Name Fields */}
        <div>
          <h4 className="text-base font-medium text-foreground mb-6">
            Full Name
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personalInfo.surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Surname <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Dela Cruz"
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
              name="personalInfo.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    First Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Juan"
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
              name="personalInfo.middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Santos"
                      {...field}
                      value={field.value || ''}
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Leave blank if none
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.nameExtension"
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
                      <SelectItem value="I">I</SelectItem>
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Birth Information */}
        <div>
          <h4 className="text-base font-medium text-foreground flex items-center gap-2 mb-6">
            <Calendar className="h-4 w-4 text-primary" />
            Birth Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormDateInput
              control={form.control}
              name="personalInfo.dateOfBirth"
              label="Date of Birth"
              required
            />

            <FormField
              control={form.control}
              name="personalInfo.placeOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Place of Birth <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Manila, Philippines"
                      {...field}
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

        {/* Personal Characteristics */}
        <div>
          <h4 className="text-base font-medium text-foreground mb-6">
            Personal Characteristics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personalInfo.sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sex <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer">
                            Male
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer">
                            Female
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.civilStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Civil Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                        <SelectValue placeholder="Select civil status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.heightM"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (meters)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="2.5"
                      placeholder="e.g., 1.70"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Optional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      placeholder="e.g., 65"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Optional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.bloodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                        <SelectValue placeholder="Unknown / Not specified" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Optional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Government IDs */}
        <div>
          <h4 className="text-base font-medium text-foreground flex items-center gap-2 mb-6">
            <Shield className="h-4 w-4 text-primary" />
            Government Identification Numbers
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Provide at least one government ID number for verification purposes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personalInfo.gsisNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSIS ID No.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 12-3456789-0"
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
              name="personalInfo.pagibigNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAG-IBIG ID No.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1234-5678-9012"
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
              name="personalInfo.philhealthNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilHealth No.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 12-345678901-2"
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
              name="personalInfo.sssNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSS No.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 34-5678901-2"
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
              name="personalInfo.tinNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 123-456-789-000"
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
              name="personalInfo.agencyEmployeeNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Employee No.</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="TUP Employee Number"
                      {...field}
                      value={field.value || ''}
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Your TUP Manila employee ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.philsysNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PhilSys Number (PSN)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 12-345678901-2"
                      {...field}
                      value={field.value || ''}
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Philippine Identification System Number (Format: XX-XXXXXXXXX-X)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Citizenship */}
        <div>
          <h4 className="text-base font-medium text-foreground mb-6">
            Citizenship
          </h4>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="personalInfo.citizenship.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Citizenship <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Clear dual citizenship fields when switching to Filipino
                        if (value === 'Filipino') {
                          form.setValue('personalInfo.citizenship.acquisitionMethod', undefined);
                          form.setValue('personalInfo.citizenship.country', undefined);
                        }
                      }}
                      value={field.value}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Filipino" id="filipino-step" />
                          <Label htmlFor="filipino-step" className="cursor-pointer">
                            Filipino
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Dual" id="dual-step" />
                          <Label htmlFor="dual-step" className="cursor-pointer">
                            Dual Citizenship
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {citizenshipType === 'Dual' && (
              <>
                <FormField
                  control={form.control}
                  name="personalInfo.citizenship.acquisitionMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        How did you acquire dual citizenship?{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="byBirth" id="byBirth-step" />
                              <Label htmlFor="byBirth-step" className="cursor-pointer">
                                By Birth
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="byNaturalization" id="byNaturalization-step" />
                              <Label htmlFor="byNaturalization-step" className="cursor-pointer">
                                By Naturalization
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalInfo.citizenship.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Please indicate country{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., United States"
                          {...field}
                          value={field.value || ''}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-slate-600 dark:text-slate-400">
                        {citizenshipAcquisitionMethod === 'byNaturalization' 
                          ? 'Indicate the country where you were naturalized'
                          : 'Indicate the other country of your dual citizenship'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
});
