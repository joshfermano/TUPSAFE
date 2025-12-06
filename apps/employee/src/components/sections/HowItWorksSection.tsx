'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { BorderBeam } from '../ui/border-beam';
import { steps } from '../../lib/landing-data';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24 dark:from-gray-900 dark:to-gray-950"
      aria-label="How TUPSAFE Works">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="mb-4 bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              Simple Process
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              How{' '}
              <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                TUPSAFE
              </span>{' '}
              Works
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Get started with digital compliance in four simple steps
            </motion.p>
          </div>
        </BlurFade>

        {/* Timeline */}
        <div className="relative mx-auto max-w-5xl">
          {/* Vertical Line - Desktop Only */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#8B1538] via-[#c73436] to-[#8B1538] lg:block" />

          {/* Steps */}
          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isEven = index % 2 === 0;

              return (
                <BlurFade key={step.id} delay={0.2 + index * 0.15} inView>
                  <div
                    className={cn(
                      'relative grid gap-8 lg:grid-cols-2 lg:gap-16',
                      !isEven && 'lg:flex-row-reverse'
                    )}>
                    {/* Content Card */}
                    <motion.div
                      className={cn(
                        'relative',
                        isEven ? 'lg:col-start-1' : 'lg:col-start-2'
                      )}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      viewport={{ once: true }}>
                      <div className="relative">
                        <MagicCard
                          className="group p-6 transition-all duration-300 hover:scale-[1.02]"
                          gradientColor="#8B1538"
                          gradientOpacity={0.1}
                          gradientFrom="#8B1538"
                          gradientTo="#c73436">
                          <BorderBeam
                            size={250}
                            duration={12}
                            delay={index * 3}
                            colorFrom="#8B1538"
                            colorTo="#c73436"
                          />

                          {/* Step Header */}
                          <div className="mb-4 flex items-center gap-4">
                            <motion.div
                              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#8B1538] to-[#c73436]"
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.6, type: 'spring' }}>
                              <IconComponent className="h-7 w-7 text-white" />
                            </motion.div>
                            <div>
                              <div className="mb-1 text-sm font-semibold text-[#8B1538] dark:text-[#E63946]">
                                Step {step.step}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {step.title}
                              </h3>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="mb-6 text-gray-600 dark:text-gray-300">
                            {step.description}
                          </p>

                          {/* Details List */}
                          <div className="space-y-2">
                            {step.details.map((detail, detailIndex) => (
                              <motion.div
                                key={detailIndex}
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.4,
                                  delay: 0.4 + index * 0.1 + detailIndex * 0.05,
                                }}
                                viewport={{ once: true }}>
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {detail}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </MagicCard>
                      </div>
                    </motion.div>

                    {/* Step Number Circle - Desktop Timeline */}
                    <div
                      className={cn(
                        'hidden lg:flex lg:items-center lg:justify-center',
                        isEven ? 'lg:col-start-2' : 'lg:col-start-1'
                      )}>
                      <motion.div
                        className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#8B1538] to-[#c73436] shadow-xl dark:border-gray-950"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.2 + index * 0.1,
                          type: 'spring',
                        }}
                        viewport={{ once: true }}>
                        <span className="text-3xl font-bold text-white">
                          {step.step}
                        </span>
                        {/* Pulsating Ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#8B1538]"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.7, 0, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.5,
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Arrow Between Steps - Mobile Only */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="flex justify-center py-6 lg:hidden"
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      viewport={{ once: true }}>
                      <ArrowRight className="h-8 w-8 rotate-90 text-[#8B1538] dark:text-[#E63946]" />
                    </motion.div>
                  )}
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <BlurFade delay={0.8} inView>
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            viewport={{ once: true }}>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Ready to get started?{' '}
              <a
                href="/dashboard"
                className="font-semibold text-[#8B1538] hover:text-[#c73436] dark:text-[#E63946] dark:hover:text-[#c73436]">
                Create your account today
              </a>
            </p>
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
