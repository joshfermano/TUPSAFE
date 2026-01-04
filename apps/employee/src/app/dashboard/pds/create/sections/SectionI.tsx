'use client';

/**
 * Section I: Personal Information
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 * - No sparkles, no shine borders - clean government form aesthetic
 */

import { memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  User,
  Calendar,
  Shield,
  Phone,
  Mail,
  Smartphone,
  Home,
} from 'lucide-react';
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
import { AddressInput } from '../../../../../components/forms/shared/AddressInput';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';
import {
  formatDateForInput,
  parseDateFromInput,
} from '../../../../../lib/utils/date-utils';

export const SectionI = memo(function SectionI() {
  const form = useFormContext<CompletePdsData>();
  const citizenshipType = useWatch({
    control: form.control,
    name: 'personalInfo.citizenship.type',
  });

  return (
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section I</p>
            <h2 className="text-2xl font-bold text-foreground">
              Personal Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your personal details as they appear in official
              documents
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Full Name */}
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-6">
              <User className="h-4 w-4 text-primary" />
              Full Name
            </h3>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormDescription>Leave blank if none</FormDescription>
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
                        <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
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

          <Separator className="border-slate-200 dark:border-slate-800" />

          {/* Birth Information */}
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-6">
              <Calendar className="h-4 w-4 text-primary" />
              Birth Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="personalInfo.dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date of Birth <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={formatDateForInput(new Date())}
                        {...field}
                        value={formatDateForInput(field.value as Date | null)}
                        onChange={(e) => {
                          field.onChange(parseDateFromInput(e.target.value));
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

          {/* Personal Characteristics */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-6">
              Personal Characteristics
            </h3>
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
                        <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
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
                        <SelectTrigger className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors">
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
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Government IDs Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              Government Identification Numbers
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Provide at least one government ID number for verification
              purposes
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormDescription>
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
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormDescription>
                      Philippine Identification System Number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator className="border-slate-200 dark:border-slate-800" />

          {/* Citizenship */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-6">
              Citizenship
            </h3>
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
                        onValueChange={field.onChange}
                        value={field.value}>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Filipino" id="filipino" />
                            <Label
                              htmlFor="filipino"
                              className="cursor-pointer">
                              Filipino
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Dual" id="dual" />
                            <Label htmlFor="dual" className="cursor-pointer">
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
                <FormField
                  control={form.control}
                  name="personalInfo.citizenship.details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Please specify country{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., United States"
                          {...field}
                          className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                      </FormControl>
                      <FormDescription>
                        Indicate the other country of your dual citizenship
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Addresses Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Residential & Permanent Addresses
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Provide your complete Philippine addresses
          </p>

          <div className="space-y-12">
            <AddressInput
              name="personalInfo.residentialAddress"
              label="Residential Address *"
              required={true}
            />

            <AddressInput
              name="personalInfo.permanentAddress"
              label="Permanent Address *"
              required={true}
              sameAsField="personalInfo.residentialAddress"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Contact Information
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Provide at least one method of contact
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="personalInfo.telephoneNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Telephone No.
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+63-2-8123-4567"
                      {...field}
                      value={field.value || ''}
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </FormControl>
                  <FormDescription>Landline number (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personalInfo.mobileNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Mobile No.
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+63-917-123-4567"
                      {...field}
                      value={field.value || ''}
                      className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </FormControl>
                  <FormDescription>
                    Mobile phone number (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="personalInfo.emailAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="juan.delacruz@tup.edu.ph"
                    {...field}
                    value={field.value || ''}
                    className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </FormControl>
                <FormDescription>
                  Official or personal email address for communication
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Info box - Clean, subtle styling */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Contact Information Policy
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your contact information will be used for official university
                communications only. Please ensure at least one contact method
                is provided and regularly monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
