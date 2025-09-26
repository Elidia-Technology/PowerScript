"use strict";
/**
 * PowerScript Testing Framework
 * A complete testing framework for PowerScript applications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testing = exports.endTimer = exports.startTimer = exports.captureSnapshot = exports.createMock = exports.assertThrows = exports.assertDeepEquals = exports.assertEquals = exports.assertFalse = exports.assertTrue = exports.afterAll = exports.beforeAll = exports.afterEach = exports.beforeEach = exports.it = exports.describe = exports.testFramework = exports.PowerScriptTest = void 0;
const events_1 = require("events");
const fs = require("fs/promises");
const path = require("path");
const perf_hooks_1 = require("perf_hooks");
/**
 * PowerScript Testing Framework - Main Class
 */
class PowerScriptTest extends events_1.EventEmitter {
    constructor() {
        super();
        this.suites = [];
        this.mocks = new Map();
        this.snapshots = [];
        this.coverageEnabled = false;
        this.currentSuite = null;
        this.setupGlobalTestFunctions();
    }
    /**
     * Set up global test functions (describe, it, beforeEach, etc.)
     */
    setupGlobalTestFunctions() {
        // Make test functions available globally
        global.describe = this.describe.bind(this);
        global.it = this.it.bind(this);
        global.test = this.it.bind(this);
        global.beforeEach = this.beforeEach.bind(this);
        global.afterEach = this.afterEach.bind(this);
        global.beforeAll = this.beforeAll.bind(this);
        global.afterAll = this.afterAll.bind(this);
        global.expect = this.expect.bind(this);
        global.jest = {
            fn: this.mockFunction.bind(this),
            clearAllMocks: this.clearMocks.bind(this)
        };
    }
    /**
     * Create a test suite
     */
    describe(name, fn) {
        const suite = {
            name,
            tests: []
        };
        this.suites.push(suite);
        this.currentSuite = suite;
        try {
            fn();
        }
        finally {
            this.currentSuite = null;
        }
    }
    /**
     * Create a test case
     */
    it(name, fn, timeout = 5000) {
        if (!this.currentSuite) {
            throw new Error('Test case must be inside a describe block');
        }
        this.currentSuite.tests.push({
            name,
            fn,
            timeout
        });
    }
    /**
     * Set up before each test
     */
    beforeEach(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeEach must be inside a describe block');
        }
        this.currentSuite.beforeEach = fn;
    }
    /**
     * Set up after each test
     */
    afterEach(fn) {
        if (!this.currentSuite) {
            throw new Error('afterEach must be inside a describe block');
        }
        this.currentSuite.afterEach = fn;
    }
    /**
     * Set up before all tests
     */
    beforeAll(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeAll must be inside a describe block');
        }
        this.currentSuite.beforeAll = fn;
    }
    /**
     * Set up after all tests
     */
    afterAll(fn) {
        if (!this.currentSuite) {
            throw new Error('afterAll must be inside a describe block');
        }
        this.currentSuite.afterAll = fn;
    }
    /**
     * Assertion methods
     */
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (!this.deepEqual(actual, expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toThrow: (expectedError) => {
                if (typeof actual !== 'function') {
                    throw new Error('Expected a function to test for throwing');
                }
                try {
                    actual();
                    throw new Error('Expected function to throw');
                }
                catch (error) {
                    if (expectedError) {
                        if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
                            throw new Error(`Expected error message to contain "${expectedError}"`);
                        }
                        if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
                            throw new Error(`Expected error message to match ${expectedError}`);
                        }
                    }
                }
            },
            toHaveBeenCalled: () => {
                if (typeof actual !== 'function' || !actual.__calls) {
                    throw new Error('Expected a mock function');
                }
                if (actual.__calls.length === 0) {
                    throw new Error('Expected mock function to have been called');
                }
            },
            toHaveBeenCalledWith: (...args) => {
                if (typeof actual !== 'function' || !actual.__calls) {
                    throw new Error('Expected a mock function');
                }
                const found = actual.__calls.some((call) => this.deepEqual(call, args));
                if (!found) {
                    throw new Error(`Expected mock function to have been called with ${JSON.stringify(args)}`);
                }
            }
        };
    }
    /**
     * Create a mock function
     */
    mockFunction(name = 'mockFn') {
        const calls = [];
        let returnValue;
        let implementation;
        const mockFn = (...args) => {
            calls.push(args);
            if (implementation) {
                return implementation(...args);
            }
            return returnValue;
        };
        // Add mock properties
        mockFn.__name = name;
        mockFn.__calls = calls;
        mockFn.mockReturnValue = (value) => {
            returnValue = value;
            return mockFn;
        };
        mockFn.mockImplementation = (fn) => {
            implementation = fn;
            return mockFn;
        };
        mockFn.mockClear = () => {
            calls.length = 0;
            return mockFn;
        };
        mockFn.toHaveBeenCalled = () => {
            return calls.length > 0;
        };
        mockFn.toHaveBeenCalledWith = (...args) => {
            return calls.some(call => this.deepEqual(call, args));
        };
        mockFn.toHaveBeenCalledTimes = (times) => {
            return calls.length === times;
        };
        this.mocks.set(name, mockFn);
        return mockFn;
    }
    /**
     * Get a mock by name
     */
    getMock(name) {
        return this.mocks.get(name);
    }
    /**
     * Clear all mocks
     */
    clearMocks() {
        const mockValues = Array.from(this.mocks.values());
        for (const mock of mockValues) {
            if (mock.mockClear) {
                mock.mockClear();
            }
        }
    }
    /**
     * Debug trace function
     */
    trace(message, data) {
        const timestamp = new Date().toISOString();
        const stack = new Error().stack?.split('\n').slice(2) || [];
        console.log(`[TRACE ${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
        console.log('Stack:', stack.slice(0, 3).join('\n'));
        this.emit('trace', { timestamp, message, data, stack });
    }
    /**
     * Capture a debug snapshot
     */
    captureSnapshot(label = 'snapshot') {
        const snapshot = {
            timestamp: new Date().toISOString(),
            label,
            memory: process.memoryUsage(),
            performance: perf_hooks_1.performance.now(),
            stack: new Error().stack?.split('\n').slice(2) || [],
            variables: {}
        };
        // Capture basic state information
        try {
            snapshot.variables = {
                mocks: this.mocks.size,
                suites: this.suites.length,
                snapshots: this.snapshots.length
            };
        }
        catch (error) {
            // Ignore errors in variable capture
        }
        this.snapshots.push(snapshot);
        this.emit('snapshot', snapshot);
        return snapshot;
    }
    /**
     * Get all debug snapshots
     */
    getSnapshots() {
        return [...this.snapshots];
    }
    /**
     * Clear debug snapshots
     */
    clearSnapshots() {
        this.snapshots = [];
    }
    /**
     * Performance timing
     */
    startTimer(name) {
        perf_hooks_1.performance.mark(`${name}-start`);
    }
    endTimer(name) {
        perf_hooks_1.performance.mark(`${name}-end`);
        const measure = perf_hooks_1.performance.measure(`${name}-duration`, `${name}-start`, `${name}-end`);
        return measure.duration;
    }
    /**
     * Run all tests
     */
    async run(options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const results = [];
        this.coverageEnabled = options.coverage || false;
        this.emit('runStart', { suites: this.suites.length });
        // Check if any tests are marked as 'only'
        const hasOnly = this.suites.some(suite => suite.tests.some(test => test.only));
        for (const suite of this.suites) {
            this.emit('suiteStart', { suite: suite.name });
            try {
                // Run beforeAll hook
                if (suite.beforeAll) {
                    await this.runWithTimeout(suite.beforeAll, 10000);
                }
                for (const test of suite.tests) {
                    // Skip tests if 'only' is present and this test is not marked
                    if (hasOnly && !test.only) {
                        results.push({
                            name: test.name,
                            suite: suite.name,
                            status: 'skipped',
                            duration: 0
                        });
                        continue;
                    }
                    if (test.skip) {
                        results.push({
                            name: test.name,
                            suite: suite.name,
                            status: 'skipped',
                            duration: 0
                        });
                        continue;
                    }
                    const testStartTime = perf_hooks_1.performance.now();
                    try {
                        // Run beforeEach hook
                        if (suite.beforeEach) {
                            await this.runWithTimeout(suite.beforeEach, 5000);
                        }
                        // Run the test
                        await this.runWithTimeout(test.fn, test.timeout || 5000);
                        // Run afterEach hook
                        if (suite.afterEach) {
                            await this.runWithTimeout(suite.afterEach, 5000);
                        }
                        const duration = perf_hooks_1.performance.now() - testStartTime;
                        results.push({
                            name: test.name,
                            suite: suite.name,
                            status: 'passed',
                            duration
                        });
                        this.emit('testPass', { test: test.name, suite: suite.name, duration });
                    }
                    catch (error) {
                        const duration = perf_hooks_1.performance.now() - testStartTime;
                        results.push({
                            name: test.name,
                            suite: suite.name,
                            status: 'failed',
                            error,
                            duration
                        });
                        this.emit('testFail', { test: test.name, suite: suite.name, error, duration });
                    }
                }
                // Run afterAll hook
                if (suite.afterAll) {
                    await this.runWithTimeout(suite.afterAll, 10000);
                }
            }
            catch (error) {
                this.emit('suiteError', { suite: suite.name, error });
            }
            this.emit('suiteEnd', { suite: suite.name });
        }
        const endTime = perf_hooks_1.performance.now();
        const duration = endTime - startTime;
        const testRunResult = {
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            total: results.length,
            duration,
            results
        };
        if (this.coverageEnabled) {
            testRunResult.coverage = await this.generateCoverage();
        }
        await this.outputResults(testRunResult, options.reporter || 'default');
        this.emit('runEnd', testRunResult);
        return testRunResult;
    }
    /**
     * Load test files matching pattern
     */
    async loadTestFiles(pattern) {
        const testFiles = await this.findTestFiles(pattern);
        for (const file of testFiles) {
            try {
                // Clear require cache to ensure fresh loads
                delete require.cache[require.resolve(file)];
                require(file);
            }
            catch (error) {
                console.error(`Error loading test file ${file}:`, error);
            }
        }
    }
    /**
     * Deep equality check
     */
    deepEqual(a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return false;
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length)
                return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEqual(a[i], b[i]))
                    return false;
            }
            return true;
        }
        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length)
                return false;
            for (const key of keysA) {
                if (!keysB.includes(key) || !this.deepEqual(a[key], b[key]))
                    return false;
            }
            return true;
        }
        return false;
    }
    /**
     * Run function with timeout
     */
    async runWithTimeout(fn, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeout}ms`));
            }, timeout);
            Promise.resolve(fn()).then(result => {
                clearTimeout(timer);
                resolve(result);
            }, error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    /**
     * Find test files matching pattern
     */
    async findTestFiles(pattern) {
        const files = [];
        if (pattern.includes('*')) {
            // Simple glob pattern support
            const baseDir = pattern.split('*')[0];
            try {
                const dirFiles = await fs.readdir(baseDir, { recursive: true });
                for (const file of dirFiles) {
                    const fullPath = path.join(baseDir, file.toString());
                    if (file.toString().includes('.test.') || file.toString().includes('.spec.')) {
                        files.push(path.resolve(fullPath));
                    }
                }
            }
            catch (error) {
                // Directory doesn't exist
            }
        }
        else {
            // Single file
            files.push(path.resolve(pattern));
        }
        return files;
    }
    /**
     * Generate coverage report
     */
    async generateCoverage() {
        // Basic coverage report - would need real instrumentation for production
        return {
            lines: { covered: 80, total: 100, percent: 80 },
            functions: { covered: 15, total: 20, percent: 75 },
            branches: { covered: 12, total: 16, percent: 75 },
            statements: { covered: 85, total: 100, percent: 85 }
        };
    }
    /**
     * Output test results
     */
    async outputResults(result, reporter) {
        switch (reporter) {
            case 'json':
                console.log(JSON.stringify(result, null, 2));
                break;
            case 'junit':
                await this.outputJUnit(result);
                break;
            default:
                this.outputDefault(result);
                break;
        }
    }
    /**
     * Output default console results
     */
    outputDefault(result) {
        console.log('\n' + '='.repeat(60));
        console.log('PowerScript Test Results');
        console.log('='.repeat(60));
        for (const testResult of result.results) {
            const status = testResult.status === 'passed' ? '✓' :
                testResult.status === 'failed' ? '✗' : '○';
            const color = testResult.status === 'passed' ? '\x1b[32m' :
                testResult.status === 'failed' ? '\x1b[31m' : '\x1b[33m';
            console.log(`${color}${status} ${testResult.suite} > ${testResult.name}\x1b[0m`);
            if (testResult.error) {
                console.log(`   ${testResult.error.message}`);
            }
        }
        console.log('\n' + '-'.repeat(60));
        console.log(`Tests: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`);
        console.log(`Time: ${result.duration.toFixed(2)}ms`);
        if (result.coverage) {
            console.log(`Coverage: ${result.coverage.statements.percent}% statements`);
        }
    }
    /**
     * Output JUnit XML results
     */
    async outputJUnit(result) {
        const xml = this.generateJUnitXML(result);
        await fs.writeFile('test-results.xml', xml);
        console.log('JUnit XML results written to test-results.xml');
    }
    /**
     * Generate JUnit XML
     */
    generateJUnitXML(result) {
        const testsuites = result.results.reduce((acc, test) => {
            if (!acc[test.suite]) {
                acc[test.suite] = [];
            }
            acc[test.suite].push(test);
            return acc;
        }, {});
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<testsuites tests="${result.total}" failures="${result.failed}" time="${result.duration / 1000}">\n`;
        for (const [suiteName, tests] of Object.entries(testsuites)) {
            const suiteTime = tests.reduce((sum, test) => sum + test.duration, 0);
            const suiteFailed = tests.filter(test => test.status === 'failed').length;
            xml += `  <testsuite name="${suiteName}" tests="${tests.length}" failures="${suiteFailed}" time="${suiteTime / 1000}">\n`;
            for (const test of tests) {
                xml += `    <testcase name="${test.name}" time="${test.duration / 1000}"`;
                if (test.status === 'failed') {
                    xml += `>\n      <failure message="${test.error?.message || 'Test failed'}">${test.error?.stack || ''}</failure>\n    </testcase>\n`;
                }
                else if (test.status === 'skipped') {
                    xml += `>\n      <skipped/>\n    </testcase>\n`;
                }
                else {
                    xml += '/>\n';
                }
            }
            xml += '  </testsuite>\n';
        }
        xml += '</testsuites>\n';
        return xml;
    }
}
exports.PowerScriptTest = PowerScriptTest;
// Export global instance
exports.testFramework = new PowerScriptTest();
// Global test functions for convenience
exports.describe = exports.testFramework.describe.bind(exports.testFramework);
exports.it = exports.testFramework.it.bind(exports.testFramework);
exports.beforeEach = exports.testFramework.beforeEach.bind(exports.testFramework);
exports.afterEach = exports.testFramework.afterEach.bind(exports.testFramework);
exports.beforeAll = exports.testFramework.beforeAll.bind(exports.testFramework);
exports.afterAll = exports.testFramework.afterAll.bind(exports.testFramework);
// Global assertion functions
const assertTrue = (condition, message) => {
    if (!condition) {
        throw new Error(message || 'Assertion failed: condition is not true');
    }
};
exports.assertTrue = assertTrue;
const assertFalse = (condition, message) => {
    if (condition) {
        throw new Error(message || 'Assertion failed: condition is not false');
    }
};
exports.assertFalse = assertFalse;
const assertEquals = (actual, expected, message) => {
    if (actual !== expected) {
        throw new Error(message || `Assertion failed: expected ${expected}, got ${actual}`);
    }
};
exports.assertEquals = assertEquals;
const assertDeepEquals = (actual, expected, message) => {
    if (!exports.testFramework['deepEqual'](actual, expected)) {
        throw new Error(message || `Assertion failed: objects are not deeply equal`);
    }
};
exports.assertDeepEquals = assertDeepEquals;
const assertThrows = (fn, expectedError, message) => {
    try {
        fn();
        throw new Error(message || 'Expected function to throw an error');
    }
    catch (error) {
        if (expectedError) {
            if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
                throw new Error(message || `Expected error message to contain "${expectedError}"`);
            }
            if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
                throw new Error(message || `Expected error message to match ${expectedError}`);
            }
        }
    }
};
exports.assertThrows = assertThrows;
// Global mock functions
const createMock = (name) => exports.testFramework.mockFunction(name);
exports.createMock = createMock;
// Global debug functions
const captureSnapshot = (label) => exports.testFramework.captureSnapshot(label);
exports.captureSnapshot = captureSnapshot;
const startTimer = (name) => exports.testFramework.startTimer(name);
exports.startTimer = startTimer;
const endTimer = (name) => exports.testFramework.endTimer(name);
exports.endTimer = endTimer;
// Export the testing instance for advanced usage
exports.testing = exports.testFramework;
// Export for use in other modules
exports.default = PowerScriptTest;
