module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2021,
    requireConfigFile: false,
  },
  env: {
    es6: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'prettier', 'node'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    // typescript
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      rules: {
        'prefer-const': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-import': 'off',
      },
    },
    {
      files: ['test/**/*'],
      env: {
        mocha: true,
      },
    },
  ],
};
