'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

// Demo credentials display (for UI only)
const demoCredentials = [
  {
    email: 'admin@tup.edu.ph',
    password: 'admin123',
    name: 'Dr. Adora Guerrero',
    role: 'admin',
    title: 'University President'
  },
  {
    email: 'hr@tup.edu.ph',
    password: 'hr123',
    name: 'Prof. Antonio Santos',
    role: 'hr',
    title: 'HR Director'
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Simulate authentication delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Sign in using AuthContext
      await signIn(email, password);

      // Store remember me preference
      if (typeof window !== 'undefined' && rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    // Auto-submit after a short delay
    setTimeout(() => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(event);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-center space-y-8 p-8">
          <div className="space-y-4">
            {/* Logo/Brand Section */}
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
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

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border bg-card shadow-2xl backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                Admin Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access the admin portal
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Demo Credentials Info */}
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  <strong className="font-semibold">Demo Credentials:</strong>
                  <div className="mt-2 space-y-2">
                    {demoCredentials.map((cred) => (
                      <div key={cred.email} className="flex flex-col space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-medium">
                            {cred.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 uppercase">
                            {cred.role}
                          </span>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary hover:text-primary/80 justify-start"
                          onClick={() => handleDemoLogin(cred.email, cred.password)}
                        >
                          {cred.email} / {cred.password}
                        </Button>
                        <span className="text-[10px] text-muted-foreground/60">
                          {cred.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
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
