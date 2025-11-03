'use client';

import { MagicCard } from '@/components/ui/magic-card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function InfoCard({
  title,
  icon: Icon,
  children,
  className,
  gradient = false,
}: InfoCardProps) {
  return (
    <MagicCard
      gradientSize={0}
      gradientColor="#093FB4"
      gradientOpacity={0}
      gradientFrom="#093FB4"
      gradientTo="#8B1538"
      className={cn(
        'h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
    >
<<<<<<< HEAD
      {/* Card Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
            gradient
              ? 'bg-gradient-to-br from-[#093FB4] to-[#0066B3] text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-[#093FB4] dark:text-[#0066B3]'
          )}
        >
          <Icon className="h-5 w-5" />
=======
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
            shineColor={gradient ? ["#8B1538", "#c73436", "#8B1538"] : ["#8B1538", "#c73436", "#8B1538"]}
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
            gradientTo="#c73436"
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
>>>>>>> 831112425ec31e6d8d7a958096b5448a791388b3
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>

      {/* Card Content */}
      <div className="px-6 pb-6">{children}</div>
    </MagicCard>
  );
}

interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

export function InfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          {label}
        </p>
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100 break-words">
          {value || '—'}
        </div>
      </div>
    </div>
  );
}
