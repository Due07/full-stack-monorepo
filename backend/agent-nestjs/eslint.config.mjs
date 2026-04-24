import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
// import eslintConfigPrettier from 'eslint-config-prettier';

const GLOBAL_RULES = {
  semi: [2, 'always'],
  quotes: ['error', 'single', { avoidEscape: true }],
  'no-eval': 2,
  'no-implied-eval': 2,
  'no-with': 2,
  'no-multiple-empty-lines': [1, { max: 1, maxEOF: 0, maxBOF: 0 }],
  'eol-last': [2, 'always'],
  'use-isnan': 2,
  'no-unused-expressions': ['error', { allowShortCircuit: true }],
  'no-undef': 2,
}

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.d.ts'],
  },
  js.configs.recommended,
  // eslintConfigPrettier,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        'no-unused-vars': 2,
        ...globals.node,
      },
    },
    rules: { ...GLOBAL_RULES }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: { ...globals.node, },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...GLOBAL_RULES,
      'no-redeclare': 0,
      '@typescript-eslint/no-redeclare': 2,
      'no-undef': 0,
      '@typescript-eslint/no-namespace': [2, { allowDeclarations: true }],
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 2,
      // 启用 TS 版本的私有成员检查规则
      '@typescript-eslint/no-unused-private-class-members': 2,
      '@typescript-eslint/explicit-function-return-type': [
        'off',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': [2, { allowSingleExtends: true }],
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
