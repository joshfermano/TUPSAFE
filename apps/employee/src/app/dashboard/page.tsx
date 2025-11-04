'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Particles } from '@/components/ui/particles';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

// Animation constants extracted outside component to prevent recreation
const LOGO_SCALE_ANIMATION = {
  scale: [1, 1.1, 1],
};

const LOGO_SCALE_TRANSITION = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const GLOW_ANIMATION = {
  scale: [1, 1.3, 1],
  opacity: [0.5, 0.8, 0.5],
};

const GLOW_TRANSITION = {
  duration: 2,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

const SPINNER_ROTATION = {
  rotate: 360,
};

const SPINNER_TRANSITION = {
  duration: 1,
  repeat: Infinity,
  ease: 'linear' as const,
};

const DOT_ANIMATION = {
  scale: [1, 1.5, 1],
  opacity: [0.5, 1, 0.5],
};

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/dashboard/profile');
    }, 800);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={80}
        ease={80}
        color="#8B1538"
        size={0.8}
        staticity={40}
        refresh={false}
      />
      <AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(700px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] -z-10'
        )}
      />

      {/* Loading Content */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}>
        {/* Animated Logo/Icon */}
        <motion.div
          className="relative"
          animate={LOGO_SCALE_ANIMATION}
          transition={LOGO_SCALE_TRANSITION}>
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B1538]/30 to-[#B8264D]/30 blur-2xl"
            animate={GLOW_ANIMATION}
            transition={GLOW_TRANSITION}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#8B1538] to-[#B8264D] shadow-2xl">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        {/* Spinner */}
        <motion.div
          animate={SPINNER_ROTATION}
          transition={SPINNER_TRANSITION}>
          <Loader2 className="h-10 w-10 text-[#8B1538] dark:text-[#8B1538]" />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Loading Dashboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Preparing your workspace...
          </p>
        </motion.div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="h-2 w-2 rounded-full bg-[#8B1538] dark:bg-[#8B1538]"
              animate={DOT_ANIMATION}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut' as const,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
