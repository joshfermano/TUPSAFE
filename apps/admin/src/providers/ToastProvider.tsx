'use client';

import { Toaster } from 'sonner';

/**
 * ToastProvider Component
 *
 * Provides toast notification functionality for the TUPSAFE admin portal.
 * Uses Sonner library for modern, accessible toast notifications with admin-specific styling.
 *
 * Features:
 * - Position: bottom-right for non-intrusive notifications
 * - Theme: system (respects user's OS dark/light mode preference)
 * - Rich colors: Enhanced visual feedback for different notification types
 * - Close button: Allows manual dismissal
 * - Auto-dismiss: 4 seconds default duration
 * - Professional styling aligned with shadcn/ui design system
 *
 * Admin Portal Customizations:
 * - Clean, professional aesthetic matching enterprise requirements
 * - Optimized for admin workflows (approvals, rejections, alerts)
 * - Integrated with TUP Crimson theme colors
 *
 * Usage:
 * - Import this provider in the root layout
 * - Use toast() function from 'sonner' anywhere in the admin app
 *
 * @example
 * ```tsx
 * import { toast } from 'sonner';
 *
 * // Success notification (e.g., approval)
 * toast.success('SALN submission approved successfully');
 *
 * // Error notification (e.g., validation failure)
 * toast.error('Failed to update employee record');
 *
 * // Warning notification (e.g., pending action)
 * toast.warning('5 submissions require your review');
 *
 * // Info notification (e.g., system update)
 * toast.info('System maintenance scheduled for Saturday');
 *
 * // Custom notification with action
 * toast('New submission received', {
 *   description: 'PDS from John Doe requires review',
 *   action: {
 *     label: 'Review',
 *     onClick: () => router.push('/submissions/123'),
 *   },
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
        // Integrate with admin portal theme (TUP Crimson + shadcn/ui)
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        // Professional, clean styling for admin interface
        classNames: {
          toast: 'rounded-lg shadow-lg backdrop-blur-sm',
          title: 'font-medium',
          description: 'text-sm opacity-90',
          actionButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton: 'bg-muted text-muted-foreground hover:bg-muted/80',
          closeButton: 'bg-muted hover:bg-muted/80',
        },
      }}
      // Accessibility and UX optimizations
      expand={false}
      visibleToasts={3}
      offset={16}
    />
  );
}
