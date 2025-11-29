/**
 * Lazy MagicUI Components
 *
 * Conditional lazy loading utility for heavy MagicUI components.
 * These components are loaded on-demand to reduce initial bundle size.
 *
 * Usage:
 * Import from this file instead of directly from @/components/ui
 * when you need these components conditionally rendered.
 *
 * Performance Impact:
 * - Globe: ~50KB (3D rendering library)
 * - Particles: ~15KB (canvas animations)
 * - AnimatedGridPattern: ~10KB (complex animations)
 * - Meteors: ~8KB (canvas effects)
 * - BorderBeam: ~5KB (animation utilities)
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react';
 * import { Globe } from '@/lib/lazy-magicui';
 *
 * function HeroSection() {
 *   return (
 *     <Suspense fallback={<div className="h-[400px]" />}>
 *       <Globe />
 *     </Suspense>
 *   );
 * }
 * ```
 */

import { lazy } from 'react';

/**
 * Heavy 3D Globe component - only load when needed
 * Bundle impact: ~50KB
 */
export const Globe = lazy(() =>
  import('../components/ui/globe').then((m) => ({ default: m.Globe }))
);

/**
 * Particle effects component
 * Bundle impact: ~15KB
 */
export const Particles = lazy(() =>
  import('../components/ui/particles').then((m) => ({ default: m.Particles }))
);

/**
 * Animated grid pattern background
 * Bundle impact: ~10KB
 */
export const AnimatedGridPattern = lazy(() =>
  import('../components/ui/animated-grid-pattern').then((m) => ({
    default: m.AnimatedGridPattern,
  }))
);

/**
 * Retro grid background effect
 * Bundle impact: ~8KB
 */
export const RetroGrid = lazy(() =>
  import('../components/ui/retro-grid').then((m) => ({ default: m.RetroGrid }))
);

/**
 * Meteors animation effect
 * Bundle impact: ~8KB
 */
export const Meteors = lazy(() =>
  import('../components/ui/meteors').then((m) => ({ default: m.Meteors }))
);

/**
 * Border beam animation effect
 * Bundle impact: ~5KB
 */
export const BorderBeam = lazy(() =>
  import('../components/ui/border-beam').then((m) => ({
    default: m.BorderBeam,
  }))
);

/**
 * Shine border effect
 * Bundle impact: ~5KB
 */
export const ShineBorder = lazy(() =>
  import('../components/ui/shine-border').then((m) => ({
    default: m.ShineBorder,
  }))
);

/**
 * Dot pattern background
 * Bundle impact: ~4KB
 */
export const DotPattern = lazy(() =>
  import('../components/ui/dot-pattern').then((m) => ({
    default: m.DotPattern,
  }))
);

/**
 * Grid pattern background
 * Bundle impact: ~4KB
 */
export const GridPattern = lazy(() =>
  import('../components/ui/grid-pattern').then((m) => ({
    default: m.GridPattern,
  }))
);

/**
 * Ripple effect component
 * Bundle impact: ~6KB
 */
export const Ripple = lazy(() =>
  import('../components/ui/ripple').then((m) => ({ default: m.Ripple }))
);

/**
 * Neon gradient card with glow effect
 * Bundle impact: ~7KB
 */
export const NeonGradientCard = lazy(() =>
  import('../components/ui/neon-gradient-card').then((m) => ({
    default: m.NeonGradientCard,
  }))
);

/**
 * Magic card with hover effects
 * Bundle impact: ~6KB
 */
export const MagicCard = lazy(() =>
  import('../components/ui/magic-card').then((m) => ({ default: m.MagicCard }))
);

/**
 * Flickering grid background effect
 * Bundle impact: ~8KB
 */
export const FlickeringGrid = lazy(() =>
  import('../components/ui/flickering-grid').then((m) => ({
    default: m.FlickeringGrid,
  }))
);

/**
 * Type exports for lazy-loaded components
 * Note: Some components don't export their props types directly.
 * Use React.ComponentProps<typeof Component> to extract props when needed.
 *
 * @example
 * ```tsx
 * import { ComponentProps } from 'react';
 * import { Globe } from '@/lib/lazy-magicui';
 * type GlobeProps = ComponentProps<typeof Globe>;
 * ```
 */
export type { AnimatedGridPatternProps } from '../components/ui/animated-grid-pattern';

/**
 * Preload utility for critical components
 * Call this in useEffect to start loading components before they're needed
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   preloadMagicUIComponents(['Globe', 'Particles']);
 * }, []);
 * ```
 */
export function preloadMagicUIComponents(
  components: Array<
    | 'Globe'
    | 'Particles'
    | 'AnimatedGridPattern'
    | 'RetroGrid'
    | 'Meteors'
    | 'BorderBeam'
    | 'ShineBorder'
    | 'DotPattern'
    | 'GridPattern'
    | 'Ripple'
    | 'NeonGradientCard'
    | 'MagicCard'
    | 'FlickeringGrid'
  >
) {
  components.forEach((component) => {
    switch (component) {
      case 'Globe':
        import('../components/ui/globe');
        break;
      case 'Particles':
        import('../components/ui/particles');
        break;
      case 'AnimatedGridPattern':
        import('../components/ui/animated-grid-pattern');
        break;
      case 'RetroGrid':
        import('../components/ui/retro-grid');
        break;
      case 'Meteors':
        import('../components/ui/meteors');
        break;
      case 'BorderBeam':
        import('../components/ui/border-beam');
        break;
      case 'ShineBorder':
        import('../components/ui/shine-border');
        break;
      case 'DotPattern':
        import('../components/ui/dot-pattern');
        break;
      case 'GridPattern':
        import('../components/ui/grid-pattern');
        break;
      case 'Ripple':
        import('../components/ui/ripple');
        break;
      case 'NeonGradientCard':
        import('../components/ui/neon-gradient-card');
        break;
      case 'MagicCard':
        import('../components/ui/magic-card');
        break;
      case 'FlickeringGrid':
        import('../components/ui/flickering-grid');
        break;
    }
  });
}
