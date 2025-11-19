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
      // Allow 'any' type in auth package for:
      // 1. Supabase client types (to avoid circular dependencies)
      // 2. Middleware options (Next.js compatibility)
      // 3. Session management (browser/server compatibility)
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow require imports for dynamic imports in server/client context
      '@typescript-eslint/no-require-imports': 'off',

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

      // React hooks exhaustive deps - warn instead of error
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
