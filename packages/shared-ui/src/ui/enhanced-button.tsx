"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import { Button } from "./button"
import { ShimmerButton } from "./shimmer-button"
import { ShinyButton } from "./shiny-button"
import { PulsatingButton } from "./pulsating-button"
import { InteractiveHoverButton } from "./interactive-hover-button"

const enhancedButtonVariants = cva("", {
  variants: {
    variant: {
      default: "",
      shimmer: "",
      shiny: "",
      pulsating: "",
      interactive: "",
      destructive: "",
      outline: "",
      secondary: "",
      ghost: "",
      link: "",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-10 px-6",
      icon: "size-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  shimmerColor?: string
  shimmerDuration?: string
  pulseColor?: string
  pulseDuration?: string
}

/**
 * EnhancedButton - A wrapper component that combines standard Button with MagicUI visual effects
 *
 * @example
 * // Shimmer effect for primary CTAs
 * <EnhancedButton variant="shimmer">Submit Form</EnhancedButton>
 *
 * @example
 * // Shiny effect for secondary actions
 * <EnhancedButton variant="shiny" size="lg">Learn More</EnhancedButton>
 *
 * @example
 * // Pulsating effect for urgent actions
 * <EnhancedButton variant="pulsating" pulseColor="#9b1c1c">
 *   Urgent Action Required
 * </EnhancedButton>
 *
 * @example
 * // Interactive hover effect
 * <EnhancedButton variant="interactive">Explore Features</EnhancedButton>
 *
 * @example
 * // Standard button variants still work
 * <EnhancedButton variant="outline" size="sm">Cancel</EnhancedButton>
 */
const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      shimmerColor = "#B8264D",
      shimmerDuration = "3s",
      pulseColor = "#9b1c1c",
      pulseDuration = "1.5s",
      children,
      ...props
    },
    ref
  ) => {
    // Determine which button component to use based on variant
    const renderButton = () => {
      switch (variant) {
        case "shimmer":
          return (
            <ShimmerButton
              ref={ref}
              className={cn(enhancedButtonVariants({ size }), className)}
              shimmerColor={shimmerColor}
              shimmerDuration={shimmerDuration}
              background="linear-gradient(135deg, #8B1538 0%, #B8264D 100%)"
              {...props}
            >
              {children}
            </ShimmerButton>
          )

        case "shiny":
          return (
            <ShinyButton
              ref={ref}
              className={cn(enhancedButtonVariants({ size }), className)}
              {...(props as any)}
            >
              {children}
            </ShinyButton>
          )

        case "pulsating":
          return (
            <PulsatingButton
              ref={ref}
              className={cn(enhancedButtonVariants({ size }), className)}
              pulseColor={pulseColor}
              duration={pulseDuration}
              {...props}
            >
              {children}
            </PulsatingButton>
          )

        case "interactive":
          return (
            <InteractiveHoverButton
              className={cn(enhancedButtonVariants({ size }), className)}
              {...props}
            >
              {children}
            </InteractiveHoverButton>
          )

        default:
          // Use standard Button for all other variants
          return (
            <Button
              ref={ref}
              variant={variant}
              size={size}
              asChild={asChild}
              className={className}
              {...props}
            >
              {children}
            </Button>
          )
      }
    }

    return renderButton()
  }
)

EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }
