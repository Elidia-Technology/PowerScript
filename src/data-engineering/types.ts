/**
 * PowerScript Data Engineering Pipelines - Type Definitions
 * Comprehensive types for ETL operations, data processing, and pipeline management
 */

import { EventEmitter } from 'events';

// ====================
// Core Pipeline Types
// ====================

export interface PipelineConfig {
  name: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  schedule?: CronSchedule;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  concurrency?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CronSchedule {
  enabled: boolean;
  expression: string;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryOnFailure: boolean;
}

// ====================
// Data Source Types
// ====================

export interface DataSource {
  id: string;
  type: DataSourceType;
  config: DataSourceConfig;
  schema?: DataSchema;
  metadata?: Record<string, any>;
}

export type DataSourceType = 
  | 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'elasticsearch'
  | 'kafka' | 'rabbitmq' | 'sqs' | 'pubsub'
  | 'http' | 'websocket' | 'graphql' | 'rest'
  | 'file' | 's3' | 'gcs' | 'azure-blob'
  | 'spark' | 'flink' | 'airflow' | 'dbt'
  | 'snowflake' | 'bigquery' | 'redshift' | 'databricks';

export interface DataSourceConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
  region?: string;
  bucket?: string;
  topic?: string;
  queue?: string;
  endpoint?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
}

export interface DataSchema {
  fields: SchemaField[];
  primaryKey?: string[];
  indexes?: SchemaIndex[];
  constraints?: SchemaConstraint[];
}

export interface SchemaField {
  name: string;
  type: DataType;
  nullable?: boolean;
  defaultValue?: any;
  description?: string;
  format?: string;
  validation?: ValidationRule[];
}

export type DataType = 
  | 'string' | 'number' | 'integer' | 'float' | 'double'
  | 'boolean' | 'date' | 'datetime' | 'timestamp'
  | 'json' | 'array' | 'object' | 'binary'
  | 'uuid' | 'email' | 'url' | 'phone';

