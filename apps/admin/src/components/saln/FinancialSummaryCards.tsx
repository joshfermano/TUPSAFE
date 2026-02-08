'use client';

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinancialSummaryCardsProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function FinancialSummaryCards({
  totalAssets,
  totalLiabilities,
  netWorth,
  className,
}: FinancialSummaryCardsProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {/* Total Assets Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Assets
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/90">
            <TrendingUp className="h-4 w-4 text-emerald-100" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalAssets)}
          </div>
        </CardContent>
      </Card>

      {/* Total Liabilities Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Liabilities
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/90">
            <TrendingDown className="h-4 w-4 text-rose-100" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalLiabilities)}
          </div>
        </CardContent>
      </Card>

      {/* Net Worth Card */}
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Worth
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/90">
            <Wallet className="h-4 w-4 text-blue-100" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              netWorth >= 0 ? 'text-foreground' : 'text-rose-500'
            )}
          >
            {formatCurrency(netWorth)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
