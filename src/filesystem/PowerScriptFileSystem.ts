/**
 * PowerScript Filesystem & Storage Module
 * Provides comprehensive filesystem and storage capabilities with AS3-style APIs
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

import {
  FileSystemConfig,
  FileStats,
  FileOptions,
  DirectoryOptions,
  WatchOptions,
  StreamOptions,
  FileSystemEvent,
  StorageProvider,
  VirtualFileSystem,
  FileWatcher,
  CacheEntry,
  CacheOptions,
  PowerScriptFileSystemOptions,
  FileSystemStats,
  FileSystemError,
  StorageProviderError
} from './types';

/**
 * Native filesystem provider implementation
 */
class NativeStorageProvider implements StorageProvider {
  name = 'native';
  type = 'native' as const;
  
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = path.resolve(rootPath);
  }

  async connect(): Promise<void> {
    // Native FS doesn't need connection
  }

  async disconnect(): Promise<void> {
    // Native FS doesn't need disconnection
  }

  private resolvePath(filePath: string): string {
    return path.resolve(this.rootPath, filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async readFile(filePath: string, options?: FileOptions): Promise<Buffer | string> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      return await fs.promises.readFile(resolvedPath, options as any);
    } catch (error) {
      throw new FileSystemError(`Failed to read file: ${filePath}`, 'READ_ERROR', filePath, error as Error);
    }
  }

  async writeFile(filePath: string, data: Buffer | string, options?: FileOptions): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      
      if (options?.createDirectories) {
        const dir = path.dirname(resolvedPath);
        await fs.promises.mkdir(dir, { recursive: true });
      }

      await fs.promises.writeFile(resolvedPath, data, options as any);
    } catch (error) {
      throw new FileSystemError(`Failed to write file: ${filePath}`, 'WRITE_ERROR', filePath, error as Error);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await fs.promises.unlink(resolvedPath);
    } catch (error) {
      throw new FileSystemError(`Failed to delete file: ${filePath}`, 'DELETE_ERROR', filePath, error as Error);
    }
  }

  async createDirectory(dirPath: string, options?: DirectoryOptions): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(dirPath);
      await fs.promises.mkdir(resolvedPath, { recursive: options?.recursive });
    } catch (error) {
      throw new FileSystemError(`Failed to create directory: ${dirPath}`, 'MKDIR_ERROR', dirPath, error as Error);
    }
  }

  async removeDirectory(dirPath: string, options?: DirectoryOptions): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(dirPath);
      await fs.promises.rmdir(resolvedPath, { recursive: options?.recursive });
    } catch (error) {
      throw new FileSystemError(`Failed to remove directory: ${dirPath}`, 'RMDIR_ERROR', dirPath, error as Error);
    }
  }

  async listDirectory(dirPath: string, options?: DirectoryOptions): Promise<string[]> {
    try {
      const resolvedPath = this.resolvePath(dirPath);
      const entries = await fs.promises.readdir(resolvedPath);
      
      if (options?.filter) {
        return entries.filter(entry => options.filter!(path.join(dirPath, entry)));
      }
      
      return entries;
    } catch (error) {
      throw new FileSystemError(`Failed to list directory: ${dirPath}`, 'READDIR_ERROR', dirPath, error as Error);
    }
  }

  async getStats(filePath: string): Promise<FileStats> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      const stats = await fs.promises.stat(resolvedPath);
      
      return {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode,
        owner: stats.uid.toString(),
        group: stats.gid.toString()
      };
    } catch (error) {
      throw new FileSystemError(`Failed to get stats: ${filePath}`, 'STAT_ERROR', filePath, error as Error);
    }
  }

  async copy(source: string, destination: string): Promise<void> {
    try {
      const srcPath = this.resolvePath(source);
      const destPath = this.resolvePath(destination);
      await fs.promises.copyFile(srcPath, destPath);
    } catch (error) {
      throw new FileSystemError(`Failed to copy file: ${source} -> ${destination}`, 'COPY_ERROR', source, error as Error);
    }
  }

  async move(source: string, destination: string): Promise<void> {
    try {
      const srcPath = this.resolvePath(source);
      const destPath = this.resolvePath(destination);
      await fs.promises.rename(srcPath, destPath);
    } catch (error) {
      throw new FileSystemError(`Failed to move file: ${source} -> ${destination}`, 'MOVE_ERROR', source, error as Error);
    }
  }
}

