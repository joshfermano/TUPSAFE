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
    ignores: ['node_modules/**', 'dist/**', '.turbo/**', '*.tsbuildinfo'],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // Allow 'any' type in mock-data package for:
      // 1. Mock utilities and test data generators
      // 2. API response mocking
      '@typescript-eslint/no-explicit-any': 'off',

      // Disable Pages directory check for non-Next.js packages
      '@next/next/no-html-link-for-pages': 'off',

      // Unused variables - use underscore prefix for intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'error',
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
