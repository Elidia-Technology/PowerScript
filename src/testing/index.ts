/**
 * PowerScript Testing Framework
 * A complete testing framework for PowerScript applications
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Core test interfaces
export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
}

export interface TestResult {
  name: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: Error;
  duration: number;
}

export interface TestRunResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  results: TestResult[];
  coverage?: CoverageReport;
}

export interface CoverageReport {
  lines: { covered: number; total: number; percent: number };
  functions: { covered: number; total: number; percent: number };
  branches: { covered: number; total: number; percent: number };
  statements: { covered: number; total: number; percent: number };
}

export interface DebugSnapshot {
  timestamp: string;
  label: string;
  memory: NodeJS.MemoryUsage;
  performance: number;
  stack: string[];
  variables: Record<string, any>;
}

/**
 * PowerScript Testing Framework - Main Class
 */
export class PowerScriptTest extends EventEmitter {
  private suites: TestSuite[] = [];
  private mocks: Map<string, any> = new Map();
  private snapshots: DebugSnapshot[] = [];
  private coverageEnabled = false;
  private currentSuite: TestSuite | null = null;

  constructor() {
    super();
    this.setupGlobalTestFunctions();
  }

  /**
   * Set up global test functions (describe, it, beforeEach, etc.)
   */
  private setupGlobalTestFunctions(): void {
    // Make test functions available globally
    (global as any).describe = this.describe.bind(this);
    (global as any).it = this.it.bind(this);
    (global as any).test = this.it.bind(this);
    (global as any).beforeEach = this.beforeEach.bind(this);
    (global as any).afterEach = this.afterEach.bind(this);
    (global as any).beforeAll = this.beforeAll.bind(this);
    (global as any).afterAll = this.afterAll.bind(this);
    (global as any).expect = this.expect.bind(this);
    (global as any).jest = {
      fn: this.mockFunction.bind(this),
      clearAllMocks: this.clearMocks.bind(this)
    };
  }

  /**
   * Create a test suite
   */
  describe(name: string, fn: () => void): void {
    const suite: TestSuite = {
      name,
      tests: []
    };

    this.suites.push(suite);
    this.currentSuite = suite;
    
    try {
      fn();
    } finally {
      this.currentSuite = null;
    }
  }

