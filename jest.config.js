module.exports = {
    preset: null,
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.js'],
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {},
    testMatch: [
        '**/tests/**/*.test.js',
        '**/src/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/test-db.js'
    ],
    setupFilesAfterEnv: [],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
