'use client';

/**
 * SALN Step 7: Review & Submit
 * Final review of all sections with expandable details and declaration
 *
 * Rebuilt with:
 * - EnhancedFormSection for main sections
 * - EnhancedCard for review cards
 * - BlurFade for entrance animations
 * - Clean, minimalistic collapsible sections
 * - React.memo for performance
 */

import { memo, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import {
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Car,
  CreditCard,
  Briefcase,
  Users,
  Calculator,
  AlertTriangle,
  IdCard,
} from 'lucide-react';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Label } from '../../../../../components/ui/label';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../../components/ui/collapsible';
import { formatCurrency } from '../../../../../lib/utils/currency';
import type {
  CompleteSalnData,
  SalnSummary,
} from '../../../../../lib/validations/saln-schema';

// Import Enhanced Components
import { EnhancedFormSection, EnhancedInput, BlurFade } from '@tupsafe/shared-ui';
import { formatDateForInput } from '../../../../../lib/utils/date-utils';
import { FormDateInput } from '../../../../../components/forms/shared/FormDateInput';

// Government ID types for selection
const GOVERNMENT_ID_TYPES = [
  "Driver's License",
  'Passport',
  'SSS ID',
  'GSIS ID',
  'PhilHealth ID',
  "Voter's ID",
  'PRC ID',
  'Postal ID',
  'Senior Citizen ID',
  'PWD ID',
  'UMID',
  'Other',
] as const;

interface ReviewSubmitProps {
  data: Partial<CompleteSalnData>;
  summary: SalnSummary;
}

