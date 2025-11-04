'use client';

/**
 * Step 6: Net Worth Summary
 * Auto-calculated financial summary with animated displays
 */

import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { FormSection } from '@/components/forms/shared/FormSection';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { formatCurrency } from '@/lib/utils/currency';
import type { SalnSummary } from '@/lib/validations/saln-schema';

interface NetWorthSummaryProps {
  summary: SalnSummary;
}

export function NetWorthSummary({ summary }: NetWorthSummaryProps) {
  const isPositiveNetWorth = summary.netWorth >= 0;

  return (
    <div className="space-y-6">
      <FormSection
        title="Financial Summary"
        description="Auto-calculated totals from your declarations"
        icon={Calculator}
      >
        {/* Assets Breakdown */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="p-6 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground mb-2">Real Property Value</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(summary.totalRealPropertyValue)}
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground mb-2">Personal Property Value</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(summary.totalPersonalPropertyValue)}
            </p>
          </div>
        </div>

        {/* Total Assets */}
        <div className="relative mb-6">
          <NeonGradientCard className="p-8 text-center">
            <BorderBeam size={250} duration={12} delay={9} />
            <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Total Assets
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">PHP</span>
              <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                <NumberTicker value={Math.round(summary.totalAssets)} />
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(summary.totalAssets)}
            </p>
          </NeonGradientCard>
        </div>

        {/* Total Liabilities */}
        <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5 mb-6">
          <p className="text-sm text-muted-foreground mb-2">Total Liabilities</p>
          <p className="text-3xl font-bold text-destructive">
            {formatCurrency(summary.totalLiabilities)}
          </p>
        </div>

        {/* Net Worth - Highlight */}
        <div className="relative">
          <div
            className={`p-8 border-2 rounded-xl text-center ${
              isPositiveNetWorth
                ? 'border-primary/50 bg-primary/5'
                : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              {isPositiveNetWorth ? (
                <TrendingUp className="h-6 w-6 text-primary" />
              ) : (
                <TrendingDown className="h-6 w-6 text-amber-500" />
              )}
              <p className="text-lg font-semibold uppercase tracking-wide">
                Net Worth
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-base text-muted-foreground">PHP</span>
              <p
                className={`text-6xl font-bold ${
                  isPositiveNetWorth ? 'text-primary' : 'text-amber-500'
                }`}
              >
                <NumberTicker value={Math.round(Math.abs(summary.netWorth))} />
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {formatCurrency(summary.netWorth)}
            </p>

            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isPositiveNetWorth
                ? 'Your total assets exceed your liabilities. This is a healthy financial position.'
                : 'Your liabilities exceed your assets. This indicates negative net worth.'}
            </p>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Calculation:</p>
          <div className="space-y-1 text-sm text-muted-foreground font-mono">
            <p>Total Assets = Real Property + Personal Property</p>
            <p>Net Worth = Total Assets - Total Liabilities</p>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
