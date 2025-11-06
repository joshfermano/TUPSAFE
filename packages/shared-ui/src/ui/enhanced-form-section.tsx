"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"

import { cn } from "../lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"
import { MagicCard } from "./magic-card"
import { NeonGradientCard } from "./neon-gradient-card"
import { BorderBeam } from "./border-beam"
import { TextAnimate } from "./text-animate"

export interface EnhancedFormSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  isActive?: boolean
  isCollapsible?: boolean
  defaultExpanded?: boolean
  variant?: "magic" | "neon" | "default"
  gradientFrom?: string
  gradientTo?: string
  neonColors?: {
    firstColor?: string
    secondColor?: string
  }
}

/**
 * EnhancedFormSection - A premium form section component with collapsible functionality and visual effects
 *
 * @example
 * // Basic magic card form section
 * <EnhancedFormSection
 *   title="Personal Information"
 *   subtitle="Enter your basic details"
 *   variant="magic"
 * >
 *   <form>Form fields here</form>
 * </EnhancedFormSection>
 *
 * @example
 * // Collapsible section with neon effect when active
 * <EnhancedFormSection
 *   title="Employment History"
 *   subtitle="Add your work experience"
 *   isCollapsible={true}
 *   defaultExpanded={false}
 *   isActive={true}
 *   variant="neon"
 * >
 *   <div>Collapsible content</div>
 * </EnhancedFormSection>
 *
 * @example
 * // Active section with border beam effect
 * <EnhancedFormSection
 *   title="Educational Background"
 *   isActive={true}
 *   variant="magic"
 * >
 *   <div>Form content</div>
 * </EnhancedFormSection>
 */
const EnhancedFormSection = React.forwardRef<
  HTMLDivElement,
  EnhancedFormSectionProps
>(
  (
    {
      className,
      title,
      subtitle,
      isActive = false,
      isCollapsible = false,
      defaultExpanded = true,
      variant = "magic",
      gradientFrom = "#9b1c1c",
      gradientTo = "#dc2626",
      neonColors = {
        firstColor: "#9b1c1c",
        secondColor: "#dc2626",
      },
      children,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(defaultExpanded)

    const headerContent = (
      <div className="space-y-2">
        <TextAnimate
          animation="blurInUp"
          by="character"
          className="text-xl font-semibold text-foreground"
        >
          {title}
        </TextAnimate>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    )

    const contentWrapper = (content: React.ReactNode) => {
      if (isCollapsible) {
        return (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="space-y-4">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  {headerContent}
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pb-4"
                    >
                      {content}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      }

      return (
        <div className="space-y-4">
          <div className="p-4">{headerContent}</div>
          <div className="px-4 pb-4">{content}</div>
        </div>
      )
    }

    const renderSection = () => {
      const content = contentWrapper(children)

      switch (variant) {
        case "magic":
          return (
            <div ref={ref} className={cn("relative", className)} {...props}>
              <MagicCard
                className="border rounded-xl shadow-sm"
                gradientFrom={gradientFrom}
                gradientTo={gradientTo}
              >
                {content}
                {isActive && (
                  <BorderBeam
                    size={250}
                    duration={12}
                    delay={9}
                    colorFrom={gradientFrom}
                    colorTo={gradientTo}
                  />
                )}
              </MagicCard>
            </div>
          )

        case "neon":
          return (
            <div ref={ref} className={cn("relative", className)} {...props}>
              <NeonGradientCard
                neonColors={{
                  firstColor: neonColors.firstColor || "#9b1c1c",
                  secondColor: neonColors.secondColor || "#dc2626",
                }}
                borderSize={isActive ? 3 : 2}
                borderRadius={12}
              >
                <div className="p-2">{content}</div>
              </NeonGradientCard>
            </div>
          )

        default:
          return (
            <div
              ref={ref}
              className={cn(
                "relative border rounded-xl shadow-sm bg-card",
                isActive && "ring-2 ring-primary ring-offset-2",
                className
              )}
              {...props}
            >
              {content}
              {isActive && (
                <BorderBeam
                  size={250}
                  duration={12}
                  delay={9}
                  colorFrom={gradientFrom}
                  colorTo={gradientTo}
                />
              )}
            </div>
          )
      }
    }

    return renderSection()
  }
)

EnhancedFormSection.displayName = "EnhancedFormSection"

export { EnhancedFormSection }
