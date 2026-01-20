'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { ShineBorder } from '../ui/shine-border';
import { researchOverview, researchHighlights } from '../../lib/landing-data';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';

export default function ResearchOverviewSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-white py-24 dark:bg-gray-950"
      aria-label="About the Research">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="mb-4 bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              About the Research
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              TUP Manila{' '}
              <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                Thesis Project
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              A digital compliance management system designed to modernize PDS
              and SALN submissions for government employees
            </motion.p>
          </div>
        </BlurFade>

        {/* Research Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {researchOverview.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <BlurFade key={item.id} delay={0.2 + index * 0.1} inView>
                <ShineBorder
                  className="h-full"
                  shineColor={['#8B1538', '#c73436', '#8B1538']}
                  duration={14}
                  borderWidth={2}>
                  <MagicCard
                    className="group relative flex h-full flex-col p-6 transition-all duration-300 hover:scale-[1.02]"
                    gradientColor="#8B1538"
                    gradientOpacity={0.08}
                    gradientFrom="#8B1538"
                    gradientTo="#c73436">
                    {/* Icon and Title Header */}
                    <div className="mb-4">
                      <motion.div
                        className="mb-4 inline-flex rounded-lg bg-[#8B1538]/10 p-3 dark:bg-[#8B1538]/20"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}>
                        <IconComponent className="h-6 w-6 text-[#8B1538] dark:text-[#E63946]" />
                      </motion.div>

                      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[#8B1538] dark:text-[#E63946]">
                        {item.subtitle}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="mb-6 flex-grow text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>

                    {/* Highlights List */}
                    <motion.div
                      className="border-t border-gray-200 pt-4 dark:border-gray-800"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.4 + index * 0.1,
                      }}
                      viewport={{ once: true }}>
                      <ul className="space-y-2">
                        {item.highlights.map((highlight, highlightIndex) => (
                          <motion.li
                            key={highlightIndex}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.5 + index * 0.1 + highlightIndex * 0.05,
                            }}
                            viewport={{ once: true }}>
                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#8B1538] dark:text-[#E63946]" />
                            <span>{highlight}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </MagicCard>
                </ShineBorder>
              </BlurFade>
            );
          })}
        </div>

        {/* Bottom Research Highlights */}
        <BlurFade delay={0.6} inView>
          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            viewport={{ once: true }}>
            {researchHighlights.map((highlight, index) => (
              <motion.div
                key={highlight.label}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.8 + index * 0.1,
                }}
                viewport={{ once: true }}>
                <div className="mb-2 text-xl font-bold text-[#8B1538] dark:text-[#E63946]">
                  {highlight.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {highlight.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