export const ReviewSubmit = memo(function ReviewSubmit({
  data,
  summary,
}: ReviewSubmitProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    declarant: true,
    real: false,
    personal: false,
    liabilities: false,
    business: false,
    relatives: false,
    summary: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <BlurFade delay={0.1}>
        <EnhancedFormSection
          title="Review Your SALN"
          subtitle="Please review all information before submitting"
          variant="default">
          <Alert className="mb-6 border-slate-200/50 dark:border-slate-800/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
              Review all information carefully. Once submitted, your SALN will
              be sent for official review and cannot be edited without approval.
            </AlertDescription>
          </Alert>

          {/* Declarant Information */}
          <BlurFade delay={0.15}>
            <Collapsible
              open={expandedSections.declarant}
              onOpenChange={() => toggleSection('declarant')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Declarant Information</span>
                  </div>
                  {expandedSections.declarant ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-3">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Reporting Year:
                    </span>
                    <span className="font-medium">{data.submission?.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Filing Type:
                    </span>
                    <span className="font-medium capitalize">
                      {data.submission?.filingType?.replace('_', ' ')}
                    </span>
                  </div>
                  {data.submission?.spouseName && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        Spouse Name:
                      </span>
                      <span className="font-medium">
                        {data.submission.spouseName}
                      </span>
                    </div>
                  )}
                  {data.submission?.position && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">
                        Position:
                      </span>
                      <span className="font-medium">
                        {data.submission.position}
                      </span>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Real Properties */}
          <BlurFade delay={0.18}>
            <Collapsible
              open={expandedSections.real}
              onOpenChange={() => toggleSection('real')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <span className="font-semibold">
                      Real Properties ({data.realProperties?.length || 0})
                    </span>
                  </div>
                  {expandedSections.real ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-6">
                {data.realProperties && data.realProperties.length > 0 ? (
                  data.realProperties.map((prop, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                      <p className="font-medium mb-1">{prop.description}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {prop.exactLocation}
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          FMV: {formatCurrency(prop.currentFairMarketValue)}
                        </span>
                        <Badge variant="secondary">{prop.kind}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No real properties declared
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Personal Properties */}
          <BlurFade delay={0.21}>
            <Collapsible
              open={expandedSections.personal}
              onOpenChange={() => toggleSection('personal')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5" />
                    <span className="font-semibold">
                      Personal Properties (
                      {data.personalProperties?.length || 0})
                    </span>
                  </div>
                  {expandedSections.personal ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-6">
                {data.personalProperties &&
                data.personalProperties.length > 0 ? (
                  data.personalProperties.map((prop, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                      <p className="font-medium mb-2">{prop.description}</p>
                      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>Year: {prop.yearAcquired}</span>
                        <span>
                          Value: {formatCurrency(prop.acquisitionCost)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No personal properties declared
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Liabilities */}
          <BlurFade delay={0.24}>
            <Collapsible
              open={expandedSections.liabilities}
              onOpenChange={() => toggleSection('liabilities')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <span className="font-semibold">
                      Liabilities ({data.liabilities?.length || 0})
                    </span>
                  </div>
                  {expandedSections.liabilities ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-6">
                {data.liabilities && data.liabilities.length > 0 ? (
                  data.liabilities.map((liability, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                      <p className="font-medium mb-2">{liability.nature}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {liability.creditorName}
                      </p>
                      <p className="text-sm font-semibold text-destructive">
                        Balance: {formatCurrency(liability.outstandingBalance)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No liabilities declared
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Business Interests */}
          <BlurFade delay={0.27}>
            <Collapsible
              open={expandedSections.business}
              onOpenChange={() => toggleSection('business')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5" />
                    <span className="font-semibold">
                      Business Interests ({data.businessInterests?.length || 0})
                    </span>
                  </div>
                  {expandedSections.business ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-6">
                {data.businessInterests && data.businessInterests.length > 0 ? (
                  data.businessInterests.map((business, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                      <p className="font-medium mb-2">{business.entityName}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {business.natureOfBusiness}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No business interests declared
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Relatives in Government */}
          <BlurFade delay={0.3}>
            <Collapsible
              open={expandedSections.relatives}
              onOpenChange={() => toggleSection('relatives')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">
                      Relatives in Government (
                      {data.relativesInGov?.length || 0})
                    </span>
                  </div>
                  {expandedSections.relatives ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg mb-6 space-y-6">
                {data.relativesInGov && data.relativesInGov.length > 0 ? (
                  data.relativesInGov.map((relative, index) => (
                    <div
                      key={index}
                      className="pb-4 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                      <p className="font-medium mb-2">{relative.name}</p>
                      <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>{relative.relationship}</span>
                        <span>{relative.position}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No relatives in government declared
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>

          {/* Financial Summary */}
          <BlurFade delay={0.33}>
            <Collapsible
              open={expandedSections.summary}
              onOpenChange={() => toggleSection('summary')}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between mb-4 border-slate-200 dark:border-slate-800"
                  type="button">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5" />
                    <span className="font-semibold">Financial Summary</span>
                  </div>
                  {expandedSections.summary ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-8 border border-slate-200 dark:border-slate-800 rounded-lg mb-8 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Total Real Property:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(summary.totalRealPropertyValue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Total Personal Property:
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(summary.totalPersonalPropertyValue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="font-medium">Total Assets:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(summary.totalAssets)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Liabilities:</span>
                  <span className="font-bold text-destructive">
                    {formatCurrency(summary.totalLiabilities)}
                  </span>
                </div>
                <div className="flex justify-between text-lg pt-4 border-t-2 border-slate-200 dark:border-slate-800">
                  <span className="font-bold">Net Worth:</span>
                  <span
                    className={`font-bold ${
                      summary.netWorth >= 0 ? 'text-primary' : 'text-amber-500'
                    }`}>
                    {formatCurrency(summary.netWorth)}
                  </span>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </BlurFade>
        </EnhancedFormSection>
      </BlurFade>

      {/* First Government ID Section (2025 SALN Format) */}
      <BlurFade delay={0.36}>
        <EnhancedFormSection
          title="First Government Issued ID"
          subtitle="Provide your primary government-issued ID for verification (2025 SALN requirement)"
          variant="default">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="grid gap-2">
              <Label
                htmlFor="submission.governmentIdType"
                className="text-base font-medium">
                ID Type
              </Label>
              <Controller
                name="submission.governmentIdType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                    <option value="">Select ID type</option>
                    {GOVERNMENT_ID_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="submission.governmentIdNumber"
                className="text-base font-medium">
                ID Number
              </Label>
              <Controller
                name="submission.governmentIdNumber"
                control={control}
                render={({ field }) => (
                  <EnhancedInput
                    {...field}
                    value={field.value || ''}
                    placeholder="Enter ID number"
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormDateInput
                control={control}
                name="submission.governmentIdDateIssued"
                label="Date Issued"
                max={formatDateForInput(new Date())}
              />
            </div>
          </div>
        </EnhancedFormSection>
      </BlurFade>

      {/* Second Government ID Section (2025 SALN Format) */}
      <BlurFade delay={0.39}>
        <EnhancedFormSection
          title="Second Government Issued ID"
          subtitle="Provide a different government-issued ID for the second signature"
          variant="default">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="grid gap-2">
              <Label
                htmlFor="submission.governmentIdType2"
                className="text-base font-medium">
                ID Type
              </Label>
              <Controller
                name="submission.governmentIdType2"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex h-10 w-full rounded-lg border bg-transparent border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all px-3 py-2 text-sm shadow-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-white [&>option]:dark:bg-slate-800">
                    <option value="">Select ID type</option>
                    {GOVERNMENT_ID_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="submission.governmentIdNumber2"
                className="text-base font-medium">
                ID Number
              </Label>
              <Controller
                name="submission.governmentIdNumber2"
                control={control}
                render={({ field }) => (
                  <EnhancedInput
                    {...field}
                    value={field.value || ''}
                    placeholder="Enter ID number"
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <FormDateInput
                control={control}
                name="submission.governmentIdDateIssued2"
                label="Date Issued"
                max={formatDateForInput(new Date())}
              />
            </div>
          </div>

          <Alert className="mt-6 border-slate-200/50 dark:border-slate-800/50">
            <IdCard className="h-4 w-4" />
            <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
              The 2025 SALN format requires two government-issued IDs for
              verification. Please ensure the first and second IDs are different
              from each other.
            </AlertDescription>
          </Alert>
        </EnhancedFormSection>
      </BlurFade>

      {/* Declaration */}
      <BlurFade delay={0.42}>
        <EnhancedFormSection
          title="Declaration"
          subtitle="Required declaration under penalty of perjury"
          variant="default">
          <div className="space-y-6">
            <div className="p-6 bg-muted/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                I declare under penalty of perjury that this Statement of
                Assets, Liabilities and Net Worth is a true, detailed and sworn
                statement of my assets, liabilities, net worth, business
                interests and financial connections, including those of my
                spouse and unmarried children below eighteen (18) years of age
                living in my household, as of December 31,{' '}
                {data.submission?.year}, pursuant to Section 8 of Republic Act
                No. 6713 (Code of Conduct and Ethical Standards for Public
                Officials and Employees).
              </p>
            </div>

            <Controller
              name="declaration"
              control={control}
              render={({ field }) => (
                <div className="flex items-start space-x-3 p-6 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <Checkbox
                    id="declaration"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="grid gap-2 leading-none">
                    <Label
                      htmlFor="declaration"
                      className="text-base font-medium leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I acknowledge and agree to the declaration above
                      <span className="text-destructive ml-1">*</span>
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      You must accept this declaration to submit your SALN
                    </p>
                  </div>
                </div>
              )}
            />
            {errors?.declaration && (
              <p className="text-sm text-destructive">
                {errors.declaration.message as string}
              </p>
            )}

            <Alert className="border-slate-200/50 dark:border-slate-800/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
                Note: Wet signature will be required after PDF generation for
                official submission.
              </AlertDescription>
            </Alert>
          </div>
        </EnhancedFormSection>
      </BlurFade>
    </div>
  );
});
