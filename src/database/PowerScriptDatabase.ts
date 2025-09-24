/**
 * PowerScript Database Integration System
 * Main coordination class for all database operations
 */

import {
    DatabaseConfig, DatabaseProvider, WhereClause, QueryOptions, QueryResult, SingleResult,
    Transaction, ModelDefinition, Model, Migration, MigrationResult,
    DatabaseEvent, DatabaseEventType, DatabaseSeverity, DatabaseError
} from './types';

// Simple EventEmitter implementation
class SimpleEventEmitter {
    private events: Map<string, Function[]> = new Map();
    
    on(event: string, listener: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(listener);
    }
    
    emit(event: string, ...args: any[]): void {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    
    off(event: string, listener?: Function): void {
        if (!listener) {
            this.events.delete(event);
        } else {
            const listeners = this.events.get(event);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
            }
        }
    }
}

export class PowerScriptDatabase extends SimpleEventEmitter {
    private static instance: PowerScriptDatabase;
    
    private providers: Map<string, DatabaseProvider> = new Map();
    private connections: Map<string, DatabaseProvider> = new Map();
    private models: Map<string, Model> = new Map();
    private migrations: Map<string, Migration> = new Map();
    
    private config: Record<string, DatabaseConfig> = {};
    
    private metrics = {
        connections: {
            total: 0,
            active: 0,
            failed: 0
        },
        queries: {
            total: 0,
            successful: 0,
            failed: 0,
            averageTime: 0,
            totalTime: 0,
            slowQueries: 0
        },
        transactions: {
            started: 0,
            committed: 0,
            rolledBack: 0
        },
        cache: {
            hits: 0,
            misses: 0,
            hitRate: 0
        },
        migrations: {
            executed: 0,
            successful: 0,
            failed: 0
        }
    };
    
    private constructor() {
        super();
        this.setupDefaultProviders();
    }
    
    public static getInstance(): PowerScriptDatabase {
        if (!PowerScriptDatabase.instance) {
            PowerScriptDatabase.instance = new PowerScriptDatabase();
        }
        return PowerScriptDatabase.instance;
    }
    
