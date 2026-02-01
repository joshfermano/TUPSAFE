"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialog size variants for consistent sizing across the app
 * - sm: Small dialogs (confirmations, simple forms)
 * - default: Standard dialogs (most forms)
 * - lg: Large dialogs (complex forms, details)
 * - xl: Extra large dialogs (multi-section content)
 * - full: Full-width dialogs (complex workflows, data tables)
 */
const dialogSizeClasses = {
  sm: "sm:max-w-md",
  default: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  full: "sm:max-w-5xl max-h-[90vh]",
} as const

type DialogSize = keyof typeof dialogSizeClasses

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

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /**
   * Controls the maximum width of the dialog
   * @default "default"
   */
  size?: DialogSize
  /**
   * Whether to show the close button in the top-right corner
   * @default true
   */
  showCloseButton?: boolean
}

function DialogContent({
  className,
  children,
  size = "default",
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const isDark = useTheme()

  // Explicit colors for guaranteed theme support in portals
  // These inline styles act as the ultimate fallback when CSS classes fail
  const themeStyles: React.CSSProperties = {
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    color: isDark ? '#fafafa' : '#18181b',
  }

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
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
          dialogSizeClasses[size],
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
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute right-4 top-4 rounded-sm",
              // Explicit colors for visibility in both themes
              "text-zinc-500 dark:text-zinc-400",
              "hover:text-zinc-900 dark:hover:text-zinc-50",
              "transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
              "focus:ring-offset-white dark:focus:ring-offset-zinc-900",
              "disabled:pointer-events-none",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            )}
            style={{
              color: isDark ? '#a1a1aa' : '#71717a',
            }}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
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

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
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

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

// Export types for external use
export type { DialogSize, DialogContentProps }
