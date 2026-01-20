'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MagicCard } from '../../../components/ui/magic-card';
import { BorderBeam } from '../../../components/ui/border-beam';
import { AnimatedGradientText } from '../../../components/ui/animated-gradient-text';
import AnimatedGridPattern from '../../../components/ui/animated-grid-pattern';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../../components/ui/input-otp';
import {
  Loader2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  User,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-fill identifier from query params
  useEffect(() => {
    const prefillIdentifier = searchParams.get('identifier');
    if (prefillIdentifier) {
      setIdentifier(prefillIdentifier);
    }
  }, [searchParams]);

  // Password requirements check
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or employee ID');
      return;
    }

    if (code.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (!doPasswordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          code,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        toast.success('Password reset successful', {
          description: 'You can now log in with your new password.',
        });
      } else {
        toast.error('Reset failed', {
          description: data.error || 'Please check your code and try again.',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter your email or employee ID first');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          type: 'password_reset',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Code resent', {
          description:
            'If an account exists, a new verification code has been sent.',
        });
        setCode(''); // Clear the OTP input
      } else {
        toast.error('Failed to resend', {
          description: data.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
      <div className="relative z-10 w-full max-w-md mx-auto">
        <MagicCard
          className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl"
          gradientColor="rgba(139, 21, 56, 0.06)"
          gradientOpacity={0.2}>
          <BorderBeam size={280} duration={12} delay={9} />

          <div className="p-7 sm:p-9 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              {/* TUP Logo */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/tup-logo.png"
                  alt="TUP Manila Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-[#8B1538] dark:text-red-400" />
                </div>
              </div>
              <AnimatedGradientText className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-[#8B1538] via-[#6B0F2A] to-[#B8264D] bg-clip-text text-transparent">
                  Reset Password
                </span>
              </AnimatedGradientText>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your verification code and set a new password
              </p>
            </div>

            {isSuccess ? (
              // Success State
              <div className="space-y-6">
                <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Your password has been reset successfully. You can now log
                    in with your new password.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] text-white">
                  Go to Login
                </Button>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Identifier Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="identifier"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email or Employee ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="email@tup.edu.ph or TUPM-1223-95-001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-11 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#8B1538]/20 focus:border-[#8B1538]"
                    />
                  </div>
                </div>

                {/* OTP Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Verification Code
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendCode}
                      disabled={isResending || isLoading}
                      className="text-xs text-[#8B1538] hover:text-[#6B0F2A] dark:text-red-400">
                      {isResending ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Resend Code
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={setCode}
                      disabled={isLoading}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#8B1538]/20 focus:border-[#8B1538]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                      {Object.entries({
                        'At least 8 characters': passwordRequirements.length,
                        'One uppercase letter': passwordRequirements.uppercase,
                        'One lowercase letter': passwordRequirements.lowercase,
                        'One number': passwordRequirements.number,
                        'One special character': passwordRequirements.special,
                      }).map(([req, met]) => (
                        <div
                          key={req}
                          className={cn(
                            'flex items-center gap-1',
                            met
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-slate-500 dark:text-slate-400'
                          )}>
                          <CheckCircle2
                            className={cn(
                              'h-3 w-3',
                              met ? 'opacity-100' : 'opacity-40'
                            )}
                          />
                          {req}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#8B1538]/20 focus:border-[#8B1538]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !doPasswordsMatch && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !identifier.trim() ||
                    code.length !== 6 ||
                    !isPasswordValid ||
                    !doPasswordsMatch
                  }
                  className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {/* Back Links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
              <Link
                href="/auth/forgot-password"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#8B1538] dark:hover:text-red-400 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Request New Code
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500 hover:text-[#8B1538] dark:hover:text-red-400 transition-colors">
                Back to Login
              </Link>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B1538]/20 border-t-[#8B1538]"></div>
        </div>
      }>
      <ResetPasswordContent />
    </Suspense>
  );
}

