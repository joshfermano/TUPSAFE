'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@tupsafe/mock-data/api';
import { MockLoginForm } from '@/components/auth/MockLoginForm';
import { Badge } from '@/components/ui/badge';
import { MagicCard } from '@/components/ui/magic-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { Shield, Building2, FileText, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard/profile';

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
          )}
        />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B1538]/20 border-t-[#8B1538]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Hero Section - Left Side */}
        <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Badge */}
          <div className="flex justify-center lg:justify-start">
            <Badge
              variant="secondary"
              className="bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-red-200 border-[#8B1538]/20 dark:border-[#8B1538]/30 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              TUP Manila Employee Portal
            </Badge>
          </div>

          {/* Main Title */}
          <div className="space-y-3 sm:space-y-4">
            <AnimatedGradientText className="text-3xl sm:text-4xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-[#8B1538] via-[#6B0F2A] to-blue-600 bg-clip-text text-transparent">
                TUPSAFE
              </span>
            </AnimatedGradientText>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300">
              Employee Portal
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto lg:mx-0">
              Streamlined digital platform for PDS and SALN submissions with
              complete audit trails and compliance management.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#8B1538]/20 dark:border-slate-700">
              <FileText className="w-5 h-5 text-[#8B1538] dark:text-red-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-PDS Management
              </span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-[#8B1538]/20 dark:border-slate-700">
              <Building2 className="w-5 h-5 text-[#8B1538] dark:text-red-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                e-SALN Compliance
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="hidden md:flex justify-center lg:justify-start">
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-2 transition ease-out hover:text-[#8B1538] hover:duration-300 hover:dark:text-red-400">
              <Users className="w-4 h-4 mr-2" />
              <span>Trusted by TUP Manila Community</span>
              <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>

        {/* Login Form - Right Side */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2">
          <div className="w-full max-w-md">
            <MagicCard
              className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl"
              gradientColor="rgba(139, 21, 56, 0.06)"
              gradientOpacity={0.2}>
              <BorderBeam size={280} duration={12} delay={9} />

              <div className="p-7 sm:p-9 space-y-6">
                {/* Form Header */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Welcome Back
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enter your credentials to access your employee dashboard
                  </p>
                </div>

                {/* Login Form Component */}
                <MockLoginForm
                  redirectTo={redirectTo}
                  onSuccess={() => {
                    router.push(redirectTo);
                  }}
                  onError={(error: Error) => {
                    console.error('Login error:', error);
                  }}
                />

                {/* Help Section */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Need help accessing your account?{' '}
                    <span className="text-[#8B1538] dark:text-red-400 font-medium hover:text-[#6B0F2A] dark:hover:text-red-300 cursor-pointer transition-colors">
                      Contact your HR department
                    </span>
                  </p>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-[#8B1538]/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#8B1538]/20 rounded-full blur-lg"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8B1538]/20 border-t-[#8B1538]"></div>
        </div>
      }>
      <LoginContent />
    </Suspense>
  );
}
