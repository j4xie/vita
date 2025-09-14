module.exports = {
  extends: [
    'expo',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [],
  rules: {
    // Basic syntax error prevention only
    'no-dupe-keys': 'error',
    'no-empty': 'error',
    'no-unreachable': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    'ios/',
    'android/',
    '*.d.ts',
    '.expo/',
    'dist/',
  ],
};