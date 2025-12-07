'use client';

import { motion } from 'framer-motion';
import { Landmark, Clock, ArrowLeft, TrendingUp, FileCheck, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { EmployeeOnlyGuard } from '../../../../components/guards/EmployeeOnlyGuard';

export default function SALNPendingPage() {
  return (
    <EmployeeOnlyGuard>
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full">
        {/* Card Container */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-12 text-center">
            {/* Icon with subtle animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <div className="relative">
                <Landmark className="h-12 w-12 text-emerald-600 dark:text-emerald-500" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-1 -right-1">
                  <Clock className="h-5 w-5 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              SALN Pending Submissions
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              This feature is currently under development. You will be able to view and manage your pending SALN submissions here soon.
            </motion.p>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Track Progress
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Monitor submission status
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center mb-2">
                  <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Review Feedback
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  View verification notes
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center mb-2">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Compliance Status
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Check annual requirements
                </div>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}>
              <Link href="/dashboard/saln">
                <Button
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                  <ArrowLeft className="h-4 w-4" />
                  Back to SALN Dashboard
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Bottom accent - emerald theme for SALN */}
          <div className="h-2 bg-gradient-to-r from-emerald-500/30 via-emerald-600 to-emerald-500/30" />
        </div>

        {/* Additional info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Expected release: Coming soon
        </motion.p>
      </motion.div>
    </div>
    </EmployeeOnlyGuard>
  );
}
