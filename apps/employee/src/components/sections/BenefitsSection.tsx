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
              Core Features
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              <AnimatedShinyText className="inline">
                System{' '}
                <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                  Capabilities
                </span>
              </AnimatedShinyText>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Core functionalities designed to modernize compliance document
              management at TUP Manila
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
              {/* Manual Process */}
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-900 dark:bg-red-950/30">
                <div className="mb-4 text-center">
                  <span className="text-2xl">📄</span>
                  <h4 className="mt-2 text-lg font-semibold text-red-900 dark:text-red-300">
                    Manual Process Challenges
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-red-800 dark:text-red-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">-</span>
                    <span>Paper-based document handling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">-</span>
                    <span>Physical submission requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">-</span>
                    <span>Manual status tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">-</span>
                    <span>Physical document storage limitations</span>
                  </li>
                </ul>
              </div>

              {/* Proposed Solution */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="mb-4 text-center">
                  <span className="text-2xl">💻</span>
                  <h4 className="mt-2 text-lg font-semibold text-emerald-900 dark:text-emerald-300">
                    Proposed System Solution
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">+</span>
                    <span>Digital document submission workflow</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">+</span>
                    <span>Remote access capability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">+</span>
                    <span>Automated status notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">+</span>
                    <span>Centralized digital storage system</span>
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
