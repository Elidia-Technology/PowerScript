/**
 * PowerScript Concurrency & Scheduling Module - Main Orchestrator
 * Comprehensive parallel processing, worker management, and task scheduling
 */

import { EventEmitter } from 'events';
import { TaskQueue } from './queues/TaskQueue';
import { WorkerPool } from './workers/WorkerPool';
import { TaskScheduler } from './scheduling/TaskScheduler';
import {
  ConcurrencyConfig,
  QueueType,
  QueueOptions,
  WorkerConfig,
  SchedulerConfig,
  TaskHandler,
  JobHandler,
  Schedule,
  JobOptions,
  TaskPriority,
  Job,
  Task,
  ConcurrencyMetrics,
  ConcurrencyEvent,
  ConcurrencyError,
  EventType
} from './types';

export class PowerScriptConcurrency extends EventEmitter {
  private config: Required<ConcurrencyConfig>;
  private queues = new Map<string, TaskQueue>();
  private workerPools = new Map<string, WorkerPool>();
  private scheduler: TaskScheduler;
  private isInitialized = false;

  constructor(config: ConcurrencyConfig = {}) {
    super();
    
    this.config = {
      maxWorkers: config.maxWorkers ?? 4,
      maxConcurrentTasks: config.maxConcurrentTasks ?? 100,
      taskTimeout: config.taskTimeout ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      enableMetrics: config.enableMetrics ?? true,
      enableLogging: config.enableLogging ?? true
    };

    this.scheduler = new TaskScheduler({
      maxConcurrentJobs: this.config.maxConcurrentTasks,
      enableMetrics: this.config.enableMetrics
    });

    this._setupEventHandlers();
  }

  /**
   * Initialize the concurrency system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create default queue and worker pool
      this.createQueue('default', QueueType.FIFO);
      await this.createWorkerPool('default', this.config.maxWorkers, 'default');

      this.scheduler.start();
      this.isInitialized = true;

      this._log('PowerScriptConcurrency initialized successfully');
      this._emitEvent(EventType.WORKER_CREATED, { 
        message: 'Concurrency system initialized',
        config: this.config 
      });

    } catch (error) {
      throw new ConcurrencyError(`Failed to initialize concurrency system: ${error}`, 'INIT_ERROR');
    }
  }

  /**
   * Shutdown the concurrency system gracefully
   */
  async shutdown(timeout: number = 30000): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this._log('Shutting down concurrency system...');

      // Stop scheduler
      this.scheduler.stop();

      // Stop all queues
      for (const queue of this.queues.values()) {
        queue.stop();
      }

      // Stop all worker pools
      const shutdownPromises = Array.from(this.workerPools.values()).map(
        pool => pool.stop(timeout)
      );
      await Promise.allSettled(shutdownPromises);

