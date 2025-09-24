/**
 * PowerScript Database Integrations Types
 * Comprehensive type definitions for database operations
 */

// Core Database Types
export interface DatabaseConfig {
    provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'dynamodb' | 'elasticsearch';
    connection: {
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
        ssl?: boolean;
        url?: string; // For connection string
        options?: Record<string, any>;
    };
    pool?: {
        enabled: boolean;
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        idleTimeoutMillis: number;
        createTimeoutMillis: number;
    };
    cache?: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        strategy: 'memory' | 'redis' | 'none';
    };
    retry?: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoffMultiplier: number;
    };
    monitoring?: {
        enabled: boolean;
        slowQueryThreshold: number;
        logQueries: boolean;
    };
}

// Query Types
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
    groupBy?: string[];
    having?: WhereClause;
    distinct?: boolean;
    include?: string[]; // For relations
    cache?: boolean;
    timeout?: number;
}

export interface WhereClause {
    [key: string]: any | {
        $eq?: any;
        $ne?: any;
        $gt?: any;
        $gte?: any;
        $lt?: any;
        $lte?: any;
        $in?: any[];
        $nin?: any[];
        $like?: string;
        $ilike?: string;
        $between?: [any, any];
        $exists?: boolean;
        $and?: WhereClause[];
        $or?: WhereClause[];
        $not?: WhereClause;
    };
}

export interface QueryResult<T = any> {
    data: T[];
    count: number;
    totalCount?: number;
    hasMore?: boolean;
    metadata: {
        executionTime: number;
        cached: boolean;
        affectedRows?: number;
        insertId?: any;
        query?: string;
        parameters?: any[];
    };
}

export interface SingleResult<T = any> {
    data: T | null;
    metadata: {
        executionTime: number;
        cached: boolean;
        found: boolean;
        query?: string;
        parameters?: any[];
    };
}

// Transaction Types
export interface Transaction {
    id: string;
    startTime: Date;
    status: 'active' | 'committed' | 'rolled_back';
    
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    findOne<T = any>(table: string, where: WhereClause): Promise<SingleResult<T>>;
    findMany<T = any>(table: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>>;
    insert<T = any>(table: string, data: Partial<T>): Promise<SingleResult<T>>;
    update<T = any>(table: string, data: Partial<T>, where: WhereClause): Promise<QueryResult<T>>;
    delete(table: string, where: WhereClause): Promise<QueryResult<any>>;
    
    commit(): Promise<void>;
    rollback(): Promise<void>;
}

// Model Types
export interface ModelDefinition {
    tableName: string;
    primaryKey: string | string[];
    fields: Record<string, FieldDefinition>;
    relations?: Record<string, RelationDefinition>;
    indexes?: IndexDefinition[];
    hooks?: ModelHooks;
    options?: {
        timestamps?: boolean;
        softDelete?: boolean;
        version?: boolean;
    };
}

export interface FieldDefinition {
    type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'uuid' | 'text' | 'binary';
    required?: boolean;
    unique?: boolean;
    default?: any;
    validate?: (value: any) => boolean | string;
    transform?: {
        get?: (value: any) => any;
        set?: (value: any) => any;
    };
    length?: number;
    precision?: number;
    scale?: number;
}

export interface RelationDefinition {
    type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
    target: string;
    foreignKey?: string;
    localKey?: string;
    through?: string; // For many-to-many
    cascade?: boolean;
}

export interface IndexDefinition {
    name: string;
    fields: string[];
    unique?: boolean;
    type?: 'btree' | 'hash' | 'gist' | 'gin';
}

export interface ModelHooks {
    beforeCreate?: (data: any) => any | Promise<any>;
    afterCreate?: (data: any) => void | Promise<void>;
    beforeUpdate?: (data: any, where: WhereClause) => any | Promise<any>;
    afterUpdate?: (data: any, result: any) => void | Promise<void>;
    beforeDelete?: (where: WhereClause) => void | Promise<void>;
    afterDelete?: (result: any) => void | Promise<void>;
    beforeFind?: (where: WhereClause, options: QueryOptions) => any | Promise<any>;
    afterFind?: (result: any) => any | Promise<any>;
}

// Migration Types
export interface Migration {
    id: string;
    name: string;
    timestamp: Date;
    up: (db: DatabaseProvider) => Promise<void>;
    down: (db: DatabaseProvider) => Promise<void>;
}

export interface MigrationResult {
    success: boolean;
    migration: Migration;
    executionTime: number;
    error?: Error;
}

// Provider Interface
export interface DatabaseProvider {
    name: string;
    version: string;
    type: 'sql' | 'nosql' | 'graph' | 'cache';
    
    // Connection Management
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    ping(): Promise<boolean>;
    
    // Raw Query Execution
    query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
    execute(sql: string, params?: any[]): Promise<QueryResult<any>>;
    
    // CRUD Operations
    findOne<T = any>(table: string, where: WhereClause): Promise<SingleResult<T>>;
    findMany<T = any>(table: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>>;
    insert<T = any>(table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>>;
    update<T = any>(table: string, data: Partial<T>, where: WhereClause): Promise<QueryResult<T>>;
    delete(table: string, where: WhereClause): Promise<QueryResult<any>>;
    count(table: string, where?: WhereClause): Promise<number>;
    exists(table: string, where: WhereClause): Promise<boolean>;
    
    // Transaction Management
    beginTransaction(): Promise<Transaction>;
    
    // Schema Management
    createTable(definition: ModelDefinition): Promise<void>;
    dropTable(tableName: string): Promise<void>;
    alterTable(tableName: string, changes: any): Promise<void>;
    createIndex(tableName: string, index: IndexDefinition): Promise<void>;
    dropIndex(tableName: string, indexName: string): Promise<void>;
    
    // Migration Support
    runMigration(migration: Migration): Promise<MigrationResult>;
    
    // Health and Monitoring
    getStats(): Promise<Record<string, any>>;
    clearCache(): Promise<void>;
}

// Model Class Interface
export interface Model<T = any> {
    tableName: string;
    definition: ModelDefinition;
    
    // Query Methods
    find(where?: WhereClause, options?: QueryOptions): Promise<T[]>;
    findOne(where: WhereClause): Promise<T | null>;
    findById(id: any): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(data: Partial<T>, where: WhereClause): Promise<T[]>;
    delete(where: WhereClause): Promise<number>;
    count(where?: WhereClause): Promise<number>;
    exists(where: WhereClause): Promise<boolean>;
    
    // Relationship Methods
    with(relations: string[]): Model<T>;
    
    // Validation
    validate(data: Partial<T>): Promise<ValidationResult>;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    value: any;
}

// Event Types
export enum DatabaseEventType {
    CONNECTION_OPENED = 'db.connection.opened',
    CONNECTION_CLOSED = 'db.connection.closed',
    CONNECTION_ERROR = 'db.connection.error',
    QUERY_START = 'db.query.start',
    QUERY_SUCCESS = 'db.query.success',
    QUERY_ERROR = 'db.query.error',
    SLOW_QUERY = 'db.query.slow',
    TRANSACTION_START = 'db.transaction.start',
    TRANSACTION_COMMIT = 'db.transaction.commit',
    TRANSACTION_ROLLBACK = 'db.transaction.rollback',
    MIGRATION_START = 'db.migration.start',
    MIGRATION_SUCCESS = 'db.migration.success',
    MIGRATION_ERROR = 'db.migration.error',
    CACHE_HIT = 'db.cache.hit',
    CACHE_MISS = 'db.cache.miss'
}

export enum DatabaseSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface DatabaseEvent {
    id: string;
    type: DatabaseEventType;
    timestamp: Date;
    severity: DatabaseSeverity;
    message: string;
    metadata: Record<string, any>;
    provider?: string;
    duration?: number;
    error?: Error;
}

// Error Types
export class DatabaseError extends Error {
    constructor(
        message: string,
        public code: string,
        public category: 'connection' | 'query' | 'transaction' | 'migration' | 'validation' = 'query',
        public severity: DatabaseSeverity = DatabaseSeverity.MEDIUM,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ConnectionError extends DatabaseError {
    constructor(message: string, code: string = 'CONNECTION_ERROR', retryable: boolean = true) {
        super(message, code, 'connection', DatabaseSeverity.HIGH, retryable);
        this.name = 'ConnectionError';
    }
}

export class QueryError extends DatabaseError {
    constructor(message: string, code: string = 'QUERY_ERROR', retryable: boolean = false) {
        super(message, code, 'query', DatabaseSeverity.MEDIUM, retryable);
        this.name = 'QueryError';
    }
}

export class TransactionError extends DatabaseError {
    constructor(message: string, code: string = 'TRANSACTION_ERROR', retryable: boolean = false) {
        super(message, code, 'transaction', DatabaseSeverity.HIGH, retryable);
        this.name = 'TransactionError';
    }
}

export class ValidationError extends DatabaseError {
    constructor(message: string, code: string = 'VALIDATION_ERROR', retryable: boolean = false) {
        super(message, code, 'validation', DatabaseSeverity.MEDIUM, retryable);
        this.name = 'ValidationError';
    }
}

export class MigrationError extends DatabaseError {
    constructor(message: string, code: string = 'MIGRATION_ERROR', retryable: boolean = false) {
        super(message, code, 'migration', DatabaseSeverity.HIGH, retryable);
        this.name = 'MigrationError';
    }
}