'use client';

import React from 'react';
import { useTheme, ThemeToggle } from '@/components/theme';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * ThemeDemo component showcasing all TUPSAFE theme features
 *
 * This component demonstrates:
 * - Theme state management
 * - Custom government blue colors
 * - Various theme toggle variants
 * - Gradient utilities
 * - Professional UI components
 * - Accessibility features
 */
export const ThemeDemo: React.FC = () => {
  const { theme, resolvedTheme, systemTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-government">
            TUPSAFE Theme System
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A comprehensive theme system for the Philippine Government e-PDS and
            e-SALN compliance platform. Features government blue (#093FB4)
            branding, accessibility compliance, and seamless dark mode support.
          </p>
        </div>

        {/* Theme Status */}
        <Card className="bg-gradient-government-soft border-border/50">
          <CardHeader>
            <CardTitle className="text-government">
              Current Theme Status
            </CardTitle>
            <CardDescription>
              Live theme information and system preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Selected Theme
                </label>
                <Badge variant="outline" className="w-full justify-center py-2">
                  {theme}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Resolved Theme
                </label>
                <Badge
                  variant={resolvedTheme === 'dark' ? 'default' : 'secondary'}
                  className="w-full justify-center py-2">
                  {resolvedTheme}
                </Badge>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  System Preference
                </label>
                <Badge variant="outline" className="w-full justify-center py-2">
                  {systemTheme}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Controls</CardTitle>
            <CardDescription>
              Different ways to control the theme system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Button Variant</h3>
                <ThemeToggle variant="button" showLabel />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Dropdown Variant</h3>
                <ThemeToggle variant="dropdown" />
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Minimal Variant</h3>
                <div className="flex gap-2">
                  <ThemeToggle variant="minimal" size="sm" />
                  <ThemeToggle variant="minimal" size="md" />
                  <ThemeToggle variant="minimal" size="lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Government Blue Color Palette</CardTitle>
            <CardDescription>
              Custom OKLCH colors based on Philippine Government Blue (#093FB4)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-primary border-2 border-border"></div>
                <div className="text-center">
                  <div className="font-medium text-sm">Primary</div>
                  <div className="text-xs text-muted-foreground">
                    oklch(0.38 0.2 260)
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-secondary border-2 border-border"></div>
                <div className="text-center">
                  <div className="font-medium text-sm">Secondary</div>
                  <div className="text-xs text-muted-foreground">
                    Blue-tinted gray
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-accent border-2 border-border"></div>
                <div className="text-center">
                  <div className="font-medium text-sm">Accent</div>
                  <div className="text-xs text-muted-foreground">
                    Light blue highlight
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-muted border-2 border-border"></div>
                <div className="text-center">
                  <div className="font-medium text-sm">Muted</div>
                  <div className="text-xs text-muted-foreground">
                    Subtle blue-gray
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gradient Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Gradient Effects</CardTitle>
            <CardDescription>
              Custom gradient utilities for government branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-md bg-gradient-government flex items-center justify-center text-white font-semibold">
                  Government Gradient
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  .bg-gradient-government
                </p>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-md bg-gradient-government-soft flex items-center justify-center font-semibold">
                  Soft Government Gradient
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  .bg-gradient-government-soft
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Glass Effect */}
        <Card>
          <CardHeader>
            <CardTitle>Glass Effect</CardTitle>
            <CardDescription>
              Premium glass morphism effect with government blue tinting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-32 bg-gradient-government rounded-lg overflow-hidden">
              <div className="absolute inset-4 glass-government rounded-lg flex items-center justify-center">
                <span className="font-semibold text-foreground">
                  Glass Effect with Government Blue
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Government Button Styles</CardTitle>
            <CardDescription>
              Professional button variants for government applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="btn-government">Primary Action</Button>
              <Button className="btn-government-outline">
                Secondary Action
              </Button>
              <Button className="btn-government-ghost">Ghost Action</Button>
              <Button variant="destructive">Destructive Action</Button>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Features</CardTitle>
            <CardDescription>
              WCAG 2.1 AA compliant design with proper focus states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Focus States</h4>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left border rounded focus-government">
                    Focusable Element 1
                  </button>
                  <button className="w-full px-4 py-2 text-left border rounded focus-government">
                    Focusable Element 2
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Color Contrast</h4>
                <div className="space-y-2">
                  <p className="text-foreground">
                    Primary text (high contrast)
                  </p>
                  <p className="text-muted-foreground">
                    Secondary text (medium contrast)
                  </p>
                  <p className="text-government">Government blue text</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animation Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Smooth Animations</CardTitle>
            <CardDescription>
              Performant animations that respect user preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="animate-fade-in p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Fade In Animation</h4>
                <p className="text-sm text-muted-foreground">
                  Smooth fade-in effect for content loading
                </p>
              </div>
              <div className="animate-slide-up p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Slide Up Animation</h4>
                <p className="text-sm text-muted-foreground">
                  Elegant slide-up motion for UI elements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Info */}
        <Card className="border-government/20">
          <CardHeader>
            <CardTitle className="text-government">Integration Guide</CardTitle>
            <CardDescription>
              How to integrate the theme system into your TUPSAFE application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">
                1. Wrap your app with ThemeProvider
              </h4>
              <code className="block p-3 bg-muted rounded text-sm">
                {`import { ThemeWrapper } from '@/components/theme';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  );
}`}
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">
                2. Use the theme hook in components
              </h4>
              <code className="block p-3 bg-muted rounded text-sm">
                {`import { useTheme } from '@/components/theme';

export function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return <div>Current theme: {resolvedTheme}</div>;
}`}
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Add theme toggle controls</h4>
              <code className="block p-3 bg-muted rounded text-sm">
                {`import { ThemeToggle } from '@/components/theme';

export function Header() {
  return (
    <header>
      <ThemeToggle variant="button" showLabel />
    </header>
  );
}`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeDemo;
