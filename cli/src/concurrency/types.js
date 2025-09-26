"use strict";
/**
 * PowerScript Concurrency & Scheduling Module - Type Definitions
 * Comprehensive types for parallel processing, workers, and task scheduling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowError = exports.SchedulerError = exports.QueueError = exports.TaskError = exports.WorkerError = exports.ConcurrencyError = exports.EventType = exports.MessageQueueType = exports.WorkflowStatus = exports.StepType = exports.JobStatus = exports.ScheduleType = exports.QueueType = exports.WorkerStatus = exports.TaskPriority = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["TIMEOUT"] = "timeout";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 0] = "LOW";
    TaskPriority[TaskPriority["NORMAL"] = 1] = "NORMAL";
    TaskPriority[TaskPriority["HIGH"] = 2] = "HIGH";
    TaskPriority[TaskPriority["CRITICAL"] = 3] = "CRITICAL";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var WorkerStatus;
(function (WorkerStatus) {
    WorkerStatus["IDLE"] = "idle";
    WorkerStatus["BUSY"] = "busy";
    WorkerStatus["ERROR"] = "error";
    WorkerStatus["TERMINATED"] = "terminated";
})(WorkerStatus || (exports.WorkerStatus = WorkerStatus = {}));
var QueueType;
(function (QueueType) {
    QueueType["FIFO"] = "fifo";
    QueueType["LIFO"] = "lifo";
    QueueType["PRIORITY"] = "priority";
    QueueType["DELAYED"] = "delayed";
})(QueueType || (exports.QueueType = QueueType = {}));
var ScheduleType;
(function (ScheduleType) {
    ScheduleType["CRON"] = "cron";
    ScheduleType["INTERVAL"] = "interval";
    ScheduleType["ONCE"] = "once";
    ScheduleType["TIMES"] = "times";
})(ScheduleType || (exports.ScheduleType = ScheduleType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["SCHEDULED"] = "scheduled";
    JobStatus["RUNNING"] = "running";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["FAILED"] = "failed";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["DISABLED"] = "disabled";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var StepType;
(function (StepType) {
    StepType["TASK"] = "task";
    StepType["PARALLEL"] = "parallel";
    StepType["SEQUENTIAL"] = "sequential";
    StepType["CONDITION"] = "condition";
    StepType["DELAY"] = "delay";
})(StepType || (exports.StepType = StepType = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["PAUSED"] = "paused";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var MessageQueueType;
(function (MessageQueueType) {
    MessageQueueType["REDIS"] = "redis";
    MessageQueueType["RABBITMQ"] = "rabbitmq";
    MessageQueueType["KAFKA"] = "kafka";
    MessageQueueType["SQS"] = "sqs";
    MessageQueueType["MEMORY"] = "memory";
})(MessageQueueType || (exports.MessageQueueType = MessageQueueType = {}));
var EventType;
(function (EventType) {
    EventType["TASK_STARTED"] = "task.started";
    EventType["TASK_COMPLETED"] = "task.completed";
    EventType["TASK_FAILED"] = "task.failed";
    EventType["WORKER_CREATED"] = "worker.created";
    EventType["WORKER_TERMINATED"] = "worker.terminated";
    EventType["QUEUE_FULL"] = "queue.full";
    EventType["QUEUE_EMPTY"] = "queue.empty";
    EventType["JOB_SCHEDULED"] = "job.scheduled";
    EventType["JOB_EXECUTED"] = "job.executed";
    EventType["WORKFLOW_STARTED"] = "workflow.started";
    EventType["WORKFLOW_COMPLETED"] = "workflow.completed";
})(EventType || (exports.EventType = EventType = {}));
// ============================================================================
// ERROR TYPES
// ============================================================================
class ConcurrencyError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ConcurrencyError';
    }
}
exports.ConcurrencyError = ConcurrencyError;
class WorkerError extends ConcurrencyError {
    constructor(message, workerId, details) {
        super(message, 'WORKER_ERROR', details);
        this.workerId = workerId;
        this.name = 'WorkerError';
    }
}
exports.WorkerError = WorkerError;
class TaskError extends ConcurrencyError {
    constructor(message, taskId, details) {
        super(message, 'TASK_ERROR', details);
        this.taskId = taskId;
        this.name = 'TaskError';
    }
}
exports.TaskError = TaskError;
class QueueError extends ConcurrencyError {
    constructor(message, queueId, details) {
        super(message, 'QUEUE_ERROR', details);
        this.queueId = queueId;
        this.name = 'QueueError';
    }
}
exports.QueueError = QueueError;
class SchedulerError extends ConcurrencyError {
    constructor(message, jobId, details) {
        super(message, 'SCHEDULER_ERROR', details);
        this.jobId = jobId;
        this.name = 'SchedulerError';
    }
}
exports.SchedulerError = SchedulerError;
class WorkflowError extends ConcurrencyError {
    constructor(message, workflowId, details) {
        super(message, 'WORKFLOW_ERROR', details);
        this.workflowId = workflowId;
        this.name = 'WorkflowError';
    }
}
exports.WorkflowError = WorkflowError;
