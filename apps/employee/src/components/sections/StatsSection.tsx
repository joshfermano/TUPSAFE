'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { NumberTicker } from '../ui/number-ticker';
import { BlurFade } from '../ui/blur-fade';
import { stats } from '../../lib/landing-data';
import { cn } from '../../lib/utils';

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-24 dark:from-gray-950 dark:to-gray-900"
      aria-label="TUPSAFE Impact Statistics">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              System{' '}
              <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                Overview
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Research metrics demonstrating the system&apos;s capacity for
              compliance document management
            </motion.p>
          </div>
        </BlurFade>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <BlurFade key={stat.id} delay={0.2 + index * 0.1} inView>
                <MagicCard
                  className={cn(
                    'group relative p-8 text-center transition-all duration-300 hover:scale-105',
                    'border border-gray-200 dark:border-gray-800'
                  )}
                  gradientColor="#8B1538"
                  gradientOpacity={0.1}
                  gradientFrom="#8B1538"
                  gradientTo="#c73436">
                  {/* Icon */}
                  <motion.div
                    className="mb-4 flex justify-center"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6, type: 'spring' }}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20">
                      <IconComponent className="h-7 w-7 text-[#8B1538] dark:text-[#E63946]" />
                    </div>
                  </motion.div>

                  {/* Value with Number Ticker */}
                  <div className="mb-2 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      <NumberTicker value={parseInt(stat.value)} />
                    </span>
                    {stat.suffix && (
                      <span className="text-3xl font-bold text-[#8B1538] dark:text-[#E63946]">
                        {stat.suffix}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    {stat.label}
                  </div>

                  {/* Description */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.description}
                  </div>

                  {/* Hover Effect - Subtle Glow */}
                  <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-[#8B1538]/0 via-[#8B1538]/5 to-[#c73436]/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </MagicCard>
              </BlurFade>
            );
          })}
        </div>

        {/* Bottom Call-out */}
        <BlurFade delay={0.6} inView>
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            viewport={{ once: true }}>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Developed for{' '}
              <span className="font-semibold text-[#8B1538] dark:text-[#E63946]">
                TUP Manila
              </span>{' '}
              faculty, staff, and administrators as a thesis research
              implementation
            </p>
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
