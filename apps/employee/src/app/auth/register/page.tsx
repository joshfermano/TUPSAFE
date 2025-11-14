'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Shield,
  FileText,
  Building,
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  Check,
  AlertCircle,
  Building2,
  Users,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';

// Import new components
import { UserTypeSelection } from '@/components/auth/UserTypeSelection';
import { EmployeeRegistrationForm } from '@/components/auth/EmployeeRegistrationForm';
import { ApplicantRegistrationForm } from '@/components/auth/ApplicantRegistrationForm';

import {
  type EmployeeRegistrationFormData,
  type ApplicantRegistrationFormData,
} from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

// Step definitions for employee flow
const EMPLOYEE_STEPS = [
  {
    id: 0,
    title: 'User Type',
    description: 'Select your role',
    icon: Users,
  },
  {
    id: 1,
    title: 'Personal Info',
    description: 'Basic information',
    icon: User,
  },
  {
    id: 2,
    title: 'Employment',
    description: 'Position details',
    icon: Building,
  },
  {
    id: 3,
    title: 'Security',
    description: 'Account security',
    icon: Shield,
  },
  {
    id: 4,
    title: 'Verification',
    description: 'Terms and verification',
    icon: FileText,
  },
];

// Step definitions for applicant flow
const APPLICANT_STEPS = [
  {
    id: 0,
    title: 'User Type',
    description: 'Select your role',
    icon: Users,
  },
  {
    id: 1,
    title: 'Personal Info',
    description: 'Basic information',
    icon: User,
  },
  {
    id: 2,
    title: 'Position',
    description: 'Select position',
    icon: Briefcase,
  },
  {
    id: 3,
    title: 'Security',
    description: 'Account security',
    icon: Shield,
  },
  {
    id: 4,
    title: 'Verification',
    description: 'Terms and verification',
    icon: FileText,
  },
];

