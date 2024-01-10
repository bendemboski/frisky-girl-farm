module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['prettier', 'googleappsscript'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
  },
  overrides: [
    // typescript
    {
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      env: {
        node: false,
        'googleappsscript/googleappsscript': true,
      },
      rules: {
        'prefer-const': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};
