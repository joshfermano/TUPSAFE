'use client';

import { memo } from 'react';
import { Info, Plus, X, CheckCircle2, Award, Users, CreditCard } from 'lucide-react';
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
import { Separator } from '../../../../../components/ui/separator';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Textarea } from '../../../../../components/ui/textarea';
import { FormSection } from '../../../../../components/forms/shared/FormSection';
import { FormDateInput } from '../../../../../components/forms/shared/FormDateInput';
import { NeonGradientCard } from '../../../../../components/ui/neon-gradient-card';
import { type CompletePdsData } from '../../../../../lib/validations/pds-schema';

// Define questions array outside component to prevent recreation on each render
const CSC_QUESTIONS = [
  {
    key: 'Q34_related_to_authority',
    label: 'Are you related by consanguinity or affinity to the appointing or recommending authority, or to the chief of bureau or office or to the person who has immediate supervision over you in the Office, Bureau or Department where you will be appointed, a. within the third degree? b. within the fourth degree (for Local Government Unit - Career Employees)?',
  },
  {
    key: 'Q35a_admin_offense',
    label: 'Have you ever been found guilty of any administrative offense?',
  },
  {
    key: 'Q35b_criminal_charged',
    label: 'Have you ever been criminally charged before any court?',
  },
  {
    key: 'Q36_convicted_of_crime',
    label: 'Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by any court or tribunal?',
  },
  {
    key: 'Q37_separated_from_service',
    label: 'Have you ever been separated from the service in any of the following modes: resignation, retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out (abolition) in the public or private sector?',
  },
  {
    key: 'Q38a_candidate_for_election',
    label: 'Have you ever been a candidate in a national or local election held within the last year (except Barangay election)?',
  },
  {
    key: 'Q38b_resigned_to_campaign',
    label: 'Have you resigned from the government service during the three (3)-month period before the last election to promote/actively campaign for a national or local candidate?',
  },
  {
    key: 'Q39_immigrant_status',
    label: 'Have you acquired the status of an immigrant or permanent resident of another country?',
  },
  {
    key: 'Q40a_indigenous_group',
    label: 'Pursuant to existing provisions of Republic Act No. 8371 (THE INDIGENOUS PEOPLES RIGHTS ACT OF 1997), are you a member of any indigenous group/indigenous people?',
  },
  {
    key: 'Q40b_disabled',
    label: 'Pursuant to existing provisions of Republic Act No. 7277 (MAGNA CARTA FOR DISABLED PERSONS), are you a person with disability?',
  },
  {
    key: 'Q40c_solo_parent',
    label: 'Pursuant to existing provisions of Republic Act No. 11861 (EXPANDED SOLO PARENTS WELFARE ACT), are you a solo parent?',
  },
] as const;

/**
 * Step 8: Other Information & Review
 * Skills, questions 34-42, references, and final review
 */
export const OtherReview = memo(function OtherReview() {
  const form = useFormContext<Partial<CompletePdsData>>();

  // Watch all question values at once (single subscription instead of 9 separate ones)
  // This fixes the performance issue of calling watch() inside the map loop
  const questionValues = form.watch('otherInfo.questions');

  // Type-safe field array setup for nested arrays
  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control: form.control,
    // TypeScript limitation: React Hook Form doesn't support deeply nested field array paths in its type system
    // Runtime validation is maintained through the Zod schema
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
    // TypeScript limitation: React Hook Form doesn't support deeply nested field array paths in its type system
    // Runtime validation is maintained through the Zod schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: 'otherInfo.references' as any,
  });

  return (
    <FormSection
      title="Other Information & Final Review"
      description="Special skills, CSC questions, character references, and review"
      icon={Info}
      stepNumber={8}>
      <div className="space-y-8">
        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground">
              Special Skills & Hobbies
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSkill('')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>

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
                  onClick={() => removeSkill(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Non-Academic Distinctions/Recognition */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Non-Academic Distinctions / Recognition
            </h4>
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
              }>
              <Plus className="h-4 w-4 mr-2" />
              Add Recognition
            </Button>
          </div>

          {recognitionFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No recognitions added yet
            </div>
          ) : (
            <div className="space-y-4">
              {recognitionFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Recognition #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecognition(index)}>
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
                            Title of Recognition <span className="text-destructive">*</span>
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
                            Year Received <span className="text-destructive">*</span>
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
                            Awarding Organization <span className="text-destructive">*</span>
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Membership in Association/Organization */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Membership in Association / Organization
            </h4>
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
              }>
              <Plus className="h-4 w-4 mr-2" />
              Add Membership
            </Button>
          </div>

          {associationFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No memberships added yet
            </div>
          ) : (
            <div className="space-y-4">
              {associationFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Membership #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAssociation(index)}>
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
                            Association / Organization Name <span className="text-destructive">*</span>
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
                                  e.target.value ? parseInt(e.target.value) : undefined
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* CSC Questions */}
        <div>
          <h4 className="text-base font-medium text-foreground mb-6">
            CSC Questions (34-42)
          </h4>
          <div className="space-y-6">
            {CSC_QUESTIONS.map((question) => {
              // Access the value directly from the watched object instead of calling watch() per question
              // This avoids creating 9 separate subscriptions on each render
              const isChecked = questionValues?.[
                question.key as keyof typeof questionValues
              ] as boolean;

              return (
                <div key={question.key} className="space-y-3">
                  <FormField
                    control={form.control}
                    name={
                      `otherInfo.questions.${question.key}` as FieldPath<
                        Partial<CompletePdsData>
                      >
                    }
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

                  {isChecked && (
                    <FormField
                      control={form.control}
                      name={
                        `otherInfo.questions.${question.key}_details` as FieldPath<
                          Partial<CompletePdsData>
                        >
                      }
                      render={({ field }) => (
                        <FormItem>
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* References */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-medium text-foreground">
                Character References <span className="text-destructive">*</span>
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Minimum 3, Maximum 5
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
              disabled={referenceFields.length >= 5}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </div>

          {referenceFields.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 text-sm">
              No references added yet. Minimum of 3 required.
            </div>
          ) : (
            <div className="space-y-4">
              {referenceFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">
                      Reference #{index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReference(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name={`otherInfo.references.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
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
                          <FormLabel>Address</FormLabel>
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Government Issued ID (Item 42) - CS Form No. 212 Revised 2025 */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-4 w-4 text-primary" />
            <h4 className="text-base font-medium text-foreground">
              Government Issued ID (Item 42)
            </h4>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Please provide details of one valid government-issued ID for identification and signature verification.
          </p>

          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="otherInfo.governmentId.idType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Government Issued ID (i.e. Passport, GSIS, SSS, PRC, Driver&apos;s License, etc.)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Driver's License, Passport, PRC ID"
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
                name="otherInfo.governmentId.idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID/License/Passport No.</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., N01-12-123456"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormDateInput
                control={form.control}
                name="otherInfo.governmentId.dateIssued"
                label="Date of Issuance"
                placeholder="Select date issued"
              />

              <FormField
                control={form.control}
                name="otherInfo.governmentId.placeIssued"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place of Issuance</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., LTO Manila, DFA NCR"
                        {...field}
                        value={field.value ?? ''}
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

        <Separator className="border-slate-200/50 dark:border-slate-800/50" />

        {/* Final Review */}
        <NeonGradientCard className="p-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h4 className="text-base font-medium text-foreground">
                Ready to Submit?
              </h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Please review all the information you&apos;ve provided. Once
              submitted, your Personal Data Sheet will be forwarded to HR for
              review. You can still save as draft if you need more time.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
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
