"use strict";
/**
 * PowerScript Concurrency & Scheduling Module
 * Comprehensive parallel processing, worker management, and task scheduling
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowError = exports.SchedulerError = exports.QueueError = exports.TaskError = exports.WorkerError = exports.ConcurrencyError = exports.MessageQueueType = exports.EventType = exports.StepType = exports.WorkflowStatus = exports.ScheduleType = exports.JobStatus = exports.WorkerStatus = exports.TaskPriority = exports.TaskStatus = exports.QueueType = exports.TaskScheduler = exports.WorkerPool = exports.TaskQueue = exports.PowerScriptConcurrency = void 0;
// Main orchestrator
var PowerScriptConcurrency_1 = require("./PowerScriptConcurrency");
Object.defineProperty(exports, "PowerScriptConcurrency", { enumerable: true, get: function () { return PowerScriptConcurrency_1.PowerScriptConcurrency; } });
const PowerScriptConcurrency_2 = require("./PowerScriptConcurrency");
// Core components
var TaskQueue_1 = require("./queues/TaskQueue");
Object.defineProperty(exports, "TaskQueue", { enumerable: true, get: function () { return TaskQueue_1.TaskQueue; } });
var WorkerPool_1 = require("./workers/WorkerPool");
Object.defineProperty(exports, "WorkerPool", { enumerable: true, get: function () { return WorkerPool_1.WorkerPool; } });
var TaskScheduler_1 = require("./scheduling/TaskScheduler");
Object.defineProperty(exports, "TaskScheduler", { enumerable: true, get: function () { return TaskScheduler_1.TaskScheduler; } });
// Type definitions
__exportStar(require("./types"), exports);
// Re-export for convenience
var types_1 = require("./types");
Object.defineProperty(exports, "QueueType", { enumerable: true, get: function () { return types_1.QueueType; } });
Object.defineProperty(exports, "TaskStatus", { enumerable: true, get: function () { return types_1.TaskStatus; } });
Object.defineProperty(exports, "TaskPriority", { enumerable: true, get: function () { return types_1.TaskPriority; } });
Object.defineProperty(exports, "WorkerStatus", { enumerable: true, get: function () { return types_1.WorkerStatus; } });
Object.defineProperty(exports, "JobStatus", { enumerable: true, get: function () { return types_1.JobStatus; } });
Object.defineProperty(exports, "ScheduleType", { enumerable: true, get: function () { return types_1.ScheduleType; } });
Object.defineProperty(exports, "WorkflowStatus", { enumerable: true, get: function () { return types_1.WorkflowStatus; } });
Object.defineProperty(exports, "StepType", { enumerable: true, get: function () { return types_1.StepType; } });
Object.defineProperty(exports, "EventType", { enumerable: true, get: function () { return types_1.EventType; } });
Object.defineProperty(exports, "MessageQueueType", { enumerable: true, get: function () { return types_1.MessageQueueType; } });
// Error classes
var types_2 = require("./types");
Object.defineProperty(exports, "ConcurrencyError", { enumerable: true, get: function () { return types_2.ConcurrencyError; } });
Object.defineProperty(exports, "WorkerError", { enumerable: true, get: function () { return types_2.WorkerError; } });
Object.defineProperty(exports, "TaskError", { enumerable: true, get: function () { return types_2.TaskError; } });
Object.defineProperty(exports, "QueueError", { enumerable: true, get: function () { return types_2.QueueError; } });
Object.defineProperty(exports, "SchedulerError", { enumerable: true, get: function () { return types_2.SchedulerError; } });
Object.defineProperty(exports, "WorkflowError", { enumerable: true, get: function () { return types_2.WorkflowError; } });
// Default export
exports.default = PowerScriptConcurrency_2.PowerScriptConcurrency;
