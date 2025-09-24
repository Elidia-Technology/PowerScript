/**
 * PowerScript Mock MySQL Provider
 * Mock implementation of MySQL database provider for testing
 */

import {
    DatabaseProvider, DatabaseConfig, WhereClause, QueryOptions, 
    QueryResult, SingleResult, Transaction, ModelDefinition, 
    Migration, MigrationResult, ConnectionError, QueryError
} from '../types';

export class MockMySQLProvider implements DatabaseProvider {
    public readonly name = 'MockMySQLProvider';
    public readonly version = '1.0.0';
    public readonly type = 'sql' as const;
    
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
        await this.sleep(60);
        
        if (this.config.connection.host === 'invalid-host') {
            throw new ConnectionError('Failed to connect to MySQL server', 'MYSQL_CONNECTION_FAILED');
        }
        
        this.connected = true;
    }
    
    async disconnect(): Promise<void> {
        await this.sleep(30);
        this.connected = false;
    }
    
    isConnected(): boolean {
        return this.connected;
    }
    
    async ping(): Promise<boolean> {
        if (!this.connected) return false;
        
        try {
            await this.sleep(15);
            return true;
        } catch {
            return false;
        }
    }
    
    async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 45); // Simulate query time
        
        // Mock SQL parsing and execution
        const result = this.executeMockQuery<T>(sql, params);
        const duration = Date.now() - startTime;
        
        return {
            data: result,
            count: result.length,
            metadata: {
                executionTime: duration,
                cached: false,
                query: sql,
                parameters: params
            }
        };
    }
    
    async execute(sql: string, params?: any[]): Promise<QueryResult<any>> {
        return this.query(sql, params);
    }
    
    async findOne<T = any>(table: string, where: WhereClause): Promise<SingleResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 25);
        
        const tableData = this.mockData.get(table) || [];
        const result = tableData.find(row => this.matchesWhere(row, where));
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
    
    async findMany<T = any>(table: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 35);
        
        let tableData = this.mockData.get(table) || [];
        
        // Apply where clause
        if (where) {
            tableData = tableData.filter(row => this.matchesWhere(row, where));
        }
        
        // Apply options
        if (options?.orderBy) {
            tableData = this.applySorting(tableData, options.orderBy);
        }
        
        const totalCount = tableData.length;
        
        if (options?.offset) {
            tableData = tableData.slice(options.offset);
        }
        
        if (options?.limit) {
            tableData = tableData.slice(0, options.limit);
        }
        
        const duration = Date.now() - startTime;
        
        return {
            data: tableData,
            count: tableData.length,
            totalCount,
            hasMore: options?.limit ? totalCount > (options.offset || 0) + options.limit : false,
            metadata: {
                executionTime: duration,
                cached: false
            }
        };
    }
    
    async insert<T = any>(table: string, data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 55);
        
        const tableData = this.mockData.get(table) || [];
        const insertData = Array.isArray(data) ? data : [data];
        const insertedRows: T[] = [];
        
        for (const row of insertData) {
            const newRow = {
                id: tableData.length + 1, // Auto-increment ID
                ...row,
                created_at: new Date(),
                updated_at: new Date()
            } as T;
            
            tableData.push(newRow);
            insertedRows.push(newRow);
        }
        
        this.mockData.set(table, tableData);
        const duration = Date.now() - startTime;
        
        return {
            data: insertedRows,
            count: insertedRows.length,
            metadata: {
                executionTime: duration,
                cached: false,
                affectedRows: insertedRows.length,
                insertId: insertedRows[0] ? (insertedRows[0] as any).id : null
            }
        };
    }
    
    async update<T = any>(table: string, updateData: Partial<T>, where: WhereClause): Promise<QueryResult<T>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 45);
        
        const tableData = this.mockData.get(table) || [];
        const updatedRows: T[] = [];
        
        for (let i = 0; i < tableData.length; i++) {
            if (this.matchesWhere(tableData[i], where)) {
                tableData[i] = {
                    ...tableData[i],
                    ...updateData,
                    updated_at: new Date()
                };
                updatedRows.push(tableData[i]);
            }
        }
        
        this.mockData.set(table, tableData);
        const duration = Date.now() - startTime;
        
        return {
            data: updatedRows,
            count: updatedRows.length,
            metadata: {
                executionTime: duration,
                cached: false,
                affectedRows: updatedRows.length
            }
        };
    }
    
    async delete(table: string, where: WhereClause): Promise<QueryResult<any>> {
        this.ensureConnected();
        
        const startTime = Date.now();
        await this.sleep(Math.random() * 35);
        
        const tableData = this.mockData.get(table) || [];
        const initialLength = tableData.length;
        
        const filteredData = tableData.filter(row => !this.matchesWhere(row, where));
        this.mockData.set(table, filteredData);
        
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
    
    async count(table: string, where?: WhereClause): Promise<number> {
        const result = await this.findMany(table, where, { limit: undefined });
        return result.totalCount || result.count;
    }
    
    async exists(table: string, where: WhereClause): Promise<boolean> {
        const result = await this.findOne(table, where);
        return result.metadata.found;
    }
    
    async beginTransaction(): Promise<Transaction> {
        this.ensureConnected();
        
        const transactionId = `mysql_tx_${++this.transactionCounter}_${Date.now()}`;
        const transaction = new MockMySQLTransaction(transactionId, this);
        
        return transaction;
    }
    
    async createTable(definition: ModelDefinition): Promise<void> {
        this.ensureConnected();
        
        // Initialize empty table
        if (!this.mockData.has(definition.tableName)) {
            this.mockData.set(definition.tableName, []);
        }
    }
    
    async dropTable(tableName: string): Promise<void> {
        this.ensureConnected();
        this.mockData.delete(tableName);
    }
    
    async alterTable(tableName: string, changes: any): Promise<void> {
        this.ensureConnected();
        // Mock table alteration - would implement column changes in real provider
    }
    
    async createIndex(tableName: string, index: any): Promise<void> {
        this.ensureConnected();
        // Mock index creation
    }
    
    async dropIndex(tableName: string, indexName: string): Promise<void> {
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
            tablesCount: this.mockData.size,
            totalRows: Array.from(this.mockData.values()).reduce((sum, table) => sum + table.length, 0),
            tables: Array.from(this.mockData.keys()),
            engine: 'InnoDB' // MySQL specific
        };
    }
    
    async clearCache(): Promise<void> {
        // Mock cache clearing
    }
    
    // Private helper methods
    private initializeMockData(): void {
        // Initialize with some sample data
        this.mockData.set('products', [
            { id: 1, name: 'Product A', price: 99.99, category_id: 1, created_at: new Date(), updated_at: new Date() },
            { id: 2, name: 'Product B', price: 149.99, category_id: 2, created_at: new Date(), updated_at: new Date() }
        ]);
        
        this.mockData.set('categories', [
            { id: 1, name: 'Electronics', created_at: new Date(), updated_at: new Date() },
            { id: 2, name: 'Books', created_at: new Date(), updated_at: new Date() }
        ]);
    }
    
    private ensureConnected(): void {
        if (!this.connected) {
            throw new ConnectionError('Not connected to database', 'NOT_CONNECTED');
        }
    }
    
    private executeMockQuery<T>(sql: string, params?: any[]): T[] {
        // Very basic SQL parsing for demo purposes
        const sqlLower = sql.toLowerCase().trim();
        
        if (sqlLower.startsWith('select')) {
            // Extract table name (very basic parsing)
            const fromMatch = sqlLower.match(/from\s+(\w+)/);
            if (fromMatch) {
                const tableName = fromMatch[1];
                return (this.mockData.get(tableName) || []) as T[];
            }
        }
        
        return [] as T[];
    }
    
    private matchesWhere(row: any, where: WhereClause): boolean {
        for (const [key, condition] of Object.entries(where)) {
            if (key === '$and') {
                if (!condition.every((clause: WhereClause) => this.matchesWhere(row, clause))) {
                    return false;
                }
            } else if (key === '$or') {
                if (!condition.some((clause: WhereClause) => this.matchesWhere(row, clause))) {
                    return false;
                }
            } else if (key === '$not') {
                if (this.matchesWhere(row, condition)) {
                    return false;
                }
            } else {
                // Simple field comparison
                const rowValue = row[key];
                
                if (typeof condition === 'object' && condition !== null) {
                    // Handle operators
                    for (const [op, value] of Object.entries(condition)) {
                        switch (op) {
                            case '$eq':
                                if (rowValue !== value) return false;
                                break;
                            case '$ne':
                                if (rowValue === value) return false;
                                break;
                            case '$gt':
                                if (rowValue <= (value as any)) return false;
                                break;
                            case '$gte':
                                if (rowValue < (value as any)) return false;
                                break;
                            case '$lt':
                                if (rowValue >= (value as any)) return false;
                                break;
                            case '$lte':
                                if (rowValue > (value as any)) return false;
                                break;
                            case '$in':
                                if (!(value as any[]).includes(rowValue)) return false;
                                break;
                            case '$nin':
                                if ((value as any[]).includes(rowValue)) return false;
                                break;
                            case '$like':
                                const likePattern = (value as string).replace(/%/g, '.*');
                                if (!new RegExp(likePattern, 'i').test(String(rowValue))) return false;
                                break;
                        }
                    }
                } else {
                    // Direct value comparison
                    if (rowValue !== condition) return false;
                }
            }
        }
        return true;
    }
    
    private applySorting(data: any[], orderBy: Array<{ field: string; direction: 'ASC' | 'DESC' }>): any[] {
        return data.sort((a, b) => {
            for (const { field, direction } of orderBy) {
                const aVal = a[field];
                const bVal = b[field];
                
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

// Mock MySQL Transaction implementation
class MockMySQLTransaction implements Transaction {
    public readonly startTime = new Date();
    public status: 'active' | 'committed' | 'rolled_back' = 'active';
    
    constructor(
        public readonly id: string,
        private provider: MockMySQLProvider
    ) {}
    
    async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.query<T>(sql, params);
    }
    
    async findOne<T = any>(table: string, where: WhereClause): Promise<SingleResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findOne<T>(table, where);
    }
    
    async findMany<T = any>(table: string, where?: WhereClause, options?: QueryOptions): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findMany<T>(table, where, options);
    }
    
    async insert<T = any>(table: string, data: Partial<T>): Promise<SingleResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        const result = await this.provider.insert<T>(table, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    
    async update<T = any>(table: string, data: Partial<T>, where: WhereClause): Promise<QueryResult<T>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.update<T>(table, data, where);
    }
    
    async delete(table: string, where: WhereClause): Promise<QueryResult<any>> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.delete(table, where);
    }
    
    async commit(): Promise<void> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        
        // Simulate commit delay
        await new Promise(resolve => setTimeout(resolve, 12));
        this.status = 'committed';
    }
    
    async rollback(): Promise<void> {
        if (this.status !== 'active') {
            throw new QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        
        // Simulate rollback delay
        await new Promise(resolve => setTimeout(resolve, 12));
        this.status = 'rolled_back';
    }
}