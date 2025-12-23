'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  Building2,
  Mail,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { UserTypeSelection } from '../../../components/auth/UserTypeSelection';
import { EmployeeRegistrationForm } from '../../../components/auth/EmployeeRegistrationForm';
import { ApplicantRegistrationForm } from '../../../components/auth/ApplicantRegistrationForm';
import { MagicCard } from '../../../components/ui/magic-card';
import { BorderBeam } from '../../../components/ui/border-beam';
import { AnimatedGradientText } from '../../../components/ui/animated-gradient-text';
import AnimatedGridPattern from '../../../components/ui/animated-grid-pattern';

import {
  type EmployeeRegistrationFormData,
  type ApplicantRegistrationFormData,
} from '../../../lib/validations/auth';
import { cn } from '../../../lib/utils';

// Local storage key for draft persistence
const REGISTRATION_DRAFT_KEY = 'tupsafe_registration_draft';

// Draft data structure
interface RegistrationDraft {
  userId: string;
  email: string;
  userTypeSelection: UserTypeSelection;
  expiresAt: number; // Unix timestamp
}

// Helper to save draft to localStorage
function saveDraft(draft: RegistrationDraft): void {
  try {
    localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save registration draft:', error);
  }
}

// Helper to load draft from localStorage
function loadDraft(): RegistrationDraft | null {
  try {
    const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;

    const draft: RegistrationDraft = JSON.parse(raw);
    
    // Check if draft is expired
    if (Date.now() > draft.expiresAt) {
      clearDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.error('Failed to load registration draft:', error);
    return null;
  }
}

// Helper to clear draft from localStorage
function clearDraft(): void {
  try {
    localStorage.removeItem(REGISTRATION_DRAFT_KEY);
  } catch (error) {
    console.error('Failed to clear registration draft:', error);
  }
}

// Minimalist step definitions
const EMPLOYEE_STEPS = [
  { id: 0, title: 'User Type' },
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Email Verify' },
  { id: 3, title: 'Employment' },
  { id: 4, title: 'Terms' },
];

const APPLICANT_STEPS = [
  { id: 0, title: 'User Type' },
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Email Verify' },
  { id: 3, title: 'Position' },
  { id: 4, title: 'Terms' },
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
  const [registrationUserId, setRegistrationUserId] = useState<string | null>(
    null
  );
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(
    null
  );
  
  // Continue registration state
  const [showContinueForm, setShowContinueForm] = useState(false);
  const [continueEmail, setContinueEmail] = useState('');
  const [continueError, setContinueError] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const isEmployee = userTypeSelection?.startsWith('employee');
  const isApplicant = userTypeSelection === 'applicant';
  const isFaculty = userTypeSelection === 'employee-faculty';
  const steps = isEmployee ? EMPLOYEE_STEPS : APPLICANT_STEPS;

  // Restore draft from localStorage on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && !draftRestored) {
      console.log('Restoring registration draft:', draft.email);
      setRegistrationUserId(draft.userId);
      setRegistrationEmail(draft.email);
      setUserTypeSelection(draft.userTypeSelection);
      setCurrentStep(2); // Jump to OTP step
      setDraftRestored(true);
    }
  }, [draftRestored]);

  // Save draft when user is created (after initiate succeeds)
  const handleUserCreated = useCallback((userId: string, email: string) => {
    setRegistrationUserId(userId);
    setRegistrationEmail(email);
    
    // Save draft with 15-minute expiry (aligned with OTP expiry)
    const expiresAt = Date.now() + 15 * 60 * 1000;
    saveDraft({
      userId,
      email,
      userTypeSelection: userTypeSelection!,
      expiresAt,
    });
  }, [userTypeSelection]);

  // Clear draft on successful verification or completion
  const handleVerificationComplete = useCallback(() => {
    clearDraft();
  }, []);

  const handleUserTypeSelection = (type: UserTypeSelection) => {
    setUserTypeSelection(type);
    setCurrentStep(1);
    setShowContinueForm(false);
  };

  // Handle continue registration form submission
  const handleContinueRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!continueEmail.trim()) {
      setContinueError('Please enter your email address');
      return;
    }

    setIsResuming(true);
    setContinueError(null);

    try {
      const response = await fetch('/api/auth/register/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: continueEmail.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle specific error codes
        if (result.code === 'NOT_FOUND') {
          setContinueError('No registration found for this email. Please start a new registration.');
        } else if (result.code === 'ALREADY_REGISTERED') {
          setContinueError('This email is already registered. Please sign in instead.');
        } else if (result.code === 'EXPIRED') {
          setContinueError('Your registration has expired. Please start a new registration.');
        } else {
          setContinueError(result.error || 'Failed to resume registration');
        }
        return;
      }

      // Success - restore state and jump to OTP
      const { userId, email, userType, employmentCategory } = result.data;
      
      // Map API response to userTypeSelection
      let mappedUserType: UserTypeSelection;
      if (userType === 'applicant') {
        mappedUserType = 'applicant';
      } else if (employmentCategory === 'faculty') {
        mappedUserType = 'employee-faculty';
      } else {
        mappedUserType = 'employee-staff';
      }

      setRegistrationUserId(userId);
      setRegistrationEmail(email);
      setUserTypeSelection(mappedUserType);
      setCurrentStep(2); // Jump to OTP step
      setShowContinueForm(false);

      // Save draft for future refreshes
      const expiresAt = Date.now() + 15 * 60 * 1000;
      saveDraft({
        userId,
        email,
        userTypeSelection: mappedUserType,
        expiresAt,
      });
    } catch (error) {
      console.error('Continue registration error:', error);
      setContinueError('An unexpected error occurred. Please try again.');
    } finally {
      setIsResuming(false);
    }
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
    if (currentStep === 1) {
      setUserTypeSelection(null);
      setCurrentStep(0);
    }
  };

  const onSubmitEmployee = async (data: EmployeeRegistrationFormData) => {
    console.log('[onSubmitEmployee] Called with data:', {
      ...data,
      password: '[REDACTED]',
      confirmPassword: '[REDACTED]',
    });
    
    if (!registrationUserId) {
      console.error('Registration user ID not found');
      return;
    }

    setIsLoading(true);
    try {
      // Call the registration complete API to save employment details
      const response = await fetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: registrationUserId,
          employmentCategory: data.employmentCategory,
          hireDate: data.hireDate ? data.hireDate.toISOString() : null,
          // For faculty: collegeOrOffice is the college, department is the department
          // For administrative: collegeOrOffice is the office
          departmentId: isFaculty ? data.department : undefined,
          collegeId: data.collegeOrOffice,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to complete registration');
      }

      console.log('Employee registration completed:', {
        userId: registrationUserId,
        departmentId: result.data.departmentId,
      });

      // Clear draft on successful completion
      clearDraft();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
      // Show error to user - they can try submitting again
      alert(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitApplicant = async (data: ApplicantRegistrationFormData) => {
    setIsLoading(true);
    try {
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

  // Success state - Match login page aesthetic
  if (isSubmitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 overflow-hidden">
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

        <div className="relative z-10 w-full max-w-md space-y-8 animate-in fade-in duration-700">
          <MagicCard
            className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl"
            gradientColor="rgba(139, 21, 56, 0.06)"
            gradientOpacity={0.2}>
            <BorderBeam size={280} duration={12} delay={9} />

            <div className="p-7 sm:p-9 space-y-6">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20 flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle2
                    className="h-10 w-10 text-[#8B1538] dark:text-red-400"
                    strokeWidth={2}
                  />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Registration Submitted
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your account is pending verification
                  </p>
                </div>

                <div className="w-full space-y-3 text-left pt-4">
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1538] dark:bg-red-400 mt-2 flex-shrink-0" />
                    <span>Processing time: 1-3 business days</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1538] dark:bg-red-400 mt-2 flex-shrink-0" />
                    <span>
                      Verification email sent to your{' '}
                      {isEmployee ? 'TUP Manila email' : 'email'} address
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1538] dark:bg-red-400 mt-2 flex-shrink-0" />
                    <span>
                      {isEmployee
                        ? 'HR department will verify your employment'
                        : 'HR will review your application'}
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] dark:bg-[#8B1538] dark:hover:bg-[#B8264D] text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-[#8B1538]/20">
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#8B1538]/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#B8264D]/20 rounded-full blur-xl"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Hero Section - Left Side */}
        <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Badge */}
          <div className="flex justify-center lg:justify-start">
            <Badge
              variant="secondary"
              className="bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-red-200 border-[#8B1538]/20 dark:border-[#8B1538]/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              TUP Manila Registration Portal
            </Badge>
          </div>

          {/* Main Title */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatedGradientText className="text-3xl sm:text-4xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-[#8B1538] via-[#6B0F2A] to-[#B8264D] bg-clip-text text-transparent">
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
                ? 'Secure digital platform for TUP Manila employees managing PDS and SALN submissions'
                : isApplicant
                ? 'Apply for open positions at TUP Manila with complete application tracking'
                : 'Choose your registration type to get started with TUPSAFE'}
            </p>
          </div>

          {/* Progress Indicator */}
          {userTypeSelection && (
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    currentStep >= step.id
                      ? 'bg-[#8B1538] dark:bg-red-400 w-8'
                      : 'bg-slate-200 dark:bg-slate-700 w-6'
                  )}
                />
              ))}
            </div>
          )}

          {/* Feature Highlights */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#8B1538]/20 dark:border-slate-700">
              <FileText className="w-5 h-5 text-[#8B1538] dark:text-red-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-PDS Management
              </span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#8B1538]/20 dark:border-slate-700">
              <Building2 className="w-5 h-5 text-[#8B1538] dark:text-red-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-SALN Compliance
              </span>
            </div>
          </div>
        </div>

        {/* Registration Form - Right Side */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md">
            <MagicCard
              className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl"
              gradientColor="rgba(139, 21, 56, 0.06)"
              gradientOpacity={0.2}>
              <BorderBeam size={280} duration={12} delay={9} />

              <div className="p-7 sm:p-9 space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {showContinueForm ? 'Continue Registration' : steps[currentStep].title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {showContinueForm
                      ? 'Resume your incomplete registration'
                      : currentStep === 0
                        ? 'Select your user type to begin registration'
                        : `Step ${currentStep} of ${steps.length - 1}`}
                  </p>
                </div>

                {/* Form Content */}
                <div>
                  {/* Step 0: User Type Selection or Continue Registration */}
                  {currentStep === 0 && !showContinueForm && (
                    <>
                      <UserTypeSelection
                        value={userTypeSelection || undefined}
                        onChange={handleUserTypeSelection}
                        error={
                          !userTypeSelection && currentStep > 0
                            ? 'Please select your user type'
                            : undefined
                        }
                      />
                      
                      {/* Continue Registration Link */}
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => setShowContinueForm(true)}
                          className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#8B1538] dark:hover:text-red-400 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Continue a previous registration
                        </button>
                      </div>
                    </>
                  )}

                  {/* Continue Registration Form */}
                  {currentStep === 0 && showContinueForm && (
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20 flex items-center justify-center">
                          <Mail className="w-6 h-6 text-[#8B1538] dark:text-red-400" />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Enter the email you used to start registration
                        </p>
                      </div>

                      <form onSubmit={handleContinueRegistration} className="space-y-4">
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={continueEmail}
                            onChange={(e) => {
                              setContinueEmail(e.target.value);
                              setContinueError(null);
                            }}
                            className={cn(
                              "h-11",
                              continueError && "border-red-500 focus-visible:ring-red-500"
                            )}
                            disabled={isResuming}
                          />
                          {continueError && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                              {continueError}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={isResuming}
                          className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] dark:bg-[#8B1538] dark:hover:bg-[#B8264D] text-white font-medium"
                        >
                          {isResuming ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Looking up registration...
                            </>
                          ) : (
                            'Continue Registration'
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowContinueForm(false);
                            setContinueEmail('');
                            setContinueError(null);
                          }}
                          className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-[#8B1538] dark:hover:text-red-400 transition-colors"
                        >
                          ← Back to registration options
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Employee Registration Form */}
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
                      registrationUserId={registrationUserId}
                      registrationEmail={registrationEmail}
                      onUserCreated={handleUserCreated}
                      onVerificationComplete={handleVerificationComplete}
                    />
                  )}

                  {/* Applicant Registration Form */}
                  {isApplicant && currentStep > 0 && (
                    <ApplicantRegistrationForm
                      currentStep={currentStep}
                      onNextStep={nextStep}
                      onPrevStep={prevStep}
                      onSubmit={onSubmitApplicant}
                      isLoading={isLoading}
                      totalSteps={4}
                      registrationUserId={registrationUserId}
                      registrationEmail={registrationEmail}
                      onUserCreated={handleUserCreated}
                      onVerificationComplete={handleVerificationComplete}
                    />
                  )}
                </div>

                {/* Help Section */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link
                      href="/auth/login"
                      className="text-[#8B1538] dark:text-red-400 font-medium hover:text-[#6B0F2A] dark:hover:text-red-300 transition-colors inline-flex items-center gap-1">
                      Sign in
                      <ArrowRight className="h-3 w-3 transition-transform hover:translate-x-0.5" />
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
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#8B1538]/20 rounded-full blur-lg"></div>
    </div>
  );
}
