/**
 * PowerScript Concurrency & Scheduling Module - Type Definitions
 * Comprehensive types for parallel processing, workers, and task scheduling
 */

// ============================================================================
// CORE CONCURRENCY TYPES
// ============================================================================

export interface ConcurrencyConfig {
  maxWorkers?: number;
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export interface TaskContext {
  id: string;
  name?: string;
  metadata?: Record<string, any>;
  priority?: TaskPriority;
  timeout?: number;
  retries?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// ============================================================================
// WORKER TYPES
// ============================================================================

export interface WorkerConfig {
  id?: string;
  maxTasks?: number;
  timeout?: number;
  restartOnFailure?: boolean;
  enableIsolation?: boolean;
  resourceLimits?: ResourceLimits;
}

export interface ResourceLimits {
  memory?: number; // in MB
  cpu?: number; // percentage (0-100)
  executionTime?: number; // in milliseconds
}

export interface WorkerPool {
  id: string;
  size: number;
  workers: Worker[];
  taskQueue: TaskQueue;
  metrics: WorkerPoolMetrics;
}

export interface WorkerPoolMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  activeWorkers: number;
  queueLength: number;
}

export interface Worker {
  id: string;
  status: WorkerStatus;
  currentTask?: TaskContext;
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  createdAt: Date;
  lastActivity?: Date;
}

export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  TERMINATED = 'terminated'
}

// ============================================================================
// TASK QUEUE TYPES
// ============================================================================

export interface TaskQueue {
  id: string;
  name?: string;
  type: QueueType;
  tasks: Task[];
  options: QueueOptions;
  metrics: QueueMetrics;
}

export enum QueueType {
  FIFO = 'fifo',
  LIFO = 'lifo',
  PRIORITY = 'priority',
  DELAYED = 'delayed'
}

export interface QueueOptions {
  maxSize?: number;
  concurrency?: number;
  defaultPriority?: TaskPriority;
  retryAttempts?: number;
  retryDelay?: number;
  enablePersistence?: boolean;
}

export interface QueueMetrics {
  totalEnqueued: number;
  totalDequeued: number;
  totalCompleted: number;
  totalFailed: number;
  currentSize: number;
  peakSize: number;
  averageWaitTime: number;
  averageProcessingTime: number;
}

export interface Task<TInput = any, TOutput = any> {
  id: string;
  type: string;
  input: TInput;
  output?: TOutput;
  error?: Error;
  context: TaskContext;
  status: TaskStatus;
  handler: TaskHandler<TInput, TOutput>;
  onProgress?: ProgressCallback;
  onComplete?: CompletionCallback<TOutput>;
  onError?: ErrorCallback;
}

export type TaskHandler<TInput = any, TOutput = any> = (
  input: TInput,
  context: TaskContext,
  progressCallback?: ProgressCallback
) => Promise<TOutput> | TOutput;

export type ProgressCallback = (progress: number, message?: string) => void;
export type CompletionCallback<T = any> = (result: T, context: TaskContext) => void;
export type ErrorCallback = (error: Error, context: TaskContext) => void;

// ============================================================================
// SCHEDULER TYPES
// ============================================================================

export interface SchedulerConfig {
  timezone?: string;
  maxConcurrentJobs?: number;
  enablePersistence?: boolean;
  enableMetrics?: boolean;
  checkInterval?: number; // in milliseconds
}

export interface Job {
  id: string;
  name: string;
  schedule: Schedule;
  handler: JobHandler;
  options: JobOptions;
  status: JobStatus;
  metrics: JobMetrics;
  nextRun?: Date;
  lastRun?: Date;
}

export interface Schedule {
  type: ScheduleType;
  expression?: string; // cron expression
  interval?: number; // milliseconds
  times?: Date[]; // specific times
  startDate?: Date;
  endDate?: Date;
}

export enum ScheduleType {
  CRON = 'cron',
  INTERVAL = 'interval',
  ONCE = 'once',
  TIMES = 'times'
}