    // Configuration
    public async configure(name: string, config: DatabaseConfig, provider?: DatabaseProvider): Promise<void> {
        try {
            this.config[name] = { ...config };
            
            if (provider) {
                this.providers.set(name, provider);
            } else {
                // Load default provider based on config
                const defaultProvider = await this.createDefaultProvider(config);
                this.providers.set(name, defaultProvider);
            }
            
            this.emitEvent(DatabaseEventType.CONNECTION_OPENED, 'Database configured', {
                provider: this.providers.get(name)?.name,
                config: this.sanitizeConfig(config)
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Failed to configure database: ${errorMessage}`, 'DB_CONFIG_ERROR');
        }
    }
    
    // Connection Management
    public async connect(name: string): Promise<void> {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new DatabaseError(`Database provider '${name}' not found`, 'PROVIDER_NOT_FOUND');
        }
        
        try {
            this.emitEvent(DatabaseEventType.CONNECTION_OPENED, 'Connecting to database', {
                provider: provider.name,
                name
            });
            
            await provider.connect();
            this.connections.set(name, provider);
            this.metrics.connections.total++;
            this.metrics.connections.active++;
            
            this.emitEvent(DatabaseEventType.CONNECTION_OPENED, 'Database connected', {
                provider: provider.name,
                name
            });
        } catch (error) {
            this.metrics.connections.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.emitEvent(DatabaseEventType.CONNECTION_ERROR, 'Database connection failed', {
                provider: provider.name,
                name,
                error: errorMessage
            });
            
            throw new DatabaseError(`Failed to connect to database '${name}': ${errorMessage}`, 'CONNECTION_FAILED');
        }
    }
    
    public async disconnect(name: string): Promise<void> {
        const provider = this.connections.get(name);
        if (!provider) {
            return; // Already disconnected
        }
        
        try {
            await provider.disconnect();
            this.connections.delete(name);
            this.metrics.connections.active--;
            
            this.emitEvent(DatabaseEventType.CONNECTION_CLOSED, 'Database disconnected', {
                provider: provider.name,
                name
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(DatabaseEventType.CONNECTION_ERROR, 'Database disconnection failed', {
                provider: provider.name,
                name,
                error: errorMessage
            });
            throw error;
        }
    }
    
    public async disconnectAll(): Promise<void> {
        const connectionPromises = Array.from(this.connections.keys()).map(name => 
            this.disconnect(name).catch(error => {
                console.error(`Failed to disconnect '${name}':`, error);
            })
        );
        
        await Promise.all(connectionPromises);
    }
    
    public isConnected(name: string): boolean {
        const provider = this.connections.get(name);
        return provider ? provider.isConnected() : false;
    }
    
    // Query Operations
    public async query<T = any>(name: string, sql: string, params?: any[]): Promise<QueryResult<T>> {
        const provider = this.getConnectedProvider(name);
        
        const startTime = Date.now();
        this.metrics.queries.total++;
        
        try {
            this.emitEvent(DatabaseEventType.QUERY_START, 'Query started', {
                provider: provider.name,
                sql: this.sanitizeQuery(sql),
                paramCount: params?.length || 0
            });
            
            const result = await provider.query<T>(sql, params);
            const duration = Date.now() - startTime;
            
            this.updateQueryMetrics(true, duration);
            
            // Check for slow queries
            const slowThreshold = this.config[name]?.monitoring?.slowQueryThreshold || 1000;
            if (duration > slowThreshold) {
                this.metrics.queries.slowQueries++;
                this.emitEvent(DatabaseEventType.SLOW_QUERY, 'Slow query detected', {
                    provider: provider.name,
                    duration,
                    sql: this.sanitizeQuery(sql)
                });
            }
            
            this.emitEvent(DatabaseEventType.QUERY_SUCCESS, 'Query completed', {
                provider: provider.name,
                duration,
                rowCount: result.count,
                cached: result.metadata.cached
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(false, duration);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(DatabaseEventType.QUERY_ERROR, 'Query failed', {
                provider: provider.name,
                duration,
                error: errorMessage,
                sql: this.sanitizeQuery(sql)
            });
            
            throw error;
        }
    }
    
    // CRUD Operations
    public async findOne<T = any>(name: string, table: string, where: WhereClause): Promise<SingleResult<T>> {
        const provider = this.getConnectedProvider(name);
        
        try {
            const result = await provider.findOne<T>(table, where);
            
            if (result.metadata.cached) {
                this.metrics.cache.hits++;
            } else {
                this.metrics.cache.misses++;
            }
            this.updateCacheHitRate();
            
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Find one failed: ${errorMessage}`, 'FIND_ONE_ERROR');
        }
    }
    
    public async findMany<T = any>(name: string, table: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>> {
        const provider = this.getConnectedProvider(name);
        
        try {
            const result = await provider.findMany<T>(table, where, options);
            
            if (result.metadata.cached) {
                this.metrics.cache.hits++;
            } else {
                this.metrics.cache.misses++;
            }
            this.updateCacheHitRate();
            
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Find many failed: ${errorMessage}`, 'FIND_MANY_ERROR');
        }
    }
    
    public async insert<T = any>(name: string, table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>> {
        const provider = this.getConnectedProvider(name);
        
        try {
            const result = await provider.insert<T>(table, data);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Insert failed: ${errorMessage}`, 'INSERT_ERROR');
        }
    }
    
    public async update<T = any>(name: string, table: string, data: Partial<T>, where: WhereClause): Promise<QueryResult<T>> {
        const provider = this.getConnectedProvider(name);
        
        try {
            const result = await provider.update<T>(table, data, where);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Update failed: ${errorMessage}`, 'UPDATE_ERROR');
        }
    }
    
    public async delete(name: string, table: string, where: WhereClause): Promise<QueryResult<any>> {
        const provider = this.getConnectedProvider(name);
        
        try {
            const result = await provider.delete(table, where);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Delete failed: ${errorMessage}`, 'DELETE_ERROR');
        }
    }
    
