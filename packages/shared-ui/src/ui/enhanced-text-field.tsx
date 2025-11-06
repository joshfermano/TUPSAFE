"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "../lib/utils"
import { Label } from "./label"
import { EnhancedInput, EnhancedInputProps } from "./enhanced-input"

export interface EnhancedTextFieldProps
  extends Omit<EnhancedInputProps, "error" | "success"> {
  label: string
  name: string
  error?: string
  helperText?: string
  required?: boolean
  showRequiredIndicator?: boolean
  containerClassName?: string
}

/**
 * EnhancedTextField - A complete form field with label, enhanced input, and error/helper text
 *
 * @example
 * // Basic text field
 * <EnhancedTextField
 *   label="Full Name"
 *   name="fullName"
 *   placeholder="Enter your full name"
 *   required
 * />
 *
 * @example
 * // Text field with error
 * <EnhancedTextField
 *   label="Email Address"
 *   name="email"
 *   type="email"
 *   error="Please enter a valid email address"
 *   showStatusIcon
 * />
 *
 * @example
 * // Text field with helper text
 * <EnhancedTextField
 *   label="Username"
 *   name="username"
 *   helperText="Must be at least 3 characters long"
 * />
 *
 * @example
 * // Text field with custom glow color
 * <EnhancedTextField
 *   label="Search"
 *   name="search"
 *   glowColor="#3b82f6"
 *   placeholder="Search..."
 * />
 */
const EnhancedTextField = React.forwardRef<
  HTMLInputElement,
  EnhancedTextFieldProps
>(
  (
    {
      label,
      name,
      error,
      helperText,
      required = false,
      showRequiredIndicator = true,
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error)
    const fieldId = `field-${name}`
    const errorId = `${fieldId}-error`
    const helperId = `${fieldId}-helper`

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {/* Label */}
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
          {required && showRequiredIndicator && (
            <span className="text-destructive ml-1" aria-label="required">
              *
            </span>
          )}
        </Label>

        {/* Enhanced Input */}
        <EnhancedInput
          ref={ref}
          id={fieldId}
          name={name}
          error={hasError}
          success={!hasError && props.showStatusIcon && Boolean(props.value)}
          className={className}
          aria-required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...props}
        />

        {/* Error or Helper Text */}
        <AnimatePresence mode="wait">
          {hasError ? (
            <motion.p
              key="error"
              id={errorId}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-destructive flex items-start gap-1.5"
              role="alert"
            >
              <span className="inline-block mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>{error}</span>
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={helperId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)

EnhancedTextField.displayName = "EnhancedTextField"

export { EnhancedTextField }
