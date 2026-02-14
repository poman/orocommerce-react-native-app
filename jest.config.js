module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo|@expo|@unimodules|unimodules|expo-router|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/tests/utils/',
    '/tests/config/',
    '/tests/e2e/',
    '/tests/coverage/',
    '/tests/playwright-report/',
    '/tests/test-results/',
  ],
  testMatch: ['**/tests/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!**/tests/**',
  ],
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo/src/winter/(.*)$': '<rootDir>/node_modules/expo/src/winter/$1',
  },
  testEnvironment: 'node',
  globals: {
    __ExpoImportMetaRegistry: {},
    __EXPO_ENV_PRELOAD__: true,
  },
};
