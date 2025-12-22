/**
 * User Agent Parser Utility
 *
 * Parses user agent strings to extract browser, OS, and device type information.
 * Uses lightweight pattern matching instead of heavy libraries for better performance.
 *
 * @module lib/user-agent-parser
 */

/**
 * Parsed user agent information
 */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
  full: string;
}

/**
 * Parse a user agent string and extract device information
 *
 * Extracts browser name/version, operating system, and device type from
 * the user agent string using pattern matching. Falls back to generic
 * values if specific details cannot be determined.
 *
 * @param userAgent - Raw user agent string from request headers
 * @returns ParsedUserAgent object with browser, OS, device, and full UA
 *
 * @example
 * const parsed = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
 * console.log(parsed.browser); // "Chrome 120.0"
 * console.log(parsed.os); // "Windows 10"
 * console.log(parsed.device); // "Desktop"
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  if (!userAgent || typeof userAgent !== 'string') {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown',
      full: userAgent || 'Unknown',
    };
  }

  const ua = userAgent;

  // Parse Browser
  let browser = 'Unknown';

  // Edge (Chromium-based, must check before Chrome)
  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
    browser = version ? `Edge ${version}` : 'Edge';
  }
  // Chrome
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
    browser = version ? `Chrome ${version}` : 'Chrome';
  }
  // Firefox
  else if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
    browser = version ? `Firefox ${version}` : 'Firefox';
  }
  // Safari (must check after Chrome due to Safari in Chrome UA)
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
    browser = version ? `Safari ${version}` : 'Safari';
  }
  // Opera
  else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    const version = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || '';
    browser = version ? `Opera ${version}` : 'Opera';
  }
  // Internet Explorer
  else if (ua.includes('MSIE') || ua.includes('Trident/')) {
    const version = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/)?.[1] || '';
    browser = version ? `IE ${version}` : 'IE';
  }

  // Parse Operating System
  let os = 'Unknown';

  // Windows
  if (ua.includes('Windows NT 10.0')) {
    os = 'Windows 10';
  } else if (ua.includes('Windows NT 11.0')) {
    os = 'Windows 11';
  } else if (ua.includes('Windows NT 6.3')) {
    os = 'Windows 8.1';
  } else if (ua.includes('Windows NT 6.2')) {
    os = 'Windows 8';
  } else if (ua.includes('Windows NT 6.1')) {
    os = 'Windows 7';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  }
  // macOS
  else if (ua.includes('Mac OS X')) {
    const version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    os = version ? `macOS ${version}` : 'macOS';
  }
  // iOS
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
    const version = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    os = version ? `iOS ${version}` : 'iOS';
  }
  // Android
  else if (ua.includes('Android')) {
    const version = ua.match(/Android (\d+\.\d+)/)?.[1] || '';
    os = version ? `Android ${version}` : 'Android';
  }
  // Linux
  else if (ua.includes('Linux')) {
    os = 'Linux';
  }
  // Chrome OS
  else if (ua.includes('CrOS')) {
    os = 'Chrome OS';
  }

  // Parse Device Type
  let device = 'Desktop';

  // Mobile devices
  if (ua.includes('Mobile') || ua.includes('Android')) {
    device = 'Mobile';
  }
  // Tablets
  else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  }
  // Check for common mobile keywords
  else if (
    /iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  ) {
    device = 'Mobile';
  }

  return {
    browser,
    os,
    device,
    full: ua,
  };
}

/**
 * Format parsed user agent for human-readable display
 *
 * Creates a concise, user-friendly description of the device and browser.
 * Useful for displaying in session lists or security logs.
 *
 * @param parsed - Parsed user agent object
 * @returns Formatted string description
 *
 * @example
 * const parsed = parseUserAgent(req.headers['user-agent']);
 * const formatted = formatUserAgent(parsed);
 * console.log(formatted); // "Chrome 120.0 on Windows 10"
 */
export function formatUserAgent(parsed: ParsedUserAgent): string {
  return `${parsed.browser} on ${parsed.os}`;
}

/**
 * Create a device fingerprint from IP address and user agent
 *
 * Generates a simple hash-like identifier for device tracking and recognition.
 * This is NOT cryptographically secure but sufficient for device identification.
 *
 * @param ipAddress - Client IP address
 * @param userAgent - User agent string
 * @returns Device fingerprint string
 *
 * @example
 * const fingerprint = createDeviceFingerprint('192.168.1.1', req.headers['user-agent']);
 * console.log(fingerprint); // "fp_abc123def456"
 */
export function createDeviceFingerprint(
  ipAddress: string,
  userAgent: string
): string {
  if (!ipAddress || !userAgent) {
    return 'fp_unknown';
  }

  // Simple string hashing (not cryptographic)
  const combined = `${ipAddress}_${userAgent}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to hex and take first 12 characters
  const hexHash = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  return `fp_${hexHash}`;
}
