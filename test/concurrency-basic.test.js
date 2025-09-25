/**
 * PowerScript Concurrency & Scheduling Module - Basic Test Suite
 * Comprehensive testing for parallel processing, workers, and scheduling
 */
import { PowerScriptConcurrency, QueueType, TaskPriority } from '../src/concurrency/index.js';
// Mock console methods to capture logs during testing
const originalLog = console.log;
const originalError = console.error;
const logs = [];
const errors = [];
console.log = (...args) => {
    logs.push(args.join(' '));
};
console.error = (...args) => {
    errors.push(args.join(' '));
};
class ConcurrencyTestRunner {
    constructor() {
        this.results = [];
        this.concurrency = null;
    }
    async runAllTests() {
        console.log('🚀 Starting PowerScript Concurrency Module Tests...\n');
        const tests = [
            this.testBasicInitialization,
            this.testQueueOperations,
            this.testTaskExecution,
            this.testWorkerPoolManagement,
            this.testSchedulerBasics,
            this.testCronJobs,
            this.testIntervalJobs,
            this.testParallelExecution,
            this.testSeriesExecution,
            this.testRetryLogic,
            this.testTaskPriorities,
            this.testErrorHandling,
            this.testMetricsCollection,
            this.testGracefulShutdown
        ];
        for (const test of tests) {
            await this.runTest(test.bind(this));
        }
        this.printResults();
    }
    async runTest(testFn) {
        const testName = testFn.name;
        const startTime = Date.now();
        try {
            logs.length = 0;
            errors.length = 0;
            await testFn();
            const duration = Date.now() - startTime;
            this.results.push({
                name: testName,
                passed: true,
                duration
            });
            console.log(`✅ ${testName} - PASSED (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.results.push({
                name: testName,
                passed: false,
                error: error instanceof Error ? error.message : String(error),
                duration
            });
            console.log(`❌ ${testName} - FAILED (${duration}ms): ${error}`);
        }
    }
    async testBasicInitialization() {
        this.concurrency = new PowerScriptConcurrency({
            maxWorkers: 2,
            maxConcurrentTasks: 10,
            enableLogging: false
        });
        await this.concurrency.initialize();
        const status = this.concurrency.getStatus();
        if (!status.isInitialized) {
            throw new Error('Concurrency system should be initialized');
        }
        if (status.queues !== 1) {
            throw new Error(`Expected 1 default queue, got ${status.queues}`);
        }
        if (status.workerPools !== 1) {
            throw new Error(`Expected 1 default worker pool, got ${status.workerPools}`);
        }
    }
    async testQueueOperations() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        // Create different types of queues
        this.concurrency.createQueue('priority_queue', QueueType.PRIORITY);
        this.concurrency.createQueue('lifo_queue', QueueType.LIFO);
        const priorityQueue = this.concurrency.getQueue('priority_queue');
        const lifoQueue = this.concurrency.getQueue('lifo_queue');
        if (!priorityQueue)
            throw new Error('Priority queue not created');
        if (!lifoQueue)
            throw new Error('LIFO queue not created');
        if (priorityQueue.type !== QueueType.PRIORITY) {
            throw new Error('Priority queue has wrong type');
        }
        if (lifoQueue.type !== QueueType.LIFO) {
            throw new Error('LIFO queue has wrong type');
        }
    }
    async testTaskExecution() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let executed = false;
        const taskId = await this.concurrency.submitTask('default', 'test_task', { message: 'Hello World' }, async (input) => {
            executed = true;
            return `Processed: ${input.message}`;
        });
        // Wait a bit for task execution
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!executed)
            throw new Error('Task was not executed');
        if (!taskId)
            throw new Error('Task ID not returned');
    }
    async testWorkerPoolManagement() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        // Create a custom worker pool
        this.concurrency.createQueue('custom_queue', QueueType.FIFO);
        const pool = await this.concurrency.createWorkerPool('custom_pool', 3, 'custom_queue');
        if (!pool)
            throw new Error('Worker pool not created');
        if (pool.size !== 3)
            throw new Error(`Expected 3 workers, got ${pool.size}`);
        const stats = pool.getStats();
        if (stats.activeWorkers < 0)
            throw new Error('Invalid worker stats');
    }
    async testSchedulerBasics() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let executed = false;
        const futureDate = new Date(Date.now() + 50); // 50ms from now
        const job = this.concurrency.scheduleOnceJob('test_once_job', 'Test One-Time Job', futureDate, async (context) => {
            executed = true;
            return 'Job executed';
        });
        if (!job)
            throw new Error('Job not created');
        if (job.id !== 'test_once_job')
            throw new Error('Job has wrong ID');
        // Wait for job to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!executed)
            throw new Error('Scheduled job was not executed');
    }
    async testCronJobs() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let executionCount = 0;
        // Schedule a job to run every second (simplified cron)
        const job = this.concurrency.scheduleCronJob('cron_test', 'Cron Test Job', '* * * * *', // Every minute (simplified)
        async () => {
            executionCount++;
            return 'Cron executed';
        });
        if (!job)
            throw new Error('Cron job not created');
        if (job.schedule.expression !== '* * * * *')
            throw new Error('Cron expression not set correctly');
    }
    async testIntervalJobs() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let executionCount = 0;
        const job = this.concurrency.scheduleIntervalJob('interval_test', 'Interval Test Job', 50, // 50ms interval
        async () => {
            executionCount++;
            return 'Interval executed';
        });
        if (!job)
            throw new Error('Interval job not created');
        // Wait for a few executions
        await new Promise(resolve => setTimeout(resolve, 150));
        if (executionCount < 1)
            throw new Error('Interval job did not execute');
    }
    async testParallelExecution() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        const tasks = Array.from({ length: 5 }, (_, i) => () => Promise.resolve(i * 2));
        const results = await this.concurrency.parallel(tasks, 3);
        if (results.length !== 5)
            throw new Error(`Expected 5 results, got ${results.length}`);
        if (results[0] !== 0)
            throw new Error('First result should be 0');
        if (results[4] !== 8)
            throw new Error('Last result should be 8');
    }
    async testSeriesExecution() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        const executionOrder = [];
        const tasks = Array.from({ length: 3 }, (_, i) => async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            executionOrder.push(i);
            return i;
        });
        const results = await this.concurrency.series(tasks);
        if (results.length !== 3)
            throw new Error(`Expected 3 results, got ${results.length}`);
        if (executionOrder.join(',') !== '0,1,2')
            throw new Error('Tasks did not execute in series');
    }
    async testRetryLogic() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let attemptCount = 0;
        try {
            await this.concurrency.retry(async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Simulated failure');
                }
                return 'Success on attempt 3';
            }, 3, 10);
        }
        catch (error) {
            // Should not reach here
        }
        if (attemptCount !== 3)
            throw new Error(`Expected 3 attempts, got ${attemptCount}`);
    }
    async testTaskPriorities() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        const priorityQueue = this.concurrency.getQueue('priority_queue');
        if (!priorityQueue)
            throw new Error('Priority queue not found');
        const executionOrder = [];
        // Submit tasks with different priorities
        await this.concurrency.submitTask('priority_queue', 'low_priority', 'low', async (input) => {
            executionOrder.push(input);
            return input;
        }, { priority: TaskPriority.LOW });
        await this.concurrency.submitTask('priority_queue', 'high_priority', 'high', async (input) => {
            executionOrder.push(input);
            return input;
        }, { priority: TaskPriority.HIGH });
        await this.concurrency.submitTask('priority_queue', 'critical_priority', 'critical', async (input) => {
            executionOrder.push(input);
            return input;
        }, { priority: TaskPriority.CRITICAL });
        priorityQueue.start();
        // Wait for tasks to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        // Higher priority tasks should execute first
        if (executionOrder[0] !== 'critical') {
            throw new Error('Critical priority task should execute first');
        }
    }
    async testErrorHandling() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        let errorCaught = false;
        try {
            await this.concurrency.submitTask('nonexistent_queue', 'error_task', {}, async () => 'should not execute');
        }
        catch (error) {
            errorCaught = true;
        }
        if (!errorCaught)
            throw new Error('Should have thrown error for nonexistent queue');
        // Test task execution error
        let taskErrorHandled = false;
        this.concurrency.on('taskFailed', () => {
            taskErrorHandled = true;
        });
        await this.concurrency.submitTask('default', 'failing_task', {}, async () => {
            throw new Error('Intentional task failure');
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!taskErrorHandled)
            throw new Error('Task error was not handled properly');
    }
    async testMetricsCollection() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        const initialMetrics = this.concurrency.getMetrics();
        if (typeof initialMetrics.workers.totalWorkers !== 'number') {
            throw new Error('Invalid worker metrics');
        }
        if (typeof initialMetrics.tasks.totalTasks !== 'number') {
            throw new Error('Invalid task metrics');
        }
        const status = this.concurrency.getStatus();
        if (typeof status.queues !== 'number') {
            throw new Error('Invalid status metrics');
        }
    }
    async testGracefulShutdown() {
        if (!this.concurrency)
            throw new Error('Concurrency not initialized');
        // Submit a long-running task
        this.concurrency.submitTask('default', 'long_task', {}, async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'completed';
        });
        // Shutdown should handle this gracefully
        await this.concurrency.shutdown(1000);
        const status = this.concurrency.getStatus();
        if (status.isInitialized) {
            throw new Error('System should be shutdown');
        }
    }
    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        const total = this.results.length;
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`📈 Success Rate: ${successRate}%`);
        if (failed > 0) {
            console.log('\n💥 Failed Tests:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.name}: ${result.error}`);
            });
        }
        const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
        console.log(`⏱️  Average Duration: ${avgDuration.toFixed(1)}ms`);
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;
        if (passed === total) {
            console.log('\n🎉 All tests passed! PowerScript Concurrency Module is working correctly.');
        }
        else {
            console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.`);
        }
    }
}
// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new ConcurrencyTestRunner();
    runner.runAllTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}
export { ConcurrencyTestRunner };
