/**
 * # Concurrency Module Documentation
 * 
 * ## Overview
 * 
 * **Module Name:** PowerScript Concurrency  
 * **Package:** eips  
 * **Phase:** 9  
 * **Description:** Comprehensive parallel processing and task scheduling system providing worker pools, task queues, job scheduling, and resource management for high-performance concurrent applications.
 *
 * ## Purpose
 * 
 * The Concurrency module provides:
 * - Worker thread management and pooling
 * - Task queue systems with multiple strategies (FIFO, LIFO, Priority)
 * - Job scheduling with cron-like expressions
 * - Parallel processing with controlled concurrency
 * - Load balancing and resource management
 * - Task retry mechanisms with backoff strategies
 * - Performance monitoring and metrics
 * - Event-driven architecture for concurrent operations
 * - Memory and CPU usage optimization
 *
 * ## Dependencies
 * 
 * ### Core Dependencies
 * - PowerScript Core module
 * - Node.js >= 18.0.0 (with worker_threads support)
 * 
 * ### Optional Dependencies
 * - `node-cron` - For advanced cron scheduling
 * - `bull` or `bee-queue` - For Redis-backed job queues
 * - `cluster` - For multi-process scaling
 * - `piscina` - For advanced worker thread pooling
 * - `@opentelemetry/api` - For performance monitoring
 * - `ioredis` - For distributed task coordination
 * - `uuid` - For unique task identification
 *
 * ## Main Classes
 */

/**
 * ## PowerScriptConcurrency Class
 * 
 * Main orchestrator class that coordinates worker pools, task queues,
 * and job scheduling for comprehensive concurrent processing.
 * 
 * ### Constructor
 * ```typescript
 * const concurrency = new PowerScriptConcurrency(config);
 * ```
 * 
 * ### Configuration Interface
 * ```typescript
 * interface ConcurrencyConfig {
 *   maxWorkers?: number; // Default: 4
 *   maxConcurrentTasks?: number; // Default: 100
 *   taskTimeout?: number; // Default: 30000ms
 *   retryAttempts?: number; // Default: 3
 *   retryDelay?: number; // Default: 1000ms
 *   enableMetrics?: boolean; // Default: true
 *   enableLogging?: boolean; // Default: true
 * }
 * ```
 * 
 * ### Methods
 */

/**
 * Initialize concurrency system
 * 
 * @return {Promise<void>} Promise that resolves when initialization is complete
 * 
 * Example:
 * <pre>
 * import { PowerScriptConcurrency } from "eips";
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 8,
 *   maxConcurrentTasks: 200,
 *   taskTimeout: 60000,
 *   retryAttempts: 5,
 *   retryDelay: 2000,
 *   enableMetrics: true,
 *   enableLogging: true
 * });
 * 
 * await concurrency.initialize();
 * console.log('Concurrency system initialized');
 * </pre>
 */
async initialize(): Promise<void>

/**
 * Shutdown concurrency system gracefully
 * 
 * @param {Number} timeout - Timeout for graceful shutdown in milliseconds
 * @return {Promise<void>} Promise that resolves when shutdown is complete
 * 
 * Example:
 * <pre>
 * // Graceful shutdown with 30-second timeout
 * await concurrency.shutdown(30000);
 * console.log('Concurrency system shut down');
 * </pre>
 */
async shutdown(timeout?: number): Promise<void>

/**
 * Create task queue with specified strategy
 * 
 * @param {String} name - Queue name identifier
 * @param {String} type - Queue type ('FIFO', 'LIFO', 'PRIORITY')
 * @param {Object} options - Queue configuration options
 * @return {TaskQueue} Created task queue instance
 * 
 * Example:
 * <pre>
 * // Create priority queue for high-importance tasks
 * const priorityQueue = concurrency.createQueue('critical', 'PRIORITY', {
 *   maxSize: 1000,
 *   batchSize: 10,
 *   processingDelay: 100,
 *   retryAttempts: 5
 * });
 * 
 * // Create FIFO queue for regular processing
 * const regularQueue = concurrency.createQueue('regular', 'FIFO', {
 *   maxSize: 5000,
 *   batchSize: 50,
 *   processingDelay: 50
 * });
 * 
 * console.log('Queues created');
 * </pre>
 */
createQueue(name: string, type: QueueType, options?: QueueOptions): TaskQueue