type UserTypeSelection =
  | 'employee-faculty'
  | 'employee-staff'
  | 'applicant'
  | null;

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userTypeSelection, setUserTypeSelection] =
    useState<UserTypeSelection>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Determine if employee or applicant
  const isEmployee = userTypeSelection?.startsWith('employee');
  const isApplicant = userTypeSelection === 'applicant';
  const isFaculty = userTypeSelection === 'employee-faculty';

  // Get appropriate steps based on user type
  const steps = isEmployee ? EMPLOYEE_STEPS : APPLICANT_STEPS;

  const handleUserTypeSelection = (type: UserTypeSelection) => {
    setUserTypeSelection(type);
    setCurrentStep(1); // Move to first form step after selection
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
    // If going back to step 0, reset user type selection
    if (currentStep === 1) {
      setUserTypeSelection(null);
      setCurrentStep(0);
    }
  };

  const onSubmitEmployee = async (data: EmployeeRegistrationFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('Employee registration attempt:', {
        ...data,
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]',
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitApplicant = async (data: ApplicantRegistrationFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('Applicant registration attempt:', {
        ...data,
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]',
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-28 pb-8">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <Card className="text-center space-y-6 border-[#8B1538]/20 bg-[#8B1538]/5 dark:border-[#8B1538]/80 dark:bg-[#8B1538]/20 relative overflow-hidden">
              <BorderBeam
                size={250}
                duration={12}
                delay={9}
                colorFrom="#8B1538"
                colorTo="#B8264D"
              />

              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-[#8B1538]/10 dark:bg-[#8B1538]/50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#8B1538] dark:text-[#8B1538]/90" />
                </div>
                <CardTitle className="text-xl text-[#8B1538] dark:text-[#8B1538]/90">
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out">
                    <span>Registration Submitted</span>
                  </AnimatedShinyText>
                </CardTitle>
                <CardDescription className="text-[#8B1538]/80 dark:text-[#8B1538]/70">
                  Your account is pending verification
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-[#8B1538]/80 dark:text-[#8B1538]/70">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Processing time: 1-3 business days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>
                      Verification email sent to your{' '}
                      {isEmployee ? 'TUP Manila email' : 'email'} address
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>
                      {isEmployee
                        ? 'HR department will verify your employment'
                        : 'HR will review your application'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#8B1538]/20 dark:border-[#8B1538]/80">
                  <p className="text-xs text-[#8B1538]/70 dark:text-[#8B1538]/60 leading-relaxed">
                    You will receive an email notification once your account has
                    been verified and activated. Please check your email
                    regularly.
                  </p>
                </div>

                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-[#8B1538]/5 to-[#B8264D]/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background Grid Pattern */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
        )}
      />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-start lg:items-center">
        {/* Hero Section - Left Side */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Badge */}
          <div className="flex justify-center lg:justify-start">
            <Badge
              variant="secondary"
              className="bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#8B1538]/90 border-[#8B1538]/20 dark:border-[#8B1538]/80 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              TUP Manila Registration Portal
            </Badge>
          </div>

          {/* Main Title */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatedGradientText className="text-3xl sm:text-4xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-[#8B1538] via-[#B8264D] to-[#8B1538] bg-clip-text text-transparent">
                TUPSAFE
              </span>
            </AnimatedGradientText>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300">
              {isEmployee
                ? 'Employee Registration'
                : isApplicant
                ? 'Applicant Registration'
                : 'Registration Portal'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0">
              {isEmployee
                ? 'Secure digital platform for TUP Manila employees'
                : isApplicant
                ? 'Apply for open positions at TUP Manila'
                : 'Choose your registration type to get started'}
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#8B1538]/20 dark:border-slate-700">
              <FileText className="w-5 h-5 text-[#8B1538] dark:text-[#8B1538]/90" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-PDS Management
              </span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#B8264D]/20 dark:border-slate-700">
              <Building2 className="w-5 h-5 text-[#B8264D] dark:text-[#B8264D]/90" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-SALN Compliance
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          {userTypeSelection && (
            <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-2xl mx-auto lg:mx-0">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center space-y-2">
                  <div
                    className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                    ${
                      currentStep >= step.id
                        ? 'bg-[#8B1538] border-[#8B1538] text-white shadow-lg scale-110'
                        : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-[#8B1538]/40'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <step.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                    {currentStep >= step.id && (
                      <BorderBeam size={40} duration={12} delay={9} />
                    )}
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-[10px] sm:text-xs font-medium transition-colors leading-tight ${
                        currentStep >= step.id
                          ? 'text-[#8B1538] dark:text-[#8B1538]/90'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Indicator */}
          <div className="hidden md:flex justify-center lg:justify-start">
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-2 transition ease-out hover:text-[#8B1538] hover:duration-300 hover:dark:text-[#8B1538]/90">
              <Users className="w-4 h-4 mr-2" />
              <span>Join TUP Manila Community</span>
              <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>

        {/* Registration Form - Right Side */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md">
            <MagicCard
              className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-[#8B1538]/20 dark:border-slate-700/50 shadow-2xl"
              gradientColor="rgba(139, 21, 56, 0.08)"
              gradientOpacity={0.3}>
              <BorderBeam size={280} duration={12} delay={9} />

              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {steps[currentStep].description}
                  </p>
                </div>

                {/* Registration Form Content */}
                <div className="space-y-4">
                  {/* Step 0: User Type Selection */}
                  {currentStep === 0 && (
                    <UserTypeSelection
                      value={userTypeSelection || undefined}
                      onChange={handleUserTypeSelection}
                      error={
                        !userTypeSelection && currentStep > 0
                          ? 'Please select your user type'
                          : undefined
                      }
                    />
                  )}

                  {/* Employee Registration Form (Steps 1-4) */}
                  {isEmployee && currentStep > 0 && (
                    <EmployeeRegistrationForm
                      employmentCategory={
                        isFaculty ? 'faculty' : 'administrative'
                      }
                      currentStep={currentStep}
                      onNextStep={nextStep}
                      onPrevStep={prevStep}
                      onSubmit={onSubmitEmployee}
                      isLoading={isLoading}
                      totalSteps={4}
                    />
                  )}

                  {/* Applicant Registration Form (Steps 1-4) */}
                  {isApplicant && currentStep > 0 && (
                    <ApplicantRegistrationForm
                      currentStep={currentStep}
                      onNextStep={nextStep}
                      onPrevStep={prevStep}
                      onSubmit={onSubmitApplicant}
                      isLoading={isLoading}
                      totalSteps={4}
                    />
                  )}

                  {/* Verification Info Card - Shown on Step 4 */}
                  {currentStep === 4 && (
                    <Card className="border-[#8B1538]/20 bg-[#8B1538]/5 dark:border-[#8B1538]/80 dark:bg-[#8B1538]/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-[#8B1538] dark:text-[#8B1538]/90 flex-shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-[#8B1538] dark:text-[#8B1538]/90">
                              {isEmployee
                                ? 'Account Verification Process'
                                : 'Application Review Process'}
                            </p>
                            <div className="text-xs text-[#8B1538]/80 dark:text-[#8B1538]/70 space-y-1">
                              {isEmployee ? (
                                <>
                                  <p>
                                    • Your registration will be reviewed by TUP
                                    HR personnel
                                  </p>
                                  <p>
                                    • Employment verification may take 1-3
                                    business days
                                  </p>
                                  <p>
                                    • You will receive email confirmation when
                                    approved
                                  </p>
                                  <p>
                                    • Ensure all information provided is
                                    accurate and complete
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p>
                                    • Your application will be reviewed by the
                                    hiring committee
                                  </p>
                                  <p>• Review process may take 1-2 weeks</p>
                                  <p>• You will receive updates via email</p>
                                  <p>
                                    • Ensure all information matches your
                                    resume/CV
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Help Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link
                      href="/auth/login"
                      className="text-[#8B1538] dark:text-[#8B1538]/90 font-medium hover:text-[#8B1538]/80 dark:hover:text-[#8B1538]/70 transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-[#8B1538]/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#B8264D]/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#8B1538]/10 rounded-full blur-lg"></div>
    </div>
  );
}
