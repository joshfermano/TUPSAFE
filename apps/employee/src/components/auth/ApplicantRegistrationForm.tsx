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
  Loader2,
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
import { EmailVerificationStep } from './EmailVerificationStep';

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
  registrationUserId: string | null;
  registrationEmail: string | null;
  onUserCreated: (userId: string, email: string) => void;
}

export function ApplicantRegistrationForm({
  currentStep,
  onNextStep,
  onPrevStep,
  onSubmit,
  isLoading,
  totalSteps,
  registrationUserId,
  registrationEmail,
  onUserCreated,
}: ApplicantRegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);

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
          'password',
          'confirmPassword',
        ];
        break;
      case 2:
        // Email verification step - no form validation needed
        return true;
      case 3:
        fieldsToValidate = ['positionAppliedFor'];
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
    // Special handling for step 1 - initiate registration
    if (currentStep === 1) {
      const isValid = await validateCurrentStep();
      if (!isValid) return;

      setIsInitiating(true);
      try {
        const response = await fetch('/api/auth/register/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userType: 'applicant',
            firstName: form.getValues('firstName'),
            lastName: form.getValues('lastName'),
            middleName: form.getValues('middleName') || '',
            email: form.getValues('email'),
            phoneNumber: form.getValues('phoneNumber'),
            password: form.getValues('password'),
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to initiate registration');
        }

        // Store userId and email for email verification step
        onUserCreated(result.data.userId, result.data.email);
        onNextStep();
      } catch (error) {
        console.error('Registration initiation error:', error);
        form.setError('email', {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to send verification email',
        });
      } finally {
        setIsInitiating(false);
      }
      return;
    }

    const isValid = await validateCurrentStep();
    if (isValid && currentStep < totalSteps) {
      onNextStep();
    }
  };

  // Input styling matching login page
  const inputClasses = "h-11 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 dark:focus:border-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg transition-all duration-200";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">First Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Juan"
                        className={inputClasses}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Dela Cruz"
                        className={inputClasses}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Middle Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Santos"
                      className={inputClasses}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="juan.delacruz@example.com"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Your personal email address
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+639123456789"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className={`${inputClasses} pl-10 pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    8+ characters, uppercase, lowercase, number, special character
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-600 dark:text-slate-400">Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className={`${inputClasses} pl-10 pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Step 2: Email Verification */}
        {currentStep === 2 && registrationEmail && registrationUserId && (
          <EmailVerificationStep
            email={registrationEmail}
            userId={registrationUserId}
            onVerified={onNextStep}
            onBack={onPrevStep}
          />
        )}

        {/* Step 3: Position Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
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

        {/* Step 4: Terms and Verification */}
        {currentStep === 4 && (
          <div className="space-y-6">
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

        {/* Navigation Buttons - Hidden on step 2 (email verification) */}
        {currentStep !== 2 && (
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onPrevStep}
              disabled={currentStep === 0 || isLoading || isInitiating}
              className="flex-1 h-11 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium rounded-lg transition-all duration-200 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading || isInitiating}
                className="flex-1 h-11 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#6B1028] hover:to-[#9A1E3D] text-white font-medium rounded-lg shadow-lg shadow-[#8B1538]/25 hover:shadow-[#8B1538]/40 transition-all duration-200 disabled:opacity-40"
              >
                {isInitiating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-11 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#6B1028] hover:to-[#9A1E3D] text-white font-medium rounded-lg shadow-lg shadow-[#8B1538]/25 hover:shadow-[#8B1538]/40 transition-all duration-200 disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}
