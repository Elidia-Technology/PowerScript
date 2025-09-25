/**
 * PowerScript Concurrency - Task Queue Implementation
 * High-performance task queue with multiple queue types and priority support
 */
import { EventEmitter } from 'events';
import { QueueType, TaskPriority, TaskStatus, QueueError, EventType } from '../types.js';
export class TaskQueue extends EventEmitter {
    constructor(id, type = QueueType.FIFO, options = {}, name) {
        super();
        this.tasks = [];
        this._running = false;
        this._processingTasks = new Set();
        this._concurrentCount = 0;
        this.id = id;
        this.name = name;
        this.type = type;
        this.options = {
            maxSize: options.maxSize ?? 10000,
            concurrency: options.concurrency ?? 1,
            defaultPriority: options.defaultPriority ?? TaskPriority.NORMAL,
            retryAttempts: options.retryAttempts ?? 3,
            retryDelay: options.retryDelay ?? 1000,
            enablePersistence: options.enablePersistence ?? false
        };
        this.metrics = {
            totalEnqueued: 0,
            totalDequeued: 0,
            totalCompleted: 0,
            totalFailed: 0,
            currentSize: 0,
            peakSize: 0,
            averageWaitTime: 0,
            averageProcessingTime: 0
        };
        this._setupEventHandlers();
    }
    /**
     * Add a task to the queue
     */
    async enqueue(type, input, handler, options = {}) {
        if (this.tasks.length >= this.options.maxSize) {
            throw new QueueError(`Queue ${this.id} is full (max size: ${this.options.maxSize})`, this.id);
        }
        const taskId = this._generateTaskId();
        const now = new Date();
        const context = {
            id: taskId,
            name: type,
            metadata: options.metadata || {},
            priority: options.priority ?? this.options.defaultPriority,
            timeout: options.timeout,
            retries: options.retries ?? this.options.retryAttempts,
            createdAt: now
        };
        const task = {
            id: taskId,
            type,
            input,
            context,
            status: TaskStatus.PENDING,
            handler,
            onProgress: options.onProgress,
            onComplete: options.onComplete,
            onError: options.onError
        };
        this._insertTask(task);
        this.metrics.totalEnqueued++;
        this.metrics.currentSize = this.tasks.length;
        this.metrics.peakSize = Math.max(this.metrics.peakSize, this.metrics.currentSize);
        this._emitEvent(EventType.TASK_STARTED, { taskId, type, queueId: this.id });
        if (this._running && this._concurrentCount < this.options.concurrency) {
            setImmediate(() => this._processNext());
        }
        return taskId;
    }
    /**
     * Start processing tasks from the queue
     */
    start() {
        if (this._running)
            return;
        this._running = true;
        this._processNext();
    }
    /**
     * Stop processing tasks from the queue
     */
    stop() {
        this._running = false;
    }
    /**
     * Pause processing (can be resumed)
     */
    pause() {
        this._running = false;
    }
    /**
     * Resume processing
     */
    resume() {
        if (this._running)
            return;
        this.start();
    }
    /**
     * Clear all pending tasks
     */
    clear() {
        const pendingTasks = this.tasks.filter(task => task.status === TaskStatus.PENDING);
        this.tasks = this.tasks.filter(task => task.status !== TaskStatus.PENDING);
        this.metrics.currentSize = this.tasks.length;
        pendingTasks.forEach(task => {
            task.status = TaskStatus.CANCELLED;
            this._emitTaskEvent(task, EventType.TASK_FAILED, { reason: 'Queue cleared' });
        });
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }
    /**
     * Remove a specific task from the queue
     */
    removeTask(taskId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1)
            return false;
        const task = this.tasks[taskIndex];
        if (task.status === TaskStatus.RUNNING) {
            // Cannot remove running task, mark for cancellation
            task.status = TaskStatus.CANCELLED;
            return false;
        }
        this.tasks.splice(taskIndex, 1);
        this.metrics.currentSize = this.tasks.length;
        return true;
    }
    /**
     * Get queue statistics
     */
    getStats() {
        const pendingTasks = this.tasks.filter(task => task.status === TaskStatus.PENDING).length;
        return {
            ...this.metrics,
            isRunning: this._running,
            concurrentTasks: this._concurrentCount,
            pendingTasks
        };
    }
    /**
     * Wait for all tasks to complete
     */
    async drain() {
        return new Promise((resolve) => {
            if (this.tasks.length === 0 && this._concurrentCount === 0) {
                resolve();
                return;
            }
            const checkEmpty = () => {
                if (this.tasks.length === 0 && this._concurrentCount === 0) {
                    this.off('taskCompleted', checkEmpty);
                    this.off('taskFailed', checkEmpty);
                    resolve();
                }
            };
            this.on('taskCompleted', checkEmpty);
            this.on('taskFailed', checkEmpty);
        });
    }
    _insertTask(task) {
        switch (this.type) {
            case QueueType.FIFO:
                this.tasks.push(task);
                break;
            case QueueType.LIFO:
                this.tasks.unshift(task);
                break;
            case QueueType.PRIORITY:
                this._insertByPriority(task);
                break;
            case QueueType.DELAYED:
                // For delayed tasks, we'd need additional scheduling logic
                this.tasks.push(task);
                break;
            default:
                this.tasks.push(task);
        }
    }
    _insertByPriority(task) {
        const priority = task.context.priority;
        let insertIndex = this.tasks.length;
        for (let i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].context.priority < priority) {
                insertIndex = i;
                break;
            }
        }
        this.tasks.splice(insertIndex, 0, task);
    }
    async _processNext() {
        if (!this._running || this._concurrentCount >= this.options.concurrency) {
            return;
        }
        const task = this._getNextTask();
        if (!task)
            return;
        this._concurrentCount++;
        task.status = TaskStatus.RUNNING;
        task.context.startedAt = new Date();
        this._emitTaskEvent(task, EventType.TASK_STARTED);
        try {
            const result = await this._executeTask(task);
            await this._handleTaskSuccess(task, result);
        }
        catch (error) {
            await this._handleTaskError(task, error);
        }
        finally {
            this._concurrentCount--;
            this._removeCompletedTask(task);
            // Process next task if queue is still running
            if (this._running && this._concurrentCount < this.options.concurrency) {
                setImmediate(() => this._processNext());
            }
        }
    }
    _getNextTask() {
        return this.tasks.find(task => task.status === TaskStatus.PENDING &&
            !this._processingTasks.has(task.id));
    }
    async _executeTask(task) {
        this._processingTasks.add(task.id);
        const progressCallback = task.onProgress ?
            (progress, message) => {
                task.onProgress(progress, message);
                this.emit('taskProgress', { task, progress, message });
            } : undefined;
        const timeoutPromise = task.context.timeout ?
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Task ${task.id} timed out after ${task.context.timeout}ms`)), task.context.timeout);
            }) : null;
        const taskPromise = Promise.resolve(task.handler(task.input, task.context, progressCallback));
        if (timeoutPromise) {
            return Promise.race([taskPromise, timeoutPromise]);
        }
        return taskPromise;
    }
    async _handleTaskSuccess(task, result) {
        task.status = TaskStatus.COMPLETED;
        task.output = result;
        task.context.completedAt = new Date();
        this.metrics.totalCompleted++;
        this.metrics.totalDequeued++;
        this._updateAverageProcessingTime(task);
        if (task.onComplete) {
            try {
                task.onComplete(result, task.context);
            }
            catch (error) {
                console.error(`Error in task completion callback for ${task.id}:`, error);
            }
        }
        this._emitTaskEvent(task, EventType.TASK_COMPLETED, { result });
        this.emit('taskCompleted', task);
    }
    async _handleTaskError(task, error) {
        task.error = error;
        const remainingRetries = (task.context.retries || 0) - 1;
        if (remainingRetries > 0) {
            // Retry the task
            task.context.retries = remainingRetries;
            task.status = TaskStatus.PENDING;
            setTimeout(() => {
                if (this._running) {
                    setImmediate(() => this._processNext());
                }
            }, this.options.retryDelay);
            return;
        }
        // Task failed permanently
        task.status = TaskStatus.FAILED;
        task.context.completedAt = new Date();
        this.metrics.totalFailed++;
        this.metrics.totalDequeued++;
        if (task.onError) {
            try {
                task.onError(error, task.context);
            }
            catch (callbackError) {
                console.error(`Error in task error callback for ${task.id}:`, callbackError);
            }
        }
        this._emitTaskEvent(task, EventType.TASK_FAILED, { error: error.message });
        this.emit('taskFailed', task);
    }
    _removeCompletedTask(task) {
        this._processingTasks.delete(task.id);
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
            const index = this.tasks.findIndex(t => t.id === task.id);
            if (index !== -1) {
                this.tasks.splice(index, 1);
                this.metrics.currentSize = this.tasks.length;
            }
        }
    }
    _updateAverageProcessingTime(task) {
        if (task.context.startedAt && task.context.completedAt) {
            const processingTime = task.context.completedAt.getTime() - task.context.startedAt.getTime();
            const totalCompletedBefore = this.metrics.totalCompleted - 1;
            this.metrics.averageProcessingTime = totalCompletedBefore > 0 ?
                ((this.metrics.averageProcessingTime * totalCompletedBefore) + processingTime) / this.metrics.totalCompleted :
                processingTime;
        }
    }
    _emitTaskEvent(task, eventType, data = {}) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            source: `queue:${this.id}`,
            data: {
                taskId: task.id,
                taskType: task.type,
                queueId: this.id,
                ...data
            }
        };
        this.emit('event', event);
    }
    _emitEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            source: `queue:${this.id}`,
            data
        };
        this.emit('event', event);
    }
    _generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    _setupEventHandlers() {
        this.on('taskCompleted', () => {
            if (this.metrics.currentSize === 0 && this._concurrentCount === 0) {
                this._emitEvent(EventType.QUEUE_EMPTY, { queueId: this.id });
            }
        });
        this.on('taskFailed', () => {
            if (this.metrics.currentSize === 0 && this._concurrentCount === 0) {
                this._emitEvent(EventType.QUEUE_EMPTY, { queueId: this.id });
            }
        });
    }
}
