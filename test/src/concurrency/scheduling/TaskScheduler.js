/**
 * PowerScript Concurrency - Task Scheduler Implementation
 * Cron-like scheduler with advanced job management and workflow orchestration
 */
import { EventEmitter } from 'events';
import { JobStatus, ScheduleType, SchedulerError, EventType } from '../types.js';
export class TaskScheduler extends EventEmitter {
    constructor(config = {}) {
        super();
        this.jobs = new Map();
        this.isRunning = false;
        this.config = {
            timezone: config.timezone ?? 'UTC',
            maxConcurrentJobs: config.maxConcurrentJobs ?? 10,
            enablePersistence: config.enablePersistence ?? false,
            enableMetrics: config.enableMetrics ?? true,
            checkInterval: config.checkInterval ?? 1000 // 1 second
        };
    }
    /**
     * Start the scheduler
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.schedulerInterval = setInterval(() => {
            this._checkScheduledJobs();
        }, this.config.checkInterval);
        this._emitEvent(EventType.JOB_SCHEDULED, { message: 'Scheduler started' });
    }
    /**
     * Stop the scheduler
     */
    stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = undefined;
        }
        this._emitEvent(EventType.JOB_SCHEDULED, { message: 'Scheduler stopped' });
    }
    /**
     * Schedule a new job
     */
    scheduleJob(id, name, schedule, handler, options = {}) {
        if (this.jobs.has(id)) {
            throw new SchedulerError(`Job with id '${id}' already exists`, id);
        }
        const job = {
            id,
            name,
            schedule,
            handler,
            options: {
                maxExecutions: options.maxExecutions,
                timeout: options.timeout ?? 30000,
                retryAttempts: options.retryAttempts ?? 3,
                retryDelay: options.retryDelay ?? 1000,
                enabled: options.enabled ?? true,
                metadata: options.metadata || {}
            },
            status: options.enabled ? JobStatus.SCHEDULED : JobStatus.DISABLED,
            metrics: {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0
            }
        };
        // Calculate next run time
        job.nextRun = this._calculateNextRun(schedule);
        this.jobs.set(id, job);
        this._emitEvent(EventType.JOB_SCHEDULED, { jobId: id, nextRun: job.nextRun });
        return job;
    }
    /**
     * Schedule a cron job
     */
    scheduleCronJob(id, name, cronExpression, handler, options = {}) {
        const schedule = {
            type: ScheduleType.CRON,
            expression: cronExpression
        };
        return this.scheduleJob(id, name, schedule, handler, options);
    }
    /**
     * Schedule an interval job
     */
    scheduleIntervalJob(id, name, intervalMs, handler, options = {}) {
        const schedule = {
            type: ScheduleType.INTERVAL,
            interval: intervalMs
        };
        return this.scheduleJob(id, name, schedule, handler, options);
    }
    /**
     * Schedule a one-time job
     */
    scheduleOnceJob(id, name, runAt, handler, options = {}) {
        const schedule = {
            type: ScheduleType.ONCE,
            times: [runAt]
        };
        return this.scheduleJob(id, name, schedule, handler, options);
    }
    /**
     * Cancel a scheduled job
     */
    cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        job.status = JobStatus.CANCELLED;
        this.jobs.delete(jobId);
        this._emitEvent(EventType.JOB_SCHEDULED, { jobId, status: 'cancelled' });
        return true;
    }
    /**
     * Enable a job
     */
    enableJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        job.status = JobStatus.SCHEDULED;
        job.options.enabled = true;
        job.nextRun = this._calculateNextRun(job.schedule);
        return true;
    }
    /**
     * Disable a job
     */
    disableJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        job.status = JobStatus.DISABLED;
        job.options.enabled = false;
        job.nextRun = undefined;
        return true;
    }
    /**
     * Execute a job immediately
     */
    async executeJobNow(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new SchedulerError(`Job '${jobId}' not found`, jobId);
        }
        return this._executeJob(job, true);
    }
    /**
     * Get job information
     */
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    /**
     * Get all jobs
     */
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    /**
     * Get scheduler statistics
     */
    getStats() {
        const jobs = Array.from(this.jobs.values());
        return {
            totalJobs: jobs.length,
            scheduledJobs: jobs.filter(j => j.status === JobStatus.SCHEDULED).length,
            runningJobs: jobs.filter(j => j.status === JobStatus.RUNNING).length,
            disabledJobs: jobs.filter(j => j.status === JobStatus.DISABLED).length,
            isRunning: this.isRunning
        };
    }
    _checkScheduledJobs() {
        const now = new Date();
        const runningJobs = Array.from(this.jobs.values()).filter(j => j.status === JobStatus.RUNNING).length;
        if (runningJobs >= this.config.maxConcurrentJobs) {
            return; // Too many concurrent jobs
        }
        for (const job of this.jobs.values()) {
            if (job.status === JobStatus.SCHEDULED &&
                job.nextRun &&
                job.nextRun <= now) {
                this._executeJob(job);
                // Calculate next run time for recurring jobs
                if (job.schedule.type !== ScheduleType.ONCE) {
                    job.nextRun = this._calculateNextRun(job.schedule, now);
                }
                else {
                    job.status = JobStatus.COMPLETED;
                }
                // Check if we've reached max concurrent jobs
                if (runningJobs >= this.config.maxConcurrentJobs - 1) {
                    break;
                }
            }
        }
    }
    async _executeJob(job, immediate = false) {
        const executionId = `${job.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date();
        const context = {
            jobId: job.id,
            executionId,
            scheduledTime: job.nextRun || startTime,
            actualTime: startTime,
            metadata: job.options.metadata
        };
        job.status = JobStatus.RUNNING;
        job.lastRun = startTime;
        job.metrics.totalExecutions++;
        this._emitEvent(EventType.JOB_EXECUTED, {
            jobId: job.id,
            executionId,
            startTime,
            immediate
        });
        try {
            // Set up timeout if specified
            const timeoutPromise = job.options.timeout ?
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Job ${job.id} timed out after ${job.options.timeout}ms`)), job.options.timeout);
                }) : null;
            const jobPromise = Promise.resolve(job.handler(context));
            const result = timeoutPromise ?
                await Promise.race([jobPromise, timeoutPromise]) :
                await jobPromise;
            // Job completed successfully
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            job.status = job.schedule.type === ScheduleType.ONCE ? JobStatus.COMPLETED : JobStatus.SCHEDULED;
            job.metrics.successfulExecutions++;
            this._updateAverageExecutionTime(job, executionTime);
            this._emitEvent(EventType.JOB_EXECUTED, {
                jobId: job.id,
                executionId,
                status: 'completed',
                executionTime,
                result
            });
            return result;
        }
        catch (error) {
            // Job failed
            const endTime = new Date();
            const executionTime = endTime.getTime() - startTime.getTime();
            job.metrics.failedExecutions++;
            job.metrics.lastError = error;
            job.status = job.schedule.type === ScheduleType.ONCE ? JobStatus.FAILED : JobStatus.SCHEDULED;
            this._updateAverageExecutionTime(job, executionTime);
            this._emitEvent(EventType.JOB_EXECUTED, {
                jobId: job.id,
                executionId,
                status: 'failed',
                error: error.message,
                executionTime
            });
            // Handle retries for failed jobs
            if (job.options.retryAttempts && job.options.retryAttempts > 0) {
                setTimeout(() => {
                    if (job.status === JobStatus.SCHEDULED) {
                        job.options.retryAttempts = (job.options.retryAttempts || 0) - 1;
                        this._executeJob(job);
                    }
                }, job.options.retryDelay || 1000);
            }
            throw error;
        }
    }
    _calculateNextRun(schedule, fromDate) {
        const now = fromDate || new Date();
        switch (schedule.type) {
            case ScheduleType.INTERVAL:
                if (schedule.interval) {
                    return new Date(now.getTime() + schedule.interval);
                }
                break;
            case ScheduleType.CRON:
                if (schedule.expression) {
                    return this._parseNextCronDate(schedule.expression, now);
                }
                break;
            case ScheduleType.ONCE:
                if (schedule.times && schedule.times.length > 0) {
                    return schedule.times.find(time => time > now);
                }
                break;
            case ScheduleType.TIMES:
                if (schedule.times) {
                    return schedule.times.find(time => time > now);
                }
                break;
        }
        return undefined;
    }
    _parseNextCronDate(cronExpression, fromDate) {
        // Simplified cron parsing - in a real implementation, you'd use a proper cron library
        const parts = cronExpression.trim().split(/\s+/);
        if (parts.length !== 5)
            return undefined;
        const [minute, hour, day, month, dayOfWeek] = parts;
        const next = new Date(fromDate);
        // This is a very simplified cron parser for demonstration
        // For production use, consider using libraries like 'node-cron' or 'cron-parser'
        if (minute === '*' && hour === '*' && day === '*' && month === '*' && dayOfWeek === '*') {
            // Every minute
            next.setMinutes(next.getMinutes() + 1);
            next.setSeconds(0);
            next.setMilliseconds(0);
            return next;
        }
        if (minute !== '*' && hour !== '*') {
            const targetHour = parseInt(hour);
            const targetMinute = parseInt(minute);
            next.setHours(targetHour, targetMinute, 0, 0);
            if (next <= fromDate) {
                next.setDate(next.getDate() + 1);
            }
            return next;
        }
        // For more complex cron expressions, implement proper parsing
        // or use a dedicated library
        return undefined;
    }
    _updateAverageExecutionTime(job, executionTime) {
        const totalExecutions = job.metrics.totalExecutions;
        const previousAverage = job.metrics.averageExecutionTime;
        job.metrics.averageExecutionTime = totalExecutions > 1 ?
            ((previousAverage * (totalExecutions - 1)) + executionTime) / totalExecutions :
            executionTime;
        if (job.metrics.lastExecutionTime === undefined) {
            job.metrics.lastExecutionTime = executionTime;
        }
        else {
            job.metrics.lastExecutionTime = executionTime;
        }
    }
    _emitEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: new Date(),
            source: 'scheduler',
            data
        };
        this.emit('event', event);
    }
}
