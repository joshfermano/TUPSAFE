"use client"

import * as React from "react"
import { motion } from "motion/react"
import { CheckCircle2 } from "lucide-react"

import { cn } from "../lib/utils"
import { SparklesText } from "./sparkles-text"
import { BlurFade } from "./blur-fade"

export interface EnhancedSuccessProps
  extends React.HTMLAttributes<HTMLDivElement> {
  message: string
  description?: string
  showConfetti?: boolean
  onComplete?: () => void
  autoHide?: boolean
  autoHideDelay?: number
  variant?: "default" | "sparkle"
}

/**
 * EnhancedSuccess - A celebration success message component with animations
 *
 * @example
 * // Basic success message
 * <EnhancedSuccess
 *   message="Form Submitted Successfully!"
 *   description="Your PDS has been submitted for review."
 * />
 *
 * @example
 * // Success with sparkle effect
 * <EnhancedSuccess
 *   message="SALN Approved!"
 *   variant="sparkle"
 *   onComplete={() => console.log("Animation completed")}
 * />
 *
 * @example
 * // Auto-hide success message
 * <EnhancedSuccess
 *   message="Changes Saved"
 *   autoHide
 *   autoHideDelay={3000}
 *   onComplete={() => setShowSuccess(false)}
 * />
 */
const EnhancedSuccess = React.forwardRef<HTMLDivElement, EnhancedSuccessProps>(
  (
    {
      className,
      message,
      description,
      showConfetti = false,
      onComplete,
      autoHide = false,
      autoHideDelay = 3000,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => {
            onComplete?.()
          }, 500) // Wait for fade out animation
        }, autoHideDelay)

        return () => clearTimeout(timer)
      }
    }, [autoHide, autoHideDelay, onComplete])

    if (!isVisible && autoHide) {
      return null
    }

    return (
      <BlurFade delay={0.1} inView>
        <div
          ref={ref}
          className={cn("relative", className)}
          {...props}
        >
          {/* Success Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 shadow-lg"
          >
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-teal-400/10"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-start gap-4">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="flex-shrink-0"
              >
                <div className="rounded-full bg-green-500 p-2 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </motion.div>

              {/* Message */}
              <div className="flex-1 space-y-2">
                {variant === "sparkle" ? (
                  <SparklesText
                    className="text-xl font-bold text-green-700 dark:text-green-400"
                    sparklesCount={5}
                  >
                    {message}
                  </SparklesText>
                ) : (
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold text-green-700 dark:text-green-400"
                  >
                    {message}
                  </motion.h3>
                )}

                {description && (
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-green-600 dark:text-green-500"
                  >
                    {description}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-400/20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            />
          </motion.div>

          {/* Optional: Confetti effect would go here */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Confetti component can be added later when available */}
              {/* <Confetti /> */}
            </div>
          )}
        </div>
      </BlurFade>
    )
  }
)

EnhancedSuccess.displayName = "EnhancedSuccess"

export { EnhancedSuccess }
