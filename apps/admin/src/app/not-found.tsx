'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, LayoutDashboard } from 'lucide-react';

/**
 * Custom 404 Not Found Page
 *
 * A modern, minimalistic error page with TUP Crimson branding.
 * Features:
 * - Responsive design (mobile-friendly)
 * - Dark mode support
 * - Animated elements with fade-in effect
 * - Accessible navigation options
 * - Professional error illustration
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="text-center px-4 animate-in fade-in duration-500">
        {/* Animated Icon */}
        <div className="mb-8 flex justify-center animate-in zoom-in duration-700 delay-100">
          <div className="relative">
            <FileQuestion className="h-24 w-24 text-primary/20" strokeWidth={1.5} />
            <div className="absolute -top-1 -right-1 h-8 w-8 bg-primary/10 rounded-full blur-md" />
          </div>
        </div>

        {/* 404 Text with Gradient */}
        <h1
          className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-700 delay-150"
          aria-label="404 Error"
        >
          404
        </h1>

        {/* Error Message */}
        <h2 className="mt-6 text-2xl sm:text-3xl font-semibold text-foreground animate-in slide-in-from-bottom duration-700 delay-200">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed animate-in slide-in-from-bottom duration-700 delay-300">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Please check the URL or navigate back to a safe location.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 justify-center flex-wrap animate-in slide-in-from-bottom duration-700 delay-[400ms]">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            aria-label="Navigate to Dashboard"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-primary/20 hover:bg-primary/5 shadow-sm hover:shadow-md transition-all"
            aria-label="Navigate to Home"
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Home
          </Button>
        </div>

        {/* Additional Help Text */}
        <div className="mt-12 pt-8 border-t border-border/50 animate-in slide-in-from-bottom duration-700 delay-500">
          <p className="text-xs text-muted-foreground/70">
            If you believe this is an error, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
