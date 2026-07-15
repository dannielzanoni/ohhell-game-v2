import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'coverage/**',
    'dist/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended, prettier],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/shared/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/devtools/**', '@/features/**', '@/games/**'],
              message: 'shared deve permanecer independente de app, features, games e devtools.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/devtools/**'],
              message:
                'features não devem depender da composição da aplicação ou de ferramentas dev.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/core/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**',
                '@/devtools/**',
                '@/games/classic/**',
                '@/games/hell-hand/**',
                '@/games/session/**',
              ],
              message: 'games/core deve ser independente das variantes e da camada de composição.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/classic/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/devtools/**', '@/games/hell-hand/**'],
              message: 'classic não deve depender de app, devtools ou hell-hand.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/games/hell-hand/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/devtools/**', '@/games/classic/**'],
              message: 'hell-hand não deve depender de app, devtools ou classic.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/**/routes.jsx',
      'src/features/auth/components/AvatarEditModal.jsx',
      'src/features/notifications/ToastProvider.jsx',
      'src/features/theme/ThemeProvider.jsx',
      'src/games/hell-hand/components/LuaStudioFrame.jsx',
      'src/games/session/GameSessionPage.jsx',
      'src/shared/ui/button.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]);
