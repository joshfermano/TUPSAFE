'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EmailVerificationStepProps {
  email: string;
  userId: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerificationStep({
  email,
  userId,
  onVerified,
  onBack,
}: EmailVerificationStepProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleaned);
    setError(null);
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: otp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to verify code. Please try again.'
      );
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'email_verification',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to resend code');
      }

      setResendCooldown(60);
      setOtp('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend code. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-10">
      {/* Email Info Card - Minimalist */}
      <div className="p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#2A2A2A] bg-gradient-to-br from-[#FAFAFA]/80 to-[#FAFAFA]/40 dark:from-[#1A1A1A]/80 dark:to-[#1A1A1A]/40">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8B1538]/10 to-[#8B1538]/5 dark:from-[#8B1538]/20 dark:to-[#8B1538]/10 flex items-center justify-center border border-[#8B1538]/10">
            <Mail className="h-6 w-6 text-[#8B1538]" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <h4 className="text-base font-normal text-[#1A1A1A] dark:text-white">
              Verify Your Email
            </h4>
            <p className="text-sm text-[#666666] dark:text-[#999999] font-light leading-relaxed">
              We sent a 6-digit code to <span className="font-normal text-[#1A1A1A] dark:text-white">{email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Input - Modern & Clean */}
      <div className="space-y-5">
        <label className="block text-sm font-normal text-[#1A1A1A] dark:text-white text-center">
          Enter Verification Code
        </label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => handleOtpChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="000000"
          disabled={isVerifying || success}
          className={cn(
            'h-20 text-center text-4xl font-light tracking-[0.5em] pl-7',
            'bg-white dark:bg-[#1A1A1A]',
            'border-2 border-[#E5E5E5] dark:border-[#2A2A2A]',
            'focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20',
            'text-[#1A1A1A] dark:text-white',
            'placeholder:text-[#E5E5E5] dark:placeholder:text-[#2A2A2A] placeholder:tracking-normal',
            'transition-all duration-300 rounded-2xl',
            'hover:border-[#8B1538]/30',
            success && 'border-green-500 bg-green-50/50 dark:bg-green-900/10 focus:border-green-500 focus:ring-green-500/20',
            error && 'border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500/20'
          )}
        />
      </div>

      {/* Error Message - Minimal */}
      {error && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-50/30 dark:from-red-900/10 dark:to-red-900/5 border-2 border-red-200 dark:border-red-800/30">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-sm text-red-700 dark:text-red-300 font-light leading-relaxed">
            {error}
          </p>
        </div>
      )}

      {/* Success Message - Minimal */}
      {success && (
        <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-green-50/30 dark:from-green-900/10 dark:to-green-900/5 border-2 border-green-200 dark:border-green-800/30">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-sm text-green-700 dark:text-green-300 font-light leading-relaxed">
            Email verified successfully! Proceeding to next step...
          </p>
        </div>
      )}

      {/* Action Buttons - Clean Design */}
      <div className="space-y-4">
        <Button
          type="button"
          onClick={handleVerify}
          disabled={otp.length !== 6 || isVerifying || success}
          className="w-full h-14 bg-[#1A1A1A] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-[#E5E5E5] text-white dark:text-[#1A1A1A] font-normal rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-40"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 dark:border-[#1A1A1A]/30 border-t-white dark:border-t-[#1A1A1A] rounded-full animate-spin" />
              Verifying...
            </span>
          ) : success ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5" strokeWidth={1.5} />
              Verified
            </span>
          ) : (
            'Verify Code'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending || success}
          className="w-full h-14 text-[#666666] dark:text-[#999999] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A]/50 font-normal rounded-2xl transition-all duration-300 disabled:opacity-40"
        >
          {isResending ? (
            'Sending...'
          ) : resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            'Resend Code'
          )}
        </Button>
      </div>

      {/* Help Text - Minimal */}
      <div className="pt-6 border-t border-[#E5E5E5] dark:border-[#2A2A2A]">
        <p className="text-xs text-[#666666] dark:text-[#999999] text-center font-light leading-relaxed space-y-1.5">
          <span className="block">Code expires in 15 minutes</span>
          <span className="block">Check your spam folder if needed</span>
        </p>
      </div>

      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isVerifying || success}
        className="w-full h-14 text-[#666666] dark:text-[#999999] hover:text-[#8B1538] hover:bg-transparent font-normal transition-colors duration-300 disabled:opacity-40"
      >
        Back to Personal Information
      </Button>
    </div>
  );
}
