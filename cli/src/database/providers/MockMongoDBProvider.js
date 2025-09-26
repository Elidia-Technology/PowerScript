"use strict";
/**
 * PowerScript Mock MongoDB Provider
 * Mock implementation of MongoDB database provider for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMongoDBProvider = void 0;
const types_1 = require("../types");
class MockMongoDBProvider {
    constructor(config) {
        this.name = 'MockMongoDBProvider';
        this.version = '1.0.0';
        this.type = 'nosql';
        this.connected = false;
        this.mockData = new Map();
        this.transactionCounter = 0;
        this.config = config;
        this.initializeMockData();
    }
    async connect() {
        // Simulate connection delay
        await this.sleep(70);
        if (this.config.connection.host === 'invalid-host') {
            throw new types_1.ConnectionError('Failed to connect to MongoDB server', 'MONGODB_CONNECTION_FAILED');
        }
        this.connected = true;
    }
    async disconnect() {
        await this.sleep(35);
        this.connected = false;
    }
    isConnected() {
        return this.connected;
    }
    async ping() {
        if (!this.connected)
            return false;
        try {
            await this.sleep(20);
            return true;
        }
        catch {
            return false;
        }
    }
    async query(collection, query) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 40);
        const collectionData = this.mockData.get(collection) || [];
        let result = query ? collectionData.filter(doc => this.matchesMongoQuery(doc, query)) : collectionData;
        const duration = Date.now() - startTime;
        return {
            data: result,
            count: result.length,
            metadata: {
                executionTime: duration,
                cached: false,
                query: JSON.stringify(query)
            }
        };
    }
    async execute(operation, params) {
        // MongoDB doesn't use SQL, so we adapt this to run aggregation pipelines
        return this.aggregate(operation, params || []);
    }
    async aggregate(collection, pipeline) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 60);
        let collectionData = this.mockData.get(collection) || [];
        // Very basic aggregation pipeline simulation
        for (const stage of pipeline) {
            if (stage.$match) {
                collectionData = collectionData.filter(doc => this.matchesMongoQuery(doc, stage.$match));
            }
            else if (stage.$project) {
                collectionData = collectionData.map(doc => this.applyProjection(doc, stage.$project));
            }
            else if (stage.$sort) {
                collectionData = this.applyMongoSort(collectionData, stage.$sort);
            }
            else if (stage.$limit) {
                collectionData = collectionData.slice(0, stage.$limit);
            }
            else if (stage.$skip) {
                collectionData = collectionData.slice(stage.$skip);
            }
        }
        const duration = Date.now() - startTime;
        return {
            data: collectionData,
            count: collectionData.length,
            metadata: {
                executionTime: duration,
                cached: false,
                query: JSON.stringify(pipeline)
            }
        };
    }
    async findOne(collection, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 25);
        const collectionData = this.mockData.get(collection) || [];
        const result = collectionData.find(doc => this.matchesMongoQuery(doc, where));
        const duration = Date.now() - startTime;
        return {
            data: result || null,
            metadata: {
                executionTime: duration,
                cached: false,
                found: !!result
            }
        };
    }
    async findMany(collection, where, options) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 35);
        let collectionData = this.mockData.get(collection) || [];
        // Apply where clause
        if (where) {
            collectionData = collectionData.filter(doc => this.matchesMongoQuery(doc, where));
        }
        // Apply options
        if (options?.orderBy) {
            collectionData = this.applySorting(collectionData, options.orderBy);
        }
        const totalCount = collectionData.length;
        if (options?.offset) {
            collectionData = collectionData.slice(options.offset);
        }
        if (options?.limit) {
            collectionData = collectionData.slice(0, options.limit);
        }
        const duration = Date.now() - startTime;
        return {
            data: collectionData,
            count: collectionData.length,
            totalCount,
            hasMore: options?.limit ? totalCount > (options.offset || 0) + options.limit : false,
            metadata: {
                executionTime: duration,
                cached: false
            }
        };
    }
    async insert(collection, data) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 50);
        const collectionData = this.mockData.get(collection) || [];
        const insertData = Array.isArray(data) ? data : [data];
        const insertedDocs = [];
        for (const doc of insertData) {
            const newDoc = {
                _id: this.generateObjectId(),
                ...doc,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            collectionData.push(newDoc);
            insertedDocs.push(newDoc);
        }
        this.mockData.set(collection, collectionData);
        const duration = Date.now() - startTime;
        return {
            data: insertedDocs,
            count: insertedDocs.length,
            metadata: {
                executionTime: duration,
                cached: false,
                insertId: insertedDocs.map(doc => doc._id)
            }
        };
    }
    async insertOne(collection, data) {
        const result = await this.insert(collection, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    async update(collection, updateData, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 45);
        const collectionData = this.mockData.get(collection) || [];
        const updatedDocs = [];
        for (let i = 0; i < collectionData.length; i++) {
            if (this.matchesMongoQuery(collectionData[i], where)) {
                collectionData[i] = {
                    ...collectionData[i],
                    ...updateData,
                    updatedAt: new Date()
                };
                updatedDocs.push(collectionData[i]);
            }
        }
        this.mockData.set(collection, collectionData);
        const duration = Date.now() - startTime;
        return {
            data: updatedDocs,
            count: updatedDocs.length,
            metadata: {
                executionTime: duration,
                cached: false,
                affectedRows: updatedDocs.length
            }
        };
    }
    async updateOne(collection, updateData, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 40);
        const collectionData = this.mockData.get(collection) || [];
        let updatedDoc = null;
        for (let i = 0; i < collectionData.length; i++) {
            if (this.matchesMongoQuery(collectionData[i], where)) {
                collectionData[i] = {
                    ...collectionData[i],
                    ...updateData,
                    updatedAt: new Date()
                };
                updatedDoc = collectionData[i];
                break;
            }
        }
        this.mockData.set(collection, collectionData);
        const duration = Date.now() - startTime;
        return {
            data: updatedDoc,
            metadata: {
                executionTime: duration,
                cached: false,
                found: !!updatedDoc
            }
        };
    }
    async delete(collection, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 35);
        const collectionData = this.mockData.get(collection) || [];
        const initialLength = collectionData.length;
        const filteredData = collectionData.filter(doc => !this.matchesMongoQuery(doc, where));
        this.mockData.set(collection, filteredData);
        const deletedCount = initialLength - filteredData.length;
        const duration = Date.now() - startTime;
        return {
            data: [],
            count: 0,
            metadata: {
                executionTime: duration,
                cached: false,
                affectedRows: deletedCount
            }
        };
    }
    async deleteOne(collection, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 30);
        const collectionData = this.mockData.get(collection) || [];
        let deletedDoc = null;
        for (let i = 0; i < collectionData.length; i++) {
            if (this.matchesMongoQuery(collectionData[i], where)) {
                deletedDoc = collectionData.splice(i, 1)[0];
                break;
            }
        }
        this.mockData.set(collection, collectionData);
        const duration = Date.now() - startTime;
        return {
            data: deletedDoc,
            metadata: {
                executionTime: duration,
                cached: false,
                found: !!deletedDoc
            }
        };
    }
    async count(collection, where) {
        const result = await this.findMany(collection, where, { limit: undefined });
        return result.totalCount || result.count;
    }
    async exists(collection, where) {
        const result = await this.findOne(collection, where);
        return result.metadata.found;
    }
    async beginTransaction() {
        this.ensureConnected();
        const transactionId = `mongo_tx_${++this.transactionCounter}_${Date.now()}`;
        const transaction = new MockMongoTransaction(transactionId, this);
        return transaction;
    }
    async createTable(definition) {
        this.ensureConnected();
        // In MongoDB, collections are created automatically
        if (!this.mockData.has(definition.tableName)) {
            this.mockData.set(definition.tableName, []);
        }
    }
    async dropTable(collectionName) {
        this.ensureConnected();
        this.mockData.delete(collectionName);
    }
    async alterTable(collectionName, changes) {
        this.ensureConnected();
        // MongoDB is schemaless, so this is mostly a no-op
    }
    async createIndex(collectionName, index) {
        this.ensureConnected();
        // Mock index creation
    }
    async dropIndex(collectionName, indexName) {
        this.ensureConnected();
        // Mock index dropping
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
        return {
            provider: this.name,
            connected: this.connected,
            collectionsCount: this.mockData.size,
            totalDocuments: Array.from(this.mockData.values()).reduce((sum, collection) => sum + collection.length, 0),
            collections: Array.from(this.mockData.keys()),
            storageEngine: 'WiredTiger' // MongoDB specific
        };
    }
    async clearCache() {
        // Mock cache clearing
    }
    // Private helper methods
    initializeMockData() {
        // Initialize with some sample data
        this.mockData.set('articles', [
            {
                _id: this.generateObjectId(),
                title: 'MongoDB Introduction',
                content: 'Introduction to MongoDB database',
                author: 'Alice',
                tags: ['database', 'nosql', 'mongodb'],
                views: 1250,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: this.generateObjectId(),
                title: 'Node.js Best Practices',
                content: 'Best practices for Node.js development',
                author: 'Bob',
                tags: ['nodejs', 'javascript', 'backend'],
                views: 890,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
        this.mockData.set('users', [
            {
                _id: this.generateObjectId(),
                name: 'Alice Johnson',
                email: 'alice@example.com',
                profile: {
                    age: 28,
                    location: 'New York',
                    interests: ['technology', 'reading']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: this.generateObjectId(),
                name: 'Bob Smith',
                email: 'bob@example.com',
                profile: {
                    age: 32,
                    location: 'San Francisco',
                    interests: ['coding', 'music', 'travel']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    }
    ensureConnected() {
        if (!this.connected) {
            throw new types_1.ConnectionError('Not connected to database', 'NOT_CONNECTED');
        }
    }
    generateObjectId() {
        return Math.random().toString(16).substr(2, 24);
    }
    matchesMongoQuery(doc, query) {
        for (const [key, condition] of Object.entries(query)) {
            if (key === '$and') {
                if (!condition.every((clause) => this.matchesMongoQuery(doc, clause))) {
                    return false;
                }
            }
            else if (key === '$or') {
                if (!condition.some((clause) => this.matchesMongoQuery(doc, clause))) {
                    return false;
                }
            }
            else if (key === '$not') {
                if (this.matchesMongoQuery(doc, condition)) {
                    return false;
                }
            }
            else {
                // Handle nested field access (e.g., "profile.age")
                const docValue = this.getNestedValue(doc, key);
                if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
                    // Handle MongoDB operators
                    for (const [op, value] of Object.entries(condition)) {
                        switch (op) {
                            case '$eq':
                                if (docValue !== value)
                                    return false;
                                break;
                            case '$ne':
                                if (docValue === value)
                                    return false;
                                break;
                            case '$gt':
                                if (docValue <= value)
                                    return false;
                                break;
                            case '$gte':
                                if (docValue < value)
                                    return false;
                                break;
                            case '$lt':
                                if (docValue >= value)
                                    return false;
                                break;
                            case '$lte':
                                if (docValue > value)
                                    return false;
                                break;
                            case '$in':
                                if (!value.includes(docValue))
                                    return false;
                                break;
                            case '$nin':
                                if (value.includes(docValue))
                                    return false;
                                break;
                            case '$regex':
                                if (!new RegExp(value).test(String(docValue)))
                                    return false;
                                break;
                            case '$exists':
                                const exists = docValue !== undefined;
                                if (exists !== value)
                                    return false;
                                break;
                            case '$size':
                                if (!Array.isArray(docValue) || docValue.length !== value)
                                    return false;
                                break;
                        }
                    }
                }
                else {
                    // Direct value comparison
                    if (docValue !== condition)
                        return false;
                }
            }
        }
        return true;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    applyProjection(doc, projection) {
        const result = {};
        for (const [field, include] of Object.entries(projection)) {
            if (include) {
                if (field.includes('.')) {
                    // Handle nested field projection
                    const value = this.getNestedValue(doc, field);
                    this.setNestedValue(result, field, value);
                }
                else {
                    result[field] = doc[field];
                }
            }
        }
        return result;
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        current[lastKey] = value;
    }
    applyMongoSort(data, sort) {
        const sortKeys = Object.entries(sort);
        return data.sort((a, b) => {
            for (const [field, direction] of sortKeys) {
                const aVal = this.getNestedValue(a, field);
                const bVal = this.getNestedValue(b, field);
                let comparison = 0;
                if (aVal < bVal)
                    comparison = -1;
                else if (aVal > bVal)
                    comparison = 1;
                if (comparison !== 0) {
                    return direction === -1 ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
    applySorting(data, orderBy) {
        return data.sort((a, b) => {
            for (const { field, direction } of orderBy) {
                const aVal = this.getNestedValue(a, field);
                const bVal = this.getNestedValue(b, field);
                let comparison = 0;
                if (aVal < bVal)
                    comparison = -1;
                else if (aVal > bVal)
                    comparison = 1;
                if (comparison !== 0) {
                    return direction === 'DESC' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MockMongoDBProvider = MockMongoDBProvider;
// Mock MongoDB Transaction implementation
class MockMongoTransaction {
    constructor(id, provider) {
        this.id = id;
        this.provider = provider;
        this.startTime = new Date();
        this.status = 'active';
    }
    async query(collection, query) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.query(collection, query);
    }
    async findOne(collection, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findOne(collection, where);
    }
    async findMany(collection, where, options) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findMany(collection, where, options);
    }
    async insert(collection, data) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        const result = await this.provider.insert(collection, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    async update(collection, data, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.update(collection, data, where);
    }
    async delete(collection, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.delete(collection, where);
    }
    async commit() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Simulate commit delay
        await new Promise(resolve => setTimeout(resolve, 15));
        this.status = 'committed';
    }
    async rollback() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Simulate rollback delay
        await new Promise(resolve => setTimeout(resolve, 15));
        this.status = 'rolled_back';
    }
}
