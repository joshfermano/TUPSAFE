"use client"

import * as React from "react"

import { cn } from "../lib/utils"
import { DotPattern } from "./dot-pattern"
import { FlickeringGrid } from "./flickering-grid"
import { RetroGrid } from "./retro-grid"
import { Particles } from "./particles"

export interface EnhancedBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  effect?: "dots" | "grid" | "retro" | "particles" | "none"
  intensity?: "low" | "medium" | "high"
  color?: string
  respectReducedMotion?: boolean
}

/**
 * EnhancedBackground - A container component with animated background effects
 *
 * @example
 * // Dot pattern background (hero sections)
 * <EnhancedBackground effect="dots" intensity="medium" color="#9b1c1c">
 *   <div className="relative z-10">
 *     <h1>Welcome to TUPSAFE</h1>
 *   </div>
 * </EnhancedBackground>
 *
 * @example
 * // Flickering grid background (data/analytics sections)
 * <EnhancedBackground effect="grid" intensity="low">
 *   <div className="relative z-10">
 *     <Dashboard />
 *   </div>
 * </EnhancedBackground>
 *
 * @example
 * // Retro grid background (futuristic sections)
 * <EnhancedBackground effect="retro" intensity="high">
 *   <div className="relative z-10">
 *     <FeatureShowcase />
 *   </div>
 * </EnhancedBackground>
 *
 * @example
 * // Particles background (landing/hero sections)
 * <EnhancedBackground
 *   effect="particles"
 *   intensity="medium"
 *   color="#9b1c1c"
 *   respectReducedMotion={true}
 * >
 *   <div className="relative z-10">
 *     <HeroContent />
 *   </div>
 * </EnhancedBackground>
 */
const EnhancedBackground = React.forwardRef<
  HTMLDivElement,
  EnhancedBackgroundProps
>(
  (
    {
      className,
      effect = "none",
      intensity = "medium",
      color = "#9b1c1c",
      respectReducedMotion = true,
      children,
      ...props
    },
    ref
  ) => {
    const [prefersReducedMotion, setPrefersReducedMotion] =
      React.useState(false)

    React.useEffect(() => {
      if (respectReducedMotion) {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mediaQuery.matches)

        const handleChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches)
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
      }
    }, [respectReducedMotion])

    // Don't render effects if user prefers reduced motion
    if (respectReducedMotion && prefersReducedMotion) {
      return (
        <div
          ref={ref}
          className={cn("relative overflow-hidden", className)}
          {...props}
        >
          {children}
        </div>
      )
    }

    const getIntensityProps = () => {
      switch (intensity) {
        case "low":
          return {
            opacity: 0.2,
            particleCount: 30,
            gridSize: 60,
          }
        case "high":
          return {
            opacity: 0.6,
            particleCount: 100,
            gridSize: 30,
          }
        default: // medium
          return {
            opacity: 0.4,
            particleCount: 60,
            gridSize: 40,
          }
      }
    }

    const intensityProps = getIntensityProps()

    const renderBackground = () => {
      switch (effect) {
        case "dots":
          return (
            <DotPattern
              className={cn(
                "absolute inset-0 h-full w-full",
                "[mask-image:radial-gradient(circle_at_center,white,transparent)]"
              )}
              width={intensityProps.gridSize}
              height={intensityProps.gridSize}
              cx={1}
              cy={1}
              cr={1}
              style={{
                opacity: intensityProps.opacity,
              }}
            />
          )

        case "grid":
          return (
            <FlickeringGrid
              className="absolute inset-0 h-full w-full"
              squareSize={intensityProps.gridSize / 10}
              gridGap={intensityProps.gridSize / 20}
              color={color}
              maxOpacity={intensityProps.opacity}
              flickerChance={0.3}
            />
          )

        case "retro":
          return (
            <RetroGrid
              className="absolute inset-0 h-full w-full"
              angle={65}
              style={{
                opacity: intensityProps.opacity,
                maskImage:
                  "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
              }}
            />
          )

        case "particles":
          return (
            <Particles
              className="absolute inset-0 h-full w-full"
              quantity={intensityProps.particleCount}
              ease={80}
              color={color}
              refresh={false}
              style={{
                opacity: intensityProps.opacity,
              }}
            />
          )

        case "none":
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {renderBackground()}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

EnhancedBackground.displayName = "EnhancedBackground"

export { EnhancedBackground }
