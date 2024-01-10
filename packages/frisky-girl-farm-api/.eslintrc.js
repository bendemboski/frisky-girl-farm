module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    node: true,
  },
  plugins: ['prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:prettier/recommended',
    'plugin:n/recommended',
  ],
  overrides: [
    // typescript
    {
      files: ['*.ts'],
      rules: {
        'prefer-const': 'off',
        'no-unused-vars': 'off',
        'n/no-missing-import': 'off',
      },
    },
    {
      files: ['test/**/*'],
    },
  ],
};
