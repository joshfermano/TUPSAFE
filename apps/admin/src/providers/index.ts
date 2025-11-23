/**
 * TUPSAFE Admin Portal Providers
 *
 * Barrel export for all provider components used in the admin portal.
 * Enables clean, centralized imports throughout the application.
 *
 * Available Providers:
 * - QueryProvider: React Query (TanStack Query) for data fetching and caching
 * - ToastProvider: Sonner toast notifications for user feedback
 *
 * Usage:
 * ```tsx
 * import { QueryProvider, ToastProvider } from '@/providers';
 * ```
 */

export { QueryProvider } from './QueryProvider';
export { ToastProvider } from './ToastProvider';
export { RealtimeProvider } from './RealtimeProvider';
