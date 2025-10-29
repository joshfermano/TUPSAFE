'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GridPattern } from '@/components/ui/grid-pattern';
import { Meteors } from '@/components/ui/meteors';
import { AuroraText } from '@/components/ui/aurora-text';
import { GraduationCap, ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-background flex items-center"
      aria-label="TUPSAFE Hero Section"
      role="banner">
      {/* Animated Background - Subtle and Professional */}
      <div className="absolute inset-0">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            'fill-[#8B1538]/[0.03] stroke-[#8B1538]/[0.08]',
            '[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]'
          )}
        />
        <Meteors number={8} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 py-20">
          <div
            className={cn(
              'transition-all duration-1000 ease-out',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}>
            {/* Research Project Badge */}
            <div className="flex justify-center mb-6">
              <Badge
                variant="outline"
                className="border-[#8B1538]/20 bg-[#8B1538]/5 text-[#8B1538] hover:bg-[#8B1538]/10 transition-colors duration-300">
                <GraduationCap className="mr-2 h-3.5 w-3.5" />
                TUP Manila Thesis Research Project
              </Badge>
            </div>

            {/* Academic Status Badge */}
            <div className="flex justify-center mb-8">
              <Badge
                variant="secondary"
                className="bg-muted/50 text-muted-foreground border border-border/50">
                Academic Prototype • Thesis 2025
              </Badge>
            </div>

            {/* Main Headline with TUP Crimson Gradient */}
            <div className="text-center mb-6">
              <AuroraText
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
                colors={['#8B1538', '#0066B3', '#8B1538', '#0066B3']}>
                TUP Manila e-PDS and e-SALN
                <br />
                <span className="text-[#8B1538]">Compliance System</span>
              </AuroraText>
            </div>

            {/* Subtitle - University Name */}
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-[#0066B3]">
                Technological University of the Philippines - Manila
              </h2>
            </div>

            {/* Research Description */}
            <div className="text-center mb-10 max-w-3xl mx-auto">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                A secure web-based thesis research project enabling TUP Manila
                faculty, staff, and administrators to submit and manage Personal
                Data Sheets (e-PDS) and Statements of Assets, Liabilities, and
                Net Worth (e-SALN) in compliance with Civil Service Commission
                standards. Streamlining institutional compliance through modern
                digital solutions.
              </p>
            </div>

            {/* Target Audience Label */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  For TUP Manila Faculty, Staff, and Administrators
                </span>
              </div>
            </div>

            {/* CTA Buttons - Academic Focus */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button
                onClick={() => {
                  router.push('/dashboard');
                }}
                size="lg"
                className="bg-[#8B1538] hover:bg-[#6B0F2A] text-white text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 group min-w-[200px]"
                aria-label="View TUPSAFE prototype dashboard">
                View Prototype
                <ArrowRight
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>

              <Button
                onClick={() => {
                  router.push('/about');
                }}
                variant="outline"
                size="lg"
                className="border-[#8B1538]/20 text-[#8B1538] hover:bg-[#8B1538]/5 text-lg px-8 py-6 transition-all duration-300 min-w-[200px]"
                aria-label="Learn about the research project">
                About the Research
              </Button>
            </div>

            {/* Research Information Footer */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#8B1538]" />
                <span>Academic Research</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#0066B3]" />
                <span>TUP Manila Thesis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span>CSC Compliant Design</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Clean and Minimalistic */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:flex">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-[#8B1538]/10 shadow-sm">
          <div className="w-6 h-10 border-2 border-[#8B1538]/30 rounded-full flex justify-center relative overflow-hidden">
            <div className="w-1.5 h-3 bg-[#8B1538]/50 rounded-full mt-2 animate-pulse"></div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
