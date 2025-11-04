'use client';

import { useMemo } from 'react';
import { useResolvedTheme } from './useOptimizedTheme';
import type { ResolvedTheme } from '@/context/ThemeContext';

/**
 * TUP Manila Color Palette Interface
 *
 * All colors are in OKLCH format for perceptually uniform color transitions
 * and better dark mode support.
 */
export interface TUPColors {
  /** TUP Manila primary crimson color */
  primary: string;
  /** Primary foreground color (text on primary background) */
  primaryForeground: string;
  /** TUP Manila secondary crimson (slightly darker) */
  secondary: string;
  /** Secondary foreground color */
  secondaryForeground: string;
  /** TUP crimson main color - same as primary */
  tupCrimson: string;
  /** Lighter shade of TUP crimson for accents */
  tupCrimsonLight: string;
  /** Darker shade of TUP crimson for depth */
  tupCrimsonDark: string;
  /** Very subtle crimson for backgrounds */
  tupCrimsonSubtle: string;
  /** Accent color for highlights */
  accent: string;
  /** Accent foreground color */
  accentForeground: string;
  /** Muted background color */
  muted: string;
  /** Muted foreground color (less prominent text) */
  mutedForeground: string;
  /** Background color */
  background: string;
  /** Foreground color (main text) */
  foreground: string;
  /** Card background color */
  card: string;
  /** Card foreground color */
  cardForeground: string;
  /** Border color */
  border: string;
  /** Input border color */
  input: string;
  /** Focus ring color */
  ring: string;
  /** Destructive/error color */
  destructive: string;
  /** Destructive foreground color */
  destructiveForeground: string;
}

/**
 * TUP Manila Gradient Definitions
 */
export interface TUPGradients {
  /** Primary TUP crimson gradient (135deg) */
  primary: string;
  /** Soft gradient for subtle backgrounds */
  soft: string;
  /** Radial gradient for spotlight effects */
  radial: string;
}

/**
 * Complete TUP Manila Color System
 */
export interface TUPColorSystem {
  /** Solid colors */
  colors: TUPColors;
  /** Gradient definitions */
  gradients: TUPGradients;
  /** Current theme (light or dark) */
  theme: ResolvedTheme;
}

/**
 * Light mode color definitions (TUP Manila Crimson #DC143C)
 */
const LIGHT_COLORS: TUPColors = {
  // Primary Colors - TUP Manila Crimson
  primary: 'oklch(0.55 0.22 15)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.45 0.18 15)',
  secondaryForeground: 'oklch(0.985 0 0)',

  // TUP Crimson Variants
  tupCrimson: 'oklch(0.55 0.22 15)',
  tupCrimsonLight: 'oklch(0.65 0.18 15)',
  tupCrimsonDark: 'oklch(0.42 0.20 15)',
  tupCrimsonSubtle: 'oklch(0.95 0.08 15)',

  // Accent & Muted
  accent: 'oklch(0.95 0.08 15)',
  accentForeground: 'oklch(0.25 0.18 15)',
  muted: 'oklch(0.97 0.005 0)',
  mutedForeground: 'oklch(0.556 0.02 0)',

  // Base Colors
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  cardForeground: 'oklch(0.145 0 0)',

  // UI Elements
  border: 'oklch(0.922 0.01 0)',
  input: 'oklch(0.922 0.01 0)',
  ring: 'oklch(0.55 0.22 15)',

  // Destructive
  destructive: 'oklch(0.577 0.245 27.325)',
  destructiveForeground: 'oklch(0.985 0 0)',
};

/**
 * Dark mode color definitions (Enhanced TUP Manila Crimson)
 */
const DARK_COLORS: TUPColors = {
  // Primary Colors - Brighter crimson for dark mode contrast
  primary: 'oklch(0.65 0.24 15)',
  primaryForeground: 'oklch(0.985 0 0)',
  secondary: 'oklch(0.50 0.18 15)',
  secondaryForeground: 'oklch(0.985 0 0)',

  // TUP Crimson Variants for dark mode
  tupCrimson: 'oklch(0.65 0.24 15)',
  tupCrimsonLight: 'oklch(0.75 0.20 15)',
  tupCrimsonDark: 'oklch(0.50 0.20 15)',
  tupCrimsonSubtle: 'oklch(0.40 0.12 15)',

  // Accent & Muted
  accent: 'oklch(0.40 0.12 15)',
  accentForeground: 'oklch(0.985 0 0)',
  muted: 'oklch(0.269 0.01 0)',
  mutedForeground: 'oklch(0.708 0.02 0)',

  // Base Colors
  background: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.985 0 0)',
  card: 'oklch(0.205 0 0)',
  cardForeground: 'oklch(0.985 0 0)',

  // UI Elements
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.65 0.24 15)',

  // Destructive
  destructive: 'oklch(0.704 0.191 22.216)',
  destructiveForeground: 'oklch(0.985 0 0)',
};

