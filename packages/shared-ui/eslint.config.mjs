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
      'dist/**',
      '.turbo/**',
      '*.tsbuildinfo',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Allow 'any' type in UI components where needed for:
      // 1. Polymorphic component props (e.g., 'as' prop)
      // 2. Third-party library compatibility
      // 3. Generic utility functions
      '@typescript-eslint/no-explicit-any': 'off',

      // Unused variables - use underscore prefix for intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Disable Pages directory check for non-Next.js packages
      '@next/next/no-html-link-for-pages': 'off',

      // React hooks exhaustive deps - warn instead of error for complex dependencies
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
