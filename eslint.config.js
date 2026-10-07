import js from '@eslint/js'
import _import from 'eslint-plugin-import'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'

export default defineConfig([
  {
    ignores: [
      '**/.next',
      '**/coverage',
      '**/dist',
      '**/generated',
      '**/playwright-report',
      '**/storybook-static',
      '**/test-results',
    ],
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { globals: globals.commonjs },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    languageOptions: { globals: globals.browser },
  },

  js.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-rename': 'error',
      'object-shorthand': ['error', 'always'],
    },
  },

  ts.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  {
    plugins: { 'import': _import },
    rules: {
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external', 'internal']],
          pathGroups: [{ pattern: '{#*,#*/**,@/**}', group: 'internal' }],
        },
      ],
    },
  },
])
