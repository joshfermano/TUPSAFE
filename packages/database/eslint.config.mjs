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
      // Allow 'any' type in specific justified cases:
      // 1. Realtime hooks: SupabaseClient type to avoid circular dependencies with @tupsafe/auth
      // 2. Error handlers: Catch blocks where error type is unknown
      // 3. Audit logging: Generic metadata and changes objects
      // 4. Test utilities: Dynamic test data
      '@typescript-eslint/no-explicit-any': 'off',

      // Unused variables - use underscore prefix for intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Disable Pages directory check for non-Next.js packages
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default eslintConfig;
