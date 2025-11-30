'use client';

/**
 * Section VI: Other Information
 * CS Form No. 212 Revised 2025
 *
 * Design: Minimalistic, premium, professional
 * - Clean section headers without excessive animations
 * - Subtle card styling with clean borders
 * - Professional color scheme (TUP Blue primary)
 * - Removed: SparklesText, ShineBorder, MagicCard, NeonGradientCard
 */

import { memo } from 'react';
import * as React from 'react';
import { Info, Plus, X, CheckCircle2, Award, Users, Shield } from 'lucide-react';
import { useFormContext, useFieldArray, type FieldPath } from 'react-hook-form';
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
import { Textarea } from '../../../../../components/ui/textarea';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';

// Define CSC questions outside component to prevent recreation on each render
const CSC_QUESTIONS = [
  {
    key: 'Q34_criminal_charged',
    label: '34. Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be apppointed?',
  },
  {
    key: 'Q35_criminal_convicted',
    label: '35. a) Have you ever been found guilty of any administrative offense?',
  },
  {
    key: 'Q36_separated_from_service',
    label: '36. Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?',
  },
  {
    key: 'Q37_candidate_for_election',
    label: '37. Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?',
  },
  {
    key: 'Q38_resigned_from_government',
    label: '38. a) Have you ever been a candidate in a national or local election held within the last year?',
  },
  {
    key: 'Q39_immigrant_or_acquired_residence',
    label: '39. Have you acquired the status of an immigrant or permanent resident of another country?',
  },
  {
    key: 'Q40_indigenous_group',
    label: '40. Pursuant to: (a) Indigenous People\'s Act (RA 8371); Are you a member of any indigenous group?',
  },
  {
    key: 'Q41_disabled',
    label: '41. Pursuant to: (b) Magna Carta for Disabled Persons (RA 7277); Are you a person with disability?',
  },
  {
    key: 'Q42_solo_parent',
    label: '42. Pursuant to: (c) Solo Parents Welfare Act of 2000 (RA 8972); Are you a solo parent?',
  },
] as const;

export const SectionVI = memo(function SectionVI() {
  const form = useFormContext<Partial<CompletePdsData>>();

  // Watch all question values at once
  const questionValues = form.watch('otherInfo.questions');

  // Type-safe field array setup for nested arrays
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.skills' as any,
  });

  const {
    fields: recognitionFields,
    append: appendRecognition,
    remove: removeRecognition,
  } = useFieldArray({
    control: form.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.recognitions' as any,
  });

  const {
    fields: associationFields,
    append: appendAssociation,
    remove: removeAssociation,
  } = useFieldArray({
    control: form.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.associations' as any,
  });

  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({
    control: form.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.references' as any,
  });

  // Ensure minimum 3 references on mount
  React.useEffect(() => {
    if (referenceFields.length < 3) {
      const needed = 3 - referenceFields.length;
      for (let i = 0; i < needed; i++) {
        appendReference({
          name: '',
          address: '',
          telephoneNo: '',
        });
      }
    }
  }, [referenceFields.length, appendReference]);

  return (
    <div className="space-y-8">
      {/* Section Header - Clean, Professional */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Section VI</p>
            <h2 className="text-2xl font-bold text-foreground">
              Other Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Skills, recognitions, memberships, CSC questions, and character
              references
            </p>
          </div>
        </div>
      </div>

      {/* Skills Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Special Skills & Hobbies
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSkill('')}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

          {skillFields.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <p className="text-sm text-muted-foreground">
                No skills added yet. Add your special skills or hobbies.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {skillFields.map((field, index) => (
                <div key={field.id} className="flex gap-3">
                  <FormField
                    control={form.control}
                    name={`otherInfo.skills.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="e.g., Public Speaking"
                            {...field}
                            className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
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
                    className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recognitions Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Non-Academic Distinctions / Recognition
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendRecognition({
                  title: '',
                  year: new Date().getFullYear(),
                  organization: '',
                })
              }
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Recognition
            </Button>
          </div>

          {recognitionFields.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Award className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recognitions added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recognitionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Recognition #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecognition(index)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`otherInfo.recognitions.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Title of Recognition{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Outstanding Researcher Award"
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
                      name={`otherInfo.recognitions.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Year Received{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              placeholder="e.g., 2024"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
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
                      name={`otherInfo.recognitions.${index}.organization`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>
                            Awarding Organization{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., CHED"
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Associations Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Membership in Association / Organization
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendAssociation({
                  name: '',
                  position: '',
                  yearJoined: new Date().getFullYear(),
                })
              }
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Membership
            </Button>
          </div>

          {associationFields.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No memberships added yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {associationFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Membership #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAssociation(index)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`otherInfo.associations.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Association / Organization Name{' '}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Philippine Institute of Engineering"
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
                      name={`otherInfo.associations.${index}.position`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position / Role (if any)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Member, Board Member"
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
                      name={`otherInfo.associations.${index}.yearJoined`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Joined</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1950"
                              max={new Date().getFullYear()}
                              placeholder="e.g., 2020"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined
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
      </div>

      {/* CSC Questions Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              CSC Questions (34-42)
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Please answer the following questions truthfully. Check the box if
            your answer is YES. If yes, provide details in the text area.
          </p>

          <div className="space-y-4">
            {CSC_QUESTIONS.map((question) => {
              const isChecked = questionValues?.[
                question.key as keyof typeof questionValues
              ] as boolean;

              return (
                <div
                  key={question.key}
                  className="space-y-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <FormField
                    control={form.control}
                    name={
                      `otherInfo.questions.${question.key}` as FieldPath<
                        Partial<CompletePdsData>
                      >
                    }
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer text-sm leading-relaxed">
                          {question.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {isChecked && (
                    <FormField
                      control={form.control}
                      name={
                        `otherInfo.questions.${question.key}_details` as FieldPath<
                          Partial<CompletePdsData>
                        >
                      }
                      render={({ field }) => (
                        <FormItem className="ml-7">
                          <FormControl>
                            <Textarea
                              placeholder="Please provide details..."
                              className="resize-none bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Character References Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Character References{' '}
                <span className="text-destructive">*</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Minimum 3, Maximum 5 references (not related to you by blood or
                marriage)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendReference({
                  name: '',
                  address: '',
                  telephoneNo: '',
                })
              }
              disabled={referenceFields.length >= 5}
              className="border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </div>

          {referenceFields.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No references added yet. Minimum of 3 required.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referenceFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium">
                        Reference #{index + 1}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReference(index)}
                      disabled={referenceFields.length <= 3}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Dr. Maria Santos"
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
                      name={`otherInfo.references.${index}.telephoneNo`}
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

                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.address`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Complete address"
                              {...field}
                              className="resize-none bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
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

      {/* Final Review Card - Clean, professional notice */}
      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 sm:p-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h4 className="text-base font-semibold text-foreground">
              Ready to Submit?
            </h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please review all the information you&apos;ve provided. Once
            submitted, your Personal Data Sheet will be forwarded to HR for
            review. You can still save as draft if you need more time.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>All required fields are marked with an asterisk (*)</li>
            <li>Minimum of 3 character references required</li>
            <li>Ensure all information is accurate and up-to-date</li>
            <li>Your PDS will be used for official university records</li>
          </ul>
        </div>
      </div>
    </div>
  );
});
