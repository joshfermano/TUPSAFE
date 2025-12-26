'use client';

import * as React from 'react';

import { cn } from '../../lib/utils';

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#8B1538" (TUP Manila Crimson)
   */
  shineColor?: string | string[];
  /**
   * Children to render inside the bordered container
   */
  children?: React.ReactNode;
}

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 * Wraps children in a container with an animated gradient border.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = '#8B1538',
  className,
  style,
  children,
  ...props
}: ShineBorderProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl bg-slate-900/5 dark:bg-slate-800/50',
        className
      )}
      style={style}
      {...props}
    >
      {/* Animated border effect */}
      <div
        style={
          {
            '--border-width': `${borderWidth}px`,
            '--duration': `${duration}s`,
            backgroundImage: `radial-gradient(transparent,transparent, ${
              Array.isArray(shineColor) ? shineColor.join(',') : shineColor
            },transparent,transparent)`,
            backgroundSize: '300% 300%',
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: 'var(--border-width)',
          } as React.CSSProperties
        }
        className="motion-safe:animate-shine pointer-events-none absolute inset-0 size-full rounded-[inherit] will-change-[background-position]"
      />
      {/* Content */}
      {children}
    </div>
  );
}