/**
 * Light mode gradients
 */
const LIGHT_GRADIENTS: TUPGradients = {
  primary: 'linear-gradient(135deg, oklch(0.55 0.22 15) 0%, oklch(0.40 0.18 15) 100%)',
  soft: 'linear-gradient(135deg, oklch(0.95 0.08 15) 0%, oklch(0.97 0.01 0) 100%)',
  radial: 'radial-gradient(circle at 50% 50%, oklch(0.55 0.22 15 / 0.15) 0%, transparent 70%)',
};

/**
 * Dark mode gradients
 */
const DARK_GRADIENTS: TUPGradients = {
  primary: 'linear-gradient(135deg, oklch(0.65 0.24 15) 0%, oklch(0.50 0.20 15) 100%)',
  soft: 'linear-gradient(135deg, oklch(0.40 0.12 15) 0%, oklch(0.269 0.01 0) 100%)',
  radial: 'radial-gradient(circle at 50% 50%, oklch(0.65 0.24 15 / 0.15) 0%, transparent 70%)',
};

/**
 * Theme-aware TUP Manila color system hook
 *
 * Returns the complete TUP Manila color palette optimized for the current theme.
 * All colors automatically adjust between light and dark modes.
 *
 * Benefits:
 * - Single source of truth for TUP Manila colors
 * - Automatic theme-aware color switching
 * - Memoized to prevent recalculation
 * - Type-safe color access
 * - Includes both solid colors and gradients
 *
 * @returns Complete TUP color system with colors, gradients, and current theme
 *
 * @example
 * ```tsx
 * function TUPBrandedCard() {
 *   const { colors, gradients } = useColors();
 *
 *   return (
 *     <div
 *       style={{
 *         background: gradients.primary,
 *         color: colors.primaryForeground,
 *         border: `1px solid ${colors.border}`,
 *       }}
 *     >
 *       <h2 style={{ color: colors.tupCrimson }}>TUP Manila</h2>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Use with Tailwind CSS custom properties
 * function CustomStyledButton() {
 *   const { colors } = useColors();
 *
 *   return (
 *     <button
 *       style={{
 *         backgroundColor: colors.primary,
 *         color: colors.primaryForeground,
 *       }}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useColors(): TUPColorSystem {
  const theme = useResolvedTheme();

  // Memoize color system to prevent recalculation on every render
  return useMemo(
    () => ({
      colors: theme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
      gradients: theme === 'dark' ? DARK_GRADIENTS : LIGHT_GRADIENTS,
      theme,
    }),
    [theme]
  );
}

/**
 * Hook that returns only the color values without gradients
 *
 * Use this for simpler use cases where you only need solid colors.
 *
 * @returns Theme-aware TUP Manila colors
 *
 * @example
 * ```tsx
 * function SimpleCard() {
 *   const colors = useTUPColors();
 *   return (
 *     <div style={{ backgroundColor: colors.card, color: colors.cardForeground }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useTUPColors(): TUPColors {
  const theme = useResolvedTheme();
  return useMemo(
    () => (theme === 'dark' ? DARK_COLORS : LIGHT_COLORS),
    [theme]
  );
}

/**
 * Hook that returns only gradient definitions
 *
 * Use this when you only need gradient values.
 *
 * @returns Theme-aware TUP Manila gradients
 *
 * @example
 * ```tsx
 * function GradientHero() {
 *   const gradients = useTUPGradients();
 *   return (
 *     <section style={{ background: gradients.primary }}>
 *       Hero content
 *     </section>
 *   );
 * }
 * ```
 */
export function useTUPGradients(): TUPGradients {
  const theme = useResolvedTheme();
  return useMemo(
    () => (theme === 'dark' ? DARK_GRADIENTS : LIGHT_GRADIENTS),
    [theme]
  );
}

/**
 * Export color constants for non-hook usage (server components, utilities, etc.)
 */
export { LIGHT_COLORS, DARK_COLORS, LIGHT_GRADIENTS, DARK_GRADIENTS };
