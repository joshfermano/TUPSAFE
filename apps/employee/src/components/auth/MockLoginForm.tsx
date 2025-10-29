'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@tupsafe/mock-data/api';
import { mockAuthUsers, type MockUser } from '@tupsafe/mock-data';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Development Helper - Minimalist Collapsible */}
      <div className="rounded-xl bg-[#8B1538]/5 dark:bg-[#8B1538]/10 border border-[#8B1538]/20 dark:border-[#8B1538]/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAllUsers(!showAllUsers)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#8B1538] dark:text-[#C74E6D] hover:bg-[#8B1538]/10 dark:hover:bg-[#8B1538]/20 transition-colors">
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold">Mock Login Enabled</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#8B1538]/80 dark:text-[#C74E6D]/90">
            {showAllUsers ? 'Hide Users' : 'Show All Users'}
            {showAllUsers ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showAllUsers && (
          <div className="px-4 pb-4 pt-2 border-t border-[#8B1538]/20 dark:border-[#8B1538]/40 bg-[#8B1538]/[0.03] dark:bg-[#8B1538]/5">
            <p className="text-[11px] font-medium text-[#8B1538] dark:text-[#C74E6D] mb-2.5">
              Click any account to auto-fill (Password: password123)
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
              {mockAuthUsers.map((user: MockUser) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword('password123');
                  }}
                  className="text-left px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-800/40 hover:bg-[#8B1538]/10 dark:hover:bg-[#8B1538]/20 border border-[#8B1538]/10 dark:border-[#8B1538]/30 hover:border-[#8B1538]/30 dark:hover:border-[#8B1538]/50 transition-all group">
                  <code className="text-[11px] font-mono text-[#8B1538] dark:text-[#C74E6D] group-hover:text-[#6B1028] dark:group-hover:text-[#D96A87]">
                    {user.email}
                  </code>
                </button>
              ))}
            </div>
          </div>
        )}
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
        className="w-full h-11 bg-gradient-to-r from-[#8B1538] to-[#0066B3] hover:from-[#6B1028] hover:to-[#004D87] text-white font-medium rounded-lg shadow-lg shadow-[#8B1538]/25 hover:shadow-[#8B1538]/40 transition-all duration-200 mt-6">
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
