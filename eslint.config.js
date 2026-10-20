import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // R4: Nothing obsolete
      'no-var': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'execCommand',
          message: 'document.execCommand is forbidden. Use the Clipboard API.',
        },
        {
          object: 'document',
          property: 'write',
          message: 'document.write is forbidden.',
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'event',
          message: 'window.event is forbidden. Pass events explicitly.',
        },
      ],

      // R5: Secure DOM handling
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: 'Assignment to innerHTML is forbidden.',
        },
        {
          selector: "AssignmentExpression[left.property.name='outerHTML']",
          message: 'Assignment to outerHTML is forbidden.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'insertAdjacentHTML is forbidden.',
        },
        {
          selector: "AssignmentExpression[left.name='innerHTML']",
          message: 'Assignment to innerHTML is forbidden.',
        },
      ],

      // R3: Structural limits for maintainability
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],

      // R2: Disallow magic numbers outside configuration
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],
    },
  },
  // Allow innerHTML read in serialize-html.ts only (R5)
  {
    files: ['src/content/clipboard/serialize-html.ts'],
    rules: {
      // Reads are allowed in this single dedicated module per spec 8.4
    },
  },
  // Forbid reading innerHTML in any other src/ file
  {
    files: ['src/**/*.ts'],
    ignores: ['src/content/clipboard/serialize-html.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: 'Assignment to innerHTML is forbidden.',
        },
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message: 'Reading innerHTML is forbidden outside serialize-html.ts.',
        },
        {
          selector: "AssignmentExpression[left.property.name='outerHTML']",
          message: 'Assignment to outerHTML is forbidden.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'insertAdjacentHTML is forbidden.',
        },
      ],
    },
  },
  // R2 exception: configuration modules define the constants
  {
    files: ['src/shared/config/**/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },
  // Tests: relax lines, complexity and depth for test suites
  {
    files: ['test/**/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off',
      'max-depth': 'off',
    },
  },
  // Node scripts: Node globals and relaxed structural limits for build tools
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off',
      'max-depth': 'off',
    },
  },
  {
    ignores: ['dist/**', 'artifacts/**', 'node_modules/**', '.playwright-cli/**'],
  }
);
