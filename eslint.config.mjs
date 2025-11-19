import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '.turbo/**',
      '*.tsbuildinfo',
      'next-env.d.ts',
      '**/next-env.d.ts',
      // Package-specific ignores
      'packages/*/dist/**',
      'packages/*/.next/**',
      'packages/*/.turbo/**',
      'packages/*/next-env.d.ts',
      // App-specific ignores
      'apps/*/.next/**',
      'apps/*/out/**',
      'apps/*/.turbo/**',
      'apps/*/next-env.d.ts',
    ],
  },
  {
    rules: {
      // Allow 'any' type in specific cases where it's intentional
      // These are typically for error handling, dynamic types, or library compatibility
      // Set to warning instead of error to not block CI, but still notify developers
      '@typescript-eslint/no-explicit-any': 'warn',

      // Unused variables - use underscore prefix for intentionally unused
      // Set to warning during development to not block builds, fix during cleanup
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