/**
 * Create worker pool for task processing
 * 
 * @param {String} name - Worker pool name
 * @param {Number} workerCount - Number of workers in pool
 * @param {String} queueName - Associated queue name
 * @param {Object} config - Worker configuration
 * @return {Promise<WorkerPool>} Created worker pool instance
 * 
 * Example:
 * <pre>
 * // Create CPU-intensive processing pool
 * const cpuPool = await concurrency.createWorkerPool('cpu_intensive', 4, 'cpu_queue', {
 *   workerScript: './workers/cpu-worker.js',
 *   maxMemoryUsage: 500 * 1024 * 1024, // 500MB per worker
 *   timeout: 120000, // 2 minutes
 *   restartOnError: true
 * });
 * 
 * // Create I/O processing pool
 * const ioPool = await concurrency.createWorkerPool('io_operations', 8, 'io_queue', {
 *   workerScript: './workers/io-worker.js',
 *   maxMemoryUsage: 100 * 1024 * 1024, // 100MB per worker
 *   timeout: 30000,
 *   restartOnError: false
 * });
 * 
 * console.log('Worker pools created');
 * </pre>
 */
async createWorkerPool(name: string, workerCount: number, queueName: string, config?: WorkerConfig): Promise<WorkerPool>

/**
 * Add task to queue for processing
 * 
 * @param {String} queueName - Target queue name
 * @param {Function} handler - Task handler function
 * @param {any} data - Task data payload
 * @param {Object} options - Task options (priority, timeout, retry)
 * @return {Promise<String>} Task ID
 * 
 * Example:
 * <pre>
 * // Add high-priority image processing task
 * const taskId = await concurrency.addTask('image_processing', 
 *   async (data) => {
 *     // Process image
 *     const processedImage = await processImage(data.imageUrl, data.options);
 *     return { processedUrl: processedImage.url, metadata: processedImage.meta };
 *   },
 *   {
 *     imageUrl: 'https://example.com/image.jpg',
 *     options: { width: 800, height: 600, quality: 90 }
 *   },
 *   {
 *     priority: 'high',
 *     timeout: 60000,
 *     retryAttempts: 3,
 *     tags: ['image', 'resize']
 *   }
 * );
 * 
 * console.log('Task added:', taskId);
 * </pre>
 */
async addTask(queueName: string, handler: TaskHandler, data: any, options?: any): Promise<string>

/**
 * Schedule recurring job with cron expression
 * 
 * @param {String} name - Job name identifier
 * @param {String} schedule - Cron schedule expression
 * @param {Function} handler - Job handler function
 * @param {Object} options - Job options
 * @return {Promise<String>} Job ID
 * 
 * Example:
 * <pre>
 * // Schedule daily report generation at 6 AM
 * const reportJobId = await concurrency.scheduleJob(
 *   'daily_reports',
 *   '0 6 * * *', // Every day at 6:00 AM
 *   async (context) => {
 *     const report = await generateDailyReport();
 *     await sendReportEmail(report);
 *     return { status: 'success', reportId: report.id };
 *   },
 *   {
 *     timezone: 'America/New_York',
 *     retryAttempts: 2,
 *     timeout: 300000, // 5 minutes
 *     tags: ['reporting', 'daily']
 *   }
 * );
 * 
 * // Schedule cleanup every hour
 * const cleanupJobId = await concurrency.scheduleJob(
 *   'hourly_cleanup',
 *   '0 * * * *', // Every hour
 *   async () => {
 *     await cleanupTempFiles();
 *     await purgeExpiredSessions();
 *     return { cleaned: true };
 *   }
 * );
 * 
 * console.log('Jobs scheduled:', { reportJobId, cleanupJobId });
 * </pre>
 */
async scheduleJob(name: string, schedule: string, handler: JobHandler, options?: JobOptions): Promise<string>

/**
 * Execute multiple tasks in parallel with concurrency control
 * 
 * @param {Array} tasks - Array of task functions
 * @param {Object} options - Parallel execution options
 * @return {Promise<Array>} Array of task results
 * 
 * Example:
 * <pre>
 * // Process multiple files in parallel with concurrency limit
 * const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];
 * 
 * const results = await concurrency.parallel(
 *   files.map(filename => async () => {
 *     const content = await readFile(filename);
 *     const processed = await processContent(content);
 *     await writeFile(`processed_${filename}`, processed);
 *     return { filename, size: processed.length };
 *   }),
 *   {
 *     concurrency: 3, // Process max 3 files at once
 *     timeout: 30000,
 *     failFast: false, // Continue processing even if some tasks fail
 *     onProgress: (completed, total) => {
 *       console.log(`Progress: ${completed}/${total} files processed`);
 *     }
 *   }
 * );
 * 
 * console.log('Parallel processing results:', results);
 * </pre>
 */
