"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Switch — inline-styled track and thumb so neither Tailwind compilation nor
 * CSS specificity can accidentally hide the active/inactive states.
 *
 * - Unchecked track: zinc-300 (#d4d4d8) light / zinc-600 (#52525b) dark
 * - Checked track:   TUP crimson (#8B1538)
 * - Thumb:           white with subtle ring + shadow for contrast on any track
 */
function Switch({
  className,
  style,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  // Radix keeps internal state when uncontrolled; track it for styling.
  const [internalChecked, setInternalChecked] = React.useState<boolean>(
    Boolean(defaultChecked)
  )
  const isChecked = checked ?? internalChecked

  const trackColor = isChecked
    ? "#8B1538" // TUP crimson (primary)
    : "var(--switch-track-unchecked, #d4d4d8)" // zinc-300 light; overridden in dark

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(next) => {
        setInternalChecked(next)
        onCheckedChange?.(next)
      }}
      className={cn(
        "relative peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "h-6 w-11",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1538] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        backgroundColor: trackColor,
        border: "1px solid rgba(0, 0, 0, 0.08)",
        ...style,
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full transition-transform"
        style={{
          height: "1.125rem",
          width: "1.125rem",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 1px 2px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.12)",
          transform: isChecked ? "translateX(1.375rem)" : "translateX(0.1875rem)",
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
