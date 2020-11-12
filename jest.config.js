module.exports = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/**/*.ts',
        '!<rootDir>/src/index.ts'
    ],
    coveragePathIgnorePatterns: [
        '.*\\.d\\.ts'
    ],
    testMatch: [
        '<rootDir>/src/**/*.spec.ts'
    ],
    // This configuration is used to defeat the problem:
    //  Jest-haste-map: @providesModule naming collision:
    //   Duplicate module name: core-ui-kit
    //   Paths: C:\dev\projects\ams\core-ui-kit\dist\package.json collides with
    //      C:\dev\projects\ams\core-ui-kit\package.json
    //  This warning is caused by a @providesModule declaration with the same name across two different files.
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
    setupFiles: [
        '<rootDir>/config/jest/setup/console.setup.ts'
    ],
    setupFilesAfterEnv: [
        '<rootDir>/config/jest/env-setup/check-assertions-number.ts'
    ],
    testURL: 'http://localhost',
    transform: {
        '^(?!.*\\.(js|ts|tsx|css|json)$)': '<rootDir>/config/jest/transform/file.transform.ts',
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleFileExtensions: [
        'web.ts',
        'ts',
        'tsx',
        'web.js',
        'js',
        'json',
        'node'
    ],
    globals: {
        'ts-jest': { tsConfig: 'tsconfig.spec.json' }
    },
    coverageThreshold: {
        global: {
            statements: 25,
            branches: 19,
            lines: 25,
            functions: 20
        }
    }
};
