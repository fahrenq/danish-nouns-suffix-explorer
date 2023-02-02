module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'preact',
    'standard-with-typescript'
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: [
  ],
  rules: {
    'jest/no-deprecated-functions': 0
  }
}
