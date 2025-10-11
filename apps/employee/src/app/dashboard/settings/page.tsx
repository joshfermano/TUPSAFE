'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <Settings className="h-16 w-16 text-slate-600 mx-auto" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Settings
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Account settings and preferences coming soon
        </p>
      </div>
    </div>
  );
}
