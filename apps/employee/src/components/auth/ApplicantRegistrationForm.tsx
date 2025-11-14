'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import { useOpenPositions, type OpenPosition } from '@/hooks';

import {
  applicantRegistrationSchemaWithConfirmation,
  type ApplicantRegistrationFormData,
} from '@/lib/validations/auth';

interface ApplicantRegistrationFormProps {
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSubmit: (data: ApplicantRegistrationFormData) => Promise<void>;
  isLoading: boolean;
  totalSteps: number;
}

export function ApplicantRegistrationForm({
  currentStep,
  onNextStep,
  onPrevStep,
  onSubmit,
  isLoading,
  totalSteps,
}: ApplicantRegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ApplicantRegistrationFormData>({
    resolver: zodResolver(applicantRegistrationSchemaWithConfirmation),
    defaultValues: {
      userType: 'applicant',
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phoneNumber: '',
      positionAppliedFor: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      privacyAccepted: false,
      dataProcessingConsent: false,
    },
    mode: 'onChange',
  });

  // Fetch open positions for applicants
  const { data: openPositions, isLoading: isLoadingOpenPositions } =
    useOpenPositions();

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof ApplicantRegistrationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          'firstName',
          'lastName',
          'middleName',
          'email',
          'phoneNumber',
        ];
        break;
      case 2:
        fieldsToValidate = ['positionAppliedFor'];
        break;
      case 3:
        fieldsToValidate = ['password', 'confirmPassword'];
        break;
      case 4:
        fieldsToValidate = [
          'termsAccepted',
          'privacyAccepted',
          'dataProcessingConsent',
        ];
        break;
    }

    return await form.trigger(fieldsToValidate);
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      onNextStep();
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 sm:space-y-6">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan"
                        className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Dela Cruz"
                        className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Santos (optional)"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="juan.delacruz@example.com"
                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Your personal email address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+639123456789 or 09123456789"
                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Position Selection */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="positionAppliedFor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position to Apply For *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingOpenPositions ? (
                        <div className="p-2 text-sm text-slate-500">
                          Loading open positions...
                        </div>
                      ) : openPositions && openPositions.length > 0 ? (
                        openPositions.map((position: OpenPosition) => (
                          <SelectItem key={position.id} value={position.id}>
                            <div className="flex flex-col py-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {position.positionTitle}
                                </span>
                                {position.isFeatured && (
                                  <Badge className="text-xs">Featured</Badge>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {position.positionCode}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                {position.salaryGrade && (
                                  <span className="text-xs text-slate-600">
                                    {position.salaryGrade}
                                  </span>
                                )}
                                <span className="text-xs text-slate-500">
                                  {position.numberOfOpenings} opening
                                  {position.numberOfOpenings > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-slate-500">
                          No open positions available at the moment
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Browse and select from available open positions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 3: Security Setup */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs space-y-1">
                    <div>Password must contain:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>At least 12 characters</li>
                      <li>Upper and lowercase letters</li>
                      <li>At least one number</li>
                      <li>At least one special character</li>
                    </ul>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-[#8B1538] focus:ring-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-[#8B1538]/40 dark:hover:bg-slate-700/80 dark:hover:border-[#8B1538]/50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 4: Terms and Verification */}
        {currentStep === 4 && (
          <div className="space-y-5 sm:space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538] border-slate-300 dark:border-slate-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm cursor-pointer hover:text-[#8B1538] dark:hover:text-[#8B1538]/90 transition-colors text-slate-700 dark:text-slate-300">
                        I accept the{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8B1538] dark:text-[#8B1538]/90 hover:underline focus:underline focus:outline-none hover:text-[#8B1538]/80 dark:hover:text-[#8B1538]/70">
                          Terms and Conditions
                        </a>{' '}
                        *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privacyAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538] border-slate-300 dark:border-slate-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm cursor-pointer hover:text-[#8B1538] dark:hover:text-[#8B1538]/90 transition-colors text-slate-700 dark:text-slate-300">
                        I accept the{' '}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8B1538] dark:text-[#8B1538]/90 hover:underline focus:underline focus:outline-none hover:text-[#8B1538]/80 dark:hover:text-[#8B1538]/70">
                          Privacy Policy
                        </a>{' '}
                        *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataProcessingConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538] border-slate-300 dark:border-slate-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm cursor-pointer hover:text-[#8B1538] dark:hover:text-[#8B1538]/90 transition-colors text-slate-700 dark:text-slate-300">
                        I consent to the processing of my personal data for
                        application purposes as required by the Data Privacy Act
                        of 2012 *
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevStep}
            disabled={currentStep === 0 || isLoading}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-[#8B1538]/30 transition-colors order-2 sm:order-1">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#8B1538]/90 hover:to-[#B8264D]/90 text-white relative overflow-hidden group order-1 sm:order-2">
              <span className="relative z-10 flex items-center gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#8B1538]/90 hover:to-[#B8264D]/90 text-white relative overflow-hidden group order-1 sm:order-2">
              <span className="relative z-10">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
