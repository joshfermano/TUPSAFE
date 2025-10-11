'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@smartgov/mock-data/api';
import { Loader2, Mail, Lock } from 'lucide-react';

interface MockLoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function MockLoginForm({
  redirectTo = '/dashboard',
  onSuccess,
  onError,
}: MockLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const success = await signIn(email, password);

      if (success) {
        onSuccess?.();
        // Use window.location for a hard redirect to ensure auth state is fresh
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
      } else {
        const error = new Error('Invalid email or password');
        setErrorMessage(error.message);
        onError?.(error);
        setIsLoading(false);
      }
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error('An error occurred during login');
      setErrorMessage(err.message);
      onError?.(err);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Development Helper */}
      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Mock Login Enabled</strong>
          <br />
          Use:{' '}
          <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
            francis.pangilinan@da.gov.ph
          </code>
          <br />
          Password:{' '}
          <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
            password123
          </code>
        </AlertDescription>
      </Alert>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="email"
          className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@gov.ph"
            required
            disabled={isLoading}
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all duration-300 hover:bg-white hover:border-blue-400 dark:hover:bg-slate-700/80 dark:hover:border-blue-500"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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
