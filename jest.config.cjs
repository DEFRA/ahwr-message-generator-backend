module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js', '!**/*.test.js'],
  coverageDirectory: 'test-output',
  coverageReporters: ['text-summary', 'lcov'],
  coveragePathIgnorePatterns: [
    '<rootDir>/compose/',
    '<rootDir>/coverage/',
    '<rootDir>/node_modules/',
    '<rootDir>/test-output/',
    '<rootDir>/tests/',
    '<rootDir>/jest.config.cjs'
  ],
  globalSetup: '<rootDir>/test/globalSetup.js',
  globalTeardown: '<rootDir>/test/globalTeardown.js',
  modulePathIgnorePatterns: ['node_modules'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'jest tests',
        outputDirectory: 'test-output',
        outputName: 'junit.xml'
      }
    ]
  ],
  restoreMocks: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: [],
  verbose: true,
  transform: {
    '^.+\\.[j]sx?$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ffc-ahwr-common-library|@defra/hapi-tracing|@defra/hapi-secure-context|uuid|@aws-sdk)/)'
  ]
}
