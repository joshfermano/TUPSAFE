'use client';

/**
 * Step 5: Business Interests & Relatives in Government
 * Combined section for business connections and government relatives
 */

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { Briefcase, Users, Plus, Trash2, Info } from 'lucide-react';
import { FormSection } from '@/components/forms/shared/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RELATIONSHIP_TYPE } from '@/lib/validations/saln-schema';

export function BusinessRelatives() {
  const {
    control,
    formState: { errors },
  } = useFormContext();

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
      <FormSection
        title="Business Interests and Financial Connections"
        description="Disclose any business interests, partnerships, or financial connections"
        icon={Briefcase}
      >
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Include any business where you or your spouse have an interest (stockholder, partner,
            officer, director, etc.). If none, you may skip this section.
          </AlertDescription>
        </Alert>

        {businessFields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No business interests added</p>
            <p className="text-sm text-muted-foreground mb-4">
              If you have no business interests, you can skip this section
            </p>
            <Button type="button" onClick={addBusinessInterest} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Business Interest
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {businessFields.map((field, index) => (
              <div
                key={field.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Business {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBusiness(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`businessInterests.${index}.entityName`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Business Name
                    </Label>
                    <Controller
                      name={`businessInterests.${index}.entityName`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Name of business/corporation" />
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`businessInterests.${index}.businessAddress`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Business Address
                    </Label>
                    <Controller
                      name={`businessInterests.${index}.businessAddress`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Complete business address" />
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`businessInterests.${index}.natureOfBusiness`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Nature of Business Interest
                    </Label>
                    <Controller
                      name={`businessInterests.${index}.natureOfBusiness`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="e.g., Stockholder, Partner, Director"
                        />
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`businessInterests.${index}.dateOfAcquisition`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Date of Acquisition
                    </Label>
                    <Controller
                      name={`businessInterests.${index}.dateOfAcquisition`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value instanceof Date
                              ? field.value.toISOString().split('T')[0]
                              : field.value
                          }
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" onClick={addBusinessInterest} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Business Interest
            </Button>
          </div>
        )}
      </FormSection>

      {/* Relatives in Government Section */}
      <FormSection
        title="Relatives in Government Service"
        description="List relatives within 4th civil degree working in government"
        icon={Users}
      >
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Disclose relatives within the 4th civil degree (by consanguinity or affinity) currently
            employed in government. If none, you may skip this section.
          </AlertDescription>
        </Alert>

        {relativeFields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No relatives in government added</p>
            <p className="text-sm text-muted-foreground mb-4">
              If you have no relatives in government service, you can skip this section
            </p>
            <Button type="button" onClick={addRelative} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Relative
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {relativeFields.map((field, index) => (
              <div
                key={field.id}
                className="p-6 border rounded-lg bg-card space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Relative {index + 1}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelative(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor={`relativesInGov.${index}.name`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                        Full Name
                      </Label>
                      <Controller
                        name={`relativesInGov.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="Full name of relative" />
                        )}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`relativesInGov.${index}.relationship`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                        Relationship
                      </Label>
                      <Controller
                        name={`relativesInGov.${index}.relationship`}
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_TYPE.map((rel) => (
                                <SelectItem key={rel} value={rel}>
                                  {rel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`relativesInGov.${index}.position`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Position/Title
                    </Label>
                    <Controller
                      name={`relativesInGov.${index}.position`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Position in government" />
                      )}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor={`relativesInGov.${index}.agencyAddress`} className="after:content-[&apos;*&apos;] after:ml-0.5 after:text-destructive">
                      Agency/Office and Address
                    </Label>
                    <Controller
                      name={`relativesInGov.${index}.agencyAddress`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="Complete agency name and address" />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" onClick={addRelative} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Relative
            </Button>
          </div>
        )}
      </FormSection>
    </div>
  );
}