/**
 * Simple cache implementation
 */
class FileSystemCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 300000, // 5 minutes
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB
      maxItems: options.maxItems || 1000
    };
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiry
    if (entry.expiry && entry.expiry < new Date()) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access stats
    entry.hits++;
    entry.accessed = new Date();

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = new Date();
    const expiry = ttl ? new Date(now.getTime() + ttl) : new Date(now.getTime() + this.options.ttl);
    
    const entry: CacheEntry<T> = {
      key,
      value,
      expiry,
      size: this.calculateSize(value),
      hits: 0,
      created: now,
      accessed: now
    };

    // Check size limits
    if (entry.size > this.options.maxSize) {
      throw new Error(`Cache entry too large: ${entry.size} bytes`);
    }

    // Make room if necessary
    this.evictIfNecessary(entry.size);

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: entries.reduce((sum, entry) => sum + entry.size, 0),
      itemCount: entries.length,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      oldestEntry: entries.reduce((oldest, entry) => 
        !oldest || entry.created < oldest.created ? entry : oldest, null as CacheEntry<T> | null)
    };
  }

  private calculateSize(value: any): number {
    if (Buffer.isBuffer(value)) return value.length;
    if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private evictIfNecessary(newEntrySize: number): void {
    const stats = this.getStats();
    
    // Check item count
    while (this.cache.size >= this.options.maxItems) {
      this.evictOldest();
    }

    // Check total size
    while (stats.size + newEntrySize > this.options.maxSize) {
      this.evictOldest();
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = new Date();

    for (const [key, entry] of this.cache) {
      if (entry.accessed < oldestTime) {
        oldestTime = entry.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Main PowerScript Filesystem & Storage class
 */
export class PowerScriptFileSystem extends EventEmitter {
  private config: Required<FileSystemConfig>;
  private providers = new Map<string, StorageProvider>();
  private defaultProvider: StorageProvider;
  private cache: FileSystemCache;
  private watchers = new Map<string, fs.FSWatcher>();
  private stats: FileSystemStats;
  private startTime: number;

  constructor(options: PowerScriptFileSystemOptions = {}) {
    super();
    
    this.config = {
      defaultFS: 'native',
      nativeRoot: process.cwd(),
      memorySize: 100 * 1024 * 1024,
      timeout: 30000,
      enableWatchers: true,
      enableStreaming: true,
      cacheEnabled: true,
      cacheSize: 50 * 1024 * 1024,
      ...options
    };

    this.cache = new FileSystemCache({
      maxSize: this.config.cacheSize,
      ttl: 300000 // 5 minutes
    });

    this.stats = {
      totalOperations: 0,
      totalBytes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeWatchers: 0,
      activeStreams: 0,
      errorCount: 0,
      uptime: 0
    };

    this.startTime = Date.now();
    this.defaultProvider = new NativeStorageProvider(this.config.nativeRoot);
    this.providers.set('native', this.defaultProvider);
  }

  /**
   * Initialize the filesystem
   */
  async initialize(): Promise<void> {
    try {
      await this.defaultProvider.connect();
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register a storage provider
   */
  registerProvider(name: string, provider: StorageProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Check if a file or directory exists
   */
  async exists(path: string, providerName?: string): Promise<boolean> {
    try {
      this.stats.totalOperations++;
      const provider = this.getProvider(providerName);
      return await provider.exists(path);
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string, options?: FileOptions, providerName?: string): Promise<Buffer | string> {
    try {
      this.stats.totalOperations++;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cacheKey = `read:${providerName || 'default'}:${path}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
        this.stats.cacheMisses++;
      }

      const provider = this.getProvider(providerName);
      const data = await provider.readFile(path, options);
      
      if (Buffer.isBuffer(data)) {
        this.stats.totalBytes += data.length;
      } else {
        this.stats.totalBytes += Buffer.byteLength(data, 'utf8');
      }

      // Cache the result
      if (this.config.cacheEnabled) {
        const cacheKey = `read:${providerName || 'default'}:${path}`;
        this.cache.set(cacheKey, data);
      }

      return data;
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(path: string, data: Buffer | string, options?: FileOptions, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.writeFile(path, data, options);
      
      if (Buffer.isBuffer(data)) {
        this.stats.totalBytes += data.length;
      } else {
        this.stats.totalBytes += Buffer.byteLength(data, 'utf8');
      }

      // Invalidate cache
      if (this.config.cacheEnabled) {
        const cacheKey = `read:${providerName || 'default'}:${path}`;
        this.cache.delete(cacheKey);
      }

      this.emit('fileWritten', { path, size: Buffer.isBuffer(data) ? data.length : data.length });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.deleteFile(path);

      // Invalidate cache
      if (this.config.cacheEnabled) {
        const cacheKey = `read:${providerName || 'default'}:${path}`;
        this.cache.delete(cacheKey);
      }

      this.emit('fileDeleted', { path });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string, options?: DirectoryOptions, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.createDirectory(path, options);

      this.emit('directoryCreated', { path });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove a directory
   */
  async removeDirectory(path: string, options?: DirectoryOptions, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.removeDirectory(path, options);

      this.emit('directoryRemoved', { path });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string, options?: DirectoryOptions, providerName?: string): Promise<string[]> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      return await provider.listDirectory(path, options);
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get file/directory statistics
   */
  async getStats(path: string, providerName?: string): Promise<FileStats> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      return await provider.getStats(path);
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Copy a file
   */
  async copy(source: string, destination: string, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.copy(source, destination);

      this.emit('fileCopied', { source, destination });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Move a file
   */
  async move(source: string, destination: string, providerName?: string): Promise<void> {
    try {
      this.stats.totalOperations++;
      
      const provider = this.getProvider(providerName);
      await provider.move(source, destination);

      // Update cache
      if (this.config.cacheEnabled) {
        const oldKey = `read:${providerName || 'default'}:${source}`;
        const newKey = `read:${providerName || 'default'}:${destination}`;
        const cached = this.cache.get(oldKey);
        if (cached) {
          this.cache.delete(oldKey);
          this.cache.set(newKey, cached);
        }
      }

      this.emit('fileMoved', { source, destination });
    } catch (error) {
      this.stats.errorCount++;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Watch for file system changes
   */
  watch(path: string, options: WatchOptions = {}): string {
    if (!this.config.enableWatchers) {
      throw new Error('File watchers are disabled');
    }

    const watcherId = `watcher_${Date.now()}_${Math.random()}`;
    
    try {
      const watcher = fs.watch(path, { 
        recursive: options.recursive,
        persistent: options.persistent !== false 
      }, (eventType, filename) => {
        if (filename) {
          const fullPath = require('path').join(path, filename);
          
          if (options.filter && !options.filter(fullPath)) {
            return;
          }

          const event: FileSystemEvent = {
            type: eventType === 'rename' ? 'change' : 'change',
            path: fullPath,
            timestamp: new Date()
          };

          this.emit('fileChange', event);
        }
      });

      watcher.on('error', (error) => {
        this.emit('error', error);
        this.unwatchFile(watcherId);
      });

      this.watchers.set(watcherId, watcher);
      this.stats.activeWatchers++;

      return watcherId;
    } catch (error) {
      this.stats.errorCount++;
      throw new FileSystemError(`Failed to watch path: ${path}`, 'WATCH_ERROR', path, error as Error);
    }
  }

  /**
   * Stop watching a file/directory
   */
  unwatchFile(watcherId: string): void {
    const watcher = this.watchers.get(watcherId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(watcherId);
      this.stats.activeWatchers--;
    }
  }

  /**
   * Get filesystem statistics
   */
  getFileSystemStats(): FileSystemStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Shutdown the filesystem
   */
  async shutdown(): Promise<void> {
    // Close all watchers
    for (const [id, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();

    // Disconnect providers
    for (const provider of this.providers.values()) {
      await provider.disconnect();
    }

    // Clear cache
    this.cache.clear();

    this.emit('shutdown');
  }

  private getProvider(name?: string): StorageProvider {
    const providerName = name || this.config.defaultFS;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new StorageProviderError(
        `Storage provider not found: ${providerName}`,
        providerName,
        'get_provider'
      );
    }
    
    return provider;
  }
}

export default PowerScriptFileSystem;