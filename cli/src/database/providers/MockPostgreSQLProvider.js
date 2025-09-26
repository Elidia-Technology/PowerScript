"use strict";
/**
 * PowerScript Mock PostgreSQL Provider
 * Mock implementation of PostgreSQL database provider for testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPostgreSQLProvider = void 0;
const types_1 = require("../types");
class MockPostgreSQLProvider {
    constructor(config) {
        this.name = 'MockPostgreSQLProvider';
        this.version = '1.0.0';
        this.type = 'sql';
        this.connected = false;
        this.mockData = new Map();
        this.transactionCounter = 0;
        this.config = config;
        this.initializeMockData();
    }
    async connect() {
        // Simulate connection delay
        await this.sleep(50);
        if (this.config.connection.host === 'invalid-host') {
            throw new types_1.ConnectionError('Failed to connect to PostgreSQL server', 'PG_CONNECTION_FAILED');
        }
        this.connected = true;
    }
    async disconnect() {
        await this.sleep(25);
        this.connected = false;
    }
    isConnected() {
        return this.connected;
    }
    async ping() {
        if (!this.connected)
            return false;
        try {
            await this.sleep(10);
            return true;
        }
        catch {
            return false;
        }
    }
    async query(sql, params) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 50); // Simulate query time
        // Mock SQL parsing and execution
        const result = this.executeMockQuery(sql, params);
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
    async execute(sql, params) {
        return this.query(sql, params);
    }
    async findOne(table, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 30);
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
    async findMany(table, where, options) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 40);
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
    async insert(table, data) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 60);
        const tableData = this.mockData.get(table) || [];
        const insertData = Array.isArray(data) ? data : [data];
        const insertedRows = [];
        for (const row of insertData) {
            const newRow = {
                id: tableData.length + 1, // Auto-increment ID
                ...row,
                created_at: new Date(),
                updated_at: new Date()
            };
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
                insertId: insertedRows[0] ? insertedRows[0].id : null
            }
        };
    }
    async update(table, updateData, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 50);
        const tableData = this.mockData.get(table) || [];
        const updatedRows = [];
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
    async delete(table, where) {
        this.ensureConnected();
        const startTime = Date.now();
        await this.sleep(Math.random() * 40);
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
    async count(table, where) {
        const result = await this.findMany(table, where, { limit: undefined });
        return result.totalCount || result.count;
    }
    async exists(table, where) {
        const result = await this.findOne(table, where);
        return result.metadata.found;
    }
    async beginTransaction() {
        this.ensureConnected();
        const transactionId = `tx_${++this.transactionCounter}_${Date.now()}`;
        const transaction = new MockTransaction(transactionId, this);
        return transaction;
    }
    async createTable(definition) {
        this.ensureConnected();
        // Initialize empty table
        if (!this.mockData.has(definition.tableName)) {
            this.mockData.set(definition.tableName, []);
        }
    }
    async dropTable(tableName) {
        this.ensureConnected();
        this.mockData.delete(tableName);
    }
    async alterTable(tableName, changes) {
        this.ensureConnected();
        // Mock table alteration - would implement column changes in real provider
    }
    async createIndex(tableName, index) {
        this.ensureConnected();
        // Mock index creation
    }
    async dropIndex(tableName, indexName) {
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
            tablesCount: this.mockData.size,
            totalRows: Array.from(this.mockData.values()).reduce((sum, table) => sum + table.length, 0),
            tables: Array.from(this.mockData.keys())
        };
    }
    async clearCache() {
        // Mock cache clearing
    }
    // Private helper methods
    initializeMockData() {
        // Initialize with some sample data
        this.mockData.set('users', [
            { id: 1, name: 'John Doe', email: 'john@example.com', created_at: new Date(), updated_at: new Date() },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: new Date(), updated_at: new Date() }
        ]);
        this.mockData.set('posts', [
            { id: 1, title: 'First Post', content: 'This is the first post', user_id: 1, created_at: new Date(), updated_at: new Date() },
            { id: 2, title: 'Second Post', content: 'This is the second post', user_id: 2, created_at: new Date(), updated_at: new Date() }
        ]);
    }
    ensureConnected() {
        if (!this.connected) {
            throw new types_1.ConnectionError('Not connected to database', 'NOT_CONNECTED');
        }
    }
    executeMockQuery(sql, params) {
        // Very basic SQL parsing for demo purposes
        const sqlLower = sql.toLowerCase().trim();
        if (sqlLower.startsWith('select')) {
            // Extract table name (very basic parsing)
            const fromMatch = sqlLower.match(/from\s+(\w+)/);
            if (fromMatch) {
                const tableName = fromMatch[1];
                return (this.mockData.get(tableName) || []);
            }
        }
        return [];
    }
    matchesWhere(row, where) {
        for (const [key, condition] of Object.entries(where)) {
            if (key === '$and') {
                if (!condition.every((clause) => this.matchesWhere(row, clause))) {
                    return false;
                }
            }
            else if (key === '$or') {
                if (!condition.some((clause) => this.matchesWhere(row, clause))) {
                    return false;
                }
            }
            else if (key === '$not') {
                if (this.matchesWhere(row, condition)) {
                    return false;
                }
            }
            else {
                // Simple field comparison
                const rowValue = row[key];
                if (typeof condition === 'object' && condition !== null) {
                    // Handle operators
                    for (const [op, value] of Object.entries(condition)) {
                        switch (op) {
                            case '$eq':
                                if (rowValue !== value)
                                    return false;
                                break;
                            case '$ne':
                                if (rowValue === value)
                                    return false;
                                break;
                            case '$gt':
                                if (rowValue <= value)
                                    return false;
                                break;
                            case '$gte':
                                if (rowValue < value)
                                    return false;
                                break;
                            case '$lt':
                                if (rowValue >= value)
                                    return false;
                                break;
                            case '$lte':
                                if (rowValue > value)
                                    return false;
                                break;
                            case '$in':
                                if (!value.includes(rowValue))
                                    return false;
                                break;
                            case '$nin':
                                if (value.includes(rowValue))
                                    return false;
                                break;
                            case '$like':
                                const likePattern = value.replace(/%/g, '.*');
                                if (!new RegExp(likePattern, 'i').test(String(rowValue)))
                                    return false;
                                break;
                        }
                    }
                }
                else {
                    // Direct value comparison
                    if (rowValue !== condition)
                        return false;
                }
            }
        }
        return true;
    }
    applySorting(data, orderBy) {
        return data.sort((a, b) => {
            for (const { field, direction } of orderBy) {
                const aVal = a[field];
                const bVal = b[field];
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
exports.MockPostgreSQLProvider = MockPostgreSQLProvider;
// Mock Transaction implementation
class MockTransaction {
    constructor(id, provider) {
        this.id = id;
        this.provider = provider;
        this.startTime = new Date();
        this.status = 'active';
    }
    async query(sql, params) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.query(sql, params);
    }
    async findOne(table, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findOne(table, where);
    }
    async findMany(table, where, options) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.findMany(table, where, options);
    }
    async insert(table, data) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        const result = await this.provider.insert(table, data);
        return {
            data: result.data[0] || null,
            metadata: {
                ...result.metadata,
                found: !!result.data[0]
            }
        };
    }
    async update(table, data, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.update(table, data, where);
    }
    async delete(table, where) {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        return this.provider.delete(table, where);
    }
    async commit() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Simulate commit delay
        await new Promise(resolve => setTimeout(resolve, 10));
        this.status = 'committed';
    }
    async rollback() {
        if (this.status !== 'active') {
            throw new types_1.QueryError('Transaction is not active', 'TRANSACTION_NOT_ACTIVE');
        }
        // Simulate rollback delay
        await new Promise(resolve => setTimeout(resolve, 10));
        this.status = 'rolled_back';
    }
}
