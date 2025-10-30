'use client';

import { Toaster } from 'sonner';

/**
 * ToastProvider Component
 *
 * Provides toast notification functionality throughout the TUPSAFE employee application.
 * Uses Sonner library for modern, accessible toast notifications.
 *
 * Features:
 * - Position: bottom-right for non-intrusive notifications
 * - Theme: system (respects user's OS dark/light mode preference)
 * - Rich colors: Enhanced visual feedback for different notification types
 * - Close button: Allows users to dismiss notifications manually
 * - Auto-dismiss: 4 seconds default duration
 * - TUPSAFE theme integration: Uses CSS variables from Tailwind config
 *
 * Usage:
 * - Import this provider in the root layout
 * - Use toast() function from 'sonner' anywhere in the app
 *
 * @example
 * ```tsx
 * import { toast } from 'sonner';
 *
 * // Success notification
 * toast.success('Profile updated successfully!');
 *
 * // Error notification
 * toast.error('Failed to submit PDS form');
 *
 * // Info notification
 * toast.info('New submission deadline approaching');
 *
 * // Warning notification
 * toast.warning('Session will expire in 5 minutes');
 *
 * // Custom notification
 * toast('Data saved to draft', {
 *   description: 'Your changes have been automatically saved',
 * });
 * ```
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        // Integrate with TUPSAFE theme system
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        // Consistent styling for all notification types
        classNames: {
          toast: 'rounded-lg shadow-lg backdrop-blur-sm',
          title: 'font-medium',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-muted hover:bg-muted/80',
        },
      }}
      // Additional accessibility features
      expand={false}
      visibleToasts={3}
      offset={16}
    />
  );
}
