'use client';

import { memo } from 'react';
import { Info, Plus, X, CheckCircle2 } from 'lucide-react';
import { useFormContext, useFieldArray, type FieldPath } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormSection } from '@/components/forms/shared/FormSection';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { type CompletePdsData } from '@/lib/validations/pds-schema';

/**
 * Step 8: Other Information & Review
 * Skills, questions 34-42, references, and final review
 */
export const OtherReview = memo(function OtherReview() {
  const form = useFormContext<Partial<CompletePdsData>>();

  // Type-safe field array setup for nested arrays
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    // TypeScript limitation: React Hook Form doesn't support deeply nested field array paths in its type system
    // Runtime validation is maintained through the Zod schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.skills' as any,
  });

  const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
    control: form.control,
    // TypeScript limitation: React Hook Form doesn't support deeply nested field array paths in its type system
    // Runtime validation is maintained through the Zod schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.references' as any,
  });

  const questions = [
    { key: 'Q34_criminal_charged', label: 'Have you ever been formally charged?' },
    { key: 'Q35_criminal_convicted', label: 'Have you ever been convicted?' },
    { key: 'Q36_separated_from_service', label: 'Have you ever been separated from service?' },
    { key: 'Q37_candidate_for_election', label: 'Have you ever been a candidate?' },
    { key: 'Q38_resigned_from_government', label: 'Have you resigned from government service?' },
    { key: 'Q39_immigrant_or_acquired_residence', label: 'Have you acquired immigrant status?' },
    { key: 'Q40_indigenous_group', label: 'Are you a member of an indigenous group?' },
    { key: 'Q41_disabled', label: 'Are you a person with disability?' },
    { key: 'Q42_solo_parent', label: 'Are you a solo parent?' },
  ];

  return (
    <FormSection
      title="Other Information & Final Review"
      description="Special skills, CSC questions, character references, and review"
      icon={Info}
      stepNumber={8}
    >
      <div className="space-y-8">
        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">Special Skills & Hobbies</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSkill('')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          <div className="space-y-2">
            {skillFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`otherInfo.skills.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="e.g., Public Speaking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSkill(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* CSC Questions */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">CSC Questions (34-42)</h4>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.key} className="space-y-2">
                <FormField
                  control={form.control}
                  name={`otherInfo.questions.${question.key}` as FieldPath<Partial<CompletePdsData>>}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {question.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch(`otherInfo.questions.${question.key}` as FieldPath<Partial<CompletePdsData>>) && (
                  <FormField
                    control={form.control}
                    name={`otherInfo.questions.${question.key}_details` as FieldPath<Partial<CompletePdsData>>}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide details..."
                            className="resize-none"
                            {...field}
                            value={(field?.value as string) || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* References */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Character References <span className="text-destructive">*</span>
              </h4>
              <p className="text-xs text-muted-foreground">Minimum 3, Maximum 5</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendReference({
                name: '',
                address: '',
                telephoneNo: '',
              })}
              disabled={referenceFields.length >= 5}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </div>

          {referenceFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No references added yet. Minimum of 3 required.
            </div>
          ) : (
            <div className="space-y-4">
              {referenceFields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-lg border border-border space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">Reference #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReference(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Dr. Maria Santos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.telephoneNo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telephone No.</FormLabel>
                          <FormControl>
                            <Input placeholder="+63-2-8123-4567" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.address`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Complete address"
                              {...field}
                              className="resize-none"
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

        <Separator />

        {/* Final Review */}
        <NeonGradientCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">Ready to Submit?</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Please review all the information you&apos;ve provided. Once submitted, your Personal Data
              Sheet will be forwarded to HR for review. You can still save as draft if you need more time.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>All required fields are marked with an asterisk (*)</li>
              <li>Minimum of 3 character references required</li>
              <li>Ensure all information is accurate and up-to-date</li>
              <li>Your PDS will be used for official university records</li>
            </ul>
          </div>
        </NeonGradientCard>
      </div>
    </FormSection>
  );
});
