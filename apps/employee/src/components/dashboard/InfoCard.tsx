'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { ShineBorder } from '@/components/ui/shine-border';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { useState, useRef } from 'react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function InfoCard({ title, icon: Icon, children, className, gradient = false }: InfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Magnetic hover effect with spring physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 400 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Enhanced transformations for smooth 3D effect
  const rotateX = useTransform(springY, [-100, 100], [8, -8]);
  const rotateY = useTransform(springX, [-100, 100], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Subtle movement for premium feel
    x.set(deltaX * 0.08);
    y.set(deltaY * 0.08);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative will-change-transform perspective-1000"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="relative">
          {/* Shine border effect - always present but more visible on hover */}
          <ShineBorder
            className="rounded-xl"
            borderWidth={2}
            duration={12}
            shineColor={gradient ? ["#8B1538", "#0066B3", "#004B87"] : ["#8B1538", "#0066B3", "#8B1538"]}
          />

          <MagicCard
            className={cn(
              "relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
              "border border-slate-200/50 dark:border-slate-800/50",
              "shadow-lg transition-all duration-500 group rounded-xl",
              // Premium glow effect on hover
              "hover:shadow-[0_8px_30px_rgba(139,21,56,0.15),0_0_60px_rgba(139,21,56,0.1)]",
              "dark:hover:shadow-[0_8px_30px_rgba(139,21,56,0.25),0_0_60px_rgba(139,21,56,0.15)]",
              gradient && "bg-gradient-to-br from-[#8B1538]/5 to-[#0066B3]/5 dark:from-[#8B1538]/10 dark:to-[#0066B3]/10",
              isHovered && "shadow-[0_12px_40px_rgba(139,21,56,0.2)] dark:shadow-[0_12px_40px_rgba(139,21,56,0.3)]",
              className
            )}
            gradientSize={isHovered ? 400 : 200}
            gradientColor="#8B1538"
            gradientOpacity={0.08}
            gradientFrom="#8B1538"
            gradientTo="#0066B3"
          >
            {/* Shimmer sweep effect on hover */}
            <motion.div
              className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-[#8B1538]/10 to-transparent",
                "pointer-events-none -translate-x-full"
              )}
              animate={isHovered ? { x: ['0%', '200%'] } : { x: '-100%' }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* Card Header with animated icon */}
            <div className="flex items-center gap-3 p-6 border-b border-slate-200/60 dark:border-slate-800/60">
              <motion.div
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                  gradient
                    ? "bg-gradient-to-br from-[#8B1538] to-[#0066B3] text-white shadow-lg shadow-[#8B1538]/40"
                    : "bg-gradient-to-br from-[#8B1538]/10 to-[#0066B3]/10 dark:from-[#8B1538]/20 dark:to-[#0066B3]/20",
                  gradient ? "text-white" : "text-[#8B1538] dark:text-[#8B1538]"
                )}
                whileHover={{ scale: 1.15, rotate: 10 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {/* Icon glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl bg-[#8B1538]/20 blur-md"
                  animate={isHovered ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  animate={isHovered ? { rotate: [0, -5, 5, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
                  className="relative z-10"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              </motion.div>

              <motion.h3
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                animate={isHovered ? { x: [0, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {title}
              </motion.h3>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {children}
            </div>

            {/* Radial glow that follows cursor */}
            {isHovered && (
              <motion.div
                className="absolute pointer-events-none rounded-full blur-3xl opacity-30"
                style={{
                  width: 200,
                  height: 200,
                  background: gradient
                    ? 'radial-gradient(circle, rgba(139,21,56,0.6) 0%, rgba(0,102,179,0.4) 30%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(139,21,56,0.5) 0%, rgba(0,102,179,0.3) 30%, transparent 70%)',
                  left: springX,
                  top: springY,
                  x: '-50%',
                  y: '-50%',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </MagicCard>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

export function InfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <motion.div
      className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg group/item transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
      initial={{ opacity: 0, x: -15 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {Icon && (
        <motion.div
          whileHover={{ scale: 1.25, rotate: 12 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="mt-0.5"
        >
          <div className="relative">
            {/* Icon glow on hover */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#8B1538]/20 blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1.5 }}
              transition={{ duration: 0.3 }}
            />
            <Icon className="h-5 w-5 relative z-10 text-slate-500 dark:text-slate-400 flex-shrink-0 transition-colors group-hover/item:text-[#8B1538] dark:group-hover/item:text-[#8B1538]" />
          </div>
        </motion.div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 transition-colors group-hover/item:text-slate-700 dark:group-hover/item:text-slate-300">
          {label}
        </p>
        <motion.div
          className="text-base font-semibold text-slate-900 dark:text-slate-100 break-words"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          {value || '—'}
        </motion.div>
      </div>
    </motion.div>
  );
}
