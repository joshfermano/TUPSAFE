'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { ShineBorder } from '../ui/shine-border';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const InfoCard = memo(function InfoCard({
  title,
  icon: Icon,
  children,
  className,
  gradient = false,
}: InfoCardProps) {
  return (
    <BlurFade delay={0.1} inView>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={{ y: -4 }}>
        <MagicCard
          gradientSize={200}
          gradientColor="var(--primary)"
          gradientOpacity={0.03}
          gradientFrom="var(--primary)"
          gradientTo="var(--tup-crimson-dark)"
          className={cn(
            'relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300',
            'hover:border-primary/30',
            className
          )}>
          {/* Subtle shine effect on hover - only for gradient cards */}
          {gradient && (
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
              <ShineBorder
                borderWidth={1}
                duration={8}
                shineColor={['transparent', 'var(--primary)', 'transparent']}
              />
            </div>
          )}

          {/* Card Header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-4">
            <motion.div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                gradient
                  ? 'bg-gradient-tup text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-tup-crimson-light'
              )}
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
              <Icon className="h-5 w-5" />
            </motion.div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>

          {/* Card Content */}
          <div className="px-6 pb-6">{children}</div>
        </MagicCard>
      </motion.div>
    </BlurFade>
  );
});

interface InfoItemProps {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

export const InfoItem = memo(function InfoItem({
  label,
  value,
  icon: Icon,
}: InfoItemProps) {
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
});
