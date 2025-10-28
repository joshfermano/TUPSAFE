'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
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
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';

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

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-28 pb-8">
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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background Grid Pattern */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
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
              className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-4 py-2"
            >
              <Shield className="w-4 h-4 mr-2" />
              Secure Government Portal
            </Badge>
          </div>

          {/* Main Title */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatedGradientText className="text-3xl sm:text-4xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                TUPSAFE
              </span>
            </AnimatedGradientText>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300">
              Employee Registration
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0">
              Join the secure digital platform for PDS and SALN submissions with complete audit trails and compliance management.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-100 dark:border-slate-700">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">e-PDS Management</span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-blue-100 dark:border-slate-700">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">e-SALN Compliance</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto lg:mx-0">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className="flex flex-col items-center space-y-2">
                <div
                  className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                  ${
                    currentStep >= step.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                      : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-blue-400'
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
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Indicator */}
          <div className="hidden md:flex justify-center lg:justify-start">
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-2 transition ease-out hover:text-blue-600 hover:duration-300 hover:dark:text-blue-400">
              <Users className="w-4 h-4 mr-2" />
              <span>Join Philippine Government Employees</span>
              <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>

        {/* Registration Form - Right Side */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md">
            <MagicCard
              className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-blue-200/50 dark:border-slate-700/50 shadow-2xl"
              gradientColor="rgba(59, 130, 246, 0.08)"
              gradientOpacity={0.3}
            >
              <BorderBeam size={280} duration={12} delay={9} />

              <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {STEPS[currentStep - 1].title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {STEPS[currentStep - 1].description}
                  </p>
                </div>

                {/* Registration Form */}
                <div className="space-y-4">
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
                                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                    <div className="space-y-4 sm:space-y-5">
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
                                <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500">
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
                                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4">
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
                                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="pl-10 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="pl-10 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
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
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-slate-300 dark:border-slate-600"
                                  aria-describedby="terms-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300">
                                  I accept the{' '}
                                  <Link
                                    href="/terms"
                                    className="text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none hover:text-blue-700 dark:hover:text-blue-300">
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
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-slate-300 dark:border-slate-600"
                                  aria-describedby="privacy-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300">
                                  I accept the{' '}
                                  <Link
                                    href="/privacy"
                                    className="text-blue-600 dark:text-blue-400 hover:underline focus:underline focus:outline-none hover:text-blue-700 dark:hover:text-blue-300">
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
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-slate-300 dark:border-slate-600"
                                  aria-describedby="data-processing-description"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300">
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
                      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={currentStep === 1 || isLoading}
                          className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-300 transition-colors order-2 sm:order-1">
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        {currentStep < 4 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white relative overflow-hidden group order-1 sm:order-2">
                            <span className="relative z-10 flex items-center gap-2">
                              Next
                              <ArrowRight className="h-4 w-4" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white relative overflow-hidden group order-1 sm:order-2">
                            <span className="relative z-10">
                              {isLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  Submit Registration
                                </>
                              )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </div>

                {/* Help Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link
                      href="/auth/login"
                      className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
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
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-300/20 rounded-full blur-lg"></div>
    </div>
  );
}
