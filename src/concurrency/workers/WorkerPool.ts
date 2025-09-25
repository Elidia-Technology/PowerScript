/**
 * PowerScript Concurrency - Worker Pool Implementation
 * Manages a pool of workers for parallel task execution
 */

import { EventEmitter } from 'events';
import { Worker as NodeWorker, isMainThread, parentPort, workerData } from 'worker_threads';
import {
  Worker,
  WorkerPool as IWorkerPool,
  WorkerConfig,
  WorkerStatus,
  WorkerPoolMetrics,
  TaskQueue as ITaskQueue,
  TaskContext,
  Task,
  TaskStatus,
  WorkerError,
  ConcurrencyEvent,
  EventType,
  ResourceLimits
} from '../types';
import { TaskQueue } from '../queues/TaskQueue';

export class WorkerPool extends EventEmitter implements IWorkerPool {
  public readonly id: string;
  public readonly size: number;
  public workers: Worker[] = [];
  public taskQueue: TaskQueue;
  public metrics: WorkerPoolMetrics;

  private _workerInstances = new Map<string, NodeWorker>();
  private _workerTasks = new Map<string, Task>();
  private _isShutdown = false;

  constructor(
    id: string,
    size: number,
    taskQueue: TaskQueue,
    private workerConfig: WorkerConfig = {}
  ) {
    super();
    this.id = id;
    this.size = Math.max(1, size);
    this.taskQueue = taskQueue;
    
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageExecutionTime: 0,
      activeWorkers: 0,
      queueLength: 0
    };

