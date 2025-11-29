/**
 * PDF Font Registration for @react-pdf/renderer
 *
 * Uses Roboto fonts from @fontsource/roboto package
 * Font files should be copied to the app's public/fonts directory
 *
 * No CDN dependencies - fonts are served locally
 */

import { Font } from '@react-pdf/renderer';

/**
 * Default font paths (relative to public directory)
 * These fonts should be copied from @fontsource/roboto/files/
 */
export const DEFAULT_FONT_PATHS = {
  regular: '/fonts/roboto-latin-400-normal.woff',
  bold: '/fonts/roboto-latin-700-normal.woff',
  italic: '/fonts/roboto-latin-400-italic.woff',
  boldItalic: '/fonts/roboto-latin-700-italic.woff',
} as const;

export interface FontPaths {
  regular: string;
  bold: string;
  italic: string;
  boldItalic: string;
}

/**
 * Register Roboto font family for PDF generation
 *
 * @param baseUrl - Base URL for font files (e.g., 'http://localhost:3000' or window.location.origin)
 * @param fontPaths - Custom font paths (defaults to /fonts/roboto-*.woff)
 */
export function registerPDFFonts(
  baseUrl: string = '',
  fontPaths: FontPaths = DEFAULT_FONT_PATHS
): void {
  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: `${baseUrl}${fontPaths.regular}`,
        fontWeight: 'normal',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}${fontPaths.bold}`,
        fontWeight: 'bold',
        fontStyle: 'normal',
      },
      {
        src: `${baseUrl}${fontPaths.italic}`,
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
      {
        src: `${baseUrl}${fontPaths.boldItalic}`,
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
    ],
  });

  // Disable hyphenation for better control over text layout
  Font.registerHyphenationCallback((word) => [word]);
}

// Track if fonts have been registered
let fontsRegistered = false;

/**
 * Ensure fonts are registered (idempotent)
 * Safe to call multiple times - will only register once
 *
 * @param baseUrl - Base URL for font files
 * @param fontPaths - Custom font paths
 */
export function ensurePDFFontsRegistered(
  baseUrl: string = '',
  fontPaths: FontPaths = DEFAULT_FONT_PATHS
): void {
  if (!fontsRegistered) {
    registerPDFFonts(baseUrl, fontPaths);
    fontsRegistered = true;
  }
}

/**
 * Reset font registration state (useful for testing)
 */
export function resetFontRegistration(): void {
  fontsRegistered = false;
}

export default registerPDFFonts;