export interface SchemaIndex {
  name: string;
  fields: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface SchemaConstraint {
  name: string;
  type: 'check' | 'foreign_key' | 'unique' | 'not_null';
  definition: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

// ====================
// ETL Operation Types
// ====================

export interface ETLOperation {
  id: string;
  type: OperationType;
  config: OperationConfig;
  dependencies?: string[];
  enabled?: boolean;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export type OperationType = 
  | 'extract' | 'transform' | 'load' | 'validate' | 'clean'
  | 'aggregate' | 'join' | 'filter' | 'sort' | 'deduplicate'
  | 'enrich' | 'split' | 'merge' | 'pivot' | 'unpivot'
  | 'custom';

export interface OperationConfig {
  source?: string;
  target?: string;
  query?: string;
  transformation?: TransformationRule[];
  validation?: ValidationRule[];
  mapping?: FieldMapping[];
  conditions?: FilterCondition[];
  aggregations?: AggregationRule[];
  joins?: JoinRule[];
  customFunction?: string;
  parameters?: Record<string, any>;
}

export interface TransformationRule {
  field: string;
  operation: TransformOperation;
  parameters?: Record<string, any>;
  condition?: string;
}

export type TransformOperation =
  | 'rename' | 'cast' | 'format' | 'replace' | 'regex'
  | 'uppercase' | 'lowercase' | 'trim' | 'pad'
  | 'hash' | 'encrypt' | 'decrypt' | 'tokenize'
  | 'calculate' | 'lookup' | 'split' | 'concat'
  | 'normalize' | 'standardize' | 'custom';

export interface FieldMapping {
  source: string;
  target: string;
  transformation?: TransformationRule;
}

export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export type ComparisonOperator = 
  | '=' | '!=' | '>' | '<' | '>=' | '<='
  | 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE'
  | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN';

export interface AggregationRule {
  field: string;
  operation: AggregationOperation;
  alias?: string;
  groupBy?: string[];
  having?: FilterCondition[];
}

export type AggregationOperation = 
  | 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
  | 'STDDEV' | 'VARIANCE' | 'MEDIAN' | 'MODE'
  | 'FIRST' | 'LAST' | 'DISTINCT_COUNT';

export interface JoinRule {
  type: JoinType;
  leftTable: string;
  rightTable: string;
  conditions: JoinCondition[];
  select?: string[];
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

export interface JoinCondition {
  leftField: string;
  rightField: string;
  operator?: ComparisonOperator;
}

// ====================
// Streaming Types
// ====================

export interface StreamConfig {
  source: DataSource;
  target?: DataSource;
  windowSize?: number;
  windowType?: WindowType;
  watermark?: number;
  parallelism?: number;
  checkpointInterval?: number;
  bufferSize?: number;
}

export type WindowType = 'tumbling' | 'sliding' | 'session' | 'global';

export interface StreamProcessor {
  process(data: any): Promise<any>;
  onError?(error: Error, data: any): Promise<void>;
  onComplete?(): Promise<void>;
}

// ====================
// Quality & Monitoring Types
// ====================

export interface DataQualityRule {
  id: string;
  name: string;
  type: QualityRuleType;
  field?: string;
  condition: string;
  severity: QualitySeverity;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export type QualityRuleType = 
  | 'completeness' | 'accuracy' | 'consistency' | 'timeliness'
  | 'validity' | 'uniqueness' | 'integrity' | 'conformity';

export type QualitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface QualityResult {
  ruleId: string;
  passed: boolean;
  message: string;
  severity: QualitySeverity;
  recordCount: number;
  failedRecords: number;
  details?: any;
  timestamp: Date;
}

export interface DataLineage {
  id: string;
  source: string;
  target: string;
  transformation: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PipelineMetrics {
  pipelineId: string;
  startTime: Date;
  endTime?: Date;
  status: PipelineStatus;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  bytesProcessed: number;
  duration: number;
  errors: PipelineError[];
  qualityResults: QualityResult[];
  lineage: DataLineage[];
}

export type PipelineStatus = 
  | 'idle' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface PipelineError {
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  operation?: string;
  recordId?: string;
  details?: any;
  stack?: string;
}

// ====================
// Event Types
// ====================

export interface PipelineEvent {
  type: PipelineEventType;
  pipelineId: string;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

export type PipelineEventType =
  | 'pipeline.started' | 'pipeline.completed' | 'pipeline.failed' | 'pipeline.cancelled'
  | 'operation.started' | 'operation.completed' | 'operation.failed'
  | 'data.received' | 'data.processed' | 'data.validated' | 'data.loaded'
  | 'quality.checked' | 'quality.failed' | 'lineage.created'
  | 'error.occurred' | 'warning.issued' | 'info.logged';

// ====================
// Connector Types
// ====================

export interface ConnectorConfig {
  type: DataSourceType;
  name: string;
  version: string;
  config: DataSourceConfig;
  features: ConnectorFeature[];
  supportsStreaming?: boolean;
  supportsBatch?: boolean;
  supportsSchema?: boolean;
}

export type ConnectorFeature = 
  | 'read' | 'write' | 'streaming' | 'batch' | 'schema_evolution'
  | 'transactions' | 'compression' | 'partitioning' | 'encryption'
  | 'authentication' | 'monitoring' | 'lineage_tracking';

// ====================
// Orchestration Types
// ====================

export interface WorkflowConfig {
  name: string;
  description?: string;
  schedule?: CronSchedule;
  dependencies?: WorkflowDependency[];
  parameters?: Record<string, any>;
  tags?: string[];
  enabled?: boolean;
}

export interface WorkflowDependency {
  workflowId: string;
  condition: DependencyCondition;
}

export type DependencyCondition = 'success' | 'completed' | 'failed' | 'any';

export interface TaskDefinition {
  id: string;
  type: TaskType;
  config: TaskConfig;
  dependencies?: string[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
  resources?: ResourceRequirements;
}

export type TaskType = 
  | 'pipeline' | 'sql' | 'python' | 'shell' | 'http' | 'notification'
  | 'data_quality' | 'model_training' | 'custom';

export interface TaskConfig {
  command?: string;
  script?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  environment?: Record<string, string>;
  parameters?: Record<string, any>;
}

export interface ResourceRequirements {
  cpu?: number;
  memory?: string;
  disk?: string;
  gpu?: number;
  instances?: number;
}

// ====================
// Performance Types
// ====================

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  timestamp: Date;
}

export interface OptimizationSuggestion {
  type: OptimizationType;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  details?: Record<string, any>;
}

export type OptimizationType = 
  | 'partitioning' | 'indexing' | 'caching' | 'parallelization'
  | 'compression' | 'filtering' | 'aggregation' | 'memory_management'
  | 'batch_size' | 'connection_pooling' | 'query_optimization';