    this._initializeWorkers();
    this._setupTaskQueueHandlers();
  }

  /**
   * Start the worker pool
   */
  async start(): Promise<void> {
    if (this._isShutdown) {
      throw new WorkerError('Cannot start shutdown worker pool', this.id);
    }

    for (const worker of this.workers) {
      if (worker.status === WorkerStatus.IDLE) {
        await this._startWorker(worker);
      }
    }

    this.taskQueue.start();
    this._emitEvent(EventType.WORKER_CREATED, { poolId: this.id, workerCount: this.size });
  }

  /**
   * Stop the worker pool gracefully
   */
  async stop(timeout: number = 30000): Promise<void> {
    this._isShutdown = true;
    this.taskQueue.stop();

    const stopPromises = this.workers.map(worker => this._stopWorker(worker, timeout));
    await Promise.allSettled(stopPromises);

    this._workerInstances.clear();
    this._workerTasks.clear();
  }

  /**
   * Add a task to the worker pool
   */
  async submitTask<TInput, TOutput>(
    type: string,
    input: TInput,
    handler: (input: TInput, context: TaskContext) => Promise<TOutput> | TOutput,
    options: any = {}
  ): Promise<string> {
    if (this._isShutdown) {
      throw new WorkerError('Cannot submit task to shutdown worker pool', this.id);
    }

    return this.taskQueue.enqueue(type, input, handler, options);
  }

  /**
   * Get worker pool statistics
   */
  getStats(): WorkerPoolMetrics & {
    activeWorkers: number;
    idleWorkers: number;
    errorWorkers: number;
    queueStats: any;
  } {
    const activeWorkers = this.workers.filter(w => w.status === WorkerStatus.BUSY).length;
    const idleWorkers = this.workers.filter(w => w.status === WorkerStatus.IDLE).length;
    const errorWorkers = this.workers.filter(w => w.status === WorkerStatus.ERROR).length;

    return {
      ...this.metrics,
      activeWorkers,
      idleWorkers,
      errorWorkers,
      queueStats: this.taskQueue.getStats()
    };
  }

  /**
   * Resize the worker pool
   */
  async resize(newSize: number): Promise<void> {
    const targetSize = Math.max(1, newSize);
    const currentSize = this.workers.length;

    if (targetSize > currentSize) {
      // Add workers
      for (let i = currentSize; i < targetSize; i++) {
        const worker = this._createWorker(i);
        this.workers.push(worker);
        await this._startWorker(worker);
      }
    } else if (targetSize < currentSize) {
      // Remove workers
      const workersToRemove = this.workers.slice(targetSize);
      this.workers = this.workers.slice(0, targetSize);

      for (const worker of workersToRemove) {
        await this._stopWorker(worker);
      }
    }

    this.metrics.activeWorkers = this.workers.filter(w => w.status === WorkerStatus.BUSY).length;
  }

  /**
   * Restart a specific worker
   */
  async restartWorker(workerId: string): Promise<void> {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) {
      throw new WorkerError(`Worker ${workerId} not found`, this.id);
    }

    await this._stopWorker(worker);
    await this._startWorker(worker);
  }

  /**
   * Get information about a specific worker
   */
  getWorker(workerId: string): Worker | undefined {
    return this.workers.find(w => w.id === workerId);
  }

  private _initializeWorkers(): void {
    for (let i = 0; i < this.size; i++) {
      const worker = this._createWorker(i);
      this.workers.push(worker);
    }
  }

  private _createWorker(index: number): Worker {
    const workerId = `${this.id}_worker_${index}`;
    
    return {
      id: workerId,
      status: WorkerStatus.IDLE,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      createdAt: new Date()
    };
  }

  private async _startWorker(worker: Worker): Promise<void> {
    if (!isMainThread) return; // Only create workers in main thread

    try {
      const workerInstance = new NodeWorker(
        `
        const { parentPort, workerData } = require('worker_threads');
        
        parentPort.on('message', async (message) => {
          try {
            const { type, taskId, input, handlerCode, context } = message;
            
            if (type === 'EXECUTE_TASK') {
              // Execute the task handler
              const handler = eval(handlerCode);
              const result = await handler(input, context);
              
              parentPort.postMessage({
                type: 'TASK_COMPLETED',
                taskId,
                result
              });
            }
          } catch (error) {
            parentPort.postMessage({
              type: 'TASK_FAILED',
              taskId: message.taskId,
              error: error.message,
              stack: error.stack
            });
          }
        });
        `,
        {
          eval: true,
          workerData: {
            workerId: worker.id,
            config: this.workerConfig
          },
          resourceLimits: this._getResourceLimits()
        }
      );

      this._workerInstances.set(worker.id, workerInstance);

      workerInstance.on('message', (message) => {
        this._handleWorkerMessage(worker, message);
      });

      workerInstance.on('error', (error) => {
        this._handleWorkerError(worker, error);
      });

      workerInstance.on('exit', (code) => {
        this._handleWorkerExit(worker, code);
      });

      worker.status = WorkerStatus.IDLE;
      worker.lastActivity = new Date();

    } catch (error) {
      worker.status = WorkerStatus.ERROR;
      throw new WorkerError(`Failed to start worker ${worker.id}: ${error}`, worker.id);
    }
  }

  private async _stopWorker(worker: Worker, timeout: number = 10000): Promise<void> {
    const workerInstance = this._workerInstances.get(worker.id);
    if (!workerInstance) return;

    worker.status = WorkerStatus.TERMINATED;
    this._workerInstances.delete(worker.id);

    try {
      await workerInstance.terminate();
    } catch (error) {
      console.error(`Error terminating worker ${worker.id}:`, error);
    }
  }

  private _handleWorkerMessage(worker: Worker, message: any): void {
    const { type, taskId, result, error } = message;

    switch (type) {
      case 'TASK_COMPLETED':
        this._handleTaskCompleted(worker, taskId, result);
        break;
      case 'TASK_FAILED':
        this._handleTaskFailed(worker, taskId, new Error(error));
        break;
    }
  }

  private _handleTaskCompleted(worker: Worker, taskId: string, result: any): void {
    const task = this._workerTasks.get(taskId);
    if (!task) return;

    task.output = result;
    task.status = TaskStatus.COMPLETED;
    task.context.completedAt = new Date();

    worker.successfulTasks++;
    worker.totalTasks++;
    worker.status = WorkerStatus.IDLE;
    worker.lastActivity = new Date();
    worker.currentTask = undefined;

    this.metrics.completedTasks++;
    this.metrics.totalTasks++;
    this._updateAverageExecutionTime(task);

    this._workerTasks.delete(taskId);
    this._emitTaskEvent(task, EventType.TASK_COMPLETED, { workerId: worker.id, result });
  }

  private _handleTaskFailed(worker: Worker, taskId: string, error: Error): void {
    const task = this._workerTasks.get(taskId);
    if (!task) return;

    task.error = error;
    task.status = TaskStatus.FAILED;
    task.context.completedAt = new Date();

    worker.failedTasks++;
    worker.totalTasks++;
    worker.status = WorkerStatus.IDLE;
    worker.lastActivity = new Date();
    worker.currentTask = undefined;

    this.metrics.failedTasks++;
    this.metrics.totalTasks++;

    this._workerTasks.delete(taskId);
    this._emitTaskEvent(task, EventType.TASK_FAILED, { workerId: worker.id, error: error.message });
  }

  private _handleWorkerError(worker: Worker, error: Error): void {
    worker.status = WorkerStatus.ERROR;
    console.error(`Worker ${worker.id} error:`, error);

    if (this.workerConfig.restartOnFailure) {
      setTimeout(() => {
        this._startWorker(worker).catch(err => {
          console.error(`Failed to restart worker ${worker.id}:`, err);
        });
      }, 1000);
    }
  }

  private _handleWorkerExit(worker: Worker, code: number): void {
    worker.status = WorkerStatus.TERMINATED;
    this._workerInstances.delete(worker.id);
    
    console.log(`Worker ${worker.id} exited with code ${code}`);

    if (this.workerConfig.restartOnFailure && !this._isShutdown) {
      setTimeout(() => {
        this._startWorker(worker).catch(err => {
          console.error(`Failed to restart worker ${worker.id}:`, err);
        });
      }, 1000);
    }
  }

  private _setupTaskQueueHandlers(): void {
    this.taskQueue.on('taskCompleted', (task: Task) => {
      this.emit('taskCompleted', task);
    });

    this.taskQueue.on('taskFailed', (task: Task) => {
      this.emit('taskFailed', task);
    });

    // Assign tasks to available workers
    this.taskQueue.on('event', (event: ConcurrencyEvent) => {
      if (event.type === EventType.TASK_STARTED) {
        this._assignTaskToWorker(event.data.taskId);
      }
    });
  }

  private _assignTaskToWorker(taskId: string): void {
    const task = this.taskQueue.getTask(taskId);
    if (!task || task.status !== TaskStatus.RUNNING) return;

    const availableWorker = this.workers.find(w => w.status === WorkerStatus.IDLE);
    if (!availableWorker) return;

    const workerInstance = this._workerInstances.get(availableWorker.id);
    if (!workerInstance) return;

    availableWorker.status = WorkerStatus.BUSY;
    availableWorker.currentTask = task.context;
    this._workerTasks.set(taskId, task);

    // Send task to worker
    workerInstance.postMessage({
      type: 'EXECUTE_TASK',
      taskId,
      input: task.input,
      handlerCode: task.handler.toString(),
      context: task.context
    });
  }

  private _getResourceLimits(): import('worker_threads').ResourceLimits | undefined {
    const limits = this.workerConfig.resourceLimits;
    if (!limits) return undefined;

    return {
      maxOldGenerationSizeMb: limits.memory,
      maxYoungGenerationSizeMb: Math.floor((limits.memory || 128) * 0.1),
      codeRangeSizeMb: 16
    };
  }

  private _updateAverageExecutionTime(task: Task): void {
    if (task.context.startedAt && task.context.completedAt) {
      const executionTime = task.context.completedAt.getTime() - task.context.startedAt.getTime();
      const completedBefore = this.metrics.completedTasks - 1;
      
      this.metrics.averageExecutionTime = completedBefore > 0 ?
        ((this.metrics.averageExecutionTime * completedBefore) + executionTime) / this.metrics.completedTasks :
        executionTime;
    }
  }

  private _emitTaskEvent(task: Task, eventType: EventType, data: any = {}): void {
    const event: ConcurrencyEvent = {
      type: eventType,
      timestamp: new Date(),
      source: `pool:${this.id}`,
      data: {
        taskId: task.id,
        taskType: task.type,
        poolId: this.id,
        ...data
      }
    };

    this.emit('event', event);
  }

  private _emitEvent(eventType: EventType, data: any): void {
    const event: ConcurrencyEvent = {
      type: eventType,
      timestamp: new Date(),
      source: `pool:${this.id}`,
      data
    };

    this.emit('event', event);
  }
}