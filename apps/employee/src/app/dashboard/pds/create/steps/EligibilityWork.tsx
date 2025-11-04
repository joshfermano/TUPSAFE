'use client';

import { memo } from 'react';
import { Briefcase, Plus, X, Award } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormSection } from '@/components/forms/shared/FormSection';
import { type CompletePdsData } from '@/lib/validations/pds-schema';

/**
 * Step 6: Civil Service Eligibility & Work Experience
 */
export const EligibilityWork = memo(function EligibilityWork() {
  const form = useFormContext<CompletePdsData>();

  const { fields: eligibilityFields, append: appendEligibility, remove: removeEligibility } = useFieldArray({
    control: form.control,
    name: 'eligibility',
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control: form.control,
    name: 'workExperience',
  });

  return (
    <FormSection
      title="Eligibility & Work Experience"
      description="Civil service eligibility and employment history"
      icon={Briefcase}
      stepNumber={6}
    >
      <div className="space-y-8">
        {/* Civil Service Eligibility */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Civil Service Eligibility
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendEligibility({
                eligibilityName: '',
                rating: null,
                dateOfExam: null,
                placeOfExam: '',
                licenseNo: '',
                licenseValidityDate: null,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Eligibility
            </Button>
          </div>

          {eligibilityFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No civil service eligibility added yet
            </div>
          ) : (
            <div className="space-y-4">
              {eligibilityFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Eligibility #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEligibility(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eligibility.${index}.eligibilityName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligibility Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Career Service Professional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Work Experience */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Work Experience
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendWork({
                positionTitle: '',
                departmentAgency: '',
                monthlySalary: null,
                salaryGrade: '',
                statusOfAppointment: '',
                isGovernment: false,
                dateFrom: new Date(),
                dateTo: null,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Work Experience
            </Button>
          </div>

          {workFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No work experience added yet
            </div>
          ) : (
            <div className="space-y-4">
              {workFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Work Experience #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWork(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`workExperience.${index}.positionTitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Professor" {...field} />
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
                          <FormLabel>Department / Agency</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., TUP Manila" {...field} />
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
