'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { ShineBorder } from '../ui/shine-border';
import { BlurFade } from '../ui/blur-fade';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { benefits } from '../../lib/landing-data';
import { CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="relative overflow-hidden bg-white py-24 dark:bg-gray-950"
      aria-label="TUPSAFE Benefits">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="mb-4 bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              Key Advantages
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              <AnimatedShinyText className="inline">
                Why Choose{' '}
                <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                  TUPSAFE
                </span>
                ?
              </AnimatedShinyText>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Discover how our comprehensive digital platform transforms
              compliance management for TUP Manila
            </motion.p>
          </div>
        </BlurFade>

        {/* Benefits Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <BlurFade key={benefit.id} delay={0.2 + index * 0.1} inView>
                <ShineBorder
                  className="h-full"
                  shineColor={['#8B1538', '#c73436', '#8B1538']}
                  duration={14}
                  borderWidth={2}>
                  <MagicCard
                    className="group relative h-full p-6 transition-all duration-300 hover:scale-[1.02]"
                    gradientColor="#8B1538"
                    gradientOpacity={0.08}
                    gradientFrom="#8B1538"
                    gradientTo="#c73436">
                    {/* Icon with Pulsating Effect */}
                    <div className="mb-4 flex items-center justify-center">
                      <motion.div
                        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8B1538] to-[#c73436]"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 400 }}>
                        <IconComponent className="h-8 w-8 text-white" />
                        {/* Pulsating Ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#8B1538]"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 0, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-center text-xl font-bold text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>

                    {/* Highlights List */}
                    <div className="space-y-2">
                      {benefit.highlights.map((highlight, highlightIndex) => (
                        <motion.div
                          key={highlightIndex}
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.3 + index * 0.05 + highlightIndex * 0.05,
                          }}
                          viewport={{ once: true }}>
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {highlight}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </MagicCard>
                </ShineBorder>
              </BlurFade>
            );
          })}
        </div>

        {/* Bottom Comparison */}
        <BlurFade delay={0.8} inView>
          <motion.div
            className="mt-20 mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            viewport={{ once: true }}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Old Way */}
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/30">
                <div className="mb-4 text-center">
                  <span className="text-2xl">📄</span>
                  <h4 className="mt-2 text-lg font-semibold text-red-900 dark:text-red-300">
                    Traditional Process
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-red-800 dark:text-red-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✗</span>
                    <span>Manual paperwork and printing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✗</span>
                    <span>Multiple office visits required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✗</span>
                    <span>Delayed approval notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✗</span>
                    <span>Lost or misplaced documents</span>
                  </li>
                </ul>
              </div>

              {/* New Way */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="mb-4 text-center">
                  <span className="text-2xl">✨</span>
                  <h4 className="mt-2 text-lg font-semibold text-emerald-900 dark:text-emerald-300">
                    With TUPSAFE
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✓</span>
                    <span>100% digital submission process</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✓</span>
                    <span>Submit from anywhere, anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✓</span>
                    <span>Real-time status notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">✓</span>
                    <span>Secure cloud storage & retrieval</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
