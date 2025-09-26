/**
 * PowerScript Data Engineering Pipelines - Stream Processor
 * Real-time data streaming and batch processing capabilities
 */

import { EventEmitter } from 'events';
import type {
  StreamConfig,
  StreamProcessor,
  DataSource,
  WindowType,
  PipelineEvent,
  PerformanceMetrics
} from './types';

/**
 * Stream Processor - Real-time data streaming
 */
export class PowerScriptStreamProcessor extends EventEmitter {
  private _config: StreamConfig;
  private _isRunning = false;
  private _processor?: StreamProcessor;
  private _buffer: any[] = [];
  private _windowData: any[] = [];
  private _metrics: PerformanceMetrics;
  private _lastWindowTime = 0;
  private _processedCount = 0;
  private _errorCount = 0;

  constructor(config: StreamConfig) {
    super();
    this._config = config;
    this._metrics = this._initializeMetrics();
  }

  /**
   * Initialize performance metrics
   */
  private _initializeMetrics(): PerformanceMetrics {
    return {
      throughput: 0,
      latency: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: 0,
      timestamp: new Date()
    };
  }

  /**
   * Start stream processing
   */
  async start(processor: StreamProcessor): Promise<void> {
    if (this._isRunning) {
      throw new Error('Stream processor is already running');
    }

    this._processor = processor;
    this._isRunning = true;
    this._processedCount = 0;
    this._errorCount = 0;

    this.emit('stream.started', {
      source: this._config.source.id,
      timestamp: new Date()
    });

    // Start processing loop
    this._processStream();
  }

  /**
   * Stop stream processing
   */
  async stop(): Promise<void> {
    if (!this._isRunning) {
      return;
    }

    this._isRunning = false;
    
    if (this._processor?.onComplete) {
      await this._processor.onComplete();
    }

    this.emit('stream.stopped', {
      processedCount: this._processedCount,
      errorCount: this._errorCount,
      timestamp: new Date()
    });
  }

