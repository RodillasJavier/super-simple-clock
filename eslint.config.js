import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import html from 'eslint-plugin-html';

const sharedRules = {
  'no-unused-vars': 'warn',
  'no-console': 'warn',
  'no-empty': ['error', { allowEmptyCatch: true }],
};

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['script.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: globals.browser,
    },
    rules: sharedRules,
  },
  {
    files: ['**/*.html'],
    plugins: { html },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        tailwind: 'readonly',
      },
    },
    rules: sharedRules,
  },
];
