'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@tupsafe/auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface LoginResponse {
  success: boolean;
  requiresOTP?: boolean;
  message?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: unknown;
  };
  data?: {
    userId: string;
    deviceFingerprint: string;
  };
  error?: string;
}

interface VerifyDeviceResponse {
  success: boolean;
  message?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: unknown;
  };
  error?: string;
}

export function LoginForm({
  redirectTo = '/dashboard',
  onSuccess,
  onError,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP state
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  const router = useRouter();

  // Create Supabase client with portal-specific cookie configuration
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if OTP is required
      if (data.requiresOTP) {
        setUserId(data.data?.userId || '');
        setDeviceFingerprint(data.data?.deviceFingerprint || '');
        setShowOTP(true);
        setIsLoading(false);
        toast.info('Verification Required', {
          description:
            data.message ||
            'Please check your email for the verification code.',
        });
        return;
      }

      // Login successful, establish Supabase session
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        // Wait for cookies to be fully persisted
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Verify session was set correctly
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          console.error('[Login] Session verification failed after setSession');
          toast.error('Session Error', {
            description: 'Failed to establish session. Please try again.',
          });
          setIsLoading(false);
          return;
        }

        console.log('[Login] ✅ Session verified successfully');

        toast.success('Login Successful', {
          description: 'Welcome back!',
        });

        onSuccess?.();

        // Use Next.js router for navigation instead of hard redirect
        router.push(redirectTo);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      setErrorMessage(err.message);
      onError?.(err);
      toast.error('Login Failed', {
        description: err.message,
      });
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (otp.length !== 6) {
      toast.error('Invalid OTP', {
        description: 'Please enter a 6-digit verification code.',
      });
      return;
    }

    setOtpLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/verify-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          deviceFingerprint,
          code: otp,
        }),
      });

      const data: VerifyDeviceResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Verification successful, establish Supabase session
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        toast.success('Verification Successful', {
          description: 'Device trusted. Logging you in...',
        });

        // Reset loading state before redirect
        setOtpLoading(false);

        onSuccess?.();

        // Redirect
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      } else {
        // No session returned - shouldn't happen, but handle it
        throw new Error('No session data received from server');
      }
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Verification failed');
      setErrorMessage(err.message);
      onError?.(err);
      toast.error('Verification Failed', {
        description: err.message,
      });
      setOtpLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="space-y-5">
        {/* OTP Verification */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#8B1538]/10 dark:bg-[#8B1538]/20 rounded-full">
              <Shield className="h-8 w-8 text-[#8B1538] dark:text-[#C74E6D]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Verify Your Device
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {errorMessage && (
          <Alert
            variant="destructive"
            className="border-red-200 dark:border-red-800/50">
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={otpLoading}>
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

          <Button
            type="button"
            onClick={handleOTPVerification}
            disabled={otpLoading || otp.length !== 6}
            className="w-full h-11 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#6B1028] hover:to-[#9A1E3D] text-white font-medium rounded-lg shadow-lg shadow-[#8B1538]/25 hover:shadow-[#8B1538]/40 transition-all duration-200">
            {otpLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowOTP(false);
              setOtp('');
              setErrorMessage('');
            }}
            disabled={otpLoading}
            className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <Alert
          variant="destructive"
          className="border-red-200 dark:border-red-800/50">
          <AlertDescription className="text-sm">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="email"
          className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@tup.edu.ph"
            required
            disabled={isLoading}
            className="h-11 pl-10 pr-4 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 dark:focus:border-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg transition-all duration-200"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="h-11 pl-10 pr-11 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 dark:focus:border-[#8B1538] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"
            disabled={isLoading}>
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-gradient-to-r from-[#8B1538] to-[#B8264D] hover:from-[#6B1028] hover:to-[#9A1E3D] text-white font-medium rounded-lg shadow-lg shadow-[#8B1538]/25 hover:shadow-[#8B1538]/40 transition-all duration-200 mt-6">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}
