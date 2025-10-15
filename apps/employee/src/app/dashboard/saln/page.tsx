'use client';

import { Landmark } from 'lucide-react';

export default function SalnPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Landmark className="h-16 w-16 text-indigo-600 mx-auto" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          e-SALN Module
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Statement of Assets, Liabilities, and Net Worth management coming soon
        </p>
      </div>
    </div>
  );
}
