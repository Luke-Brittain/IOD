module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
  },
  globals: {
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    vi: 'readonly',
  },

  // Global rules: keep the inline-style rule OFF globally so legacy/removed folders
  // don't fail CI. We enable it as a WARN specifically for OliveBranch below.
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-restricted-syntax': 'off',
  },

  overrides: [
    // Apply the inline-style warning only to the OliveBranch source tree.
    {
      files: ['OliveBranch/**/*.ts', 'OliveBranch/**/*.tsx', 'OliveBranch/**/*.js', 'OliveBranch/**/*.jsx'],
      rules: {
        'no-restricted-syntax': [
          'warn',
          {
            selector: 'JSXAttribute[name.name="style"]',
            message:
              'Avoid inline `style` attributes in JSX. Use CSS Modules, design-system tokens, or classes instead.',
          },
        ],
      },
    },
  ],
};