    public async count(name: string, table: string, where?: WhereClause): Promise<number> {
        const provider = this.getConnectedProvider(name);
        
        try {
            return await provider.count(table, where);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Count failed: ${errorMessage}`, 'COUNT_ERROR');
        }
    }
    
    // Transaction Management
    public async beginTransaction(name: string): Promise<Transaction> {
        const provider = this.getConnectedProvider(name);
        
        try {
            this.emitEvent(DatabaseEventType.TRANSACTION_START, 'Transaction started', {
                provider: provider.name
            });
            
            const transaction = await provider.beginTransaction();
            this.metrics.transactions.started++;
            
            return transaction;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Transaction start failed: ${errorMessage}`, 'TRANSACTION_START_ERROR');
        }
    }
    
    public async commitTransaction(transaction: Transaction): Promise<void> {
        try {
            await transaction.commit();
            this.metrics.transactions.committed++;
            
            this.emitEvent(DatabaseEventType.TRANSACTION_COMMIT, 'Transaction committed', {
                transactionId: transaction.id
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Transaction commit failed: ${errorMessage}`, 'TRANSACTION_COMMIT_ERROR');
        }
    }
    
    public async rollbackTransaction(transaction: Transaction): Promise<void> {
        try {
            await transaction.rollback();
            this.metrics.transactions.rolledBack++;
            
            this.emitEvent(DatabaseEventType.TRANSACTION_ROLLBACK, 'Transaction rolled back', {
                transactionId: transaction.id
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new DatabaseError(`Transaction rollback failed: ${errorMessage}`, 'TRANSACTION_ROLLBACK_ERROR');
        }
    }
    
    // Model Management
    public registerModel<T = any>(name: string, definition: ModelDefinition): Model<T> {
        const model = new DatabaseModel<T>(name, definition, this);
        this.models.set(name, model);
        return model;
    }
    
    public getModel<T = any>(name: string): Model<T> {
        const model = this.models.get(name);
        if (!model) {
            throw new DatabaseError(`Model '${name}' not found`, 'MODEL_NOT_FOUND');
        }
        return model as Model<T>;
    }
    
    // Migration Management
    public registerMigration(migration: Migration): void {
        this.migrations.set(migration.id, migration);
    }
    
    public async runMigration(name: string, migrationId: string): Promise<MigrationResult> {
        const provider = this.getConnectedProvider(name);
        const migration = this.migrations.get(migrationId);
        
        if (!migration) {
            throw new DatabaseError(`Migration '${migrationId}' not found`, 'MIGRATION_NOT_FOUND');
        }
        
        try {
            this.emitEvent(DatabaseEventType.MIGRATION_START, 'Migration started', {
                migrationId,
                migrationName: migration.name
            });
            
            const result = await provider.runMigration(migration);
            this.metrics.migrations.executed++;
            
            if (result.success) {
                this.metrics.migrations.successful++;
                this.emitEvent(DatabaseEventType.MIGRATION_SUCCESS, 'Migration completed', {
                    migrationId,
                    executionTime: result.executionTime
                });
            } else {
                this.metrics.migrations.failed++;
                this.emitEvent(DatabaseEventType.MIGRATION_ERROR, 'Migration failed', {
                    migrationId,
                    error: result.error?.message
                });
            }
            
            return result;
        } catch (error) {
            this.metrics.migrations.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.emitEvent(DatabaseEventType.MIGRATION_ERROR, 'Migration failed', {
                migrationId,
                error: errorMessage
            });
            
            throw new DatabaseError(`Migration failed: ${errorMessage}`, 'MIGRATION_EXECUTION_ERROR');
        }
    }
    
    // Health and Monitoring
    public getDatabaseHealth(): Record<string, any> {
        const health: Record<string, any> = {};
        
        for (const [name, provider] of this.connections) {
            health[name] = {
                provider: provider.name,
                type: provider.type,
                connected: provider.isConnected(),
                config: this.sanitizeConfig(this.config[name] || {})
            };
        }
        
        return {
            connections: health,
            metrics: this.metrics,
            totalConnections: this.connections.size,
            activeConnections: Array.from(this.connections.values()).filter(p => p.isConnected()).length
        };
    }
    
    public getMetrics(): typeof this.metrics {
        return { ...this.metrics };
    }
    
    public resetMetrics(): void {
        this.metrics = {
            connections: {
                total: 0,
                active: 0,
                failed: 0
            },
            queries: {
                total: 0,
                successful: 0,
                failed: 0,
                averageTime: 0,
                totalTime: 0,
                slowQueries: 0
            },
            transactions: {
                started: 0,
                committed: 0,
                rolledBack: 0
            },
            cache: {
                hits: 0,
                misses: 0,
                hitRate: 0
            },
            migrations: {
                executed: 0,
                successful: 0,
                failed: 0
            }
        };
    }
    
    // Private helper methods
    private setupDefaultProviders(): void {
        // Default providers will be loaded from their respective modules
        // This is a placeholder for the provider registration system
    }
    
    private async createDefaultProvider(config: DatabaseConfig): Promise<DatabaseProvider> {
        // Load appropriate provider based on config.provider
        switch (config.provider) {
            case 'postgresql':
                const { MockPostgreSQLProvider } = await import('./providers/MockPostgreSQLProvider');
                return new MockPostgreSQLProvider(config);
            case 'mysql':
                const { MockMySQLProvider } = await import('./providers/MockMySQLProvider');
                return new MockMySQLProvider(config);
            case 'mongodb':
                const { MockMongoDBProvider } = await import('./providers/MockMongoDBProvider');
                return new MockMongoDBProvider(config);
            case 'redis':
                const { MockRedisProvider } = await import('./providers/MockRedisProvider');
                return new MockRedisProvider(config);
            default:
                throw new DatabaseError(`Unsupported database provider: ${config.provider}`, 'UNSUPPORTED_PROVIDER');
        }
    }
    
    private getConnectedProvider(name: string): DatabaseProvider {
        const provider = this.connections.get(name);
        if (!provider) {
            throw new DatabaseError(`Database '${name}' not connected`, 'NOT_CONNECTED');
        }
        
        if (!provider.isConnected()) {
            throw new DatabaseError(`Database '${name}' connection lost`, 'CONNECTION_LOST');
        }
        
        return provider;
    }
    
    private updateQueryMetrics(success: boolean, duration: number): void {
        if (success) {
            this.metrics.queries.successful++;
        } else {
            this.metrics.queries.failed++;
        }
        
        this.metrics.queries.totalTime += duration;
        this.metrics.queries.averageTime = this.metrics.queries.totalTime / this.metrics.queries.total;
    }
    
    private updateCacheHitRate(): void {
        const total = this.metrics.cache.hits + this.metrics.cache.misses;
        this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
    }
    
    private emitEvent(type: DatabaseEventType, message: string, metadata: Record<string, any>): void {
        const event: DatabaseEvent = {
            id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: new Date(),
            severity: DatabaseSeverity.LOW,
            message,
            metadata
        };
        
        this.emit('databaseEvent', event);
    }
    
    private sanitizeConfig(config: any): any {
        const sanitized = { ...config };
        
        // Remove sensitive information
        if (sanitized.connection?.password) {
            sanitized.connection.password = '***';
        }
        if (sanitized.connection?.url) {
            // Mask password in connection URL
            sanitized.connection.url = sanitized.connection.url.replace(/:([^@]*?)@/, ':***@');
        }
        
        return sanitized;
    }
    
    private sanitizeQuery(sql: string): string {
        // Truncate long queries for logging
        return sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
    }
}

// Database Model implementation
class DatabaseModel<T = any> implements Model<T> {
    constructor(
        public tableName: string,
        public definition: ModelDefinition,
        private database: PowerScriptDatabase
    ) {}
    
    async find(where?: WhereClause, options?: QueryOptions): Promise<T[]> {
        // This would need to be implemented with the actual connection name
        // For now, this is a placeholder
        throw new Error('Model operations require connection name - use database.findMany() instead');
    }
    
    async findOne(where: WhereClause): Promise<T | null> {
        throw new Error('Model operations require connection name - use database.findOne() instead');
    }
    
    async findById(id: any): Promise<T | null> {
        const primaryKey = this.definition.primaryKey;
        const where = typeof primaryKey === 'string' 
            ? { [primaryKey]: id }
            : primaryKey.reduce((acc, key, index) => {
                acc[key] = Array.isArray(id) ? id[index] : id;
                return acc;
            }, {} as WhereClause);
            
        return this.findOne(where);
    }
    
    async create(data: Partial<T>): Promise<T> {
        throw new Error('Model operations require connection name - use database.insert() instead');
    }
    
    async update(data: Partial<T>, where: WhereClause): Promise<T[]> {
        throw new Error('Model operations require connection name - use database.update() instead');
    }
    
    async delete(where: WhereClause): Promise<number> {
        throw new Error('Model operations require connection name - use database.delete() instead');
    }
    
    async count(where?: WhereClause): Promise<number> {
        throw new Error('Model operations require connection name - use database.count() instead');
    }
    
    async exists(where: WhereClause): Promise<boolean> {
        const count = await this.count(where);
        return count > 0;
    }
    
    with(relations: string[]): Model<T> {
        // Implement relation loading
        return this;
    }
    
    async validate(data: Partial<T>): Promise<{ valid: boolean; errors: any[] }> {
        const errors: any[] = [];
        
        // Basic validation based on field definitions
        for (const [fieldName, fieldDef] of Object.entries(this.definition.fields)) {
            const value = (data as any)[fieldName];
            
            if (fieldDef.required && (value === undefined || value === null)) {
                errors.push({
                    field: fieldName,
                    message: `${fieldName} is required`,
                    value
                });
            }
            
            if (value !== undefined && fieldDef.validate) {
                const validationResult = fieldDef.validate(value);
                if (validationResult !== true) {
                    errors.push({
                        field: fieldName,
                        message: typeof validationResult === 'string' ? validationResult : `${fieldName} is invalid`,
                        value
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export singleton instance
export const database = PowerScriptDatabase.getInstance();