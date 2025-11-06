"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { motion } from "motion/react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "../lib/utils"

export interface EnhancedSelectProps {
  variant?: "default" | "enhanced"
  spotlightColor?: string
  children?: React.ReactNode
}

const EnhancedSelect = SelectPrimitive.Root

const EnhancedSelectGroup = SelectPrimitive.Group

const EnhancedSelectValue = SelectPrimitive.Value

/**
 * EnhancedSelectTrigger - Select trigger with enhanced visual effects
 *
 * @example
 * <EnhancedSelect>
 *   <EnhancedSelectTrigger variant="enhanced" spotlightColor="#9b1c1c">
 *     <EnhancedSelectValue placeholder="Select an option" />
 *   </EnhancedSelectTrigger>
 * </EnhancedSelect>
 */
const EnhancedSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
    EnhancedSelectProps
>(
  (
    { className, children, variant = "default", spotlightColor = "#9b1c1c", ...props },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === "enhanced") {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 relative flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-all focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] data-[placeholder]:text-muted-foreground dark:bg-input/30",
          variant === "enhanced" && "overflow-hidden",
          className
        )}
        onMouseMove={handleMouseMove}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        {...props}
      >
        {variant === "enhanced" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: isOpen
                ? `radial-gradient(circle 100px at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}15, transparent)`
                : "transparent",
            }}
            transition={{ duration: 0.3 }}
          />
        )}
        <span className="relative z-10">{children}</span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50 relative z-10" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    )
  }
)
EnhancedSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const EnhancedSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
EnhancedSelectScrollUpButton.displayName =
  SelectPrimitive.ScrollUpButton.displayName

const EnhancedSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
EnhancedSelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

/**
 * EnhancedSelectContent - Select dropdown content with smooth animations
 */
const EnhancedSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <EnhancedSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <EnhancedSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
EnhancedSelectContent.displayName = SelectPrimitive.Content.displayName

const EnhancedSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
EnhancedSelectLabel.displayName = SelectPrimitive.Label.displayName

/**
 * EnhancedSelectItem - Select option with hover effects
 */
const EnhancedSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
EnhancedSelectItem.displayName = SelectPrimitive.Item.displayName

const EnhancedSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
))
EnhancedSelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  EnhancedSelect,
  EnhancedSelectGroup,
  EnhancedSelectValue,
  EnhancedSelectTrigger,
  EnhancedSelectContent,
  EnhancedSelectLabel,
  EnhancedSelectItem,
  EnhancedSelectSeparator,
  EnhancedSelectScrollUpButton,
  EnhancedSelectScrollDownButton,
}
