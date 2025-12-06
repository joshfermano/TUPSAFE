'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { ShineBorder } from '../ui/shine-border';
import { testimonials } from '../../lib/landing-data';
import { Star, Quote } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-white py-24 dark:bg-gray-950"
      aria-label="User Testimonials">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <BlurFade delay={0.1} inView>
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="mb-4 bg-[#8B1538]/10 text-[#8B1538] dark:bg-[#8B1538]/20 dark:text-[#E63946]">
              User Feedback
            </Badge>
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}>
              What{' '}
              <span className="bg-gradient-to-r from-[#8B1538] to-[#c73436] bg-clip-text text-transparent">
                Users
              </span>{' '}
              Say
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}>
              Real experiences from TUP Manila faculty, staff, and
              administrators
            </motion.p>
          </div>
        </BlurFade>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <BlurFade key={testimonial.id} delay={0.2 + index * 0.1} inView>
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
                  {/* Quote Icon */}
                  <div className="mb-4 flex items-start justify-between">
                    <motion.div
                      className="rounded-lg bg-[#8B1538]/10 p-2 dark:bg-[#8B1538]/20"
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      transition={{ duration: 0.5 }}>
                      <Quote className="h-6 w-6 text-[#8B1538] dark:text-[#E63946]" />
                    </motion.div>

                    {/* Rating Stars */}
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map(
                        (_, starIndex) => (
                          <motion.div
                            key={starIndex}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.3 + index * 0.1 + starIndex * 0.05,
                            }}
                            viewport={{ once: true }}>
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          </motion.div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Quote Text */}
                  <blockquote className="mb-6 flex-grow text-gray-700 dark:text-gray-300">
                    <p className="text-sm leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                  </blockquote>

                  {/* Author Info */}
                  <motion.div
                    className="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-800"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.4 + index * 0.1,
                    }}
                    viewport={{ once: true }}>
                    <Avatar className="h-12 w-12 border-2 border-[#8B1538]/20">
                      <AvatarFallback
                        className={cn(
                          'bg-gradient-to-br from-[#8B1538] to-[#c73436] text-white font-semibold'
                        )}>
                        {testimonial.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-[#8B1538] dark:text-[#E63946]">
                        {testimonial.department}
                      </div>
                    </div>
                  </motion.div>

                  {/* Verified Badge */}
                  <motion.div
                    className="absolute top-4 right-4"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.5 + index * 0.1,
                      type: 'spring',
                    }}
                    viewport={{ once: true }}>
                    <div className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      ✓ Verified
                    </div>
                  </motion.div>
                </MagicCard>
              </ShineBorder>
            </BlurFade>
          ))}
        </div>

        {/* Bottom Stats */}
        <BlurFade delay={0.6} inView>
          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            viewport={{ once: true }}>
            {[
              { label: 'Average Rating', value: '5.0', suffix: '/5' },
              { label: 'Active Users', value: '500+', suffix: '' },
              { label: 'Satisfaction Rate', value: '98', suffix: '%' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.8 + index * 0.1,
                }}
                viewport={{ once: true }}>
                <div className="mb-2 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-[#8B1538] dark:text-[#E63946]">
                    {stat.value}
                  </span>
                  {stat.suffix && (
                    <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </BlurFade>
      </div>
    </section>
  );
}
