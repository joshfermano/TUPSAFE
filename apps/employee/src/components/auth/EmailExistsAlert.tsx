/**
 * Email Exists Alert Component
 *
 * Displays a helpful alert when a user tries to register
 * with an email that's already in use, with a direct link to login.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface EmailExistsAlertProps {
  email: string;
  className?: string;
}

export function EmailExistsAlert({ email, className = '' }: EmailExistsAlertProps) {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20 ${className}`}
      role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Email Already Registered
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              The email <span className="font-medium">{email}</span> is already associated with an
              existing account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white">
              <Link href="/auth/login" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in to your account
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/40">
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </Button>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-800">
            If you believe this is an error or need assistance, please contact{' '}
            <a
              href="mailto:support@tup.edu.ph"
              className="underline hover:text-amber-900 dark:hover:text-amber-300">
              support@tup.edu.ph
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
