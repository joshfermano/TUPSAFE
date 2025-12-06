'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '../ui/blur-fade';
import { MagicCard } from '../ui/magic-card';
import { faqs } from '../../lib/landing-data';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Category badges
  const categoryColors = {
    general: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    pds: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    saln: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    technical:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-24 dark:from-gray-950 dark:to-gray-900"
      aria-label="Frequently Asked Questions">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="mb-4 bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              Help Center
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                Questions
              </span>
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Find answers to common questions about TUPSAFE
            </motion.p>
          </div>
        </BlurFade>

        {/* FAQ List */}
        <div className="mx-auto max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <BlurFade key={faq.id} delay={0.2 + index * 0.05} inView>
                <MagicCard
                  className="overflow-hidden transition-all duration-300 hover:scale-[1.01]"
                  gradientColor="#8B1538"
                  gradientOpacity={openIndex === index ? 0.12 : 0.05}
                  gradientFrom="#8B1538"
                  gradientTo="#c73436">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left"
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}>
                    <div className="flex items-start gap-4 p-6">
                      {/* Icon */}
                      <motion.div
                        className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#8B1538]/10 dark:bg-[#8B1538]/20"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}>
                        <HelpCircle className="h-5 w-5 text-[#8B1538] dark:text-[#E63946]" />
                      </motion.div>

                      {/* Question */}
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {faq.question}
                          </h3>
                          <motion.div
                            animate={{ rotate: openIndex === index ? 180 : 0 }}
                            transition={{ duration: 0.3 }}>
                            <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                          </motion.div>
                        </div>

                        {/* Category Badge */}
                        <Badge
                          className={cn(
                            'text-xs',
                            categoryColors[faq.category]
                          )}>
                          {faq.category.charAt(0).toUpperCase() +
                            faq.category.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Answer */}
                    <AnimatePresence initial={false}>
                      {openIndex === index && (
                        <motion.div
                          id={`faq-answer-${index}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}>
                          <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
                            <p className="text-gray-700 dark:text-gray-300 pl-14">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>

        {/* Bottom Contact */}
        <BlurFade delay={0.5} inView>
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}>
            <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Still Have Questions?
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Our support team is here to help. Contact us for personalized
                assistance.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="mailto:tupsafe@tup.edu.ph"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8B1538] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6B0F2A]">
                  Email Support
                </a>
                <a
                  href="/help"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
                  Visit Help Center
                </a>
              </div>
            </div>
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
