/**
 * PowerScript Mock MongoDB Provider
 * Mock implementation of MongoDB database provider for testing
 */

import {
    DatabaseProvider, DatabaseConfig, WhereClause, QueryOptions, 
    QueryResult, SingleResult, Transaction, ModelDefinition, 
    Migration, MigrationResult, ConnectionError, QueryError
} from '../types';

export class MockMongoDBProvider implements DatabaseProvider {
    public readonly name = 'MockMongoDBProvider';
    public readonly version = '1.0.0';
    public readonly type = 'nosql' as const;
    
    private connected = false;
    private config: DatabaseConfig;
    private mockData: Map<string, any[]> = new Map();
    private transactionCounter = 0;
    
    constructor(config: DatabaseConfig) {
        this.config = config;
        this.initializeMockData();
    }
    
    async connect(): Promise<void> {
        // Simulate connection delay
        await this.sleep(70);
        
        if (this.config.connection.host === 'invalid-host') {
            throw new ConnectionError('Failed to connect to MongoDB server', 'MONGODB_CONNECTION_FAILED');
        }
        
        this.connected = true;
    }
    
    async disconnect(): Promise<void> {
        await this.sleep(35);
        this.connected = false;
    }
    
    isConnected(): boolean {
        return this.connected;
    }
    
    async ping(): Promise<boolean> {
        if (!this.connected) return false;
        
        try {
            await this.sleep(20);
            return true;
        } catch {
            return false;
        }
    }
    
    async query<T = any>(collection: string, query?: any): Promise<QueryResult<T>> {
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
    
    async execute(operation: string, params?: any[]): Promise<QueryResult<any>> {
        // MongoDB doesn't use SQL, so we adapt this to run aggregation pipelines
        return this.aggregate(operation, params || []);
    }
    
    async aggregate<T = any>(collection: string, pipeline: any[]): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 60);
        
        let collectionData = this.mockData.get(collection) || [];
        
