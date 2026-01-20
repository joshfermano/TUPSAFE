'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

function ForgotPasswordContent() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or employee ID');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Verification code sent', {
          description:
            'If an account exists, you will receive a code via email.',
        });
      } else {
        toast.error('Request failed', {
          description: data.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToReset = () => {
    // Pass identifier to reset page via query param
    router.push(
      `/auth/reset-password?identifier=${encodeURIComponent(identifier)}`
    );
  };

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
                  Forgot Password
                </span>
              </AnimatedGradientText>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter your email or employee ID to receive a verification code
              </p>
            </div>

            {isSuccess ? (
              // Success State
              <div className="space-y-6">
                <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    If an account exists with this identifier, a verification
                    code has been sent to the associated email address.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleContinueToReset}
                    className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Enter Verification Code
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false);
                      setIdentifier('');
                    }}
                    className="w-full h-11">
                    Try Different Email/ID
                  </Button>
                </div>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <Button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full h-11 bg-[#8B1538] hover:bg-[#6B0F2A] text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-[#8B1538] dark:hover:text-red-400 transition-colors">
                <ArrowLeft className="h-4 w-4" />
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-[#B8264D]/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B1538]/20 border-t-[#8B1538]"></div>
        </div>
      }>
      <ForgotPasswordContent />
    </Suspense>
  );
}

