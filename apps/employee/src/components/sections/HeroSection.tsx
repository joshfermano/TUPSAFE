'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GridPattern } from '@/components/ui/grid-pattern';
import { Meteors } from '@/components/ui/meteors';
import { AuroraText } from '@/components/ui/aurora-text';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Database,
  Eye,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TypewriterText = ({ words }: { words: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!words || words.length === 0) {
      setError('No words provided for typewriter effect');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    const timeout = setTimeout(
      () => {
        try {
          const currentWord = words[currentWordIndex];

          if (isDeleting) {
            setCurrentText(currentWord.substring(0, currentText.length - 1));
            if (currentText === '') {
              setIsDeleting(false);
              setCurrentWordIndex((prev) => (prev + 1) % words.length);
            }
          } else {
            setCurrentText(currentWord.substring(0, currentText.length + 1));
            if (currentText === currentWord) {
              setTimeout(() => setIsDeleting(true), 2000);
            }
          }
        } catch (err) {
          setError('Error in typewriter animation');
          console.error('Typewriter error:', err);
        }
      },
      isDeleting ? 50 : 150
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  if (isLoading) {
    return (
      <span
        className="text-government font-semibold"
        aria-label="Loading typewriter text">
        <span className="animate-pulse">Loading...</span>
      </span>
    );
  }

  if (error) {
    return (
      <span
        className="text-government font-semibold"
        aria-label="Typewriter text">
        Excellence
      </span>
    );
  }

  return (
    <span
      className="text-government font-semibold"
      aria-label={`Typewriter text: ${currentText}`}
      aria-live="polite">
      {currentText}
      <span className="animate-pulse" aria-hidden="true">
        |
      </span>
    </span>
  );
};

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const typewriterWords = [
    'Compliance',
    'Transparency',
    'Efficiency',
    'Security',
    'Accountability',
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-background"
      aria-label="SmartGov Hero Section"
      role="banner">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <GridPattern
          width={40}
          height={40}
          x={-1}
          y={-1}
          className={cn(
            'fill-government/5 stroke-government/10',
            '[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]'
          )}
        />
        <Meteors number={20} />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div
            className={cn(
              'transition-all duration-1000 ease-out',
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            )}>
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <AnimatedGradientText>
                <Badge className="bg-gradient-government border-0 text-white">
                  <Shield className="mr-2 h-3 w-3" />
                  Trusted by Philippine Government Agencies
                </Badge>
              </AnimatedGradientText>
            </div>

            {/* Main Headline */}
            <div className="text-center mb-8">
              <AuroraText className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Streamlined e-PDS & e-SALN
                <br />
                <span className="text-government">Compliance Platform</span>
              </AuroraText>

              <div className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
                Official digital platform for Philippine government employees to
                submit and manage Personal Data Sheets (e-PDS) and Statements of
                Assets, Liabilities, and Net Worth (e-SALN) in full compliance
                with
                <br />
                <span className="font-semibold text-government">
                  Civil Service Commission (CSC)
                </span>{' '}
                requirements. Built for{' '}
                <TypewriterText words={typewriterWords} />
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center items-center mb-12">
              <Button
                size="lg"
                className="btn-government text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                aria-label="Get started with SmartGov platform"
                role="button">
                Get Started
                <ArrowRight
                  className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
            </div>

            {/* Government Compliance Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                CSC Approved Platform
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-government" />
                ISO 27001 Certified
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-government" />
                Data Privacy Act Compliant
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-government" />
                DICT Security Standards
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-government" />
                WCAG 2.1 AA Accessible
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator - Hidden on mobile for better responsiveness */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:flex">
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-government/20 shadow-lg">
          <div className="w-8 h-12 border-2 border-government rounded-full flex justify-center relative overflow-hidden">
            <div className="w-2 h-4 bg-government rounded-full mt-2 animate-pulse shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-government/10 to-government/20 rounded-full"></div>
          </div>
          <span className="text-xs font-medium text-government">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
