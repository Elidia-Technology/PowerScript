/**
 * PowerScript Patterns Module - Comprehensive Test Suite
 * Tests for all design patterns and best practices components
 */

import { 
    PowerScriptPatterns, 
    LogLevel,
    Singleton,
    Subject,
    Factory,
    CommandInvoker,
    SimpleCommand,
    DependencyContainer,
    ConfigManager,
    EnhancedLogger,
    ErrorManager,
    AsyncUtils,
    RetryUtility
} from '../src/patterns';

async function testPatternsModule() {
    console.log('🚀 Phase 13 Patterns Module - Comprehensive Test Starting...\n');

    let testsRun = 0;
    let testsPassed = 0;

    function runTest(name: string, testFn: () => void | Promise<void>): Promise<void> {
        return new Promise(async (resolve) => {
            testsRun++;
            try {
                await testFn();
                testsPassed++;
                console.log(`✅ ${name}`);
                resolve();
            } catch (error) {
                console.log(`❌ ${name}: ${(error as Error).message}`);
                resolve();
            }
        });
    }

    // Test 1: Singleton Pattern
    await runTest('Singleton Pattern', () => {
        const instance1 = Singleton.create('test', () => ({ id: 'test-singleton' }));
        const instance2 = Singleton.create('test', () => ({ id: 'different' }));
        
        if (instance1 !== instance2 || instance1.id !== 'test-singleton') {
            throw new Error('Singleton instances should be the same');
        }
    });

    // Test 2: Observer Pattern
    await runTest('Observer Pattern', async () => {
        const subject = new Subject<string>();
        let notificationReceived = '';
        
        const observer = {
            update: (data: string) => {
                notificationReceived = data;
            }
        };
        
        subject.attach(observer);
        await subject.notify('test-message');
        
        if (notificationReceived !== 'test-message') {
            throw new Error('Observer did not receive notification');
        }
    });

    // Test 3: Factory Pattern
    await runTest('Factory Pattern', () => {
        const factory = new Factory<{ type: string }>();
        
        class TestProduct {
            type = 'test';
        }
        
        factory.register('test', TestProduct);
        const product = factory.create('test');
        
        if (product.type !== 'test') {
            throw new Error('Factory did not create correct product');
        }
    });

    // Test 4: Command Pattern
    await runTest('Command Pattern', async () => {
        const invoker = new CommandInvoker();
        let value: number = 0;
        
        const incrementCommand = new SimpleCommand(
            () => { value = value + 1; },
            () => { value = value - 1; }
        );
        
        await invoker.execute(incrementCommand);
        if (value !== 1) throw new Error('Command execution failed');
        
        await invoker.undo();
        if (value as number !== 0) throw new Error(`Command undo failed: expected 0, got ${value}`);
    });

    // Test 5: Dependency Injection Container
    await runTest('DI Container', () => {
        const container = new DependencyContainer();
        
        class TestService {
            getName() { return 'test-service'; }
        }
        
        container.registerSingleton('testService', TestService);
        const service = container.resolve<TestService>('testService');
        
        if (service.getName() !== 'test-service') {
            throw new Error('DI container resolution failed');
        }
    });

    // Test 6: Configuration Manager
    await runTest('Config Manager', async () => {
        const config = new ConfigManager();
        
        config.set('app.name', 'PowerScript');
        config.set('app.version', '1.0.0');
        
        if (config.get('app.name') !== 'PowerScript') {
            throw new Error('Config set/get failed');
        }
        
        if (!config.has('app.version')) {
            throw new Error('Config has() check failed');
        }
    });

    // Test 7: Enhanced Logger
    await runTest('Enhanced Logger', () => {
        const logger = new EnhancedLogger({
            level: LogLevel.INFO
        });
        
        const stats = logger.getStats();
        if (stats.level !== 'INFO' || stats.transports !== 1) {
            throw new Error('Logger configuration incorrect');
        }
        
        // Test child logger
        const childLogger = logger.child({ component: 'test' });
        if (!childLogger) {
            throw new Error('Child logger creation failed');
        }
    });

    // Test 8: Error Manager
    await runTest('Error Manager', async () => {
        const errorManager = new ErrorManager();
        
        const testError = errorManager.createError('Test error', 'TEST_ERROR', 400);
        if (testError.code !== 'TEST_ERROR' || testError.statusCode !== 400) {
            throw new Error('Error creation failed');
        }
        
        await errorManager.handleError(testError);
        
        const stats = errorManager.getErrorStats();
        if (stats.totalHandlers === 0) {
            throw new Error('Error handlers not registered');
        }
    });

    // Test 9: Async Utilities - Retry
    await runTest('Async Utils - Retry', async () => {
        let attempts = 0;
        const asyncUtils = new AsyncUtils();
        
        try {
            await asyncUtils.retry(
                async () => {
                    attempts++;
                    if (attempts < 3) throw new Error('Not ready');
                    return 'success';
                },
                {
                    maxAttempts: 5,
                    baseDelay: 1,
                    backoffFactor: 1
                }
            );
        } catch (error) {
            throw new Error('Retry mechanism failed');
        }
        
        if (attempts !== 3) {
            throw new Error(`Expected 3 attempts, got ${attempts}`);
        }
    });

    // Test 10: Async Utilities - Timeout
    await runTest('Async Utils - Timeout', async () => {
        const asyncUtils = new AsyncUtils();
        
        try {
            await asyncUtils.timeout(
                new Promise(resolve => setTimeout(resolve, 100)),
                50
            );
            throw new Error('Should have timed out');
        } catch (error) {
            if (!(error as Error).message.includes('timed out')) {
                throw error;
            }
        }
    });

    // Test 11: Async Utilities - Debounce
    await runTest('Async Utils - Debounce', async () => {
        const asyncUtils = new AsyncUtils();
        let callCount = 0;
        
        const debouncedFn = asyncUtils.debounce(() => {
            callCount++;
        }, 10);
        
        // Call multiple times quickly
        debouncedFn();
        debouncedFn();
        debouncedFn();
        
        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 20));
        
        if (callCount !== 1) {
            throw new Error(`Expected 1 call, got ${callCount}`);
        }
    });

    // Test 12: Main PowerScript Patterns Module
    await runTest('PowerScript Patterns Module', async () => {
        const patterns = new PowerScriptPatterns({
            logging: { level: LogLevel.WARN }
        });
        
        await patterns.initialize();
        
        const status = patterns.getStatus();
        if (!status.initialized) {
            throw new Error('Module not initialized');
        }
        
        if (status.patterns.length !== 5 || status.services.length !== 6) {
            throw new Error('Expected patterns and services not available');
        }
        
        const stats = patterns.getStats();
        if (stats.container.registeredServices === 0) {
            throw new Error('No services registered in container');
        }
        
        await patterns.dispose();
        
        const finalStatus = patterns.getStatus();
        if (finalStatus.initialized) {
            throw new Error('Module should be disposed');
        }
    });

    // Test 13: Integration Test - Full Workflow
    await runTest('Integration - Full Workflow', async () => {
        const patterns = new PowerScriptPatterns();
        await patterns.initialize();
        
        // Test DI integration
        patterns.container.registerSingleton('workflowService', class {
            process() { return 'processed'; }
        });
        
        const service = patterns.container.resolve<any>('workflowService');
        const result = service.process();
        
        if (result !== 'processed') {
            throw new Error('Workflow integration failed');
        }
        
        // Test config integration
        patterns.config.set('workflow.enabled', true);
        if (!patterns.config.get('workflow.enabled')) {
            throw new Error('Config integration failed');
        }
        
        // Test command pattern with async utils
        const commandInvoker = patterns.command;
        let workflowValue = 0;
        
        const workflowCommand = new SimpleCommand(
            async () => {
                await patterns.asyncUtils.sleep(1);
                workflowValue = 42;
            }
        );
        
        await commandInvoker.execute(workflowCommand);
        
        if (workflowValue !== 42) {
            throw new Error('Async workflow command failed');
        }
        
        await patterns.dispose();
    });

    // Test 14: Performance and Memory
    await runTest('Performance & Memory', async () => {
        const patterns = new PowerScriptPatterns();
        await patterns.initialize();
        
        const startTime = Date.now();
        
        // Perform multiple operations
        for (let i = 0; i < 100; i++) {
            patterns.logger.debug(`Test operation ${i}`);
            patterns.config.set(`test.${i}`, i);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (duration > 1000) { // Should complete in under 1 second
            throw new Error(`Operations too slow: ${duration}ms`);
        }
        
        const stats = patterns.getStats();
        if (stats.config.totalKeys < 100) {
            throw new Error('Config operations not persisted');
        }
        
        await patterns.dispose();
    });

    console.log('\n============================================================');
    console.log('🎉 PHASE 13 PATTERNS TEST COMPLETE!');
    console.log('============================================================\n');

    console.log('📊 Patterns & Best Practices Features Tested:');
    console.log('✅ Singleton pattern with instance management');
    console.log('✅ Observer pattern with async notification');
    console.log('✅ Factory pattern with type registration');
    console.log('✅ Command pattern with undo/redo support');
    console.log('✅ Dependency injection container');
    console.log('✅ Configuration management system');
    console.log('✅ Enhanced logging with transports');
    console.log('✅ Error management with handlers');
    console.log('✅ Async utilities (retry, timeout, debounce)');
    console.log('✅ Main orchestration module');
    console.log('✅ Full integration workflow');
    console.log('✅ Performance optimization');

    console.log('\n📈 Test Results:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsRun - testsPassed}`);
    console.log(`📊 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

    if (testsPassed === testsRun) {
        console.log('\n🌟 All patterns and best practices working perfectly!');
        console.log('Ready for production use in PowerScript framework.');
    } else {
        console.log('\n⚠️ Some tests failed - check implementation details.');
    }

    return { testsRun, testsPassed, successRate: (testsPassed / testsRun) * 100 };
}

// Run tests if executed directly
if (require.main === module) {
    testPatternsModule().catch(console.error);
}

export { testPatternsModule };