        // Very basic aggregation pipeline simulation
        for (const stage of pipeline) {
            if (stage.$match) {
                collectionData = collectionData.filter(doc => this.matchesMongoQuery(doc, stage.$match));
            } else if (stage.$project) {
                collectionData = collectionData.map(doc => this.applyProjection(doc, stage.$project));
            } else if (stage.$sort) {
                collectionData = this.applyMongoSort(collectionData, stage.$sort);
            } else if (stage.$limit) {
                collectionData = collectionData.slice(0, stage.$limit);
            } else if (stage.$skip) {
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
    
    async findOne<T = any>(collection: string, where: WhereClause): Promise<SingleResult<T>> {
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
    
    async findMany<T = any>(collection: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>> {
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
    
    async insert<T = any>(collection: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 50);
        
        const collectionData = this.mockData.get(collection) || [];
        const insertData = Array.isArray(data) ? data : [data];
        const insertedDocs: T[] = [];
        
        for (const doc of insertData) {
            const newDoc = {
                _id: this.generateObjectId(),
                ...doc,
                createdAt: new Date(),
                updatedAt: new Date()
            } as T;
            
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
                insertId: insertedDocs.map(doc => (doc as any)._id)
            }
        };
    }
    
    async insertOne<T = any>(collection: string, data: Partial<T>): Promise<SingleResult<T>> {
        const result = await this.insert<T>(collection, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    
    async update<T = any>(collection: string, updateData: Partial<T>, where: WhereClause): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 45);
        
        const collectionData = this.mockData.get(collection) || [];
        const updatedDocs: T[] = [];
        
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
    
    async updateOne<T = any>(collection: string, updateData: Partial<T>, where: WhereClause): Promise<SingleResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 40);
        
        const collectionData = this.mockData.get(collection) || [];
        let updatedDoc: T | null = null;
        
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
    
    async delete(collection: string, where: WhereClause): Promise<QueryResult<any>> {
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
    
    async deleteOne(collection: string, where: WhereClause): Promise<SingleResult<any>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 30);
        
        const collectionData = this.mockData.get(collection) || [];
        let deletedDoc: any = null;
        
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
    
    async count(collection: string, where?: WhereClause): Promise<number> {
        const result = await this.findMany(collection, where, { limit: undefined });
        return result.totalCount || result.count;
    }
    
    async exists(collection: string, where: WhereClause): Promise<boolean> {
        const result = await this.findOne(collection, where);
        return result.metadata.found;
    }
    
    async beginTransaction(): Promise<Transaction> {
        this.ensureConnected();
        
        const transactionId = `mongo_tx_${++this.transactionCounter}_${Date.now()}`;
        const transaction = new MockMongoTransaction(transactionId, this);
        
        return transaction;
    }
    
    async createTable(definition: ModelDefinition): Promise<void> {
        this.ensureConnected();
        
        // In MongoDB, collections are created automatically
        if (!this.mockData.has(definition.tableName)) {
            this.mockData.set(definition.tableName, []);
        }
    }
    
    async dropTable(collectionName: string): Promise<void> {
        this.ensureConnected();
        this.mockData.delete(collectionName);
    }
    
    async alterTable(collectionName: string, changes: any): Promise<void> {
        this.ensureConnected();
        // MongoDB is schemaless, so this is mostly a no-op
    }
    
    async createIndex(collectionName: string, index: any): Promise<void> {
        this.ensureConnected();
        // Mock index creation
    }
    
    async dropIndex(collectionName: string, indexName: string): Promise<void> {
        this.ensureConnected();
        // Mock index dropping
    }
    
    async runMigration(migration: Migration): Promise<MigrationResult> {
        const startTime = Date.now();
        
        try {
            await migration.up(this);
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                migration,
                executionTime: duration
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            return {
                success: false,
                migration,
                executionTime: duration,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }
    
    async getStats(): Promise<Record<string, any>> {
        return {
            provider: this.name,
            connected: this.connected,
            collectionsCount: this.mockData.size,
            totalDocuments: Array.from(this.mockData.values()).reduce((sum, collection) => sum + collection.length, 0),
            collections: Array.from(this.mockData.keys()),
            storageEngine: 'WiredTiger' // MongoDB specific
        };
    }
    
    async clearCache(): Promise<void> {
        // Mock cache clearing
    }
    
    // Private helper methods
    private initializeMockData(): void {
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
    
    private ensureConnected(): void {
        if (!this.connected) {
            throw new ConnectionError('Not connected to database', 'NOT_CONNECTED');
        }
    }
    
    private generateObjectId(): string {
        return Math.random().toString(16).substr(2, 24);
    }
    
    private matchesMongoQuery(doc: any, query: any): boolean {
        for (const [key, condition] of Object.entries(query)) {
            if (key === '$and') {
                if (!(condition as any[]).every((clause: any) => this.matchesMongoQuery(doc, clause))) {
                    return false;
                }
            } else if (key === '$or') {
                if (!(condition as any[]).some((clause: any) => this.matchesMongoQuery(doc, clause))) {
                    return false;
                }
            } else if (key === '$not') {
                if (this.matchesMongoQuery(doc, condition)) {
                    return false;
                }
            } else {
                // Handle nested field access (e.g., "profile.age")
                const docValue = this.getNestedValue(doc, key);
                
                if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
                    // Handle MongoDB operators
                    for (const [op, value] of Object.entries(condition)) {
                        switch (op) {
                            case '$eq':
                                if (docValue !== value) return false;
                                break;
                            case '$ne':
                                if (docValue === value) return false;
                                break;
                            case '$gt':
                                if (docValue <= (value as any)) return false;
                                break;
                            case '$gte':
                                if (docValue < (value as any)) return false;
                                break;
                            case '$lt':
                                if (docValue >= (value as any)) return false;
                                break;
                            case '$lte':
                                if (docValue > (value as any)) return false;
                                break;
                            case '$in':
                                if (!(value as any[]).includes(docValue)) return false;
                                break;
                            case '$nin':
                                if ((value as any[]).includes(docValue)) return false;
                                break;
                            case '$regex':
                                if (!new RegExp(value as string).test(String(docValue))) return false;
                                break;
                            case '$exists':
                                const exists = docValue !== undefined;
                                if (exists !== value) return false;
                                break;
                            case '$size':
                                if (!Array.isArray(docValue) || docValue.length !== value) return false;
                                break;
                        }
                    }
                } else {
                    // Direct value comparison
                    if (docValue !== condition) return false;
                }
            }
        }
        return true;
    }
    
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    private applyProjection(doc: any, projection: any): any {
        const result: any = {};
        
        for (const [field, include] of Object.entries(projection)) {
            if (include) {
                if (field.includes('.')) {
                    // Handle nested field projection
                    const value = this.getNestedValue(doc, field);
                    this.setNestedValue(result, field, value);
                } else {
                    result[field] = doc[field];
                }
            }
        }
        
        return result;
    }
    
    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        
        let current = obj;
        for (const key of keys) {
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }
    
    private applyMongoSort(data: any[], sort: any): any[] {
        const sortKeys = Object.entries(sort);
        
        return data.sort((a, b) => {
            for (const [field, direction] of sortKeys) {
                const aVal = this.getNestedValue(a, field);
                const bVal = this.getNestedValue(b, field);
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                if (comparison !== 0) {
                    return (direction as number) === -1 ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
    
    private applySorting(data: any[], orderBy: Array<{ field: string; direction: 'ASC' | 'DESC' }>): any[] {
        return data.sort((a, b) => {
            for (const { field, direction } of orderBy) {
                const aVal = this.getNestedValue(a, field);
                const bVal = this.getNestedValue(b, field);
                
                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
                
                if (comparison !== 0) {
                    return direction === 'DESC' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Mock MongoDB Transaction implementation
class MockMongoTransaction implements Transaction {
    public readonly startTime = new Date();
    public status: 'active' | 'committed' | 'rolled_back' = 'active';
    
    constructor(
        public readonly id: string,
        private provider: MockMongoDBProvider
    ) {}
    
    async query<T = any>(collection: string, query?: any): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.query<T>(collection, query);
    }
    
    async findOne<T = any>(collection: string, where: WhereClause): Promise<SingleResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findOne<T>(collection, where);
    }
    
    async findMany<T = any>(collection: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findMany<T>(collection, where, options);
    }
    
    async insert<T = any>(collection: string, data: Partial<T>): Promise<SingleResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        const result = await this.provider.insert<T>(collection, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    
    async update<T = any>(collection: string, data: Partial<T>, where: WhereClause): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.update<T>(collection, data, where);
    }
    
    async delete(collection: string, where: WhereClause): Promise<QueryResult<any>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.delete(collection, where);
    }
    
    async commit(): Promise<void> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        
        // Simulate commit delay
        await new Promise(resolve => setTimeout(resolve, 15));
        this.status = 'committed';
    }
    
    async rollback(): Promise<void> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        
        // Simulate rollback delay
        await new Promise(resolve => setTimeout(resolve, 15));
        this.status = 'rolled_back';
    }
}