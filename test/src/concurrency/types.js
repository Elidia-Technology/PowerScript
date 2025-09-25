/**
 * PowerScript Concurrency & Scheduling Module - Type Definitions
 * Comprehensive types for parallel processing, workers, and task scheduling
 */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["TIMEOUT"] = "timeout";
})(TaskStatus || (TaskStatus = {}));
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 0] = "LOW";
    TaskPriority[TaskPriority["NORMAL"] = 1] = "NORMAL";
    TaskPriority[TaskPriority["HIGH"] = 2] = "HIGH";
    TaskPriority[TaskPriority["CRITICAL"] = 3] = "CRITICAL";
})(TaskPriority || (TaskPriority = {}));
export var WorkerStatus;
(function (WorkerStatus) {
    WorkerStatus["IDLE"] = "idle";
    WorkerStatus["BUSY"] = "busy";
    WorkerStatus["ERROR"] = "error";
    WorkerStatus["TERMINATED"] = "terminated";
})(WorkerStatus || (WorkerStatus = {}));
export var QueueType;
(function (QueueType) {
    QueueType["FIFO"] = "fifo";
    QueueType["LIFO"] = "lifo";
    QueueType["PRIORITY"] = "priority";
    QueueType["DELAYED"] = "delayed";
})(QueueType || (QueueType = {}));
export var ScheduleType;
(function (ScheduleType) {
    ScheduleType["CRON"] = "cron";
    ScheduleType["INTERVAL"] = "interval";
    ScheduleType["ONCE"] = "once";
    ScheduleType["TIMES"] = "times";
})(ScheduleType || (ScheduleType = {}));
export var JobStatus;
(function (JobStatus) {
    JobStatus["SCHEDULED"] = "scheduled";
    JobStatus["RUNNING"] = "running";
    JobStatus["COMPLETED"] = "completed";
    JobStatus["FAILED"] = "failed";
    JobStatus["CANCELLED"] = "cancelled";
    JobStatus["DISABLED"] = "disabled";
})(JobStatus || (JobStatus = {}));
export var StepType;
(function (StepType) {
    StepType["TASK"] = "task";
    StepType["PARALLEL"] = "parallel";
    StepType["SEQUENTIAL"] = "sequential";
    StepType["CONDITION"] = "condition";
    StepType["DELAY"] = "delay";
})(StepType || (StepType = {}));
export var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["RUNNING"] = "running";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["FAILED"] = "failed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["PAUSED"] = "paused";
})(WorkflowStatus || (WorkflowStatus = {}));
export var MessageQueueType;
(function (MessageQueueType) {
    MessageQueueType["REDIS"] = "redis";
    MessageQueueType["RABBITMQ"] = "rabbitmq";
    MessageQueueType["KAFKA"] = "kafka";
    MessageQueueType["SQS"] = "sqs";
    MessageQueueType["MEMORY"] = "memory";
})(MessageQueueType || (MessageQueueType = {}));
export var EventType;
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
})(EventType || (EventType = {}));
// ============================================================================
// ERROR TYPES
// ============================================================================
export class ConcurrencyError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ConcurrencyError';
    }
}
export class WorkerError extends ConcurrencyError {
    constructor(message, workerId, details) {
        super(message, 'WORKER_ERROR', details);
        this.workerId = workerId;
        this.name = 'WorkerError';
    }
}
export class TaskError extends ConcurrencyError {
    constructor(message, taskId, details) {
        super(message, 'TASK_ERROR', details);
        this.taskId = taskId;
        this.name = 'TaskError';
    }
}
export class QueueError extends ConcurrencyError {
    constructor(message, queueId, details) {
        super(message, 'QUEUE_ERROR', details);
        this.queueId = queueId;
        this.name = 'QueueError';
    }
}
export class SchedulerError extends ConcurrencyError {
    constructor(message, jobId, details) {
        super(message, 'SCHEDULER_ERROR', details);
        this.jobId = jobId;
        this.name = 'SchedulerError';
    }
}
export class WorkflowError extends ConcurrencyError {
    constructor(message, workflowId, details) {
        super(message, 'WORKFLOW_ERROR', details);
        this.workflowId = workflowId;
        this.name = 'WorkflowError';
    }
}
