"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        // Sizing - larger for better visibility
        "h-6 w-11",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Disabled styles
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Unchecked state - using input token for theme-aware styling
        "data-[state=unchecked]:bg-input",
        // Checked state - primary color
        "data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base styles
          "pointer-events-none block rounded-full shadow-lg ring-0 transition-transform",
          // Sizing
          "h-5 w-5",
          // Thumb color - white in both modes for contrast against track
          "bg-white dark:bg-white",
          // Position based on state
          "data-[state=checked]:translate-x-5",
          "data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
