/**
 * PowerScript Concurrency & Scheduling Module
 * Comprehensive parallel processing, worker management, and task scheduling
 */

// Main orchestrator
export { PowerScriptConcurrency } from './PowerScriptConcurrency';
import { PowerScriptConcurrency } from './PowerScriptConcurrency';

// Core components
export { TaskQueue } from './queues/TaskQueue';
export { WorkerPool } from './workers/WorkerPool';
export { TaskScheduler } from './scheduling/TaskScheduler';

// Type definitions
export * from './types';

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
} from './types';

// Error classes
export {
  ConcurrencyError,
  WorkerError,
  TaskError,
  QueueError,
  SchedulerError,
  WorkflowError
} from './types';

// Default export
export default PowerScriptConcurrency;