  /**
   * Process data item
   */
  async processData(data: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Process data immediately if not running or no processor, otherwise add to buffer
      if (!this._isRunning || !this._processor) {
        // Simple data processing without external processor
        this._processedCount++;
        this._updateMetrics(startTime);
        
        this.emit('data.processed', {
          data,
          processedCount: this._processedCount,
          timestamp: new Date()
        });
        return;
      }

      // Add to buffer when running with processor
      this._buffer.push({
        data,
        timestamp: startTime,
        id: this._generateId()
      });

      // Check if buffer is full
      if (this._buffer.length >= (this._config.bufferSize || 1000)) {
        await this._flushBuffer();
      }

      // Update metrics
      this._processedCount++;
      this._updateMetrics(startTime);

      this.emit('data.received', {
        size: this._buffer.length,
        processedCount: this._processedCount
      });

    } catch (error) {
      this._errorCount++;
      
      if (this._processor?.onError) {
        await this._processor.onError(error as Error, data);
      }

      this.emit('stream.error', {
        error: error instanceof Error ? error.message : String(error),
        data,
        timestamp: new Date()
      });
    }
  }

  /**
   * Process stream (main processing loop)
   */
  private async _processStream(): Promise<void> {
    // Simulate stream processing
    const interval = setInterval(async () => {
      if (!this._isRunning) {
        clearInterval(interval);
        return;
      }

      // Check for windowed processing
      if (this._shouldProcessWindow()) {
        await this._processWindow();
      }

      // Process buffer if needed
      if (this._buffer.length > 0) {
        await this._flushBuffer();
      }

    }, 100); // Process every 100ms
  }

  /**
   * Check if window should be processed
   */
  private _shouldProcessWindow(): boolean {
    const now = Date.now();
    const windowSize = this._config.windowSize || 5000; // 5 seconds default
    
    return (now - this._lastWindowTime) >= windowSize;
  }

  /**
   * Process window of data
   */
  private async _processWindow(): Promise<void> {
    if (this._windowData.length === 0) {
      return;
    }

    const windowType = this._config.windowType || 'tumbling';
    
    try {
      let windowResult: any;

      switch (windowType) {
        case 'tumbling':
          windowResult = await this._processTumblingWindow();
          break;
        case 'sliding':
          windowResult = await this._processSlidingWindow();
          break;
        case 'session':
          windowResult = await this._processSessionWindow();
          break;
        default:
          windowResult = await this._processGlobalWindow();
      }

      this.emit('window.processed', {
        type: windowType,
        size: this._windowData.length,
        result: windowResult,
        timestamp: new Date()
      });

      // Clear window data for tumbling window
      if (windowType === 'tumbling') {
        this._windowData = [];
      }

      this._lastWindowTime = Date.now();

    } catch (error) {
      this.emit('window.error', {
        error: error instanceof Error ? error.message : String(error),
        windowSize: this._windowData.length
      });
    }
  }

  /**
   * Process tumbling window
   */
  private async _processTumblingWindow(): Promise<any> {
    if (!this._processor) return null;

    const aggregatedData = this._aggregateWindowData(this._windowData);
    return await this._processor.process(aggregatedData);
  }

  /**
   * Process sliding window
   */
  private async _processSlidingWindow(): Promise<any> {
    if (!this._processor) return null;

    // Keep half the window data for overlap
    const overlapSize = Math.floor(this._windowData.length / 2);
    const processData = [...this._windowData];
    this._windowData = this._windowData.slice(-overlapSize);

    const aggregatedData = this._aggregateWindowData(processData);
    return await this._processor.process(aggregatedData);
  }

  /**
   * Process session window
   */
  private async _processSessionWindow(): Promise<any> {
    if (!this._processor) return null;

    // Group by session (simplified - by timestamp gaps)
    const sessions = this._groupBySession(this._windowData);
    const results = [];

    for (const session of sessions) {
      const aggregatedData = this._aggregateWindowData(session);
      const result = await this._processor.process(aggregatedData);
      results.push(result);
    }

    return results;
  }

  /**
   * Process global window
   */
  private async _processGlobalWindow(): Promise<any> {
    if (!this._processor) return null;

    const aggregatedData = this._aggregateWindowData(this._windowData);
    return await this._processor.process(aggregatedData);
  }

  /**
   * Flush buffer
   */
  private async _flushBuffer(): Promise<void> {
    if (this._buffer.length === 0 || !this._processor) {
      return;
    }

    const batchData = [...this._buffer];
    this._buffer = [];

    // Add to window data
    this._windowData.push(...batchData);

    // Process batch
    try {
      const result = await this._processor.process(batchData);
      
      this.emit('batch.processed', {
        size: batchData.length,
        result,
        timestamp: new Date()
      });

    } catch (error) {
      if (this._processor.onError) {
        await this._processor.onError(error as Error, batchData);
      }
      throw error;
    }
  }

  /**
   * Aggregate window data
   */
  private _aggregateWindowData(windowData: any[]): any {
    if (windowData.length === 0) {
      return null;
    }

    // Simple aggregation - extract data from wrappers
    const data = windowData.map(item => item.data || item);
    
    return {
      count: data.length,
      data,
      timestamp: new Date(),
      window: {
        start: windowData[0]?.timestamp,
        end: windowData[windowData.length - 1]?.timestamp
      }
    };
  }

  /**
   * Group data by session
   */
  private _groupBySession(windowData: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];
    const sessionTimeout = 30000; // 30 seconds

    for (let i = 0; i < windowData.length; i++) {
      const item = windowData[i];
      
      if (currentSession.length === 0) {
        currentSession.push(item);
      } else {
        const lastItem = currentSession[currentSession.length - 1];
        const timeDiff = item.timestamp - lastItem.timestamp;
        
        if (timeDiff > sessionTimeout) {
          // Start new session
          sessions.push(currentSession);
          currentSession = [item];
        } else {
          currentSession.push(item);
        }
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  /**
   * Update performance metrics
   */
  private _updateMetrics(startTime: number): void {
    const now = Date.now();
    const latency = now - startTime;
    
    // Calculate throughput (records per second)
    const timeDiff = (now - this._metrics.timestamp.getTime()) / 1000;
    if (timeDiff > 0) {
      this._metrics.throughput = this._processedCount / timeDiff;
    }

    // Update latency (moving average)
    this._metrics.latency = (this._metrics.latency * 0.9) + (latency * 0.1);
    
    // Update error rate
    this._metrics.errorRate = this._errorCount / Math.max(this._processedCount, 1);
    
    // Simulate resource usage
    this._metrics.cpuUsage = Math.random() * 100;
    this._metrics.memoryUsage = Math.random() * 100;
    this._metrics.diskUsage = Math.random() * 100;
    this._metrics.networkIO = Math.random() * 1000;
    
    this._metrics.timestamp = new Date();
  }

  /**
   * Generate unique ID
   */
  private _generateId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stream statistics
   */
  getStats(): any {
    return {
      isRunning: this._isRunning,
      processedCount: this._processedCount,
      errorCount: this._errorCount,
      bufferSize: this._buffer.length,
      windowSize: this._windowData.length,
      config: this._config,
      metrics: this._metrics
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this._metrics };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this._buffer = [];
    this._windowData = [];
    this._processedCount = 0;
    this._errorCount = 0;
    this._metrics = this._initializeMetrics();
    
    this.emit('stream.cleared', { timestamp: new Date() });
  }
}

/**
 * Batch Processor - Process data in batches
 */
export class BatchProcessor extends EventEmitter {
  private _config: any;
  private _jobs: Map<string, BatchJob> = new Map();
  private _isProcessing = false;

  constructor(config: any = {}) {
    super();
    this._config = {
      maxConcurrent: 5,
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Submit batch job
   */
  async submitJob(jobConfig: BatchJobConfig): Promise<string> {
    const jobId = this._generateJobId();
    const job = new BatchJob(jobId, jobConfig);
    
    this._jobs.set(jobId, job);
    
    // Forward job events
    job.on('*', (event: any) => {
      this.emit('job.event', { jobId, ...event });
    });

    this.emit('job.submitted', { jobId, config: jobConfig });
    
    // Start processing if not already running
    if (!this._isProcessing) {
      this._processJobs();
    }

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): any {
    const job = this._jobs.get(jobId);
    return job ? job.getStatus() : null;
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this._jobs.get(jobId);
    if (job) {
      await job.cancel();
      this._jobs.delete(jobId);
      this.emit('job.cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Process batch jobs
   */
  private async _processJobs(): Promise<void> {
    this._isProcessing = true;
    
    const runningJobs: Promise<void>[] = [];
    
    for (const [jobId, job] of this._jobs) {
      if (job.getStatus().status === 'pending' && 
          runningJobs.length < this._config.maxConcurrent) {
        
        const jobPromise = this._executeJob(job).finally(() => {
          // Remove completed job from running list
          const index = runningJobs.indexOf(jobPromise);
          if (index > -1) {
            runningJobs.splice(index, 1);
          }
        });
        
        runningJobs.push(jobPromise);
      }
    }

    // Wait for all jobs to complete
    await Promise.all(runningJobs);
    
    this._isProcessing = false;
  }

  /**
   * Execute individual batch job
   */
  private async _executeJob(job: BatchJob): Promise<void> {
    try {
      await job.execute();
      this.emit('job.completed', { jobId: job.getId() });
    } catch (error) {
      this.emit('job.failed', { 
        jobId: job.getId(), 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Generate job ID
   */
  private _generateJobId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get processor statistics
   */
  getStats(): any {
    const jobs = Array.from(this._jobs.values());
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.getStatus().status === 'pending').length,
      runningJobs: jobs.filter(j => j.getStatus().status === 'running').length,
      completedJobs: jobs.filter(j => j.getStatus().status === 'completed').length,
      failedJobs: jobs.filter(j => j.getStatus().status === 'failed').length,
      isProcessing: this._isProcessing,
      config: this._config
    };
  }
}

/**
 * Batch Job - Individual batch processing job
 */
class BatchJob extends EventEmitter {
  private _id: string;
  private _config: BatchJobConfig;
  private _status: BatchJobStatus = 'pending';
  private _startTime?: Date;
  private _endTime?: Date;
  private _error?: Error;
  private _progress = 0;
  private _results: any[] = [];

  constructor(id: string, config: BatchJobConfig) {
    super();
    this._id = id;
    this._config = config;
  }

  /**
   * Execute the batch job
   */
  async execute(): Promise<void> {
    this._status = 'running';
    this._startTime = new Date();
    this._progress = 0;

    this.emit('job.started', { jobId: this._id, startTime: this._startTime });

    try {
      const data = await this._loadData();
      const batches = this._createBatches(data);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchResult = await this._processBatch(batch, i);
        this._results.push(batchResult);
        
        this._progress = ((i + 1) / batches.length) * 100;
        this.emit('job.progress', { 
          jobId: this._id, 
          progress: this._progress,
          batchIndex: i,
          totalBatches: batches.length 
        });
      }

      this._status = 'completed';
      this._endTime = new Date();
      
      this.emit('job.completed', { 
        jobId: this._id, 
        duration: this._endTime.getTime() - this._startTime!.getTime(),
        results: this._results 
      });

    } catch (error) {
      this._status = 'failed';
      this._endTime = new Date();
      this._error = error as Error;
      
      this.emit('job.failed', { 
        jobId: this._id, 
        error: this._error.message 
      });
      
      throw error;
    }
  }

  /**
   * Cancel the job
   */
  async cancel(): Promise<void> {
    this._status = 'cancelled';
    this._endTime = new Date();
    
    this.emit('job.cancelled', { jobId: this._id });
  }

  /**
   * Load data for processing
   */
  private async _loadData(): Promise<any[]> {
    // Simulate data loading
    const sampleData = [];
    const recordCount = this._config.recordCount || 10000;
    
    for (let i = 0; i < recordCount; i++) {
      sampleData.push({
        id: i + 1,
        value: Math.random() * 1000,
        category: ['A', 'B', 'C'][i % 3],
        timestamp: new Date()
      });
    }
    
    return sampleData;
  }

  /**
   * Create batches from data
   */
  private _createBatches(data: any[]): any[][] {
    const batchSize = this._config.batchSize || 1000;
    const batches: any[][] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Process a single batch
   */
  private async _processBatch(batch: any[], batchIndex: number): Promise<any> {
    // Simulate batch processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      batchIndex,
      recordCount: batch.length,
      processedAt: new Date(),
      success: true
    };
  }

  /**
   * Get job ID
   */
  getId(): string {
    return this._id;
  }

  /**
   * Get job status
   */
  getStatus(): any {
    return {
      id: this._id,
      status: this._status,
      progress: this._progress,
      startTime: this._startTime,
      endTime: this._endTime,
      error: this._error?.message,
      config: this._config,
      results: this._results
    };
  }
}

// Types for batch processing
interface BatchJobConfig {
  name: string;
  type: string;
  recordCount?: number;
  batchSize?: number;
  processor?: string;
  parameters?: Record<string, any>;
}

type BatchJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';