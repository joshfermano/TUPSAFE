/**
 * Skeleton Components Demo
 *
 * This demo page showcases all available skeleton components.
 * Use this for development and testing purposes.
 *
 * To view: Import this component in a page and render it.
 */

'use client';

import React, { useState } from 'react';
import {
  DashboardSkeleton,
  ProfileSkeleton,
  CardSkeleton,
  CardSkeletonGrid,
  CardSkeletonList,
  TableSkeleton,
  ListSkeleton,
  DataTableSkeleton,
  FormSkeleton,
  MultiStepFormSkeleton,
  CompactFormSkeleton,
  AuthFormSkeleton,
} from './index';

type SkeletonType =
  | 'dashboard'
  | 'profile'
  | 'card-single'
  | 'card-grid'
  | 'card-list'
  | 'table'
  | 'list'
  | 'data-table'
  | 'form-single'
  | 'form-two-column'
  | 'form-mixed'
  | 'form-multi-step'
  | 'form-compact'
  | 'form-auth';

export function SkeletonDemo() {
  const [activeDemo, setActiveDemo] = useState<SkeletonType>('dashboard');

  const demos: { value: SkeletonType; label: string; category: string }[] = [
    { value: 'dashboard', label: 'Dashboard', category: 'Pages' },
    { value: 'profile', label: 'Profile', category: 'Pages' },
    { value: 'card-single', label: 'Single Card', category: 'Cards' },
    { value: 'card-grid', label: 'Card Grid', category: 'Cards' },
    { value: 'card-list', label: 'Card List', category: 'Cards' },
    { value: 'table', label: 'Table', category: 'Tables' },
    { value: 'list', label: 'List (Mobile)', category: 'Tables' },
    { value: 'data-table', label: 'Data Table', category: 'Tables' },
    { value: 'form-single', label: 'Form (Single Column)', category: 'Forms' },
    { value: 'form-two-column', label: 'Form (Two Column)', category: 'Forms' },
    { value: 'form-mixed', label: 'Form (Mixed)', category: 'Forms' },
    { value: 'form-multi-step', label: 'Multi-Step Form', category: 'Forms' },
    { value: 'form-compact', label: 'Compact Form', category: 'Forms' },
    { value: 'form-auth', label: 'Auth Form', category: 'Forms' },
  ];

  const categories = Array.from(new Set(demos.map(d => d.category)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Skeleton Components Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            TUPSAFE Employee Portal - Magic UI Design System
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {demos
                      .filter(demo => demo.category === category)
                      .map(demo => (
                        <button
                          key={demo.value}
                          onClick={() => setActiveDemo(demo.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeDemo === demo.value
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'text-foreground hover:bg-gray-100 dark:hover:bg-gray-900'
                          }`}
                        >
                          {demo.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-6">
              {/* Demo Info */}
              <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-foreground">
                  {demos.find(d => d.value === activeDemo)?.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Category: {demos.find(d => d.value === activeDemo)?.category}
                </p>
              </div>

              {/* Skeleton Display */}
              <div className="bg-white dark:bg-gray-950 rounded-lg">
                {activeDemo === 'dashboard' && <DashboardSkeleton />}
                {activeDemo === 'profile' && <ProfileSkeleton />}

                {activeDemo === 'card-single' && (
                  <div className="p-6">
                    <CardSkeleton rows={4} hasImage hasFooter />
                  </div>
                )}

                {activeDemo === 'card-grid' && (
                  <div className="p-6">
                    <CardSkeletonGrid count={6} columns={3} rows={3} hasImage hasFooter />
                  </div>
                )}

                {activeDemo === 'card-list' && (
                  <div className="p-6">
                    <CardSkeletonList count={5} rows={3} hasImage />
                  </div>
                )}

                {activeDemo === 'table' && (
                  <div className="p-6">
                    <TableSkeleton columns={5} rows={8} hasActions hasPagination />
                  </div>
                )}

                {activeDemo === 'list' && (
                  <div className="p-6">
                    <ListSkeleton rows={6} />
                  </div>
                )}

                {activeDemo === 'data-table' && (
                  <div className="p-6">
                    <DataTableSkeleton columns={6} rows={10} hasActions />
                  </div>
                )}

                {activeDemo === 'form-single' && (
                  <div className="p-6">
                    <FormSkeleton fields={6} hasSections hasActions layout="single" />
                  </div>
                )}

                {activeDemo === 'form-two-column' && (
                  <div className="p-6">
                    <FormSkeleton fields={8} hasSections hasActions layout="two-column" />
                  </div>
                )}

                {activeDemo === 'form-mixed' && (
                  <div className="p-6">
                    <FormSkeleton fields={10} hasSections hasActions layout="mixed" />
                  </div>
                )}

                {activeDemo === 'form-multi-step' && (
                  <div className="p-6">
                    <MultiStepFormSkeleton steps={4} fieldsPerStep={5} />
                  </div>
                )}

                {activeDemo === 'form-compact' && (
                  <div className="p-6">
                    <div className="max-w-md mx-auto">
                      <CompactFormSkeleton fields={4} />
                    </div>
                  </div>
                )}

                {activeDemo === 'form-auth' && (
                  <div className="p-6">
                    <AuthFormSkeleton />
                  </div>
                )}
              </div>

              {/* Component Code */}
              <div className="mt-6 p-4 rounded-lg bg-gray-900 dark:bg-black text-white overflow-x-auto">
                <pre className="text-xs">
                  <code>{getComponentCode(activeDemo)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getComponentCode(type: SkeletonType): string {
  const codes: Record<SkeletonType, string> = {
    dashboard: `import { DashboardSkeleton } from '@/components/skeletons';

export default function Page() {
  return <DashboardSkeleton />;
}`,

    profile: `import { ProfileSkeleton } from '@/components/skeletons';

export default function Page() {
  return <ProfileSkeleton />;
}`,

    'card-single': `import { CardSkeleton } from '@/components/skeletons';

export default function Page() {
  return <CardSkeleton rows={4} hasImage hasFooter />;
}`,

    'card-grid': `import { CardSkeletonGrid } from '@/components/skeletons';

export default function Page() {
  return (
    <CardSkeletonGrid
      count={6}
      columns={3}
      rows={3}
      hasImage
      hasFooter
    />
  );
}`,

    'card-list': `import { CardSkeletonList } from '@/components/skeletons';

export default function Page() {
  return <CardSkeletonList count={5} rows={3} hasImage />;
}`,

    table: `import { TableSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <TableSkeleton
      columns={5}
      rows={8}
      hasActions
      hasPagination
    />
  );
}`,

    list: `import { ListSkeleton } from '@/components/skeletons';

export default function Page() {
  return <ListSkeleton rows={6} />;
}`,

    'data-table': `import { DataTableSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <DataTableSkeleton
      columns={6}
      rows={10}
      hasActions
    />
  );
}`,

    'form-single': `import { FormSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <FormSkeleton
      fields={6}
      hasSections
      hasActions
      layout="single"
    />
  );
}`,

    'form-two-column': `import { FormSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <FormSkeleton
      fields={8}
      hasSections
      hasActions
      layout="two-column"
    />
  );
}`,

    'form-mixed': `import { FormSkeleton } from '@/components/skeletons';

export default function Page() {
  return (
    <FormSkeleton
      fields={10}
      hasSections
      hasActions
      layout="mixed"
    />
  );
}`,

    'form-multi-step': `import { MultiStepFormSkeleton } from '@/components/skeletons';

export default function Page() {
  return <MultiStepFormSkeleton steps={4} fieldsPerStep={5} />;
}`,

    'form-compact': `import { CompactFormSkeleton } from '@/components/skeletons';

export default function Page() {
  return <CompactFormSkeleton fields={4} />;
}`,

    'form-auth': `import { AuthFormSkeleton } from '@/components/skeletons';

export default function Page() {
  return <AuthFormSkeleton />;
}`,
  };

  return codes[type];
}