      this.isInitialized = false;
      this._log('Concurrency system shutdown complete');

    } catch (error) {
      throw new ConcurrencyError(`Error during shutdown: ${error}`, 'SHUTDOWN_ERROR');
    }
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Create a new task queue
   */
  createQueue(
    queueId: string, 
    type: QueueType = QueueType.FIFO, 
    options: QueueOptions = {},
    name?: string
  ): TaskQueue {
    if (this.queues.has(queueId)) {
      throw new ConcurrencyError(`Queue '${queueId}' already exists`, 'QUEUE_EXISTS');
    }

    const queue = new TaskQueue(queueId, type, options, name);
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
  getQueue(queueId: string): TaskQueue | undefined {
    return this.queues.get(queueId);
  }

  /**
   * Remove a queue
   */
  async removeQueue(queueId: string): Promise<boolean> {
    const queue = this.queues.get(queueId);
    if (!queue) return false;

    queue.stop();
    await queue.drain();
    this.queues.delete(queueId);

    this._log(`Removed queue '${queueId}'`);
    return true;
  }

  /**
   * Submit a task to a queue
   */
  async submitTask<TInput, TOutput>(
    queueId: string,
    taskType: string,
    input: TInput,
    handler: TaskHandler<TInput, TOutput>,
    options: {
      priority?: TaskPriority;
      timeout?: number;
      retries?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new ConcurrencyError(`Queue '${queueId}' not found`, 'QUEUE_NOT_FOUND');
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
  async createWorkerPool(
    poolId: string,
    size: number,
    queueId: string,
    workerConfig: WorkerConfig = {}
  ): Promise<WorkerPool> {
    if (this.workerPools.has(poolId)) {
      throw new ConcurrencyError(`Worker pool '${poolId}' already exists`, 'POOL_EXISTS');
    }

    const queue = this.queues.get(queueId);
    if (!queue) {
      throw new ConcurrencyError(`Queue '${queueId}' not found for worker pool`, 'QUEUE_NOT_FOUND');
    }

    const pool = new WorkerPool(poolId, size, queue, workerConfig);
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
  getWorkerPool(poolId: string): WorkerPool | undefined {
    return this.workerPools.get(poolId);
  }

  /**
   * Remove a worker pool
   */
  async removeWorkerPool(poolId: string, timeout: number = 10000): Promise<boolean> {
    const pool = this.workerPools.get(poolId);
    if (!pool) return false;

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
  scheduleCronJob(
    jobId: string,
    name: string,
    cronExpression: string,
    handler: JobHandler,
    options: JobOptions = {}
  ): Job {
    const job = this.scheduler.scheduleCronJob(jobId, name, cronExpression, handler, options);
    this._log(`Scheduled cron job '${jobId}': ${cronExpression}`);
    return job;
  }

  /**
   * Schedule an interval job
   */
  scheduleIntervalJob(
    jobId: string,
    name: string,
    intervalMs: number,
    handler: JobHandler,
    options: JobOptions = {}
  ): Job {
    const job = this.scheduler.scheduleIntervalJob(jobId, name, intervalMs, handler, options);
    this._log(`Scheduled interval job '${jobId}': every ${intervalMs}ms`);
    return job;
  }

  /**
   * Schedule a one-time job
   */
  scheduleOnceJob(
    jobId: string,
    name: string,
    runAt: Date,
    handler: JobHandler,
    options: JobOptions = {}
  ): Job {
    const job = this.scheduler.scheduleOnceJob(jobId, name, runAt, handler, options);
    this._log(`Scheduled one-time job '${jobId}' for ${runAt.toISOString()}`);
    return job;
  }

  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId: string): boolean {
    const result = this.scheduler.cancelJob(jobId);
    if (result) {
      this._log(`Cancelled job '${jobId}'`);
    }
    return result;
  }

  /**
   * Execute a job immediately
   */
  async executeJobNow(jobId: string): Promise<any> {
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
  async parallel<T>(
    tasks: Array<() => Promise<T> | T>,
    concurrency: number = this.config.maxWorkers
  ): Promise<T[]> {
    const queueId = `parallel_${Date.now()}`;
    
    try {
      // Create temporary queue and worker pool
      this.createQueue(queueId, QueueType.FIFO, { concurrency });
      await this.createWorkerPool(`${queueId}_pool`, concurrency, queueId);

      // Submit all tasks
      const taskPromises = tasks.map((task, index) => 
        this.submitTask(queueId, `parallel_task_${index}`, null, task)
      );

      // Wait for all tasks to complete
      const taskIds = await Promise.all(taskPromises);
      const queue = this.getQueue(queueId)!;
      
      // Wait for queue to drain
      await queue.drain();

      // Collect results
      const results: T[] = [];
      for (const taskId of taskIds) {
        const task = queue.getTask(taskId);
        if (task && task.output !== undefined) {
          results.push(task.output);
        }
      }

      return results;

    } finally {
      // Clean up temporary resources
      await this.removeWorkerPool(`${queueId}_pool`);
      await this.removeQueue(queueId);
    }
  }

  /**
   * Execute tasks in series with optional concurrency limit
   */
  async series<T>(
    tasks: Array<() => Promise<T> | T>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const task of tasks) {
      try {
        const result = await task();
        results.push(result);
      } catch (error) {
        throw new ConcurrencyError(`Series execution failed: ${error}`, 'SERIES_ERROR');
      }
    }

    return results;
  }

  /**
   * Execute a task with retry logic
   */
  async retry<T>(
    task: () => Promise<T> | T,
    maxAttempts: number = this.config.retryAttempts,
    delay: number = this.config.retryDelay
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw new ConcurrencyError(
      `Task failed after ${maxAttempts} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED'
    );
  }

  // ============================================================================
  // MONITORING AND METRICS
  // ============================================================================

  /**
   * Get comprehensive system metrics
   */
  getMetrics(): ConcurrencyMetrics {
    const queueMetrics: any = {};
    for (const [queueId, queue] of this.queues) {
      queueMetrics[queueId] = queue.getStats();
    }

    const jobMetrics: any = {};
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
  getStatus(): {
    isInitialized: boolean;
    queues: number;
    workerPools: number;
    scheduledJobs: number;
    schedulerRunning: boolean;
  } {
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

  private _setupEventHandlers(): void {
    // Forward scheduler events
    this.scheduler.on('event', (event) => this.emit('event', event));

    // Log important events if logging is enabled
    if (this.config.enableLogging) {
      this.on('event', (event: ConcurrencyEvent) => {
        if ([EventType.TASK_FAILED, EventType.WORKER_TERMINATED].includes(event.type)) {
          console.error(`[PowerScriptConcurrency] ${event.type}:`, event.data);
        }
      });
    }
  }

  private _emitEvent(eventType: EventType, data: any): void {
    const event: ConcurrencyEvent = {
      type: eventType,
      timestamp: new Date(),
      source: 'concurrency',
      data
    };

    this.emit('event', event);
  }

  private _log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[PowerScriptConcurrency] ${message}`);
    }
  }
}