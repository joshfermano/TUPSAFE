"use client"

import * as React from "react"
import { motion } from "motion/react"
import { CheckCircle2, AlertCircle } from "lucide-react"

import { cn } from "../lib/utils"
import { Input } from "./input"
import { ShineBorder } from "./shine-border"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  glowColor?: string
  showStatusIcon?: boolean
}

/**
 * EnhancedInput - An input component with visual enhancements and state indicators
 *
 * @example
 * // Basic enhanced input
 * <EnhancedInput
 *   placeholder="Enter your name"
 *   glowColor="#9b1c1c"
 * />
 *
 * @example
 * // Input with error state
 * <EnhancedInput
 *   placeholder="Email"
 *   error={true}
 *   showStatusIcon={true}
 * />
 *
 * @example
 * // Input with success state
 * <EnhancedInput
 *   placeholder="Username"
 *   success={true}
 *   showStatusIcon={true}
 * />
 *
 * @example
 * // Custom glow color on focus
 * <EnhancedInput
 *   placeholder="Search..."
 *   glowColor="#3b82f6"
 * />
 */
const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    {
      className,
      error = false,
      success = false,
      glowColor = "#9b1c1c",
      showStatusIcon = false,
      type,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const getStatusIcon = () => {
      if (!showStatusIcon) return null

      if (error) {
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <AlertCircle className="h-4 w-4 text-destructive" />
          </motion.div>
        )
      }

      if (success) {
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          </motion.div>
        )
      }

      return null
    }

    const getGlowColor = () => {
      if (error) return "#ef4444"
      if (success) return "#10b981"
      return glowColor
    }

    return (
      <div className="relative w-full">
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {isFocused && !error && !success && (
            <ShineBorder
              className="absolute inset-0 rounded-md pointer-events-none"
              color={getGlowColor()}
              duration={3}
              borderWidth={2}
            />
          )}
          <Input
            ref={ref}
            type={type}
            className={cn(
              "transition-all duration-200",
              isFocused && "ring-2 ring-offset-1",
              error &&
                "border-destructive ring-destructive/20 dark:ring-destructive/40 focus-visible:border-destructive focus-visible:ring-destructive/30",
              success &&
                "border-green-600 dark:border-green-500 ring-green-600/20 dark:ring-green-500/40 focus-visible:border-green-600 dark:focus-visible:border-green-500 focus-visible:ring-green-600/30 dark:focus-visible:ring-green-500/30",
              !error && !success && isFocused && "ring-primary/20",
              showStatusIcon && (error || success) && "pr-10",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            aria-invalid={error}
            {...props}
          />
          {getStatusIcon()}
        </motion.div>
      </div>
    )
  }
)

EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }
