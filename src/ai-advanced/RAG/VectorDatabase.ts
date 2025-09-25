/**
 * PowerScript Advanced AI Systems - Vector Database Interface
 * 
 * Unified interface for vector database operations supporting multiple backends:
 * - In-memory storage (for development/testing)
 * - FAISS (Facebook AI Similarity Search)
 * - Pinecone (cloud vector database)
 * - Weaviate (open-source vector database)
 * - Chroma (embedding database)
 * - Milvus (cloud-native vector database)
 */

export interface VectorMetadata {
  id: string;
  text?: string;
  source?: string;
  timestamp?: number;
  tags?: string[];
  [key: string]: any;
}

export interface Vector {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
  vector?: number[];
}

export interface VectorSearchOptions {
  topK?: number;
  scoreThreshold?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  includeValues?: boolean;
}

export interface VectorDatabaseConfig {
  type: 'memory' | 'faiss' | 'pinecone' | 'weaviate' | 'chroma' | 'milvus';
  dimension: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
  
  // Connection settings
  apiKey?: string;
  endpoint?: string;
  indexName?: string;
  
  // Performance settings
  batchSize?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface VectorDatabaseStats {
  totalVectors: number;
  dimension: number;
  indexSize: number;
  memoryUsage?: number;
  queryCount: number;
  averageQueryTime: number;
}

/**
 * Abstract base class for vector database implementations
 */
export abstract class VectorDatabase {
  protected config: VectorDatabaseConfig;
  protected stats: VectorDatabaseStats;

  constructor(config: VectorDatabaseConfig) {
    this.config = config;
    this.stats = {
      totalVectors: 0,
      dimension: config.dimension,
      indexSize: 0,
      queryCount: 0,
      averageQueryTime: 0
    };
  }

  /**
   * Initialize the vector database connection
   */
  abstract initialize(): Promise<void>;

  /**
   * Insert a single vector
   */
  abstract insert(vector: Vector): Promise<void>;

  /**
   * Insert multiple vectors in batch
   */
  abstract insertBatch(vectors: Vector[]): Promise<void>;

  /**
   * Search for similar vectors
   */
  abstract search(queryVector: number[], options?: VectorSearchOptions): Promise<VectorSearchResult[]>;

  /**
   * Get vector by ID
   */
  abstract get(id: string): Promise<Vector | null>;

  /**
   * Delete vector by ID
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Delete multiple vectors by IDs
   */
  abstract deleteBatch(ids: string[]): Promise<number>;

  /**
   * Update vector metadata
   */
  abstract updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<boolean>;

  /**
   * Clear all vectors
   */
  abstract clear(): Promise<void>;

  /**
   * Get database statistics
   */
  getStats(): VectorDatabaseStats {
    return { ...this.stats };
  }

  /**
   * Create index for faster search (if supported)
   */
  abstract createIndex(): Promise<void>;

  /**
   * Close database connection
   */
  abstract close(): Promise<void>;
}

/**
 * In-memory vector database implementation
 * Useful for development, testing, and small datasets
 */
export class MemoryVectorDatabase extends VectorDatabase {
  private vectors: Map<string, Vector> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async insert(vector: Vector): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (vector.values.length !== this.config.dimension) {
      throw new Error(`Vector dimension ${vector.values.length} does not match configured dimension ${this.config.dimension}`);
    }

    this.vectors.set(vector.id, { ...vector });
    this.stats.totalVectors = this.vectors.size;
    this.stats.indexSize = this.vectors.size * this.config.dimension * 4; // Approximate bytes
  }

  async insertBatch(vectors: Vector[]): Promise<void> {
    for (const vector of vectors) {
      await this.insert(vector);
    }
  }

  async search(queryVector: number[], options: VectorSearchOptions = {}): Promise<VectorSearchResult[]> {
    const startTime = Date.now();
    
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }

    if (queryVector.length !== this.config.dimension) {
      throw new Error(`Query vector dimension ${queryVector.length} does not match configured dimension ${this.config.dimension}`);
    }

    const {
      topK = 10,
      scoreThreshold = 0,
      filter = {},
      includeMetadata = true,
      includeValues = false
    } = options;

    const results: VectorSearchResult[] = [];
    const metric = this.config.metric || 'cosine';

    for (const [id, vector] of Array.from(this.vectors)) {
      // Apply filters
      if (Object.keys(filter).length > 0) {
        let passesFilter = true;
        for (const [key, value] of Object.entries(filter)) {
          if (vector.metadata[key] !== value) {
            passesFilter = false;
            break;
          }
        }
        if (!passesFilter) continue;
      }

      // Calculate similarity score
      const score = this._calculateSimilarity(queryVector, vector.values, metric);
      
      if (score >= scoreThreshold) {
        const result: VectorSearchResult = {
          id,
          score,
          metadata: includeMetadata ? { ...vector.metadata } : {} as VectorMetadata
        };

        if (includeValues) {
          result.vector = [...vector.values];
        }

        results.push(result);
      }
    }

    // Sort by score (descending) and limit to topK
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, topK);

    // Update statistics
    this.stats.queryCount++;
    const queryTime = Date.now() - startTime;
    this.stats.averageQueryTime = 
      (this.stats.averageQueryTime * (this.stats.queryCount - 1) + queryTime) / this.stats.queryCount;

    return limitedResults;
  }

  async get(id: string): Promise<Vector | null> {
    const vector = this.vectors.get(id);
    return vector ? { ...vector } : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.vectors.delete(id);
    if (deleted) {
      this.stats.totalVectors = this.vectors.size;
      this.stats.indexSize = this.vectors.size * this.config.dimension * 4;
    }
    return deleted;
  }

  async deleteBatch(ids: string[]): Promise<number> {
    let deletedCount = 0;
    for (const id of ids) {
      if (await this.delete(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<boolean> {
    const vector = this.vectors.get(id);
    if (vector) {
      vector.metadata = { ...vector.metadata, ...metadata };
      this.vectors.set(id, vector);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    this.stats.totalVectors = 0;
    this.stats.indexSize = 0;
  }

  async createIndex(): Promise<void> {
    // In-memory database doesn't need explicit indexing
  }

  async close(): Promise<void> {
    this.vectors.clear();
    this.initialized = false;
  }

  /**
   * Calculate similarity between two vectors
   */
  private _calculateSimilarity(a: number[], b: number[], metric: string): number {
    switch (metric) {
      case 'cosine':
        return this._cosineSimilarity(a, b);
      case 'euclidean':
        return 1 / (1 + this._euclideanDistance(a, b));
      case 'dotproduct':
        return this._dotProduct(a, b);
      default:
        return this._cosineSimilarity(a, b);
    }
  }

  /**
   * Calculate cosine similarity
   */
  private _cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = this._dotProduct(a, b);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate dot product
   */
  private _dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  /**
   * Calculate Euclidean distance
   */
  private _euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }
}

/**
 * Vector database factory
 */
export class VectorDatabaseFactory {
  /**
   * Create a vector database instance
   */
  static create(config: VectorDatabaseConfig): VectorDatabase {
    switch (config.type) {
      case 'memory':
        return new MemoryVectorDatabase(config);
      case 'faiss':
        throw new Error('FAISS implementation not yet available');
      case 'pinecone':
        throw new Error('Pinecone implementation not yet available');
      case 'weaviate':
        throw new Error('Weaviate implementation not yet available');
      case 'chroma':
        throw new Error('Chroma implementation not yet available');
      case 'milvus':
        throw new Error('Milvus implementation not yet available');
      default:
        throw new Error(`Unsupported vector database type: ${config.type}`);
    }
  }
}

// Types are already exported above, no need to re-export