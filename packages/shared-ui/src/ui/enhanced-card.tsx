"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "./card"
import { MagicCard } from "./magic-card"
import { NeonGradientCard } from "./neon-gradient-card"

const enhancedCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      magic: "",
      neon: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedCardVariants> {
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  gradientFrom?: string
  gradientTo?: string
  neonSize?: number
  neonColors?: {
    firstColor?: string
    secondColor?: string
  }
}

/**
 * EnhancedCard - A wrapper component that combines standard Card with MagicUI visual effects
 *
 * @example
 * // Magic card with spotlight effect (default TUP Manila colors)
 * <EnhancedCard variant="magic">
 *   <EnhancedCardHeader>
 *     <EnhancedCardTitle>Dashboard Overview</EnhancedCardTitle>
 *     <EnhancedCardDescription>Your recent activity</EnhancedCardDescription>
 *   </EnhancedCardHeader>
 *   <EnhancedCardContent>Content here</EnhancedCardContent>
 * </EnhancedCard>
 *
 * @example
 * // Neon gradient card for highlighted sections
 * <EnhancedCard
 *   variant="neon"
 *   neonColors={{ firstColor: "#9b1c1c", secondColor: "#dc2626" }}
 * >
 *   <EnhancedCardContent>Highlighted content</EnhancedCardContent>
 * </EnhancedCard>
 *
 * @example
 * // Standard card (no effects)
 * <EnhancedCard variant="default">
 *   <EnhancedCardContent>Standard card content</EnhancedCardContent>
 * </EnhancedCard>
 */
const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  (
    {
      className,
      variant = "default",
      gradientSize = 200,
      gradientColor = "#262626",
      gradientOpacity = 0.8,
      gradientFrom = "#9b1c1c",
      gradientTo = "#dc2626",
      neonSize = 300,
      neonColors = {
        firstColor: "#9b1c1c",
        secondColor: "#dc2626",
      },
      children,
      ...props
    },
    ref
  ) => {
    const renderCard = () => {
      switch (variant) {
        case "magic":
          return (
            <MagicCard
              className={cn("border rounded-xl shadow-sm p-6", className)}
              gradientSize={gradientSize}
              gradientColor={gradientColor}
              gradientOpacity={gradientOpacity}
              gradientFrom={gradientFrom}
              gradientTo={gradientTo}
              {...(props as any)}
            >
              {children}
            </MagicCard>
          )

        case "neon":
          return (
            <NeonGradientCard
              className={cn("", className)}
              neonColors={{
                firstColor: neonColors.firstColor || "#9b1c1c",
                secondColor: neonColors.secondColor || "#dc2626",
              }}
              borderSize={2}
              borderRadius={12}
              {...(props as any)}
            >
              <div className="p-6">{children}</div>
            </NeonGradientCard>
          )

        default:
          return (
            <Card ref={ref} className={className} {...props}>
              {children}
            </Card>
          )
      }
    }

    return renderCard()
  }
)

EnhancedCard.displayName = "EnhancedCard"

/**
 * EnhancedCardHeader - Card header component
 * Works with all EnhancedCard variants
 */
const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardHeader ref={ref} className={className} {...props} />
})

EnhancedCardHeader.displayName = "EnhancedCardHeader"

/**
 * EnhancedCardTitle - Card title component
 * Works with all EnhancedCard variants
 */
const EnhancedCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardTitle ref={ref} className={className} {...props} />
})

EnhancedCardTitle.displayName = "EnhancedCardTitle"

/**
 * EnhancedCardDescription - Card description component
 * Works with all EnhancedCard variants
 */
const EnhancedCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardDescription ref={ref} className={className} {...props} />
})

EnhancedCardDescription.displayName = "EnhancedCardDescription"

/**
 * EnhancedCardContent - Card content component
 * Works with all EnhancedCard variants
 */
const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardContent ref={ref} className={className} {...props} />
})

EnhancedCardContent.displayName = "EnhancedCardContent"

/**
 * EnhancedCardFooter - Card footer component
 * Works with all EnhancedCard variants
 */
const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardFooter ref={ref} className={className} {...props} />
})

EnhancedCardFooter.displayName = "EnhancedCardFooter"

/**
 * EnhancedCardAction - Card action component
 * Works with all EnhancedCard variants
 */
const EnhancedCardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <CardAction ref={ref} className={className} {...props} />
})

EnhancedCardAction.displayName = "EnhancedCardAction"

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
  EnhancedCardAction,
  enhancedCardVariants,
}
