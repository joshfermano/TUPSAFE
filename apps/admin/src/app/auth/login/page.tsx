'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/context/ThemeContext';
import { useRealAuth, type OTPVerificationState } from '@/context/RealAuthContext';

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  authentication_required: 'Please sign in to access this page',
  insufficient_privileges: 'Admin or HR privileges required to access this portal',
  account_pending_approval: 'Your account is pending approval',
  account_suspended: 'Your account has been suspended',
  account_rejected: 'Your account registration was rejected',
  account_inactive: 'Your account is inactive',
  configuration_error: 'System configuration error. Please contact support.',
  database_error: 'Database connection error. Please try again.',
  profile_not_found: 'User profile not found',
  internal_error: 'An internal error occurred. Please try again.',
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme: _resolvedTheme } = useTheme();
  const { signIn, verifyOTP } = useRealAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP verification state
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otpCode, setOTPCode] = useState('');
  const [otpState, setOTPState] = useState<OTPVerificationState | null>(null);

  // Get error from URL params
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  React.useEffect(() => {
    if (urlError) {
      setError(ERROR_MESSAGES[urlError] || urlMessage || 'An error occurred');
    }
  }, [urlError, urlMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate empty fields
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.requiresOTP && result.otpState) {
        // Show OTP input form
        setShowOTPInput(true);
        setOTPState(result.otpState);
        setIsLoading(false);
        return;
      }

      if (!result.success) {
        // Display a user-friendly error message
        setError(result.error || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Login successful - refresh to ensure middleware has latest session, then redirect
      // The session is now in cookies, so middleware will recognize the user
      router.refresh();

      // Small delay to ensure session is propagated
      await new Promise(resolve => setTimeout(resolve, 300));

      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!otpState) {
      setError('Invalid verification state');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOTP(otpCode, otpState);

      if (!result.success) {
        setError(result.error || 'Verification failed');
        setIsLoading(false);
        return;
      }

      // Verification successful - redirect to dashboard
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOTPInput(false);
    setOTPCode('');
    setOTPState(null);
    setError('');
  };

  return (
    <div className="min-h-screen gradient-primary-bg flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full gradient-primary-glow rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full gradient-primary-glow-tl rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            {/* Logo/Brand Section */}
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 gradient-primary-header rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">TUPSAFE</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    ADMIN PORTAL
                  </span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-2 pt-4">
              <h2 className="text-2xl font-semibold text-foreground leading-tight">
                TUP Manila e-PDS and e-SALN Compliance System
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Secure administrative access for Human Resources personnel and system administrators
                to manage employee submissions, ensure compliance, and maintain institutional records.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm text-muted-foreground">
                  Review and approve PDS and SALN submissions
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm text-muted-foreground">
                  Generate compliance reports and analytics
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-sm text-muted-foreground">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>
          </div>

          {/* University Branding */}
          <div className="border-t pt-6">
            <p className="text-xs text-muted-foreground">
              Technological University of the Philippines - Manila
            </p>
          </div>
        </div>

        {/* Right Side - Login/OTP Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border bg-card shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                {showOTPInput ? 'Device Verification' : 'Admin Sign In'}
              </CardTitle>
              <CardDescription className="text-center">
                {showOTPInput
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Enter your credentials to access the admin portal'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!showOTPInput ? (
                /* Login Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.name@tup.edu.ph"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 focus-visible:ring-primary"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 focus-visible:ring-primary"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* OTP Verification Form */
                <form onSubmit={handleOTPVerification} className="space-y-4">
                  <Alert className="bg-primary/5 border-primary/20">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-xs">
                      We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>.
                      Please check your email and enter the code below.
                    </AlertDescription>
                  </Alert>

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOTPCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest focus-visible:ring-primary"
                      disabled={isLoading}
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading || otpCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>

                  {/* Back to Login */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </form>
              )}

              {/* Footer */}
              <div className="pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Authorized personnel only. All access is monitored and logged.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
