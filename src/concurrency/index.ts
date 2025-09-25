/**
 * PowerScript Concurrency & Scheduling Module
 * Comprehensive parallel processing, worker management, and task scheduling
 */

// Main orchestrator
export { PowerScriptConcurrency } from './PowerScriptConcurrency.js';
import { PowerScriptConcurrency } from './PowerScriptConcurrency.js';

// Core components
export { TaskQueue } from './queues/TaskQueue.js';
export { WorkerPool } from './workers/WorkerPool.js';
export { TaskScheduler } from './scheduling/TaskScheduler.js';

// Type definitions
export * from './types.js';

// Re-export for convenience
export {
  QueueType,
  TaskStatus,
  TaskPriority,
  WorkerStatus,
  JobStatus,
  ScheduleType,
  WorkflowStatus,
  StepType,
  EventType,
  MessageQueueType
} from './types.js';

// Error classes
export {
  ConcurrencyError,
  WorkerError,
  TaskError,
  QueueError,
  SchedulerError,
  WorkflowError
} from './types.js';

// Default export
export default PowerScriptConcurrency;