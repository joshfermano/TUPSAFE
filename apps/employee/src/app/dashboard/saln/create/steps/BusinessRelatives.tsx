'use client';

/**
 * SALN Step 5: Business Interests & Relatives in Government
 * Combined section for business connections and government relatives
 *
 * Rebuilt with:
 * - EnhancedCard for business/relative items
 * - EnhancedFormSection for two main sections
 * - EnhancedInput for text fields
 * - BlurFade for staggered animations
 * - React.memo for performance
 * - Fixed Select components using defaultValue (no infinite loops)
 */

import { memo } from 'react';
import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Briefcase, Users, Plus, Trash2, Info } from 'lucide-react';
import { Label } from '../../../../../components/ui/label';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { RELATIONSHIP_TYPE } from '../../../../../lib/validations/saln-schema';

// Import Enhanced Components
import {
  EnhancedFormSection,
  EnhancedCard,
  EnhancedCardContent,
  EnhancedInput,
  BlurFade,
} from '@tupsafe/shared-ui';

export const BusinessRelatives = memo(function BusinessRelatives() {
  const { control } = useFormContext();

  const {
    fields: businessFields,
    append: appendBusiness,
    remove: removeBusiness,
  } = useFieldArray({
    control,
    name: 'businessInterests',
  });

  const {
    fields: relativeFields,
    append: appendRelative,
    remove: removeRelative,
  } = useFieldArray({
    control,
    name: 'relativesInGov',
  });

  const addBusinessInterest = () => {
    appendBusiness({
      entityName: '',
      businessAddress: '',
      natureOfBusiness: '',
      dateOfAcquisition: new Date(),
    });
  };

  const addRelative = () => {
    appendRelative({
      name: '',
      relationship: 'Spouse',
      position: '',
      agencyAddress: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Business Interests Section */}
      <BlurFade delay={0.1}>
        <EnhancedFormSection
          title="Business Interests and Financial Connections"
          subtitle="Disclose any business interests, partnerships, or financial connections"
          variant="default">
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
              Include any business where you or your spouse have an interest
              (stockholder, partner, officer, director, etc.). If none, you may
              skip this section.
            </AlertDescription>
          </Alert>

          {businessFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                No business interests added
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                If you have no business interests, you can skip this section
              </p>
              <Button
                type="button"
                onClick={addBusinessInterest}
                variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Business Interest
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {businessFields.map((field, index) => (
                <BlurFade key={field.id} delay={0.15 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Business {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBusiness(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-6">
                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.entityName`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Business Name
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.entityName`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Name of business/corporation"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.businessAddress`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Business Address
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.businessAddress`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Complete business address"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.natureOfBusiness`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Nature of Business Interest
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.natureOfBusiness`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="e.g., Stockholder, Partner, Director"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`businessInterests.${index}.dateOfAcquisition`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Date of Acquisition
                            </Label>
                            <Controller
                              name={`businessInterests.${index}.dateOfAcquisition`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  type="date"
                                  {...field}
                                  value={
                                    field.value instanceof Date
                                      ? field.value.toISOString().split('T')[0]
                                      : field.value
                                  }
                                  onChange={(e) =>
                                    field.onChange(new Date(e.target.value))
                                  }
                                  max={new Date().toISOString().split('T')[0]}
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addBusinessInterest}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Business Interest
              </Button>
            </div>
          )}
        </EnhancedFormSection>
      </BlurFade>

      {/* Relatives in Government Section */}
      <BlurFade delay={0.2}>
        <EnhancedFormSection
          title="Relatives in Government Service"
          subtitle="List relatives within 4th civil degree working in government"
          variant="default">
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
              Disclose relatives within the 4th civil degree (by consanguinity
              or affinity) currently employed in government. If none, you may
              skip this section.
            </AlertDescription>
          </Alert>

          {relativeFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg border-slate-200/50 dark:border-slate-800/50">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                No relatives in government added
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                If you have no relatives in government service, you can skip
                this section
              </p>
              <Button type="button" onClick={addRelative} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Relative
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {relativeFields.map((field, index) => (
                <BlurFade key={field.id} delay={0.25 + index * 0.05}>
                  <EnhancedCard variant="default">
                    <EnhancedCardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Relative {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRelative(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="grid gap-2">
                              <Label
                                htmlFor={`relativesInGov.${index}.name`}
                                className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                                Full Name
                              </Label>
                              <Controller
                                name={`relativesInGov.${index}.name`}
                                control={control}
                                render={({ field }) => (
                                  <EnhancedInput
                                    {...field}
                                    placeholder="Full name of relative"
                                  />
                                )}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label
                                htmlFor={`relativesInGov.${index}.relationship`}
                                className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                                Relationship
                              </Label>
                              <Controller
                                name={`relativesInGov.${index}.relationship`}
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                  <select
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                                    <option value="">
                                      Select relationship
                                    </option>
                                    {RELATIONSHIP_TYPE.map((rel) => (
                                      <option key={rel} value={rel}>
                                        {rel}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              />
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`relativesInGov.${index}.position`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Position/Title
                            </Label>
                            <Controller
                              name={`relativesInGov.${index}.position`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Position in government"
                                />
                              )}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label
                              htmlFor={`relativesInGov.${index}.agencyAddress`}
                              className="text-base font-medium after:content-['*'] after:ml-0.5 after:text-destructive">
                              Agency/Office and Address
                            </Label>
                            <Controller
                              name={`relativesInGov.${index}.agencyAddress`}
                              control={control}
                              render={({ field }) => (
                                <EnhancedInput
                                  {...field}
                                  placeholder="Complete agency name and address"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </EnhancedCardContent>
                  </EnhancedCard>
                </BlurFade>
              ))}

              <Button
                type="button"
                onClick={addRelative}
                variant="outline"
                className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Relative
              </Button>
            </div>
          )}
        </EnhancedFormSection>
      </BlurFade>
    </div>
  );
});
