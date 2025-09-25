/**
 * PowerScript Filesystem & Storage Module - Type Definitions
 * Provides comprehensive filesystem and storage capabilities
 */

// Core filesystem types
export interface FileSystemConfig {
  defaultFS?: 'native' | 'memory' | 'zip' | 's3' | 'gcs' | 'azure';
  nativeRoot?: string;
  memorySize?: number;
  timeout?: number;
  enableWatchers?: boolean;
  enableStreaming?: boolean;
  cacheEnabled?: boolean;
  cacheSize?: number;
}

export interface FileStats {
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
  permissions: number;
  owner?: string;
  group?: string;
}

export interface FileOptions {
  encoding?: BufferEncoding | null;
  flag?: string;
  mode?: number;
  createDirectories?: boolean;
  overwrite?: boolean;
}

export interface DirectoryOptions {
  recursive?: boolean;
  withFileTypes?: boolean;
  filter?: (path: string) => boolean;
}

export interface WatchOptions {
  recursive?: boolean;
  persistent?: boolean;
  interval?: number;
  filter?: (path: string) => boolean;
}

export interface StreamOptions {
  highWaterMark?: number;
  encoding?: BufferEncoding;
  objectMode?: boolean;
  start?: number;
  end?: number;
}

// File system event types
export type FileSystemEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir' | 'error';

export interface FileSystemEvent {
  type: FileSystemEventType;
  path: string;
  stats?: FileStats;
  error?: Error;
  timestamp: Date;
}

// Storage provider types
export interface StorageProvider {
  name: string;
  type: 'native' | 'cloud' | 'virtual';
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  exists(path: string): Promise<boolean>;
  readFile(path: string, options?: FileOptions): Promise<Buffer | string>;
  writeFile(path: string, data: Buffer | string, options?: FileOptions): Promise<void>;
  deleteFile(path: string): Promise<void>;
  createDirectory(path: string, options?: DirectoryOptions): Promise<void>;
  removeDirectory(path: string, options?: DirectoryOptions): Promise<void>;
  listDirectory(path: string, options?: DirectoryOptions): Promise<string[]>;
  getStats(path: string): Promise<FileStats>;
  copy(source: string, destination: string): Promise<void>;
  move(source: string, destination: string): Promise<void>;
}

// Cloud storage configurations
export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export interface GCSConfig {
  projectId: string;
  bucket: string;
  keyFilename?: string;
  credentials?: any;
}

export interface AzureConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
  endpoint?: string;
}

// Database storage types
export interface DatabaseConfig {
  type: 'sqlite' | 'cassandra' | 'neo4j' | 'dynamodb' | 'redis';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  options?: Record<string, any>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  where?: Record<string, any>;
  select?: string[];
}

export interface QueryResult<T = any> {
  data: T[];
  count: number;
  hasMore: boolean;
  cursor?: string;
}

// Virtual filesystem types
export interface VirtualFileSystem {
  mount(path: string, provider: StorageProvider): void;
  unmount(path: string): void;
  resolve(path: string): { provider: StorageProvider; relativePath: string };
  exists(path: string): Promise<boolean>;
  readFile(path: string, options?: FileOptions): Promise<Buffer | string>;
  writeFile(path: string, data: Buffer | string, options?: FileOptions): Promise<void>;
}

// Stream types
export interface FileReadStream extends NodeJS.ReadableStream {
  bytesRead: number;
  path: string;
  pending: boolean;
}

export interface FileWriteStream extends NodeJS.WritableStream {
  bytesWritten: number;
  path: string;
  pending: boolean;
}

// Watcher types
export interface FileWatcher {
  id: string;
  path: string;
  options: WatchOptions;
  isActive: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: 'change', listener: (event: FileSystemEvent) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

// Cache types
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiry?: Date;
  size: number;
  hits: number;
  created: Date;
  accessed: Date;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
  maxItems?: number;
}

// Main filesystem interface
export interface PowerScriptFileSystemOptions extends FileSystemConfig {
  providers?: Record<string, StorageProvider>;
  databases?: Record<string, DatabaseConfig>;
  cloudConfigs?: {
    s3?: S3Config[];
    gcs?: GCSConfig[];
    azure?: AzureConfig[];
  };
}

export interface FileSystemStats {
  totalOperations: number;
  totalBytes: number;
  cacheHits: number;
  cacheMisses: number;
  activeWatchers: number;
  activeStreams: number;
  errorCount: number;
  uptime: number;
}

// Error types
export class FileSystemError extends Error {
  constructor(
    message: string,
    public code: string = 'FILESYSTEM_ERROR',
    public path?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export class StorageProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public operation: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StorageProviderError';
  }
}