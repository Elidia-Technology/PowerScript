module.exports = {
  preset: 'ts-jest',
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      roots: ['<rootDir>/test'],
      testMatch: [
        '**/*.test.ts',
        '!**/*client*.test.*',
        '!**/*eips*.test.*'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/test/setup.js']
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/test'],
      testMatch: [
        '**/*client*.test.*',
        '**/*eips*.test.*'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/test/setup-jsdom.js']
    }
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  forceExit: true,
  detectOpenHandles: false,
};