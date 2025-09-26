"use strict";
/**
 * PowerScript Database Integration System
 * Main coordination class for all database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.PowerScriptDatabase = void 0;
const types_1 = require("./types");
// Simple EventEmitter implementation
class SimpleEventEmitter {
    constructor() {
        this.events = new Map();
    }
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(listener);
    }
    emit(event, ...args) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(listener => listener(...args));
        }
    }
    off(event, listener) {
        if (!listener) {
            this.events.delete(event);
        }
        else {
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
class PowerScriptDatabase extends SimpleEventEmitter {
    constructor() {
        super();
        this.providers = new Map();
        this.connections = new Map();
        this.models = new Map();
        this.migrations = new Map();
        this.config = {};
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
        this.setupDefaultProviders();
    }
    static getInstance() {
        if (!PowerScriptDatabase.instance) {
            PowerScriptDatabase.instance = new PowerScriptDatabase();
        }
        return PowerScriptDatabase.instance;
    }
    // Configuration
    async configure(name, config, provider) {
        try {
            this.config[name] = { ...config };
            if (provider) {
                this.providers.set(name, provider);
            }
            else {
                // Load default provider based on config
                const defaultProvider = await this.createDefaultProvider(config);
                this.providers.set(name, defaultProvider);
            }
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_OPENED, 'Database configured', {
                provider: this.providers.get(name)?.name,
                config: this.sanitizeConfig(config)
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Failed to configure database: ${errorMessage}`, 'DB_CONFIG_ERROR');
        }
    }
    // Connection Management
    async connect(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new types_1.DatabaseError(`Database provider '${name}' not found`, 'PROVIDER_NOT_FOUND');
        }
        try {
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_OPENED, 'Connecting to database', {
                provider: provider.name,
                name
            });
            await provider.connect();
            this.connections.set(name, provider);
            this.metrics.connections.total++;
            this.metrics.connections.active++;
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_OPENED, 'Database connected', {
                provider: provider.name,
                name
            });
        }
        catch (error) {
            this.metrics.connections.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_ERROR, 'Database connection failed', {
                provider: provider.name,
                name,
                error: errorMessage
            });
            throw new types_1.DatabaseError(`Failed to connect to database '${name}': ${errorMessage}`, 'CONNECTION_FAILED');
        }
    }
    async disconnect(name) {
        const provider = this.connections.get(name);
        if (!provider) {
            return; // Already disconnected
        }
        try {
            await provider.disconnect();
            this.connections.delete(name);
            this.metrics.connections.active--;
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_CLOSED, 'Database disconnected', {
                provider: provider.name,
                name
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(types_1.DatabaseEventType.CONNECTION_ERROR, 'Database disconnection failed', {
                provider: provider.name,
                name,
                error: errorMessage
            });
            throw error;
        }
    }
    async disconnectAll() {
        const connectionPromises = Array.from(this.connections.keys()).map(name => this.disconnect(name).catch(error => {
            console.error(`Failed to disconnect '${name}':`, error);
        }));
        await Promise.all(connectionPromises);
    }
    isConnected(name) {
        const provider = this.connections.get(name);
        return provider ? provider.isConnected() : false;
    }
    // Query Operations
    async query(name, sql, params) {
        const provider = this.getConnectedProvider(name);
        const startTime = Date.now();
        this.metrics.queries.total++;
        try {
            this.emitEvent(types_1.DatabaseEventType.QUERY_START, 'Query started', {
                provider: provider.name,
                sql: this.sanitizeQuery(sql),
                paramCount: params?.length || 0
            });
            const result = await provider.query(sql, params);
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(true, duration);
            // Check for slow queries
            const slowThreshold = this.config[name]?.monitoring?.slowQueryThreshold || 1000;
            if (duration > slowThreshold) {
                this.metrics.queries.slowQueries++;
                this.emitEvent(types_1.DatabaseEventType.SLOW_QUERY, 'Slow query detected', {
                    provider: provider.name,
                    duration,
                    sql: this.sanitizeQuery(sql)
                });
            }
            this.emitEvent(types_1.DatabaseEventType.QUERY_SUCCESS, 'Query completed', {
                provider: provider.name,
                duration,
                rowCount: result.count,
                cached: result.metadata.cached
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.updateQueryMetrics(false, duration);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(types_1.DatabaseEventType.QUERY_ERROR, 'Query failed', {
                provider: provider.name,
                duration,
                error: errorMessage,
                sql: this.sanitizeQuery(sql)
            });
            throw error;
        }
    }
    // CRUD Operations
    async findOne(name, table, where) {
        const provider = this.getConnectedProvider(name);
        try {
            const result = await provider.findOne(table, where);
            if (result.metadata.cached) {
                this.metrics.cache.hits++;
            }
            else {
                this.metrics.cache.misses++;
            }
            this.updateCacheHitRate();
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Find one failed: ${errorMessage}`, 'FIND_ONE_ERROR');
        }
    }
    async findMany(name, table, where, options) {
        const provider = this.getConnectedProvider(name);
        try {
            const result = await provider.findMany(table, where, options);
            if (result.metadata.cached) {
                this.metrics.cache.hits++;
            }
            else {
                this.metrics.cache.misses++;
            }
            this.updateCacheHitRate();
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Find many failed: ${errorMessage}`, 'FIND_MANY_ERROR');
        }
    }
    async insert(name, table, data) {
        const provider = this.getConnectedProvider(name);
        try {
            const result = await provider.insert(table, data);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Insert failed: ${errorMessage}`, 'INSERT_ERROR');
        }
    }
    async update(name, table, data, where) {
        const provider = this.getConnectedProvider(name);
        try {
            const result = await provider.update(table, data, where);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Update failed: ${errorMessage}`, 'UPDATE_ERROR');
        }
    }
    async delete(name, table, where) {
        const provider = this.getConnectedProvider(name);
        try {
            const result = await provider.delete(table, where);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Delete failed: ${errorMessage}`, 'DELETE_ERROR');
        }
    }
    async count(name, table, where) {
        const provider = this.getConnectedProvider(name);
        try {
            return await provider.count(table, where);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Count failed: ${errorMessage}`, 'COUNT_ERROR');
        }
    }
    // Transaction Management
    async beginTransaction(name) {
        const provider = this.getConnectedProvider(name);
        try {
            this.emitEvent(types_1.DatabaseEventType.TRANSACTION_START, 'Transaction started', {
                provider: provider.name
            });
            const transaction = await provider.beginTransaction();
            this.metrics.transactions.started++;
            return transaction;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Transaction start failed: ${errorMessage}`, 'TRANSACTION_START_ERROR');
        }
    }
    async commitTransaction(transaction) {
        try {
            await transaction.commit();
            this.metrics.transactions.committed++;
            this.emitEvent(types_1.DatabaseEventType.TRANSACTION_COMMIT, 'Transaction committed', {
                transactionId: transaction.id
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Transaction commit failed: ${errorMessage}`, 'TRANSACTION_COMMIT_ERROR');
        }
    }
    async rollbackTransaction(transaction) {
        try {
            await transaction.rollback();
            this.metrics.transactions.rolledBack++;
            this.emitEvent(types_1.DatabaseEventType.TRANSACTION_ROLLBACK, 'Transaction rolled back', {
                transactionId: transaction.id
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new types_1.DatabaseError(`Transaction rollback failed: ${errorMessage}`, 'TRANSACTION_ROLLBACK_ERROR');
        }
    }
    // Model Management
    registerModel(name, definition) {
        const model = new DatabaseModel(name, definition, this);
        this.models.set(name, model);
        return model;
    }
    getModel(name) {
        const model = this.models.get(name);
        if (!model) {
            throw new types_1.DatabaseError(`Model '${name}' not found`, 'MODEL_NOT_FOUND');
        }
        return model;
    }
    // Migration Management
    registerMigration(migration) {
        this.migrations.set(migration.id, migration);
    }
    async runMigration(name, migrationId) {
        const provider = this.getConnectedProvider(name);
        const migration = this.migrations.get(migrationId);
        if (!migration) {
            throw new types_1.DatabaseError(`Migration '${migrationId}' not found`, 'MIGRATION_NOT_FOUND');
        }
        try {
            this.emitEvent(types_1.DatabaseEventType.MIGRATION_START, 'Migration started', {
                migrationId,
                migrationName: migration.name
            });
            const result = await provider.runMigration(migration);
            this.metrics.migrations.executed++;
            if (result.success) {
                this.metrics.migrations.successful++;
                this.emitEvent(types_1.DatabaseEventType.MIGRATION_SUCCESS, 'Migration completed', {
                    migrationId,
                    executionTime: result.executionTime
                });
            }
            else {
                this.metrics.migrations.failed++;
                this.emitEvent(types_1.DatabaseEventType.MIGRATION_ERROR, 'Migration failed', {
                    migrationId,
                    error: result.error?.message
                });
            }
            return result;
        }
        catch (error) {
            this.metrics.migrations.failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emitEvent(types_1.DatabaseEventType.MIGRATION_ERROR, 'Migration failed', {
                migrationId,
                error: errorMessage
            });
            throw new types_1.DatabaseError(`Migration failed: ${errorMessage}`, 'MIGRATION_EXECUTION_ERROR');
        }
    }
    // Health and Monitoring
    getDatabaseHealth() {
        const health = {};
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
    getMetrics() {
        return { ...this.metrics };
    }
    resetMetrics() {
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
    setupDefaultProviders() {
        // Default providers will be loaded from their respective modules
        // This is a placeholder for the provider registration system
    }
    async createDefaultProvider(config) {
        // Load appropriate provider based on config.provider
        switch (config.provider) {
            case 'postgresql':
                const { MockPostgreSQLProvider } = await Promise.resolve().then(() => require('./providers/MockPostgreSQLProvider'));
                return new MockPostgreSQLProvider(config);
            case 'mysql':
                const { MockMySQLProvider } = await Promise.resolve().then(() => require('./providers/MockMySQLProvider'));
                return new MockMySQLProvider(config);
            case 'mongodb':
                const { MockMongoDBProvider } = await Promise.resolve().then(() => require('./providers/MockMongoDBProvider'));
                return new MockMongoDBProvider(config);
            case 'redis':
                const { MockRedisProvider } = await Promise.resolve().then(() => require('./providers/MockRedisProvider'));
                return new MockRedisProvider(config);
            default:
                throw new types_1.DatabaseError(`Unsupported database provider: ${config.provider}`, 'UNSUPPORTED_PROVIDER');
        }
    }
    getConnectedProvider(name) {
        const provider = this.connections.get(name);
        if (!provider) {
            throw new types_1.DatabaseError(`Database '${name}' not connected`, 'NOT_CONNECTED');
        }
        if (!provider.isConnected()) {
            throw new types_1.DatabaseError(`Database '${name}' connection lost`, 'CONNECTION_LOST');
        }
        return provider;
    }
    updateQueryMetrics(success, duration) {
        if (success) {
            this.metrics.queries.successful++;
        }
        else {
            this.metrics.queries.failed++;
        }
        this.metrics.queries.totalTime += duration;
        this.metrics.queries.averageTime = this.metrics.queries.totalTime / this.metrics.queries.total;
    }
    updateCacheHitRate() {
        const total = this.metrics.cache.hits + this.metrics.cache.misses;
        this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
    }
    emitEvent(type, message, metadata) {
        const event = {
            id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: new Date(),
            severity: types_1.DatabaseSeverity.LOW,
            message,
            metadata
        };
        this.emit('databaseEvent', event);
    }
    sanitizeConfig(config) {
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
    sanitizeQuery(sql) {
        // Truncate long queries for logging
        return sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
    }
}
exports.PowerScriptDatabase = PowerScriptDatabase;
// Database Model implementation
class DatabaseModel {
    constructor(tableName, definition, database) {
        this.tableName = tableName;
        this.definition = definition;
        this.database = database;
    }
    async find(where, options) {
        // This would need to be implemented with the actual connection name
        // For now, this is a placeholder
        throw new Error('Model operations require connection name - use database.findMany() instead');
    }
    async findOne(where) {
        throw new Error('Model operations require connection name - use database.findOne() instead');
    }
    async findById(id) {
        const primaryKey = this.definition.primaryKey;
        const where = typeof primaryKey === 'string'
            ? { [primaryKey]: id }
            : primaryKey.reduce((acc, key, index) => {
                acc[key] = Array.isArray(id) ? id[index] : id;
                return acc;
            }, {});
        return this.findOne(where);
    }
    async create(data) {
        throw new Error('Model operations require connection name - use database.insert() instead');
    }
    async update(data, where) {
        throw new Error('Model operations require connection name - use database.update() instead');
    }
    async delete(where) {
        throw new Error('Model operations require connection name - use database.delete() instead');
    }
    async count(where) {
        throw new Error('Model operations require connection name - use database.count() instead');
    }
    async exists(where) {
        const count = await this.count(where);
        return count > 0;
    }
    with(relations) {
        // Implement relation loading
        return this;
    }
    async validate(data) {
        const errors = [];
        // Basic validation based on field definitions
        for (const [fieldName, fieldDef] of Object.entries(this.definition.fields)) {
            const value = data[fieldName];
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
exports.database = PowerScriptDatabase.getInstance();
