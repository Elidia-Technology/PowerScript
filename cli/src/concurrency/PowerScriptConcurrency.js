"use strict";
/**
 * PowerScript Concurrency & Scheduling Module - Main Orchestrator
 * Comprehensive parallel processing, worker management, and task scheduling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptConcurrency = void 0;
const events_1 = require("events");
const TaskQueue_1 = require("./queues/TaskQueue");
const WorkerPool_1 = require("./workers/WorkerPool");
const TaskScheduler_1 = require("./scheduling/TaskScheduler");
const types_1 = require("./types");
class PowerScriptConcurrency extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.queues = new Map();
        this.workerPools = new Map();
        this.isInitialized = false;
        this.config = {
            maxWorkers: config.maxWorkers ?? 4,
            maxConcurrentTasks: config.maxConcurrentTasks ?? 100,
            taskTimeout: config.taskTimeout ?? 30000,
            retryAttempts: config.retryAttempts ?? 3,
            retryDelay: config.retryDelay ?? 1000,
            enableMetrics: config.enableMetrics ?? true,
            enableLogging: config.enableLogging ?? true
        };
        this.scheduler = new TaskScheduler_1.TaskScheduler({
            maxConcurrentJobs: this.config.maxConcurrentTasks,
            enableMetrics: this.config.enableMetrics
        });
        this._setupEventHandlers();
    }
    /**
     * Initialize the concurrency system
     */
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Create default queue and worker pool
            this.createQueue('default', types_1.QueueType.FIFO);
            await this.createWorkerPool('default', this.config.maxWorkers, 'default');
            this.scheduler.start();
            this.isInitialized = true;
            this._log('PowerScriptConcurrency initialized successfully');
            this._emitEvent(types_1.EventType.WORKER_CREATED, {
                message: 'Concurrency system initialized',
                config: this.config
            });
        }
        catch (error) {
            throw new types_1.ConcurrencyError(`Failed to initialize concurrency system: ${error}`, 'INIT_ERROR');
        }
    }
    /**
     * Shutdown the concurrency system gracefully
     */
    async shutdown(timeout = 30000) {
        if (!this.isInitialized)
            return;
        try {
            this._log('Shutting down concurrency system...');
            // Stop scheduler
            this.scheduler.stop();
            // Stop all queues
            for (const queue of this.queues.values()) {
                queue.stop();
            }
            // Stop all worker pools
            const shutdownPromises = Array.from(this.workerPools.values()).map(pool => pool.stop(timeout));
            await Promise.allSettled(shutdownPromises);
            this.isInitialized = false;
            this._log('Concurrency system shutdown complete');
        }
        catch (error) {
            throw new types_1.ConcurrencyError(`Error during shutdown: ${error}`, 'SHUTDOWN_ERROR');
        }
    }
    // ============================================================================
    // QUEUE MANAGEMENT
    // ============================================================================
    /**
     * Create a new task queue
     */
    createQueue(queueId, type = types_1.QueueType.FIFO, options = {}, name) {
        if (this.queues.has(queueId)) {
            throw new types_1.ConcurrencyError(`Queue '${queueId}' already exists`, 'QUEUE_EXISTS');
        }
        const queue = new TaskQueue_1.TaskQueue(queueId, type, options, name);
        this.queues.set(queueId, queue);
        // Forward queue events
        queue.on('event', (event) => this.emit('event', event));
        queue.on('taskCompleted', (task) => this.emit('taskCompleted', task));
        queue.on('taskFailed', (task) => this.emit('taskFailed', task));
        this._log(`Created queue '${queueId}' of type '${type}'`);
        return queue;
    }
    /**
     * Get a queue by ID
     */
    getQueue(queueId) {
        return this.queues.get(queueId);
    }
    /**
     * Remove a queue
     */
    async removeQueue(queueId) {
        const queue = this.queues.get(queueId);
        if (!queue)
            return false;
        queue.stop();
        await queue.drain();
        this.queues.delete(queueId);
        this._log(`Removed queue '${queueId}'`);
        return true;
    }
    /**
     * Submit a task to a queue
     */
    async submitTask(queueId, taskType, input, handler, options = {}) {
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new types_1.ConcurrencyError(`Queue '${queueId}' not found`, 'QUEUE_NOT_FOUND');
        }
        return queue.enqueue(taskType, input, handler, {
            ...options,
            timeout: options.timeout ?? this.config.taskTimeout,
            retries: options.retries ?? this.config.retryAttempts
        });
    }
    // ============================================================================
    // WORKER POOL MANAGEMENT
    // ============================================================================
    /**
     * Create a new worker pool
     */
    async createWorkerPool(poolId, size, queueId, workerConfig = {}) {
        if (this.workerPools.has(poolId)) {
            throw new types_1.ConcurrencyError(`Worker pool '${poolId}' already exists`, 'POOL_EXISTS');
        }
        const queue = this.queues.get(queueId);
        if (!queue) {
            throw new types_1.ConcurrencyError(`Queue '${queueId}' not found for worker pool`, 'QUEUE_NOT_FOUND');
        }
        const pool = new WorkerPool_1.WorkerPool(poolId, size, queue, workerConfig);
        this.workerPools.set(poolId, pool);
        // Forward worker pool events
        pool.on('event', (event) => this.emit('event', event));
        pool.on('taskCompleted', (task) => this.emit('taskCompleted', task));
        pool.on('taskFailed', (task) => this.emit('taskFailed', task));
        await pool.start();
        this._log(`Created worker pool '${poolId}' with ${size} workers`);
        return pool;
    }
    /**
     * Get a worker pool by ID
     */
    getWorkerPool(poolId) {
        return this.workerPools.get(poolId);
    }
    /**
     * Remove a worker pool
     */
    async removeWorkerPool(poolId, timeout = 10000) {
        const pool = this.workerPools.get(poolId);
        if (!pool)
            return false;
        await pool.stop(timeout);
        this.workerPools.delete(poolId);
        this._log(`Removed worker pool '${poolId}'`);
        return true;
    }
    // ============================================================================
    // JOB SCHEDULING
    // ============================================================================
    /**
     * Schedule a cron job
     */
    scheduleCronJob(jobId, name, cronExpression, handler, options = {}) {
        const job = this.scheduler.scheduleCronJob(jobId, name, cronExpression, handler, options);
        this._log(`Scheduled cron job '${jobId}': ${cronExpression}`);
        return job;
    }
    /**
     * Schedule an interval job
     */
    scheduleIntervalJob(jobId, name, intervalMs, handler, options = {}) {
        const job = this.scheduler.scheduleIntervalJob(jobId, name, intervalMs, handler, options);
        this._log(`Scheduled interval job '${jobId}': every ${intervalMs}ms`);
        return job;
    }
    /**
     * Schedule a one-time job
     */
    scheduleOnceJob(jobId, name, runAt, handler, options = {}) {
        const job = this.scheduler.scheduleOnceJob(jobId, name, runAt, handler, options);
        this._log(`Scheduled one-time job '${jobId}' for ${runAt.toISOString()}`);
        return job;
    }
    /**
     * Cancel a scheduled job
     */
    cancelJob(jobId) {
        const result = this.scheduler.cancelJob(jobId);
        if (result) {
            this._log(`Cancelled job '${jobId}'`);
        }
        return result;
    }
    /**
     * Execute a job immediately
     */
    async executeJobNow(jobId) {
        const result = await this.scheduler.executeJobNow(jobId);
        this._log(`Executed job '${jobId}' immediately`);
        return result;
    }
    // ============================================================================
    // CONVENIENCE METHODS
    // ============================================================================
    /**
     * Execute a simple parallel task
     */
    async parallel(tasks, concurrency = this.config.maxWorkers) {
        const queueId = `parallel_${Date.now()}`;
        try {
            // Create temporary queue and worker pool
            this.createQueue(queueId, types_1.QueueType.FIFO, { concurrency });
            await this.createWorkerPool(`${queueId}_pool`, concurrency, queueId);
            // Submit all tasks
            const taskPromises = tasks.map((task, index) => this.submitTask(queueId, `parallel_task_${index}`, null, task));
            // Wait for all tasks to complete
            const taskIds = await Promise.all(taskPromises);
            const queue = this.getQueue(queueId);
            // Wait for queue to drain
            await queue.drain();
            // Collect results
            const results = [];
            for (const taskId of taskIds) {
                const task = queue.getTask(taskId);
                if (task && task.output !== undefined) {
                    results.push(task.output);
                }
            }
            return results;
        }
        finally {
            // Clean up temporary resources
            await this.removeWorkerPool(`${queueId}_pool`);
            await this.removeQueue(queueId);
        }
    }
    /**
     * Execute tasks in series with optional concurrency limit
     */
    async series(tasks) {
        const results = [];
        for (const task of tasks) {
            try {
                const result = await task();
                results.push(result);
            }
            catch (error) {
                throw new types_1.ConcurrencyError(`Series execution failed: ${error}`, 'SERIES_ERROR');
            }
        }
        return results;
    }
    /**
     * Execute a task with retry logic
     */
    async retry(task, maxAttempts = this.config.retryAttempts, delay = this.config.retryDelay) {
        let lastError = new Error('Unknown error');
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await task();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                }
            }
        }
        throw new types_1.ConcurrencyError(`Task failed after ${maxAttempts} attempts: ${lastError.message}`, 'RETRY_EXHAUSTED');
    }
    // ============================================================================
    // MONITORING AND METRICS
    // ============================================================================
    /**
     * Get comprehensive system metrics
     */
    getMetrics() {
        const queueMetrics = {};
        for (const [queueId, queue] of this.queues) {
            queueMetrics[queueId] = queue.getStats();
        }
        const jobMetrics = {};
        for (const job of this.scheduler.getAllJobs()) {
            jobMetrics[job.id] = job.metrics;
        }
        // Calculate worker metrics
        const allWorkerStats = Array.from(this.workerPools.values()).map(pool => pool.getStats());
        const totalWorkers = allWorkerStats.reduce((sum, stats) => sum + stats.activeWorkers + stats.idleWorkers + stats.errorWorkers, 0);
        const activeWorkers = allWorkerStats.reduce((sum, stats) => sum + stats.activeWorkers, 0);
        const totalTasksExecuted = allWorkerStats.reduce((sum, stats) => sum + stats.completedTasks + stats.failedTasks, 0);
        // Calculate task metrics
        const totalTasks = allWorkerStats.reduce((sum, stats) => sum + stats.totalTasks, 0);
        const completedTasks = allWorkerStats.reduce((sum, stats) => sum + stats.completedTasks, 0);
        const failedTasks = allWorkerStats.reduce((sum, stats) => sum + stats.failedTasks, 0);
        const avgExecutionTime = allWorkerStats.length > 0 ?
            allWorkerStats.reduce((sum, stats) => sum + stats.averageExecutionTime, 0) / allWorkerStats.length : 0;
        return {
            workers: {
                totalWorkers,
                activeWorkers,
                idleWorkers: totalWorkers - activeWorkers,
                averageTasksPerWorker: totalWorkers > 0 ? totalTasksExecuted / totalWorkers : 0,
                totalTasksExecuted
            },
            tasks: {
                totalTasks,
                completedTasks,
                failedTasks,
                averageExecutionTime: avgExecutionTime,
                averageWaitTime: 0, // Would need more detailed tracking
                throughputPerSecond: 0 // Would need time-based calculations
            },
            queues: queueMetrics,
            jobs: jobMetrics,
            workflows: {
                totalWorkflows: 0,
                activeWorkflows: 0,
                completedWorkflows: 0,
                failedWorkflows: 0,
                averageExecutionTime: 0
            }
        };
    }
    /**
     * Get system status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            queues: this.queues.size,
            workerPools: this.workerPools.size,
            scheduledJobs: this.scheduler.getAllJobs().length,
            schedulerRunning: this.scheduler.getStats().isRunning
        };
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    _setupEventHandlers() {
        // Forward scheduler events
        this.scheduler.on('event', (event) => this.emit('event', event));
        // Log important events if logging is enabled
        if (this.config.enableLogging) {
            this.on('event', (event) => {
                if ([types_1.EventType.TASK_FAILED, types_1.EventType.WORKER_TERMINATED].includes(event.type)) {
                    console.error(`[PowerScriptConcurrency] ${event.type}:`, event.data);
                }
            });
        }
    }
    _emitEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            source: 'concurrency',
            data
        };
        this.emit('event', event);
    }
    _log(message) {
        if (this.config.enableLogging) {
            console.log(`[PowerScriptConcurrency] ${message}`);
        }
    }
}
exports.PowerScriptConcurrency = PowerScriptConcurrency;
