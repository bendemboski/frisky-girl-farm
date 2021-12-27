module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2019,
    requireConfigFile: false,
  },
  plugins: ['@typescript-eslint', 'prettier', 'googleappsscript'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  env: {
    es6: true,
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
