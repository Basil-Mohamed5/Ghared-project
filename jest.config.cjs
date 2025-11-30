module.exports = {
    preset: null,
    testEnvironment: 'node',
    testMatch: [
        '**/src/tests/**/*.test.js',
        '**/src/tests/**/*.spec.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/test-db.js'
    ],
    moduleFileExtensions: ['js', 'json'],
    testTimeout: 10000,
    transformIgnorePatterns: [
        'node_modules/(?!(supertest)/)'
    ]
};
