import eslint from '@eslint/js'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: [
      'esm/**/*',
      'dist/**/*',
      'esm_*/*',
      '*.js',
      '*.mjs',
      'example/*',
      'src/htscodecs',
      'benchmarks/*',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.lint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginUnicorn.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    rules: {
      'no-underscore-dangle': 'off',
      curly: 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'unicorn/text-encoding-identifier-case': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/number-literal-case': 'off',
      'unicorn/no-new-array': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }],
      '@typescript-eslint/restrict-template-expressions': 'off',

      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          named: true,
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
          groups: [
            'builtin',
            ['external', 'internal'],
            ['parent', 'sibling', 'index', 'object'],
            'type',
          ],
        },
      ],
    },
  },
)
