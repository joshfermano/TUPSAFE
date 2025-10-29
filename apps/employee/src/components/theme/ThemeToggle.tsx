'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          rounded-md border border-border bg-background
          hover:bg-accent hover:text-accent-foreground
          focus-tup
          transition-all duration-200 ease-in-out
          flex items-center justify-center
          ${className}
        `}
        aria-label={`Switch to ${
          resolvedTheme === 'light' ? 'dark' : 'light'
        } theme`}>
        {resolvedTheme === 'light' ? (
          <Moon size={iconSize[size]} />
        ) : (
          <Sun size={iconSize[size]} />
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <select
          value={theme}
          onChange={(e) =>
            setTheme(e.target.value as 'light' | 'dark' | 'system')
          }
          className={`
            ${sizeClasses[size]}
            pl-10 pr-8 py-2
            bg-background border border-border rounded-md
            text-foreground
            focus-tup
            hover:bg-accent
            transition-all duration-200 ease-in-out
            appearance-none cursor-pointer
          `}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {theme === 'light' && (
            <Sun size={iconSize[size]} className="text-muted-foreground" />
          )}
          {theme === 'dark' && (
            <Moon size={iconSize[size]} className="text-muted-foreground" />
          )}
          {theme === 'system' && (
            <Monitor size={iconSize[size]} className="text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center rounded-md border border-border bg-background p-1">
        {(['light', 'dark', 'system'] as const).map((themeName) => {
          const isActive = theme === themeName;
          const Icon =
            themeName === 'light' ? Sun : themeName === 'dark' ? Moon : Monitor;

          return (
            <button
              key={themeName}
              onClick={() => setTheme(themeName)}
              className={`
                ${sizeClasses[size]}
                rounded-sm px-2
                transition-all duration-200 ease-in-out
                focus-tup
                flex items-center justify-center gap-2
                ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
              aria-label={`Switch to ${themeName} theme`}>
              <Icon size={iconSize[size]} />
              {showLabel && (
                <span className="capitalize text-xs font-medium">
                  {themeName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;