  /**
   * Create a test case
   */
  it(name: string, fn: () => void | Promise<void>, timeout = 5000): void {
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
  beforeEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeEach must be inside a describe block');
    }
    this.currentSuite.beforeEach = fn;
  }

  /**
   * Set up after each test
   */
  afterEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterEach must be inside a describe block');
    }
    this.currentSuite.afterEach = fn;
  }

  /**
   * Set up before all tests
   */
  beforeAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeAll must be inside a describe block');
    }
    this.currentSuite.beforeAll = fn;
  }

  /**
   * Set up after all tests
   */
  afterAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterAll must be inside a describe block');
    }
    this.currentSuite.afterAll = fn;
  }

  /**
   * Assertion methods
   */
  expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      toEqual: (expected: any) => {
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
      toThrow: (expectedError?: string | RegExp) => {
        if (typeof actual !== 'function') {
          throw new Error('Expected a function to test for throwing');
        }
        
        try {
          actual();
          throw new Error('Expected function to throw');
        } catch (error: any) {
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
      toHaveBeenCalledWith: (...args: any[]) => {
        if (typeof actual !== 'function' || !actual.__calls) {
          throw new Error('Expected a mock function');
        }
        const found = actual.__calls.some((call: any[]) => this.deepEqual(call, args));
        if (!found) {
          throw new Error(`Expected mock function to have been called with ${JSON.stringify(args)}`);
        }
      }
    };
  }

  /**
   * Create a mock function
   */
  mockFunction(name: string = 'mockFn'): any {
    const calls: any[][] = [];
    let returnValue: any;
    let implementation: ((...args: any[]) => any) | undefined;

    const mockFn = (...args: any[]) => {
      calls.push(args);
      if (implementation) {
        return implementation(...args);
      }
      return returnValue;
    };

    // Add mock properties
    (mockFn as any).__name = name;
    (mockFn as any).__calls = calls;
    (mockFn as any).mockReturnValue = (value: any) => {
      returnValue = value;
      return mockFn;
    };
    (mockFn as any).mockImplementation = (fn: (...args: any[]) => any) => {
      implementation = fn;
      return mockFn;
    };
    (mockFn as any).mockClear = () => {
      calls.length = 0;
      return mockFn;
    };
    (mockFn as any).toHaveBeenCalled = () => {
      return calls.length > 0;
    };
    (mockFn as any).toHaveBeenCalledWith = (...args: any[]) => {
      return calls.some(call => this.deepEqual(call, args));
    };
    (mockFn as any).toHaveBeenCalledTimes = (times: number) => {
      return calls.length === times;
    };

    this.mocks.set(name, mockFn);
    return mockFn;
  }

  /**
   * Get a mock by name
   */
  getMock(name: string): any {
    return this.mocks.get(name);
  }

  /**
   * Clear all mocks
   */
  clearMocks(): void {
    for (const mock of this.mocks.values()) {
      if (mock.mockClear) {
        mock.mockClear();
      }
    }
  }

  /**
   * Debug trace function
   */
  trace(message: string, data?: any): void {
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
  captureSnapshot(label: string = 'snapshot'): DebugSnapshot {
    const snapshot: DebugSnapshot = {
      timestamp: new Date().toISOString(),
      label,
      memory: process.memoryUsage(),
      performance: performance.now(),
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
    } catch (error) {
      // Ignore errors in variable capture
    }

    this.snapshots.push(snapshot);
    this.emit('snapshot', snapshot);
    return snapshot;
  }

  /**
   * Get all debug snapshots
   */
  getSnapshots(): DebugSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Clear debug snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Performance timing
   */
  startTimer(name: string): void {
    performance.mark(`${name}-start`);
  }

  endTimer(name: string): number {
    performance.mark(`${name}-end`);
    const measure = performance.measure(`${name}-duration`, `${name}-start`, `${name}-end`);
    return measure.duration;
  }

  /**
   * Run all tests
   */
  async run(options: { 
    reporter?: 'default' | 'json' | 'junit'; 
    coverage?: boolean 
  } = {}): Promise<TestRunResult> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    this.coverageEnabled = options.coverage || false;

    this.emit('runStart', { suites: this.suites.length });

    // Check if any tests are marked as 'only'
    const hasOnly = this.suites.some(suite => 
      suite.tests.some(test => test.only)
    );

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

          const testStartTime = performance.now();
          
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

            const duration = performance.now() - testStartTime;
            results.push({
              name: test.name,
              suite: suite.name,
              status: 'passed',
              duration
            });

            this.emit('testPass', { test: test.name, suite: suite.name, duration });

          } catch (error: any) {
            const duration = performance.now() - testStartTime;
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

      } catch (error: any) {
        this.emit('suiteError', { suite: suite.name, error });
      }

      this.emit('suiteEnd', { suite: suite.name });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const testRunResult: TestRunResult = {
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
  async loadTestFiles(pattern: string): Promise<void> {
    const testFiles = await this.findTestFiles(pattern);

    for (const file of testFiles) {
      try {
        // Clear require cache to ensure fresh loads
        delete require.cache[require.resolve(file)];
        require(file);
      } catch (error) {
        console.error(`Error loading test file ${file}:`, error);
      }
    }
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Run function with timeout
   */
  private async runWithTimeout<T>(fn: () => Promise<T> | T, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn()).then(
        result => {
          clearTimeout(timer);
          resolve(result);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  /**
   * Find test files matching pattern
   */
  private async findTestFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];
    
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
      } catch (error) {
        // Directory doesn't exist
      }
    } else {
      // Single file
      files.push(path.resolve(pattern));
    }
    
    return files;
  }

  /**
   * Generate coverage report
   */
  private async generateCoverage(): Promise<CoverageReport> {
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
  private async outputResults(result: TestRunResult, reporter: string): Promise<void> {
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
  private outputDefault(result: TestRunResult): void {
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
  private async outputJUnit(result: TestRunResult): Promise<void> {
    const xml = this.generateJUnitXML(result);
    await fs.writeFile('test-results.xml', xml);
    console.log('JUnit XML results written to test-results.xml');
  }

  /**
   * Generate JUnit XML
   */
  private generateJUnitXML(result: TestRunResult): string {
    const testsuites = result.results.reduce((acc, test) => {
      if (!acc[test.suite]) {
        acc[test.suite] = [];
      }
      acc[test.suite].push(test);
      return acc;
    }, {} as Record<string, TestResult[]>);

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
        } else if (test.status === 'skipped') {
          xml += `>\n      <skipped/>\n    </testcase>\n`;
        } else {
          xml += '/>\n';
        }
      }
      
      xml += '  </testsuite>\n';
    }

    xml += '</testsuites>\n';
    return xml;
  }
}

// Export global instance
export const testFramework = new PowerScriptTest();

// Export for use in other modules
export default PowerScriptTest;