export interface JobOptions {
  maxExecutions?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export enum JobStatus {
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DISABLED = 'disabled'
}

export interface JobMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  lastError?: Error;
}

export type JobHandler = (context: JobContext) => Promise<any> | any;

export interface JobContext {
  jobId: string;
  executionId: string;
  scheduledTime: Date;
  actualTime: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  options: WorkflowOptions;
  status: WorkflowStatus;
  context: WorkflowContext;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  handler: StepHandler;
  dependencies?: string[]; // step IDs
  condition?: StepCondition;
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export enum StepType {
  TASK = 'task',
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
  CONDITION = 'condition',
  DELAY = 'delay'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface WorkflowOptions {
  maxExecutionTime?: number;
  failFast?: boolean;
  enableCheckpoints?: boolean;
  enableMetrics?: boolean;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  variables: Record<string, any>;
  stepResults: Record<string, any>;
}

export type StepHandler = (context: StepContext) => Promise<any> | any;
export type StepCondition = (context: StepContext) => boolean | Promise<boolean>;

export interface StepContext {
  stepId: string;
  workflowContext: WorkflowContext;
  input?: any;
  previousResults?: Record<string, any>;
}

export interface RetryPolicy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface MessageQueueConfig {
  type: MessageQueueType;
  connection: ConnectionConfig;
  options?: Record<string, any>;
}

export enum MessageQueueType {
  REDIS = 'redis',
  RABBITMQ = 'rabbitmq',
  KAFKA = 'kafka',
  SQS = 'sqs',
  MEMORY = 'memory'
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  ssl?: boolean;
  options?: Record<string, any>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface ConcurrencyEvent {
  type: EventType;
  timestamp: Date;
  data: any;
  source: string;
}

export enum EventType {
  TASK_STARTED = 'task.started',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  WORKER_CREATED = 'worker.created',
  WORKER_TERMINATED = 'worker.terminated',
  QUEUE_FULL = 'queue.full',
  QUEUE_EMPTY = 'queue.empty',
  JOB_SCHEDULED = 'job.scheduled',
  JOB_EXECUTED = 'job.executed',
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_COMPLETED = 'workflow.completed'
}

// ============================================================================
// METRICS AND MONITORING TYPES
// ============================================================================

export interface ConcurrencyMetrics {
  workers: WorkerMetrics;
  tasks: TaskMetrics;
  queues: QueueMetricsCollection;
  jobs: JobMetricsCollection;
  workflows: WorkflowMetrics;
}

export interface WorkerMetrics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  averageTasksPerWorker: number;
  totalTasksExecuted: number;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  averageWaitTime: number;
  throughputPerSecond: number;
}

export interface QueueMetricsCollection {
  [queueId: string]: QueueMetrics;
}

export interface JobMetricsCollection {
  [jobId: string]: JobMetrics;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ConcurrencyError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

export class WorkerError extends ConcurrencyError {
  constructor(message: string, public workerId?: string, details?: any) {
    super(message, 'WORKER_ERROR', details);
    this.name = 'WorkerError';
  }
}

export class TaskError extends ConcurrencyError {
  constructor(message: string, public taskId?: string, details?: any) {
    super(message, 'TASK_ERROR', details);
    this.name = 'TaskError';
  }
}

export class QueueError extends ConcurrencyError {
  constructor(message: string, public queueId?: string, details?: any) {
    super(message, 'QUEUE_ERROR', details);
    this.name = 'QueueError';
  }
}

export class SchedulerError extends ConcurrencyError {
  constructor(message: string, public jobId?: string, details?: any) {
    super(message, 'SCHEDULER_ERROR', details);
    this.name = 'SchedulerError';
  }
}

export class WorkflowError extends ConcurrencyError {
  constructor(message: string, public workflowId?: string, details?: any) {
    super(message, 'WORKFLOW_ERROR', details);
    this.name = 'WorkflowError';
  }
}