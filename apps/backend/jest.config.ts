import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['libs/**/*.(t|j)s', 'apps/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@app/rescheduling$': '<rootDir>/libs/rescheduling/src',
    '^@app/rescheduling/(.*)$': '<rootDir>/libs/rescheduling/src/$1',
    '^@omniscient/types$': '<rootDir>/../../packages/types/src',
    '^@omniscient/types/(.*)$': '<rootDir>/../../packages/types/src/$1',
  },
};

export default config;
