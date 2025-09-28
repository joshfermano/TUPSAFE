'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';
import AnimatedShinyText from '@/components/ui/animated-shiny-text';
import { BorderBeam } from '@/components/ui/border-beam';

import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginIdentifier: '',
      password: '',
      rememberMe: false,
      mfaCode: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, show MFA if specific test credentials are used
      if (
        data.loginIdentifier === 'test@gov.ph' &&
        data.password === 'TestPassword123!'
      ) {
        setShowMFA(true);
        return;
      }

      console.log('Login attempt:', { ...data, password: '[REDACTED]' });

      // In a real app, redirect to dashboard on success
      // router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async (mfaCode: string) => {
    if (mfaCode.length === 6) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('MFA verification:', mfaCode);
        // Redirect to dashboard
      } finally {
        setIsLoading(false);
      }
    }
  };

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
        <div className="w-full max-w-md space-y-8 animate-fade-in">
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
                  <span>Welcome Back</span>
                </AnimatedShinyText>
              </h1>
              <p className="text-muted-foreground text-lg">
                Access your government compliance dashboard
              </p>
            </div>
          </div>

          {/* Login Form */}
          <Card className="glass-government border-primary/20 shadow-xl relative overflow-hidden">
            <BorderBeam size={250} duration={12} delay={9} />

            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-primary">
                {showMFA ? 'Two-Factor Authentication' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-center">
                {showMFA
                  ? 'Enter the 6-digit code from your authenticator app'
                  : 'Enter your government credentials to continue'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {!showMFA ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5">
                    {/* Login Identifier */}
                    <FormField
                      control={form.control}
                      name="loginIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Employee ID or Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="text"
                                placeholder="Enter your employee ID or government email"
                                className="pl-10 focus-government transition-all duration-300 hover:border-primary/50"
                                disabled={isLoading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="pl-10 pr-10 focus-government transition-all duration-300 hover:border-primary/50"
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isLoading}>
                                {showPassword ? (
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

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                Remember me
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors relative group">
                        <span className="relative z-10">Forgot password?</span>
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                      </Link>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full btn-government h-11 text-base font-medium relative overflow-hidden group"
                      disabled={isLoading}>
                      <span className="relative z-10">
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          'Sign In'
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    </Button>
                  </form>
                </Form>
              ) : (
                /* MFA Form */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center relative">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                      <BorderBeam size={60} duration={12} delay={9} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">
                      Verification Code
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={form.watch('mfaCode') || ''}
                        onChange={(value) => {
                          form.setValue('mfaCode', value);
                          handleMFASubmit(value);
                        }}
                        disabled={isLoading}
                        className="gap-2">
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <InputOTPSlot
                            index={1}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <InputOTPSlot
                            index={2}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <InputOTPSlot
                            index={3}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <InputOTPSlot
                            index={4}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                          <InputOTPSlot
                            index={5}
                            className="border-primary/30 hover:border-primary/50 focus:border-primary transition-colors"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t receive a code?
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Resend MFA code')}
                      disabled={isLoading}
                      className="hover:bg-primary/5 hover:border-primary/50 transition-colors">
                      Resend Code
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full hover:bg-primary/5 transition-colors"
                    onClick={() => setShowMFA(false)}
                    disabled={isLoading}>
                    Back to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20 relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Security Notice
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    This is a secure government system. All activities are
                    logged and monitored. Unauthorized access is prohibited and
                    may result in legal action.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors relative group">
                <span className="relative z-10">Register here</span>
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
