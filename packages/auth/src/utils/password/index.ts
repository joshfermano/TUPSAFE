/**
 * Password Utilities
 * Handles password generation, validation, and strength checking
 */

import crypto from 'crypto';

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Generate a secure temporary password
 * @param length - Length of password (default: 16)
 */
export function generateTemporaryPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = PASSWORD_REQUIREMENTS.specialChars;

  // Ensure at least one of each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters from all types
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to randomize position of required characters
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Validate password strength against requirements
 * @param password - Password to validate
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
    );
  } else {
    score += 25;
  }

  // Check uppercase
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 25;
  }

  // Check lowercase
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 25;
  }

  // Check numbers
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // Check special characters
  const specialCharsRegex = new RegExp(
    `[${PASSWORD_REQUIREMENTS.specialChars.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )}]`
  );
  if (
    PASSWORD_REQUIREMENTS.requireSpecialChar &&
    !specialCharsRegex.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  } else if (specialCharsRegex.test(password)) {
    score += 10;
  }

  // Bonus points for extra length
  if (password.length >= 16) {
    score += 10;
  }
  if (password.length >= 20) {
    score += 10;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 80) {
    strength = 'strong';
  } else if (score >= 60) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Check for common weak passwords
 * @param password - Password to check
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'qwerty123',
    'abc123',
    'password1',
    'password12',
    'welcome',
    'welcome123',
    'admin',
    'admin123',
    'letmein',
    'monkey',
    'dragon',
    'baseball',
    'iloveyou',
    'trustno1',
    'sunshine',
    'princess',
  ];

  const lowerPassword = password.toLowerCase();
  return commonPasswords.some((common) => lowerPassword.includes(common));
}

/**
 * Generate password strength indicator text
 * @param strength - Password strength level
 */
export function getStrengthText(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return 'Weak - Not recommended';
    case 'medium':
      return 'Medium - Good';
    case 'strong':
      return 'Strong - Excellent';
  }
}

/**
 * Generate password strength color for UI
 * @param strength - Password strength level
 */
export function getStrengthColor(
  strength: 'weak' | 'medium' | 'strong'
): string {
  switch (strength) {
    case 'weak':
      return '#ef4444'; // Red
    case 'medium':
      return '#f59e0b'; // Orange
    case 'strong':
      return '#10b981'; // Green
  }
}

/**
 * Hash password for storage (using crypto)
 * Note: In production, use bcrypt or argon2 for better security
 * This is a placeholder for demonstration
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against hash
 * Note: This is a placeholder - use bcrypt.compare in production
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Calculate password entropy (bits)
 * @param password - Password to analyze
 */
export function calculatePasswordEntropy(password: string): number {
  let charSpace = 0;

  if (/[a-z]/.test(password)) charSpace += 26;
  if (/[A-Z]/.test(password)) charSpace += 26;
  if (/[0-9]/.test(password)) charSpace += 10;
  if (specialCharsRegex.test(password))
    charSpace += PASSWORD_REQUIREMENTS.specialChars.length;

  const entropy = Math.log2(Math.pow(charSpace, password.length));
  return Math.round(entropy);
}

// Helper regex for special chars
const specialCharsRegex = new RegExp(
  `[${PASSWORD_REQUIREMENTS.specialChars.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  )}]`
);

/**
 * Alias for generateTemporaryPassword for convenience
 */
export const generatePassword = generateTemporaryPassword;
