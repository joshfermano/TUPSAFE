"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * AlertDialog size variants for consistent sizing across the app
 * - sm: Small dialogs (simple confirmations)
 * - default: Standard dialogs (most confirmations)
 * - lg: Large dialogs (complex confirmations with more content)
 * - xl: Extra large dialogs (bulk operations, detailed warnings)
 * - full: Full-width dialogs (complex workflows)
 */
const alertDialogSizeClasses = {
  sm: "sm:max-w-md",
  default: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-5xl max-h-[90vh]",
} as const

type AlertDialogSize = keyof typeof alertDialogSizeClasses

/**
 * Hook to detect current theme from document.documentElement
 * This is necessary because Radix portals render outside the React tree
 * and may not properly inherit CSS custom properties from theme context
 */
function useTheme() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Initial check
    const checkTheme = () => {
      const html = document.documentElement
      const isDarkMode = html.classList.contains('dark') ||
                         html.getAttribute('data-theme') === 'dark' ||
                         html.style.colorScheme === 'dark'
      setIsDark(isDarkMode)
    }

    checkTheme()

    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' &&
            (mutation.attributeName === 'class' ||
             mutation.attributeName === 'data-theme' ||
             mutation.attributeName === 'style')) {
          checkTheme()
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    })

    return () => observer.disconnect()
  }, [])

  return isDark
}

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        // Positioning
        "fixed inset-0 z-50",
        // Strong overlay - 95% opacity for maximum visual separation
        "bg-black/95",
        // Animation states
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

interface AlertDialogContentProps
  extends React.ComponentProps<typeof AlertDialogPrimitive.Content> {
  /**
   * Controls the maximum width of the alert dialog
   * @default "default"
   */
  size?: AlertDialogSize
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogContentProps) {
  const isDark = useTheme()

  // Explicit colors for guaranteed theme support in portals
  // These inline styles act as the ultimate fallback when CSS classes fail
  const themeStyles: React.CSSProperties = {
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    color: isDark ? '#fafafa' : '#18181b',
  }

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-theme={isDark ? 'dark' : 'light'}
        className={cn(
          // SOLID BACKGROUND - Explicit colors that work in portals
          // Using both Tailwind classes AND inline styles for maximum reliability
          // The dark: variants work when the portal inherits theme properly
          // The inline styles (above) act as fallback when they don't
          "bg-white dark:bg-zinc-900",
          "text-zinc-900 dark:text-zinc-50",
          // Force full opacity - prevents any translucency
          "opacity-100",
          // Important overrides using arbitrary values to ensure solidity
          "![background-color:var(--dialog-bg)]",
          // Enhanced borders for visual separation
          "border border-zinc-200 dark:border-zinc-800",
          // Subtle ring for additional depth perception
          "ring-1 ring-zinc-200/50 dark:ring-zinc-700/50",
          // Elevated shadows for premium feel
          "shadow-lg dark:shadow-2xl dark:shadow-black/50",
          // Positioning - centered in viewport
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          // Layout - responsive sizing with proper padding
          "grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg p-6",
          // Apply size variant
          alertDialogSizeClasses[size],
          // Smooth animation with appropriate timing
          "duration-200 ease-out",
          // Animation states for enter/exit
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        style={{
          ...themeStyles,
          // CSS custom property for the arbitrary value class above
          '--dialog-bg': isDark ? '#18181b' : '#ffffff',
        } as React.CSSProperties}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        // Explicit color inheritance
        "text-inherit",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-sm",
        // Explicit muted colors for both themes
        "text-zinc-600 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  VariantProps<typeof buttonVariants>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

// Export types for external use
export type { AlertDialogSize, AlertDialogContentProps }
