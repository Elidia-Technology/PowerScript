"use strict";
/**
 * PowerScript Concurrency - Worker Pool Implementation
 * Manages a pool of workers for parallel task execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const events_1 = require("events");
const worker_threads_1 = require("worker_threads");
const types_1 = require("../types");
class WorkerPool extends events_1.EventEmitter {
    constructor(id, size, taskQueue, workerConfig = {}) {
        super();
        this.workerConfig = workerConfig;
        this.workers = [];
        this._workerInstances = new Map();
        this._workerTasks = new Map();
        this._isShutdown = false;
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
    async start() {
        if (this._isShutdown) {
            throw new types_1.WorkerError('Cannot start shutdown worker pool', this.id);
        }
        for (const worker of this.workers) {
            if (worker.status === types_1.WorkerStatus.IDLE) {
                await this._startWorker(worker);
            }
        }
        this.taskQueue.start();
        this._emitEvent(types_1.EventType.WORKER_CREATED, { poolId: this.id, workerCount: this.size });
    }
    /**
     * Stop the worker pool gracefully
     */
    async stop(timeout = 30000) {
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
    async submitTask(type, input, handler, options = {}) {
        if (this._isShutdown) {
            throw new types_1.WorkerError('Cannot submit task to shutdown worker pool', this.id);
        }
        return this.taskQueue.enqueue(type, input, handler, options);
    }
    /**
     * Get worker pool statistics
     */
    getStats() {
        const activeWorkers = this.workers.filter(w => w.status === types_1.WorkerStatus.BUSY).length;
        const idleWorkers = this.workers.filter(w => w.status === types_1.WorkerStatus.IDLE).length;
        const errorWorkers = this.workers.filter(w => w.status === types_1.WorkerStatus.ERROR).length;
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
    async resize(newSize) {
        const targetSize = Math.max(1, newSize);
        const currentSize = this.workers.length;
        if (targetSize > currentSize) {
            // Add workers
            for (let i = currentSize; i < targetSize; i++) {
                const worker = this._createWorker(i);
                this.workers.push(worker);
                await this._startWorker(worker);
            }
        }
        else if (targetSize < currentSize) {
            // Remove workers
            const workersToRemove = this.workers.slice(targetSize);
            this.workers = this.workers.slice(0, targetSize);
            for (const worker of workersToRemove) {
                await this._stopWorker(worker);
            }
        }
        this.metrics.activeWorkers = this.workers.filter(w => w.status === types_1.WorkerStatus.BUSY).length;
    }
    /**
     * Restart a specific worker
     */
    async restartWorker(workerId) {
        const worker = this.workers.find(w => w.id === workerId);
        if (!worker) {
            throw new types_1.WorkerError(`Worker ${workerId} not found`, this.id);
        }
        await this._stopWorker(worker);
        await this._startWorker(worker);
    }
    /**
     * Get information about a specific worker
     */
    getWorker(workerId) {
        return this.workers.find(w => w.id === workerId);
    }
    _initializeWorkers() {
        for (let i = 0; i < this.size; i++) {
            const worker = this._createWorker(i);
            this.workers.push(worker);
        }
    }
    _createWorker(index) {
        const workerId = `${this.id}_worker_${index}`;
        return {
            id: workerId,
            status: types_1.WorkerStatus.IDLE,
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            createdAt: new Date()
        };
    }
    async _startWorker(worker) {
        if (!worker_threads_1.isMainThread)
            return; // Only create workers in main thread
        try {
            const workerInstance = new worker_threads_1.Worker(`
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
        `, {
                eval: true,
                workerData: {
                    workerId: worker.id,
                    config: this.workerConfig
                },
                resourceLimits: this._getResourceLimits()
            });
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
            worker.status = types_1.WorkerStatus.IDLE;
            worker.lastActivity = new Date();
        }
        catch (error) {
            worker.status = types_1.WorkerStatus.ERROR;
            throw new types_1.WorkerError(`Failed to start worker ${worker.id}: ${error}`, worker.id);
        }
    }
    async _stopWorker(worker, timeout = 10000) {
        const workerInstance = this._workerInstances.get(worker.id);
        if (!workerInstance)
            return;
        worker.status = types_1.WorkerStatus.TERMINATED;
        this._workerInstances.delete(worker.id);
        try {
            await workerInstance.terminate();
        }
        catch (error) {
            console.error(`Error terminating worker ${worker.id}:`, error);
        }
    }
    _handleWorkerMessage(worker, message) {
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
    _handleTaskCompleted(worker, taskId, result) {
        const task = this._workerTasks.get(taskId);
        if (!task)
            return;
        task.output = result;
        task.status = types_1.TaskStatus.COMPLETED;
        task.context.completedAt = new Date();
        worker.successfulTasks++;
        worker.totalTasks++;
        worker.status = types_1.WorkerStatus.IDLE;
        worker.lastActivity = new Date();
        worker.currentTask = undefined;
        this.metrics.completedTasks++;
        this.metrics.totalTasks++;
        this._updateAverageExecutionTime(task);
        this._workerTasks.delete(taskId);
        this._emitTaskEvent(task, types_1.EventType.TASK_COMPLETED, { workerId: worker.id, result });
    }
    _handleTaskFailed(worker, taskId, error) {
        const task = this._workerTasks.get(taskId);
        if (!task)
            return;
        task.error = error;
        task.status = types_1.TaskStatus.FAILED;
        task.context.completedAt = new Date();
        worker.failedTasks++;
        worker.totalTasks++;
        worker.status = types_1.WorkerStatus.IDLE;
        worker.lastActivity = new Date();
        worker.currentTask = undefined;
        this.metrics.failedTasks++;
        this.metrics.totalTasks++;
        this._workerTasks.delete(taskId);
        this._emitTaskEvent(task, types_1.EventType.TASK_FAILED, { workerId: worker.id, error: error.message });
    }
    _handleWorkerError(worker, error) {
        worker.status = types_1.WorkerStatus.ERROR;
        console.error(`Worker ${worker.id} error:`, error);
        if (this.workerConfig.restartOnFailure) {
            setTimeout(() => {
                this._startWorker(worker).catch(err => {
                    console.error(`Failed to restart worker ${worker.id}:`, err);
                });
            }, 1000);
        }
    }
    _handleWorkerExit(worker, code) {
        worker.status = types_1.WorkerStatus.TERMINATED;
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
    _setupTaskQueueHandlers() {
        this.taskQueue.on('taskCompleted', (task) => {
            this.emit('taskCompleted', task);
        });
        this.taskQueue.on('taskFailed', (task) => {
            this.emit('taskFailed', task);
        });
        // Assign tasks to available workers
        this.taskQueue.on('event', (event) => {
            if (event.type === types_1.EventType.TASK_STARTED) {
                this._assignTaskToWorker(event.data.taskId);
            }
        });
    }
    _assignTaskToWorker(taskId) {
        const task = this.taskQueue.getTask(taskId);
        if (!task || task.status !== types_1.TaskStatus.RUNNING)
            return;
        const availableWorker = this.workers.find(w => w.status === types_1.WorkerStatus.IDLE);
        if (!availableWorker)
            return;
        const workerInstance = this._workerInstances.get(availableWorker.id);
        if (!workerInstance)
            return;
        availableWorker.status = types_1.WorkerStatus.BUSY;
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
    _getResourceLimits() {
        const limits = this.workerConfig.resourceLimits;
        if (!limits)
            return undefined;
        return {
            maxOldGenerationSizeMb: limits.memory,
            maxYoungGenerationSizeMb: Math.floor((limits.memory || 128) * 0.1),
            codeRangeSizeMb: 16
        };
    }
    _updateAverageExecutionTime(task) {
        if (task.context.startedAt && task.context.completedAt) {
            const executionTime = task.context.completedAt.getTime() - task.context.startedAt.getTime();
            const completedBefore = this.metrics.completedTasks - 1;
            this.metrics.averageExecutionTime = completedBefore > 0 ?
                ((this.metrics.averageExecutionTime * completedBefore) + executionTime) / this.metrics.completedTasks :
                executionTime;
        }
    }
    _emitTaskEvent(task, eventType, data = {}) {
        const event = {
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
    _emitEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            source: `pool:${this.id}`,
            data
        };
        this.emit('event', event);
    }
}
exports.WorkerPool = WorkerPool;
