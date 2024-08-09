import eslint from '@eslint/js'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'esm/**/*',
      'dist/**/*',
      '*.js',
      '*.mjs',
      'example/*',
      'src/htscodecs',
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
  eslintPluginUnicorn.configs['flat/recommended'],
  {
    rules: {
      'no-underscore-dangle': 0,
      curly: 'error',
      'unicorn/no-useless-undefined': 0,
      'unicorn/prefer-node-protocol': 0,
      'unicorn/filename-case': 0,
      'unicorn/numeric-separators-style': 0,
      'unicorn/number-literal-case': 0,
      'unicorn/no-new-array': 0,
      'unicorn/no-array-for-each': 0,
      'unicorn/prevent-abbreviations': 0,
      'unicorn/prefer-spread': 0,
      'unicorn/prefer-string-replace-all': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unsafe-call': 0,
      '@typescript-eslint/no-unsafe-argument': 0,
      '@typescript-eslint/no-unsafe-return': 0,
      '@typescript-eslint/no-unsafe-member-access': 0,
      '@typescript-eslint/no-unsafe-assignment': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/restrict-template-expressions': 0,
    },
  },
)
