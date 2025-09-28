'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowLeft,
  ArrowRight,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';
import AnimatedShinyText from '@/components/ui/animated-shiny-text';
import { BorderBeam } from '@/components/ui/border-beam';

import {
  registerSchema,
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  registerStep4Schema,
  GOVERNMENT_DEPARTMENTS,
  type RegisterFormData,
} from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 1,
    title: 'Personal Info',
    description: 'Basic information',
    icon: User,
  },
  {
    id: 2,
    title: 'Employment',
    description: 'Government position details',
    icon: Building,
  },
  {
    id: 3,
    title: 'Security',
    description: 'Account security setup',
    icon: Shield,
  },
  {
    id: 4,
    title: 'Verification',
    description: 'Terms and verification',
    icon: FileText,
  },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phoneNumber: '',
      department: '',
      position: '',
      employeeId: '',
      yearsOfService: undefined,
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      privacyAccepted: false,
      dataProcessingConsent: false,
    },
    mode: 'onChange',
  });

  const getCurrentStepSchema = () => {
    switch (currentStep) {
      case 1:
        return registerStep1Schema;
      case 2:
        return registerStep2Schema;
      case 3:
        return registerStep3Schema;
      case 4:
        return registerStep4Schema;
      default:
        return registerStep1Schema;
    }
  };

  const validateCurrentStep = async () => {
    const schema = getCurrentStepSchema();
    const currentData = form.getValues();

    try {
      schema.parse(currentData);
      return true;
    } catch {
      // Trigger form validation to show errors
      await form.trigger();
      return false;
    }
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('Registration attempt:', {
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

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <Card className="text-center space-y-6 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20 relative overflow-hidden">
              <BorderBeam
                size={250}
                duration={12}
                delay={9}
                colorFrom="#22c55e"
                colorTo="#16a34a"
              />

              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl text-green-800 dark:text-green-200">
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out">
                    <span>Registration Submitted</span>
                  </AnimatedShinyText>
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Your account is pending verification
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Processing time: 1-3 business days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>
                      Verification email sent to your government address
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>HR department will verify your employment</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">
                    You will receive an email notification once your account has
                    been verified and activated. Please check your government
                    email regularly.
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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated Background */}
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

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors relative">
                <ShieldCheck className="h-8 w-8 text-primary relative z-10" />
                <BorderBeam size={40} duration={12} delay={9} />
              </div>
              <div className="text-left">
                <AnimatedGradientText>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent">
                    SmartGov
                  </span>
                </AnimatedGradientText>
                <p className="text-xs text-muted-foreground">
                  Government Compliance System
                </p>
              </div>
            </Link>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                  <span>Create Account</span>
                </AnimatedShinyText>
              </h1>
              <p className="text-muted-foreground text-lg">
                Register for secure access to government compliance tools
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center space-y-2">
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                  ${
                    currentStep >= step.id
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                      : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/30'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                  {currentStep >= step.id && (
                    <BorderBeam size={48} duration={12} delay={9} />
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={`text-xs font-medium transition-colors ${
                      currentStep >= step.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <Card className="glass-government border-primary/20 shadow-xl relative overflow-hidden">
            <BorderBeam size={250} duration={12} delay={9} />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-primary">
                {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription className="text-center">
                {STEPS[currentStep - 1].description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  className="focus-government transition-all duration-300 hover:border-primary/50"
                                  aria-describedby="firstName-description"
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
                                  className="focus-government transition-all duration-300 hover:border-primary/50"
                                  aria-describedby="lastName-description"
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
                                className="focus-government transition-all duration-300 hover:border-primary/50"
                                aria-describedby="middleName-description"
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
                            <FormLabel>Government Email *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="juan.delacruz@gov.ph"
                                  className="pl-10 focus-government transition-all duration-300 hover:border-primary/50"
                                  aria-describedby="email-description"
                                />
                              </div>
                            </FormControl>
                            <FormDescription id="email-description">
                              Use your official government email address
                            </FormDescription>
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
                                  className="pl-10 focus-government transition-all duration-300 hover:border-primary/50"
                                  aria-describedby="phone-description"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 2: Employment Details */}
                  {currentStep === 2 && (
                    <div className="space-y-5">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Government Department *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="focus-government transition-all duration-300 hover:border-primary/50">
                                  <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GOVERNMENT_DEPARTMENTS.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position/Job Title *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  placeholder="e.g., Administrative Officer III"
                                  className="pl-10 focus-government transition-all duration-300 hover:border-primary/50"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="EMP001234"
                                  className="focus-government transition-all duration-300 hover:border-primary/50"
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Your official government employee ID
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="yearsOfService"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Service</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="0"
                                  className="focus-government transition-all duration-300 hover:border-primary/50"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Total years in government service (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Security Setup */}
                  {currentStep === 3 && (
                    <div className="space-y-5">
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
                                  className="pl-10 pr-10 focus-government transition-all duration-300 hover:border-primary/50"
                                  aria-describedby="password-requirements"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label={
                                    showPassword
                                      ? 'Hide password'
                                      : 'Show password'
                                  }>
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription
                              id="password-requirements"
                              className="text-xs space-y-1">
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
                                  type={
                                    showConfirmPassword ? 'text' : 'password'
                                  }
                                  placeholder="Confirm your password"
                                  className="pl-10 pr-10 focus-government transition-all duration-300 hover:border-primary/50"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label={
                                    showConfirmPassword
                                      ? 'Hide password confirmation'
                                      : 'Show password confirmation'
                                  }>
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
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  aria-describedby="terms-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-primary transition-colors">
                                  I accept the{' '}
                                  <Link
                                    href="/terms"
                                    className="text-primary hover:underline focus:underline focus:outline-none">
                                    Terms and Conditions
                                  </Link>{' '}
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
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  aria-describedby="privacy-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-primary transition-colors">
                                  I accept the{' '}
                                  <Link
                                    href="/privacy"
                                    className="text-primary hover:underline focus:underline focus:outline-none">
                                    Privacy Policy
                                  </Link>{' '}
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
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  aria-describedby="data-processing-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-primary transition-colors">
                                  I consent to the processing of my personal
                                  data for government compliance purposes as
                                  required by the Data Privacy Act of 2012 *
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Account Verification Process
                              </p>
                              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <p>
                                  • Your registration will be reviewed by HR
                                  personnel
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
                                  • Ensure all information provided is accurate
                                  and complete
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1 || isLoading}
                      className="flex items-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors order-2 sm:order-1">
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={isLoading}
                        className="flex items-center gap-2 btn-government relative overflow-hidden group order-1 sm:order-2">
                        <span className="relative z-10 flex items-center gap-2">
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 btn-government relative overflow-hidden group order-1 sm:order-2">
                        <span className="relative z-10">
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Submit Registration
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors relative group">
                <span className="relative z-10">Sign in here</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Link>
            </p>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>SmartGov - Philippine Government Compliance System</p>
              <p className="space-x-2">
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors relative group">
                  <span className="relative z-10">Privacy Policy</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <span className="text-muted-foreground/50">•</span>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors relative group">
                  <span className="relative z-10">Terms of Service</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <span className="text-muted-foreground/50">•</span>
                <Link
                  href="/help"
                  className="hover:text-primary transition-colors relative group">
                  <span className="relative z-10">Help</span>
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
