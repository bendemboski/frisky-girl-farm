module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es6: true,
  },
  plugins: ['prettier', 'node'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['test/**/*.js'],
      env: {
        mocha: true,
      },
    },
  ],
};
