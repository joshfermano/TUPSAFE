'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BlurFade } from '../ui/blur-fade';
import { ShimmerButton } from '../ui/shimmer-button';
import { RetroGrid } from '../ui/retro-grid';
import { Particles } from '../ui/particles';
import { ctaData } from '../../lib/landing-data';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  const router = useRouter();

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24 dark:from-gray-900 dark:to-gray-950"
      aria-label="Call to Action">
      {/* Dramatic Background */}
      <div className="absolute inset-0">
        <RetroGrid className="opacity-40" />
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color="#8B1538"
          refresh
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80 dark:from-gray-950/80 dark:via-transparent dark:to-gray-950/80" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Main Content */}
          <BlurFade delay={0.1} inView>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              {/* Sparkle Icon */}
              <motion.div
                className="mb-6 flex justify-center"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}>
                <div className="rounded-full bg-gradient-to-br from-[#8B1538] to-[#c73436] p-4 shadow-lg">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8B1538] dark:text-[#E63946]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}>
                {ctaData.subtitle}
              </motion.p>

              {/* Title */}
              <motion.h2
                className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}>
                {ctaData.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="mb-10 text-lg text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}>
                {ctaData.description}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}>
                <ShimmerButton
                  onClick={() => router.push(ctaData.primaryButton.href)}
                  className="group min-w-[200px] bg-[#8B1538] text-white hover:bg-[#6B0F2A]"
                  shimmerColor="#c73436"
                  shimmerSize="0.1em"
                  borderRadius="0.5rem">
                  <span className="flex items-center justify-center gap-2 whitespace-pre-wrap text-base font-semibold">
                    {ctaData.primaryButton.text}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </ShimmerButton>

                <button
                  onClick={() => router.push(ctaData.secondaryButton.href)}
                  className="min-w-[200px] rounded-lg border-2 border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 transition-all hover:border-[#8B1538] hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-[#E63946] dark:hover:bg-gray-800">
                  {ctaData.secondaryButton.text}
                </button>
              </motion.div>

              {/* Features Pills */}
              <motion.div
                className="flex flex-wrap items-center justify-center gap-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}>
                {ctaData.features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <BlurFade key={index} delay={0.6 + index * 0.1} inView>
                      <motion.div
                        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400 }}>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <IconComponent className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {feature.text}
                        </span>
                      </motion.div>
                    </BlurFade>
                  );
                })}
              </motion.div>
            </motion.div>
          </BlurFade>

          {/* Trust Indicators */}
          <BlurFade delay={0.8} inView>
            <motion.div
              className="mt-16 border-t border-gray-200 pt-10 dark:border-gray-800"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              viewport={{ once: true }}>
              <div className="grid gap-8 sm:grid-cols-3">
                {[
                  {
                    icon: '🔒',
                    title: 'Secure & Compliant',
                    description: 'CSC standards implementation',
                  },
                  {
                    icon: '📋',
                    title: 'Thesis Research Project',
                    description: 'Academic prototype for TUP Manila',
                  },
                  {
                    icon: '🎓',
                    title: 'TUP Manila Focused',
                    description: 'Designed for university compliance needs',
                  },
                ].map((indicator, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.0 + index * 0.1,
                    }}
                    viewport={{ once: true }}>
                    <div className="mb-3 text-3xl">{indicator.icon}</div>
                    <div className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {indicator.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {indicator.description}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
