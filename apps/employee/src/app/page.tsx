'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import dynamic from 'next/dynamic';

// Dynamically import all sections to avoid SSR issues and optimize performance
const HeroSection = dynamic(
  () => import('../components/sections/HeroSection'),
  { ssr: false }
);
const StatsSection = dynamic(
  () => import('../components/sections/StatsSection'),
  { ssr: false }
);
const FeaturesSection = dynamic(
  () => import('../components/sections/FeaturesSection'),
  { ssr: false }
);
const BenefitsSection = dynamic(
  () => import('../components/sections/BenefitsSection'),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import('../components/sections/HowItWorksSection'),
  { ssr: false }
);
const ResearchOverviewSection = dynamic(
  () => import('../components/sections/TestimonialsSection'),
  { ssr: false }
);
const FAQSection = dynamic(() => import('../components/sections/FAQSection'), {
  ssr: false,
});
const CTASection = dynamic(() => import('../components/sections/CTASection'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard/profile');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show comprehensive landing page for unauthenticated users
  return (
    <main className="overflow-x-hidden">
      {/* 1. Hero Section - Enhanced with layered backgrounds */}
      <HeroSection />

      {/* 2. Statistics Section - Impact by numbers */}
      <StatsSection />

      {/* 3. Features Section - Enhanced with BorderBeam and AnimatedShinyText */}
      <FeaturesSection />

      {/* 4. Benefits Section - Visual comparison */}
      <BenefitsSection />

      {/* 5. How It Works Section - Timeline with animated steps */}
      <HowItWorksSection />

      {/* 6. Research Overview Section - About the project */}
      <ResearchOverviewSection />

      {/* 7. FAQ Section - Collapsible questions */}
      <FAQSection />

      {/* 8. Final CTA Section - Dramatic call-to-action */}
      <CTASection />
    </main>
  );
}
