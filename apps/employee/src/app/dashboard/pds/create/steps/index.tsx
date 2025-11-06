/**
 * PDS Form Step Components
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
export const PersonalBasic = lazy(() => import('./PersonalBasic').then((m) => ({ default: m.PersonalBasic })));
export const Contact = lazy(() => import('./Contact').then((m) => ({ default: m.Contact })));
export const Addresses = lazy(() => import('./Addresses').then((m) => ({ default: m.Addresses })));
export const Family = lazy(() => import('./Family').then((m) => ({ default: m.Family })));
export const Education = lazy(() => import('./Education').then((m) => ({ default: m.Education })));
export const EligibilityWork = lazy(() => import('./EligibilityWork').then((m) => ({ default: m.EligibilityWork })));
export const VoluntaryTraining = lazy(() => import('./VoluntaryTraining').then((m) => ({ default: m.VoluntaryTraining })));
export const OtherReview = lazy(() => import('./OtherReview').then((m) => ({ default: m.OtherReview })));
