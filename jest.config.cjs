module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/?(*.)+(spec|test).(ts|tsx|js)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/contracts/'],
  // Ignore e2e playwright tests (run separately via `npm run test:e2e`)
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/contracts/', '/tests/e2e/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  // Ensure tests resolve React from the workspace root to avoid multiple React copies
  moduleDirectories: ['node_modules', '<rootDir>/web/node_modules'],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom'
  }
};
