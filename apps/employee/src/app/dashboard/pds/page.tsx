'use client';

import { FileText } from 'lucide-react';

export default function PdsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <FileText className="h-16 w-16 text-blue-600 mx-auto" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          e-PDS Module
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Personal Data Sheet management coming soon
        </p>
      </div>
    </div>
  );
}
