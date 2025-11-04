'use client';

import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Phone, Mail, Smartphone } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormSection } from '@/components/forms/shared/FormSection';
import { type CompletePdsData } from '@/lib/validations/pds-schema';

/**
 * Step 3: Personal Information - Contact Details
 * Includes telephone, mobile, and email information
 */
export const Contact = memo(function Contact() {
  const form = useFormContext<CompletePdsData>();

  return (
    <FormSection
      title="Contact Information"
      description="Provide at least one method of contact"
      icon={Phone}
      required={true}
      stepNumber={3}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </FormControl>
                <FormDescription>Mobile phone number (optional)</FormDescription>
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
                Email Address <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="juan.delacruz@tup.edu.ph"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Official or personal email address for communication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Contact Information Policy</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your contact information will be used for official university communications only.
              Please ensure at least one contact method is provided and regularly monitored.
            </p>
          </div>
        </div>
      </div>
    </FormSection>
  );
});
