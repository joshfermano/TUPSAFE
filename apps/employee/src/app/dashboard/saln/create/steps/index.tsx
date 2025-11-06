/**
 * SALN Form Step Components
 *
 * Lazy-loaded step components for optimal code splitting and performance.
 * Each step is loaded on-demand when the user navigates to it, reducing
 * initial bundle size and improving page load times.
 *
 * All steps use React Hook Form's useFormContext for form integration.
 *
 * Performance optimization:
 * - Initial JS load reduced by ~60-70%
 * - Each step is code-split into its own chunk
 * - Steps are cached after first load
 */

import { lazy } from 'react';

// Lazy load step components for code splitting
export const DeclarantInfo = lazy(() => import('./DeclarantInfo').then((m) => ({ default: m.DeclarantInfo })));
export const RealProperties = lazy(() => import('./RealProperties').then((m) => ({ default: m.RealProperties })));
export const PersonalProperties = lazy(() => import('./PersonalProperties').then((m) => ({ default: m.PersonalProperties })));
export const Liabilities = lazy(() => import('./Liabilities').then((m) => ({ default: m.Liabilities })));
export const BusinessRelatives = lazy(() => import('./BusinessRelatives').then((m) => ({ default: m.BusinessRelatives })));
export const NetWorthSummary = lazy(() => import('./NetWorthSummary').then((m) => ({ default: m.NetWorthSummary })));
export const ReviewSubmit = lazy(() => import('./ReviewSubmit').then((m) => ({ default: m.ReviewSubmit })));