async parallel<T>(tasks: Array<() => Promise<T>>, options?: any): Promise<T[]>

/**
 * Get system performance metrics
 * 
 * @return {Promise<ConcurrencyMetrics>} System performance metrics
 * 
 * Example:
 * <pre>
 * const metrics = await concurrency.getMetrics();
 * 
 * console.log('System Metrics:');
 * console.log('- Active Workers:', metrics.activeWorkers);
 * console.log('- Queued Tasks:', metrics.queuedTasks);
 * console.log('- Completed Tasks:', metrics.completedTasks);
 * console.log('- Failed Tasks:', metrics.failedTasks);
 * console.log('- Average Processing Time:', metrics.avgProcessingTime, 'ms');
 * console.log('- Memory Usage:', (metrics.memoryUsage / 1024 / 1024).toFixed(2), 'MB');
 * console.log('- CPU Usage:', (metrics.cpuUsage * 100).toFixed(2), '%');
 * </pre>
 */
async getMetrics(): Promise<ConcurrencyMetrics>

/**
 * ## Usage Examples
 * 
 * ### Basic Concurrency Setup
 * ```typescript
 * import { PowerScriptConcurrency } from "eips";
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 6,
 *   maxConcurrentTasks: 150,
 *   taskTimeout: 60000,
 *   retryAttempts: 3,
 *   enableMetrics: true
 * });
 * 
 * await concurrency.initialize();
 * console.log('Concurrency system ready');
 * ```
 * 
 * ### Image Processing Pipeline
 * ```typescript
 * import { PowerScriptConcurrency } from "eips";
 * import sharp from 'sharp';
 * import path from 'path';
 * import fs from 'fs/promises';
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 4,
 *   maxConcurrentTasks: 100
 * });
 * await concurrency.initialize();
 * 
 * // Create specialized queues for different types of processing
 * const imageQueue = concurrency.createQueue('images', 'PRIORITY', {
 *   maxSize: 1000,
 *   batchSize: 5
 * });
 * 
 * const thumbnailQueue = concurrency.createQueue('thumbnails', 'FIFO', {
 *   maxSize: 2000,
 *   batchSize: 10
 * });
 * 
 * // Create worker pools
 * await concurrency.createWorkerPool('image_workers', 3, 'images');
 * await concurrency.createWorkerPool('thumbnail_workers', 6, 'thumbnails');
 * 
 * // Image processing functions
 * async function processHighResImage(data) {
 *   const { inputPath, outputPath, options } = data;
 *   
 *   const image = sharp(inputPath);
 *   
 *   if (options.resize) {
 *     image.resize(options.resize.width, options.resize.height);
 *   }
 *   
 *   if (options.format) {
 *     image.toFormat(options.format, { quality: options.quality || 90 });
 *   }
 *   
 *   await image.toFile(outputPath);
 *   
 *   const stats = await fs.stat(outputPath);
 *   return {
 *     outputPath,
 *     originalSize: (await fs.stat(inputPath)).size,
 *     processedSize: stats.size,
 *     compressionRatio: stats.size / (await fs.stat(inputPath)).size
 *   };
 * }
 * 
 * async function generateThumbnail(data) {
 *   const { inputPath, outputPath, size } = data;
 *   
 *   await sharp(inputPath)
 *     .resize(size, size, { 
 *       fit: 'cover',
 *       position: 'center'
 *     })
 *     .jpeg({ quality: 80 })
 *     .toFile(outputPath);
 *   
 *   return { thumbnailPath: outputPath, size };
 * }
 * 
 * // Process batch of images
 * async function processBatchImages(imagePaths) {
 *   const results = {
 *     processed: [],
 *     thumbnails: [],
 *     errors: []
 *   };
 *   
 *   // Add high-resolution processing tasks
 *   const processingTasks = imagePaths.map(async (imagePath) => {
 *     try {
 *       const outputPath = path.join('processed', path.basename(imagePath));
 *       
 *       const taskId = await concurrency.addTask('images', processHighResImage, {
 *         inputPath: imagePath,
 *         outputPath,
 *         options: {
 *           resize: { width: 1920, height: 1080 },
 *           format: 'jpeg',
 *           quality: 85
 *         }
 *       }, {
 *         priority: 'high',
 *         timeout: 120000,
 *         retryAttempts: 2
 *       });
 *       
 *       return taskId;
 *     } catch (error) {
 *       results.errors.push({ imagePath, error: error.message, type: 'processing' });
 *       return null;
 *     }
 *   });
 *   
 *   // Add thumbnail generation tasks
 *   const thumbnailTasks = imagePaths.map(async (imagePath) => {
 *     try {
 *       const thumbnailPath = path.join('thumbnails', `thumb_${path.basename(imagePath)}`);
 *       
 *       const taskId = await concurrency.addTask('thumbnails', generateThumbnail, {
 *         inputPath: imagePath,
 *         outputPath: thumbnailPath,
 *         size: 200
 *       }, {
 *         priority: 'medium',
 *         timeout: 30000,
 *         retryAttempts: 1
 *       });
 *       
 *       return taskId;
 *     } catch (error) {
 *       results.errors.push({ imagePath, error: error.message, type: 'thumbnail' });
 *       return null;
 *     }
 *   });
 *   
 *   // Wait for all tasks to complete
 *   const [processingResults, thumbnailResults] = await Promise.allSettled([
 *     Promise.all(processingTasks),
 *     Promise.all(thumbnailTasks)
 *   ]);
 *   
 *   console.log('Batch processing completed');
 *   console.log('- Processed images:', processingResults.status === 'fulfilled' ? processingResults.value.length : 0);
 *   console.log('- Generated thumbnails:', thumbnailResults.status === 'fulfilled' ? thumbnailResults.value.length : 0);
 *   console.log('- Errors:', results.errors.length);
 *   
 *   return results;
 * }
 * 
 * // Usage
 * const imagePaths = [
 *   'input/photo1.jpg',
 *   'input/photo2.png',
 *   'input/photo3.gif',
 *   'input/photo4.jpg'
 * ];
 * 
 * const results = await processBatchImages(imagePaths);
 * console.log('Processing results:', results);
 * ```
 * 
 * ### Data Processing Pipeline
 * ```typescript
 * import { PowerScriptConcurrency } from "eips";
 * import csv from 'csv-parser';
 * import fs from 'fs';
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 8,
 *   maxConcurrentTasks: 200
 * });
 * await concurrency.initialize();
 * 
 * // Create processing pipeline queues
 * const extractQueue = concurrency.createQueue('extract', 'FIFO');
 * const transformQueue = concurrency.createQueue('transform', 'PRIORITY');
 * const loadQueue = concurrency.createQueue('load', 'FIFO');
 * 
 * // Create worker pools for each stage
 * await concurrency.createWorkerPool('extract_workers', 2, 'extract');
 * await concurrency.createWorkerPool('transform_workers', 4, 'transform');
 * await concurrency.createWorkerPool('load_workers', 2, 'load');
 * 
 * // Pipeline stage functions
 * async function extractData(data) {
 *   const { filePath, batchSize } = data;
 *   const records = [];
 *   
 *   return new Promise((resolve, reject) => {
 *     fs.createReadStream(filePath)
 *       .pipe(csv())
 *       .on('data', (row) => {
 *         records.push(row);
 *         if (records.length >= batchSize) {
 *           // Process batch and continue
 *         }
 *       })
 *       .on('end', () => {
 *         resolve({ records, source: filePath });
 *       })
 *       .on('error', reject);
 *   });
 * }
 * 
 * async function transformData(data) {
 *   const { records } = data;
 *   
 *   const transformed = records.map(record => ({
 *     id: record.id,
 *     name: record.name?.trim().toLowerCase(),
 *     email: record.email?.toLowerCase(),
 *     age: parseInt(record.age) || 0,
 *     salary: parseFloat(record.salary) || 0,
 *     department: record.department?.trim(),
 *     joinDate: new Date(record.join_date),
 *     isActive: record.status?.toLowerCase() === 'active',
 *     processedAt: new Date()
 *   }));
 *   
 *   // Data validation
 *   const valid = transformed.filter(record => 
 *     record.email && record.email.includes('@') && record.age > 0
 *   );
 *   
 *   const invalid = transformed.filter(record => 
 *     !record.email || !record.email.includes('@') || record.age <= 0
 *   );
 *   
 *   return { valid, invalid, totalProcessed: transformed.length };
 * }
 * 
 * async function loadData(data) {
 *   const { valid, invalid } = data;
 *   
 *   // Simulate database insert
 *   const inserted = [];
 *   for (const record of valid) {
 *     // Insert to database
 *     await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB delay
 *     inserted.push({ ...record, dbId: Date.now() + Math.random() });
 *   }
 *   
 *   // Log invalid records
 *   if (invalid.length > 0) {
 *     console.log(`Found ${invalid.length} invalid records`);
 *   }
 *   
 *   return {
 *     inserted: inserted.length,
 *     invalid: invalid.length,
 *     timestamp: new Date()
 *   };
 * }
 * 
 * // ETL Pipeline orchestration
 * async function runETLPipeline(filePaths) {
 *   const pipelineResults = {
 *     extracted: 0,
 *     transformed: 0,
 *     loaded: 0,
 *     errors: []
 *   };
 *   
 *   try {
 *     // Stage 1: Extract data from files
 *     console.log('Starting extraction phase...');
 *     const extractTasks = filePaths.map(filePath => 
 *       concurrency.addTask('extract', extractData, {
 *         filePath,
 *         batchSize: 1000
 *       }, { priority: 'high' })
 *     );
 *     
 *     const extractResults = await Promise.allSettled(extractTasks);
 *     
 *     // Stage 2: Transform extracted data
 *     console.log('Starting transformation phase...');
 *     const transformTasks = [];
 *     for (const result of extractResults) {
 *       if (result.status === 'fulfilled') {
 *         const taskId = await concurrency.addTask('transform', transformData, 
 *           result.value, { priority: 'high' }
 *         );
 *         transformTasks.push(taskId);
 *         pipelineResults.extracted++;
 *       } else {
 *         pipelineResults.errors.push({
 *           stage: 'extract',
 *           error: result.reason
 *         });
 *       }
 *     }
 *     
 *     const transformResults = await Promise.allSettled(transformTasks);
 *     
 *     // Stage 3: Load transformed data
 *     console.log('Starting load phase...');
 *     const loadTasks = [];
 *     for (const result of transformResults) {
 *       if (result.status === 'fulfilled') {
 *         const taskId = await concurrency.addTask('load', loadData,
 *           result.value, { priority: 'medium' }
 *         );
 *         loadTasks.push(taskId);
 *         pipelineResults.transformed++;
 *       } else {
 *         pipelineResults.errors.push({
 *           stage: 'transform',
 *           error: result.reason
 *         });
 *       }
 *     }
 *     
 *     const loadResults = await Promise.allSettled(loadTasks);
 *     
 *     // Process load results
 *     for (const result of loadResults) {
 *       if (result.status === 'fulfilled') {
 *         pipelineResults.loaded++;
 *       } else {
 *         pipelineResults.errors.push({
 *           stage: 'load',
 *           error: result.reason
 *         });
 *       }
 *     }
 *     
 *     console.log('ETL Pipeline completed:');
 *     console.log('- Files extracted:', pipelineResults.extracted);
 *     console.log('- Batches transformed:', pipelineResults.transformed);
 *     console.log('- Batches loaded:', pipelineResults.loaded);
 *     console.log('- Errors:', pipelineResults.errors.length);
 *     
 *     return pipelineResults;
 *     
 *   } catch (error) {
 *     console.error('ETL Pipeline failed:', error);
 *     throw error;
 *   }
 * }
 * 
 * // Run the pipeline
 * const csvFiles = [
 *   'data/employees_2023.csv',
 *   'data/employees_2024.csv',
 *   'data/contractors.csv'
 * ];
 * 
 * const results = await runETLPipeline(csvFiles);
 * console.log('Pipeline results:', results);
 * ```
 * 
 * ### Scheduled Jobs and Monitoring
 * ```typescript
 * import { PowerScriptConcurrency } from "eips";
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 4,
 *   enableMetrics: true,
 *   enableLogging: true
 * });
 * await concurrency.initialize();
 * 
 * // Schedule system monitoring
 * await concurrency.scheduleJob(
 *   'system_monitor',
 *   '*/5 * * * *', // Every 5 minutes
 *   async () => {
 *     const metrics = await concurrency.getMetrics();
 *     
 *     console.log('System Health Check:');
 *     console.log('- Active Workers:', metrics.activeWorkers);
 *     console.log('- Queue Length:', metrics.queuedTasks);
 *     console.log('- Memory Usage:', (metrics.memoryUsage / 1024 / 1024).toFixed(2), 'MB');
 *     console.log('- CPU Usage:', (metrics.cpuUsage * 100).toFixed(2), '%');
 *     
 *     // Alert if system is overloaded
 *     if (metrics.cpuUsage > 0.8 || metrics.memoryUsage > 500 * 1024 * 1024) {
 *       console.warn('⚠️  System overload detected!');
 *       // Send alert notification
 *     }
 *     
 *     return metrics;
 *   }
 * );
 * 
 * // Schedule daily cleanup
 * await concurrency.scheduleJob(
 *   'daily_cleanup',
 *   '0 2 * * *', // Daily at 2 AM
 *   async () => {
 *     console.log('Starting daily cleanup...');
 *     
 *     // Clean up temporary files
 *     await cleanupTempFiles();
 *     
 *     // Archive old logs
 *     await archiveOldLogs();
 *     
 *     // Optimize database
 *     await optimizeDatabase();
 *     
 *     console.log('Daily cleanup completed');
 *     return { status: 'completed', timestamp: new Date() };
 *   },
 *   {
 *     timezone: 'America/New_York',
 *     retryAttempts: 2,
 *     timeout: 600000 // 10 minutes
 *   }
 * );
 * 
 * // Schedule weekly report generation
 * await concurrency.scheduleJob(
 *   'weekly_report',
 *   '0 9 * * 1', // Every Monday at 9 AM
 *   async () => {
 *     console.log('Generating weekly report...');
 *     
 *     const report = {
 *       period: getLastWeekPeriod(),
 *       metrics: await getWeeklyMetrics(),
 *       performance: await getPerformanceStats(),
 *       issues: await getReportedIssues()
 *     };
 *     
 *     await generatePDFReport(report);
 *     await emailReport(report);
 *     
 *     return report;
 *   }
 * );
 * 
 * // Event monitoring
 * concurrency.on('task.completed', (event) => {
 *   console.log(`Task ${event.taskId} completed in ${event.duration}ms`);
 * });
 * 
 * concurrency.on('task.failed', (event) => {
 *   console.error(`Task ${event.taskId} failed:`, event.error);
 * });
 * 
 * concurrency.on('worker.error', (event) => {
 *   console.error('Worker error:', event);
 * });
 * 
 * console.log('Scheduled jobs and monitoring active');
 * ```
 * 
 * ### Parallel Processing with Backpressure
 * ```typescript
 * import { PowerScriptConcurrency } from "eips";
 * 
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: 6,
 *   maxConcurrentTasks: 50
 * });
 * await concurrency.initialize();
 * 
 * // Process large dataset with controlled concurrency
 * async function processLargeDataset(dataItems, processor) {
 *   const results = [];
 *   const errors = [];
 *   let processed = 0;
 *   
 *   // Create processing batches
 *   const batchSize = 10;
 *   const batches = [];
 *   for (let i = 0; i < dataItems.length; i += batchSize) {
 *     batches.push(dataItems.slice(i, i + batchSize));
 *   }
 *   
 *   // Process batches with controlled concurrency
 *   const batchTasks = batches.map((batch, batchIndex) => async () => {
 *     try {
 *       console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
 *       
 *       const batchResults = await Promise.allSettled(
 *         batch.map(async (item, itemIndex) => {
 *           const globalIndex = batchIndex * batchSize + itemIndex;
 *           return processor(item, globalIndex);
 *         })
 *       );
 *       
 *       // Collect results and errors
 *       batchResults.forEach((result, itemIndex) => {
 *         if (result.status === 'fulfilled') {
 *           results.push(result.value);
 *         } else {
 *           errors.push({
 *             index: batchIndex * batchSize + itemIndex,
 *             error: result.reason
 *           });
 *         }
 *       });
 *       
 *       processed += batch.length;
 *       console.log(`Progress: ${processed}/${dataItems.length} items processed`);
 *       
 *       return { batchIndex, processed: batch.length };
 *     } catch (error) {
 *       console.error(`Batch ${batchIndex} failed:`, error);
 *       throw error;
 *     }
 *   });
 *   
 *   // Execute with concurrency control
 *   const batchResults = await concurrency.parallel(batchTasks, {
 *     concurrency: 5, // Process 5 batches at once
 *     timeout: 120000, // 2 minutes per batch
 *     failFast: false,
 *     onProgress: (completed, total) => {
 *       console.log(`Batch progress: ${completed}/${total} batches completed`);
 *     }
 *   });
 *   
 *   return {
 *     results,
 *     errors,
 *     totalProcessed: processed,
 *     batchesCompleted: batchResults.filter(r => r !== null).length
 *   };
 * }
 * 
 * // Example: Process 1000 API calls with rate limiting
 * const apiEndpoints = Array.from({ length: 1000 }, (_, i) => ({
 *   id: i + 1,
 *   url: `https://api.example.com/data/${i + 1}`,
 *   retries: 0
 * }));
 * 
 * async function callAPI(endpoint, index) {
 *   const startTime = Date.now();
 *   
 *   try {
 *     // Simulate API call with random delay and occasional failures
 *     await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
 *     
 *     if (Math.random() > 0.95) { // 5% failure rate
 *       throw new Error('API temporarily unavailable');
 *     }
 *     
 *     const responseTime = Date.now() - startTime;
 *     return {
 *       id: endpoint.id,
 *       url: endpoint.url,
 *       responseTime,
 *       data: `Response data for ${endpoint.id}`,
 *       timestamp: new Date()
 *     };
 *   } catch (error) {
 *     throw new Error(`API call failed for ${endpoint.url}: ${error.message}`);
 *   }
 * }
 * 
 * // Process the API calls
 * console.log('Starting large-scale API processing...');
 * const startTime = Date.now();
 * 
 * const processingResult = await processLargeDataset(apiEndpoints, callAPI);
 * 
 * const totalTime = Date.now() - startTime;
 * 
 * console.log('\\nProcessing completed:');
 * console.log('- Total items:', apiEndpoints.length);
 * console.log('- Successful:', processingResult.results.length);
 * console.log('- Failed:', processingResult.errors.length);
 * console.log('- Total time:', (totalTime / 1000).toFixed(2), 'seconds');
 * console.log('- Average per item:', (totalTime / apiEndpoints.length).toFixed(2), 'ms');
 * console.log('- Success rate:', ((processingResult.results.length / apiEndpoints.length) * 100).toFixed(2), '%');
 * 
 * // Show metrics
 * const metrics = await concurrency.getMetrics();
 * console.log('\\nFinal system metrics:', metrics);
 * ```
 * 
 * ## Best Practices
 * 
 * 1. **Resource Management**: Monitor memory and CPU usage to prevent system overload
 * 2. **Error Handling**: Implement proper retry mechanisms with exponential backoff
 * 3. **Queue Strategy**: Choose appropriate queue types based on task priority needs
 * 4. **Worker Sizing**: Size worker pools based on task characteristics (CPU vs I/O bound)
 * 5. **Monitoring**: Use metrics and events for system health monitoring
 * 6. **Graceful Shutdown**: Always implement proper cleanup procedures
 * 
 * ```typescript
 * // Example of comprehensive concurrency setup
 * const concurrency = new PowerScriptConcurrency({
 *   maxWorkers: Math.min(require('os').cpus().length, 8),
 *   maxConcurrentTasks: 100,
 *   taskTimeout: 30000,
 *   retryAttempts: 3,
 *   retryDelay: 1000,
 *   enableMetrics: true,
 *   enableLogging: process.env.NODE_ENV !== 'production'
 * });
 * 
 * // Setup graceful shutdown
 * process.on('SIGTERM', async () => {
 *   console.log('Received SIGTERM, shutting down gracefully...');
 *   await concurrency.shutdown(30000);
 *   process.exit(0);
 * });
 * 
 * process.on('SIGINT', async () => {
 *   console.log('Received SIGINT, shutting down gracefully...');
 *   await concurrency.shutdown(30000);
 *   process.exit(0);
 * });
 * 
 * await concurrency.initialize();
 * console.log('Production concurrency system ready');
 * ```
 */