/**
 * Animation utilities for optimizing performance and accessibility
 * These helpers adjust animation parameters based on device capabilities and user preferences
 */

/**
 * Calculates optimal particle count based on device capabilities
 * Reduces particle count significantly on mobile devices to improve performance
 *
 * @param baseCount - The base particle count for desktop
 * @param isMobile - Whether the device is mobile (optional)
 * @returns Adjusted particle count
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const particleCount = getParticleCount(100, isMobile);
 *
 * <Particles quantity={particleCount} />
 * ```
 */
export const getParticleCount = (baseCount: number, isMobile = false): number => {
  if (isMobile) {
    // Reduce to 30% on mobile for better performance
    return Math.floor(baseCount * 0.3);
  }
  return baseCount;
};

/**
 * Calculates optimal grid pattern square count based on device capabilities
 * Reduces grid complexity on mobile devices to improve rendering performance
 *
 * @param baseCount - The base square count for desktop
 * @param isMobile - Whether the device is mobile (optional)
 * @returns Adjusted square count
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const squareCount = getGridSquares(50, isMobile);
 *
 * <AnimatedGridPattern numSquares={squareCount} />
 * ```
 */
export const getGridSquares = (baseCount: number, isMobile = false): number => {
  if (isMobile) {
    // Reduce to 50% on mobile for better performance
    return Math.floor(baseCount * 0.5);
  }
  return baseCount;
};

/**
 * Determines if animations should be enabled based on user's reduced motion preference
 * Respects accessibility settings for users who prefer reduced motion
 *
 * @param reducedMotion - Whether the user prefers reduced motion
 * @returns Whether animations should be enabled
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const animate = shouldAnimate(reducedMotion);
 *
 * <motion.div
 *   animate={animate ? { y: -10 } : {}}
 *   transition={animate ? { duration: 0.3 } : { duration: 0 }}
 * />
 * ```
 */
export const shouldAnimate = (reducedMotion: boolean): boolean => {
  return !reducedMotion;
};

/**
 * Gets animation duration adjusted for reduced motion preference
 * Returns 0 duration if reduced motion is preferred, maintaining smooth UX without motion
 *
 * @param baseDuration - The base animation duration in seconds
 * @param reducedMotion - Whether the user prefers reduced motion
 * @returns Adjusted duration
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const duration = getAnimationDuration(0.5, reducedMotion);
 *
 * <motion.div
 *   transition={{ duration }}
 * />
 * ```
 */
export const getAnimationDuration = (baseDuration: number, reducedMotion: boolean): number => {
  return reducedMotion ? 0 : baseDuration;
};

/**
 * Gets transition configuration adjusted for reduced motion preference
 * Returns instant transition if reduced motion is preferred
 *
 * @param baseTransition - The base transition configuration
 * @param reducedMotion - Whether the user prefers reduced motion
 * @returns Adjusted transition configuration
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const transition = getTransition({ duration: 0.5, ease: "easeOut" }, reducedMotion);
 *
 * <motion.div transition={transition} />
 * ```
 */
export const getTransition = (
  baseTransition: Record<string, unknown>,
  reducedMotion: boolean
): Record<string, unknown> => {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return baseTransition;
};

/**
 * Gets animation variants adjusted for reduced motion preference
 * Returns static states if reduced motion is preferred
 *
 * @param variants - Animation variants object
 * @param reducedMotion - Whether the user prefers reduced motion
 * @returns Adjusted variants
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const variants = getAnimationVariants({
 *   hidden: { opacity: 0, y: 20 },
 *   visible: { opacity: 1, y: 0 }
 * }, reducedMotion);
 *
 * <motion.div variants={variants} />
 * ```
 */
export const getAnimationVariants = (
  variants: Record<string, Record<string, unknown>>,
  reducedMotion: boolean
): Record<string, Record<string, unknown>> => {
  if (reducedMotion) {
    // Remove transform properties but keep opacity for fade effects
    const reducedVariants: Record<string, Record<string, unknown>> = {};
    Object.keys(variants).forEach((key) => {
      const variant = variants[key];
      reducedVariants[key] = {
        opacity: variant.opacity ?? 1,
        // Remove all transform properties
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
      };
    });
    return reducedVariants;
  }
  return variants;
};
