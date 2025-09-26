"use strict";
/**
 * PowerScript Mock Redis Provider
 * Mock implementation of Redis database provider for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRedisProvider = void 0;
const types_1 = require("../types");
class MockRedisProvider {
    constructor(config) {
        this.name = 'MockRedisProvider';
        this.version = '1.0.0';
        this.type = 'cache';
        this.connected = false;
        this.mockData = new Map();
        this.mockExpiration = new Map();
        this.transactionCounter = 0;
        this.config = config;
        this.initializeMockData();
        // Cleanup expired keys periodically
        setInterval(() => this.cleanupExpiredKeys(), 10000);
    }
    async connect() {
        // Simulate connection delay
        await this.sleep(30);
        if (this.config.connection.host === 'invalid-host') {
            throw new types_1.ConnectionError('Failed to connect to Redis server', 'REDIS_CONNECTION_FAILED');
        }
        this.connected = true;
    }
    async disconnect() {
        await this.sleep(15);
        this.connected = false;
    }
    isConnected() {
        return this.connected;
    }
    async ping() {
        if (!this.connected)
            return false;
        try {
            await this.sleep(5);
            return true;
        }
        catch {
            return false;
        }
    }
    // Redis-specific methods
    async get(key) {
        this.ensureConnected();
        if (this.isExpired(key)) {
            this.mockData.delete(key);
            this.mockExpiration.delete(key);
            return null;
        }
        return this.mockData.get(key) || null;
    }
    async set(key, value, options) {
        this.ensureConnected();
        this.mockData.set(key, value);
        if (options?.ttl) {
            this.mockExpiration.set(key, Date.now() + options.ttl * 1000);
        }
    }
    async del(key) {
        this.ensureConnected();
        const keys = Array.isArray(key) ? key : [key];
        let deletedCount = 0;
        for (const k of keys) {
            if (this.mockData.has(k)) {
                this.mockData.delete(k);
                this.mockExpiration.delete(k);
                deletedCount++;
            }
        }
        return deletedCount;
    }
    async exists(key) {
        this.ensureConnected();
        const keys = Array.isArray(key) ? key : [key];
        for (const k of keys) {
            if (this.isExpired(k)) {
                this.mockData.delete(k);
                this.mockExpiration.delete(k);
                continue;
            }
            if (this.mockData.has(k)) {
                return true;
            }
        }
        return false;
    }
    async ttl(key) {
        this.ensureConnected();
        if (!this.mockData.has(key)) {
            return -2; // Key doesn't exist
        }
        const expiration = this.mockExpiration.get(key);
        if (!expiration) {
            return -1; // Key exists but has no expiration
        }
        const remaining = Math.max(0, Math.floor((expiration - Date.now()) / 1000));
        return remaining;
    }
    async expire(key, seconds) {
        this.ensureConnected();
        if (!this.mockData.has(key)) {
            return false;
        }
        this.mockExpiration.set(key, Date.now() + seconds * 1000);
        return true;
    }
    async incr(key) {
        this.ensureConnected();
        const current = parseInt(this.mockData.get(key) || '0', 10);
        const newValue = current + 1;
        this.mockData.set(key, newValue.toString());
        return newValue;
    }
    async decr(key) {
        this.ensureConnected();
        const current = parseInt(this.mockData.get(key) || '0', 10);
        const newValue = current - 1;
        this.mockData.set(key, newValue.toString());
        return newValue;
    }
    async hget(key, field) {
        this.ensureConnected();
        if (this.isExpired(key)) {
            this.mockData.delete(key);
            this.mockExpiration.delete(key);
            return null;
        }
        const hash = this.mockData.get(key);
        if (typeof hash === 'object' && hash !== null) {
            return hash[field] || null;
        }
        return null;
    }
    async hset(key, field, value) {
        this.ensureConnected();
        let hash = this.mockData.get(key);
        if (typeof hash !== 'object' || hash === null) {
            hash = {};
        }
        hash[field] = value;
        this.mockData.set(key, hash);
    }
    async hgetall(key) {
        this.ensureConnected();
        if (this.isExpired(key)) {
            this.mockData.delete(key);
            this.mockExpiration.delete(key);
            return null;
        }
        const hash = this.mockData.get(key);
        if (typeof hash === 'object' && hash !== null) {
            return hash;
        }
        return null;
    }
    async lpush(key, ...values) {
        this.ensureConnected();
        let list = this.mockData.get(key);
        if (!Array.isArray(list)) {
            list = [];
        }
        list.unshift(...values);
        this.mockData.set(key, list);
        return list.length;
    }
    async rpush(key, ...values) {
        this.ensureConnected();
        let list = this.mockData.get(key);
        if (!Array.isArray(list)) {
            list = [];
        }
        list.push(...values);
        this.mockData.set(key, list);
        return list.length;
    }
    async lpop(key) {
        this.ensureConnected();
        const list = this.mockData.get(key);
        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }
        const value = list.shift();
        this.mockData.set(key, list);
        return value || null;
    }
    async rpop(key) {
        this.ensureConnected();
        const list = this.mockData.get(key);
        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }
        const value = list.pop();
        this.mockData.set(key, list);
        return value || null;
    }
    async llen(key) {
        this.ensureConnected();
        const list = this.mockData.get(key);
        if (!Array.isArray(list)) {
            return 0;
        }
        return list.length;
    }
    async sadd(key, ...members) {
        this.ensureConnected();
        let set = this.mockData.get(key);
        if (!(set instanceof Set)) {
            set = new Set();
        }
        let addedCount = 0;
        for (const member of members) {
            if (!set.has(member)) {
                set.add(member);
                addedCount++;
            }
        }
        this.mockData.set(key, set);
        return addedCount;
    }
    async srem(key, ...members) {
        this.ensureConnected();
        const set = this.mockData.get(key);
        if (!(set instanceof Set)) {
            return 0;
        }
        let removedCount = 0;
        for (const member of members) {
            if (set.has(member)) {
                set.delete(member);
                removedCount++;
            }
        }
        this.mockData.set(key, set);
        return removedCount;
    }
    async smembers(key) {
        this.ensureConnected();
        const set = this.mockData.get(key);
        if (!(set instanceof Set)) {
            return [];
        }
        return Array.from(set);
    }
    async sismember(key, member) {
        this.ensureConnected();
        const set = this.mockData.get(key);
        if (!(set instanceof Set)) {
            return false;
        }
        return set.has(member);
    }
    // Generic database interface methods (adapted for Redis)
    async query(command, params) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 10);
        // Mock Redis command execution
        const result = await this.executeRedisCommand(command, params);
        const duration = Date.now() - startTime;
        return {
            data: Array.isArray(result) ? result : [result],
            count: Array.isArray(result) ? result.length : 1,
            metadata: {
                executionTime: duration,
                cached: true,
                query: command,
                parameters: params
            }
        };
    }
    async execute(command, params) {
        return this.query(command, params);
    }
    async findOne(key, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 5);
        const value = await this.get(key);
        let data = null;
        if (value !== null) {
            try {
                data = JSON.parse(value);
            }
            catch {
                data = value;
            }
        }
        const duration = Date.now() - startTime;
        return {
            data,
            metadata: {
                executionTime: duration,
                cached: true,
                found: data !== null
            }
        };
    }
    async findMany(pattern, where, options) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 15);
        // Simple pattern matching for Redis keys
        const keys = Array.from(this.mockData.keys()).filter(key => {
            if (pattern === '*')
                return true;
            return key.includes(pattern.replace('*', ''));
        });
        const results = [];
        for (const key of keys) {
            if (this.isExpired(key)) {
                this.mockData.delete(key);
                this.mockExpiration.delete(key);
                continue;
            }
            const value = this.mockData.get(key);
            try {
                results.push(JSON.parse(value));
            }
            catch {
                results.push(value);
            }
        }
        // Apply options
        let finalResults = results;
        if (options?.offset) {
            finalResults = finalResults.slice(options.offset);
        }
        if (options?.limit) {
            finalResults = finalResults.slice(0, options.limit);
        }
        const duration = Date.now() - startTime;
        return {
            data: finalResults,
            count: finalResults.length,
            totalCount: results.length,
            hasMore: options?.limit ? results.length > (options.offset || 0) + options.limit : false,
            metadata: {
                executionTime: duration,
                cached: true
            }
        };
    }
    async insert(key, data) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 8);
        const value = typeof data === 'string' ? data : JSON.stringify(data);
        await this.set(key, value);
        const duration = Date.now() - startTime;
        return {
            data: [data],
            count: 1,
            metadata: {
                executionTime: duration,
                cached: true,
                insertId: key
            }
        };
    }
    async update(key, updateData, where) {
        const existingResult = await this.findOne(key);
        if (!existingResult.data) {
            return {
                data: [],
                count: 0,
                metadata: {
                    executionTime: 0,
                    cached: true,
                    affectedRows: 0
                }
            };
        }
        const updatedData = { ...existingResult.data, ...updateData };
        return this.insert(key, updatedData);
    }
    async delete(key, where) {
        this.ensureConnected();
        const startTime = Date.now();
        const deletedCount = await this.del(key);
        const duration = Date.now() - startTime;
        return {
            data: [],
            count: 0,
            metadata: {
                executionTime: duration,
                cached: true,
                affectedRows: deletedCount
            }
        };
    }
    async count(pattern = '*') {
        const result = await this.findMany(pattern);
        return result.count;
    }
    async beginTransaction() {
        this.ensureConnected();
        const transactionId = `redis_tx_${++this.transactionCounter}_${Date.now()}`;
        const transaction = new MockRedisTransaction(transactionId, this);
        return transaction;
    }
    async createTable(definition) {
        // Redis doesn't have tables, so this is a no-op
    }
    async dropTable(tableName) {
        // Delete all keys matching the table pattern
        const keys = Array.from(this.mockData.keys()).filter(key => key.startsWith(tableName + ':'));
        for (const key of keys) {
            this.mockData.delete(key);
            this.mockExpiration.delete(key);
        }
    }
    async alterTable(tableName, changes) {
        // Redis doesn't have schemas, so this is a no-op
    }
    async createIndex(tableName, index) {
        // Redis doesn't have explicit indexes
    }
    async dropIndex(tableName, indexName) {
        // Redis doesn't have explicit indexes
    }
    async runMigration(migration) {
        const startTime = Date.now();
        try {
            await migration.up(this);
            const duration = Date.now() - startTime;
            return {
                success: true,
                migration,
                executionTime: duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                success: false,
                migration,
                executionTime: duration,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }
    async getStats() {
        const totalKeys = this.mockData.size;
        const expiredKeys = Array.from(this.mockExpiration.keys()).filter(key => this.isExpired(key)).length;
        return {
            provider: this.name,
            connected: this.connected,
            totalKeys,
            expiredKeys,
            activeKeys: totalKeys - expiredKeys,
            memoryUsage: this.estimateMemoryUsage(),
            dbsize: totalKeys
        };
    }
    async clearCache() {
        this.mockData.clear();
        this.mockExpiration.clear();
    }
    // Private helper methods
    initializeMockData() {
        // Initialize with some sample data
        this.mockData.set('user:1', JSON.stringify({ id: 1, name: 'John Doe', email: 'john@example.com' }));
        this.mockData.set('user:2', JSON.stringify({ id: 2, name: 'Jane Smith', email: 'jane@example.com' }));
        this.mockData.set('counter:visits', '1250');
        this.mockData.set('config:theme', 'dark');
        // Set data structure examples
        const tags = new Set(['javascript', 'redis', 'database']);
        this.mockData.set('tags:popular', tags);
        // List data structure examples
        this.mockData.set('queue:tasks', ['task1', 'task2', 'task3']);
        // Hash data structure examples
        this.mockData.set('session:abc123', {
            userId: '1',
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });
    }
    ensureConnected() {
        if (!this.connected) {
            throw new types_1.ConnectionError('Not connected to database', 'NOT_CONNECTED');
        }
    }
    isExpired(key) {
        const expiration = this.mockExpiration.get(key);
        if (!expiration)
            return false;
        return Date.now() > expiration;
    }
    cleanupExpiredKeys() {
        for (const [key, expiration] of this.mockExpiration.entries()) {
            if (Date.now() > expiration) {
                this.mockData.delete(key);
                this.mockExpiration.delete(key);
            }
        }
    }
    async executeRedisCommand(command, params) {
        const cmd = command.toLowerCase();
        const [key, ...args] = params || [];
        switch (cmd) {
            case 'get':
                return this.get(key);
            case 'set':
                await this.set(key, args[0], args[1] ? { ttl: args[1] } : undefined);
                return 'OK';
            case 'del':
                return this.del(key);
            case 'exists':
                return this.exists(key);
            case 'ttl':
                return this.ttl(key);
            case 'incr':
                return this.incr(key);
            case 'decr':
                return this.decr(key);
            default:
                return null;
        }
    }
    estimateMemoryUsage() {
        let totalSize = 0;
        for (const [key, value] of this.mockData.entries()) {
            totalSize += key.length;
            if (typeof value === 'string') {
                totalSize += value.length;
            }
            else {
                totalSize += JSON.stringify(value).length;
            }
        }
        return `${Math.round(totalSize / 1024)}KB`;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockRedisProvider = MockRedisProvider;
// Mock Redis Transaction implementation
class MockRedisTransaction {
    constructor(id, provider) {
        this.id = id;
        this.provider = provider;
        this.startTime = new Date();
        this.status = 'active';
        this.operations = [];
    }
    async query(command, params) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Queue operation for execution on commit
        this.operations.push(() => this.provider.query(command, params));
        return {
            data: [],
            count: 0,
            metadata: {
                executionTime: 0,
                cached: true,
                query: command,
                parameters: params
            }
        };
    }
    async findOne(key, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findOne(key, where);
    }
    async findMany(pattern, where, options) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findMany(pattern, where, options);
    }
    async insert(key, data) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Queue operation for execution on commit
        this.operations.push(() => this.provider.insert(key, data));
        return {
            data: data,
            metadata: {
                executionTime: 0,
                cached: true,
                found: true
            }
        };
    }
    async update(key, data, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Queue operation for execution on commit
        this.operations.push(() => this.provider.update(key, data, where));
        return {
            data: [data],
            count: 1,
            metadata: {
                executionTime: 0,
                cached: true,
                affectedRows: 1
            }
        };
    }
    async delete(key, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Queue operation for execution on commit
        this.operations.push(() => this.provider.delete(key, where));
        return {
            data: [],
            count: 0,
            metadata: {
                executionTime: 0,
                cached: true,
                affectedRows: 1
            }
        };
    }
    async commit() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Execute all queued operations
        for (const operation of this.operations) {
            await operation();
        }
        this.status = 'committed';
    }
    async rollback() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Clear all queued operations
        this.operations = [];
        this.status = 'rolled_back';
    }
}
