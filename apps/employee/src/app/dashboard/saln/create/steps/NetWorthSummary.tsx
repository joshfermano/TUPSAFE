'use client';

/**
 * SALN Step 6: Net Worth Summary
 * Auto-calculated financial summary with animated displays
 *
 * Rebuilt with:
 * - EnhancedFormSection for clean layout
 * - EnhancedCard for summary cards
 * - NumberTicker for animated values
 * - BlurFade for entrance animations
 * - React.memo for performance
 * - Premium, minimalistic design
 */

import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { NumberTicker } from '../../../../../components/ui/number-ticker';
import { formatCurrency } from '../../../../../lib/utils/currency';
import type { SalnSummary } from '../../../../../lib/validations/saln-schema';

// Import Enhanced Components
import {
  EnhancedFormSection,
  EnhancedCard,
  EnhancedCardContent,
  BlurFade,
} from '@tupsafe/shared-ui';

interface NetWorthSummaryProps {
  summary: SalnSummary;
}

export const NetWorthSummary = memo(function NetWorthSummary({
  summary,
}: NetWorthSummaryProps) {
  const isPositiveNetWorth = summary.netWorth >= 0;

  return (
    <div className="space-y-8">
      <BlurFade delay={0.1}>
        <EnhancedFormSection
          title="Financial Summary"
          subtitle="Auto-calculated totals from your declarations"
          variant="default">
          {/* Assets Breakdown */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <BlurFade delay={0.15}>
              <EnhancedCard variant="default">
                <EnhancedCardContent className="p-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Real Property Value
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(summary.totalRealPropertyValue)}
                  </p>
                </EnhancedCardContent>
              </EnhancedCard>
            </BlurFade>

            <BlurFade delay={0.2}>
              <EnhancedCard variant="default">
                <EnhancedCardContent className="p-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Personal Property Value
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(summary.totalPersonalPropertyValue)}
                  </p>
                </EnhancedCardContent>
              </EnhancedCard>
            </BlurFade>
          </div>

          {/* Total Assets */}
          <BlurFade delay={0.25}>
            <div className="p-10 border-2 border-slate-200/50 dark:border-slate-800/50 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 mb-8">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wider text-center font-medium">
                Total Assets
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  PHP
                </span>
                <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  <NumberTicker value={Math.round(summary.totalAssets)} />
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
                {formatCurrency(summary.totalAssets)}
              </p>
            </div>
          </BlurFade>

          {/* Total Liabilities */}
          <BlurFade delay={0.3}>
            <div className="p-8 border border-destructive/20 rounded-lg bg-destructive/5 mb-8">
              <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-3">
                Total Liabilities
              </p>
              <p className="text-3xl font-bold text-destructive">
                {formatCurrency(summary.totalLiabilities)}
              </p>
            </div>
          </BlurFade>

          {/* Net Worth - Highlight */}
          <BlurFade delay={0.35}>
            <div
              className={`p-10 border-2 rounded-xl text-center ${
                isPositiveNetWorth
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
              }`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                {isPositiveNetWorth ? (
                  <TrendingUp className="h-6 w-6 text-primary" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-amber-500" />
                )}
                <p className="text-lg font-semibold uppercase tracking-wide">
                  Net Worth
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-base text-slate-600 dark:text-slate-400">
                  PHP
                </span>
                <p
                  className={`text-6xl font-bold ${
                    isPositiveNetWorth ? 'text-primary' : 'text-amber-500'
                  }`}>
                  <NumberTicker
                    value={Math.round(Math.abs(summary.netWorth))}
                  />
                </p>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {formatCurrency(summary.netWorth)}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {isPositiveNetWorth
                  ? 'Your total assets exceed your liabilities. This is a healthy financial position.'
                  : 'Your liabilities exceed your assets. This indicates negative net worth.'}
              </p>
            </div>
          </BlurFade>

          {/* Formula Explanation */}
          <BlurFade delay={0.4}>
            <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-base font-medium mb-3">Calculation:</p>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 font-mono">
                <p>Total Assets = Real Property + Personal Property</p>
                <p>Net Worth = Total Assets - Total Liabilities</p>
              </div>
            </div>
          </BlurFade>
        </EnhancedFormSection>
      </BlurFade>
    </div>
  );
});
