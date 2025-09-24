/**
 * PowerScript Database Integrations Tests
 * Simplified test suite focusing on provider functionality
 */

import { MockPostgreSQLProvider, MockMySQLProvider, MockMongoDBProvider, MockRedisProvider } from '../src/database/providers';
import { DatabaseConfig } from '../src/database/types';

// Test configurations
const testConfigs = {
    postgresql: {
        provider: 'postgresql' as const,
        connection: {
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_pass'
        }
    } as DatabaseConfig,
    
    mysql: {
        provider: 'mysql' as const,
        connection: {
            host: 'localhost',
            port: 3306,
            database: 'test_db',
            username: 'test_user',
            password: 'test_pass'
        }
    } as DatabaseConfig,
    
    mongodb: {
        provider: 'mongodb' as const,
        connection: {
            host: 'localhost',
            port: 27017,
            database: 'test_db'
        }
    } as DatabaseConfig,
    
    redis: {
        provider: 'redis' as const,
        connection: {
            host: 'localhost',
            port: 6379,
            database: '0'
        }
    } as DatabaseConfig
};

// Test runner class
class DatabaseTestRunner {
    public testResults: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];
    

    
    private async test(name: string, testFn: () => Promise<void>): Promise<void> {
        const startTime = Date.now();
        
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.testResults.push({ name, passed: true, duration });
            console.log(`✅ ${name} (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.testResults.push({ name, passed: false, error: errorMessage, duration });
            console.log(`❌ ${name} (${duration}ms): ${errorMessage}`);
        }
    }
    
    private async testProviderConnections(): Promise<void> {
        console.log('📡 Testing Provider Connections...');
        
        // Test PostgreSQL Provider
        await this.test('PostgreSQL - Connection', async () => {
            const provider = new MockPostgreSQLProvider(testConfigs.postgresql);
            await provider.connect();
            
            if (!provider.isConnected()) throw new Error('Provider not connected');
            
            const pingResult = await provider.ping();
            if (!pingResult) throw new Error('Ping failed');
            
            await provider.disconnect();
            if (provider.isConnected()) throw new Error('Provider still connected after disconnect');
        });
        
        // Test MySQL Provider
        await this.test('MySQL - Connection', async () => {
            const provider = new MockMySQLProvider(testConfigs.mysql);
            await provider.connect();
            
            if (!provider.isConnected()) throw new Error('Provider not connected');
            
            const pingResult = await provider.ping();
            if (!pingResult) throw new Error('Ping failed');
            
            await provider.disconnect();
            if (provider.isConnected()) throw new Error('Provider still connected after disconnect');
        });
        
        // Test MongoDB Provider
        await this.test('MongoDB - Connection', async () => {
            const provider = new MockMongoDBProvider(testConfigs.mongodb);
            await provider.connect();
            
            if (!provider.isConnected()) throw new Error('Provider not connected');
            
            const pingResult = await provider.ping();
            if (!pingResult) throw new Error('Ping failed');
            
            await provider.disconnect();
            if (provider.isConnected()) throw new Error('Provider still connected after disconnect');
        });
        
        // Test Redis Provider
        await this.test('Redis - Connection', async () => {
            const provider = new MockRedisProvider(testConfigs.redis);
            await provider.connect();
            
            if (!provider.isConnected()) throw new Error('Provider not connected');
            
            const pingResult = await provider.ping();
            if (!pingResult) throw new Error('Ping failed');
            
            await provider.disconnect();
            if (provider.isConnected()) throw new Error('Provider still connected after disconnect');
        });
    }
    
    private async testCRUDOperations(): Promise<void> {
        console.log('🔧 Testing CRUD Operations...');
        
        const providers = [
            { name: 'PostgreSQL', provider: new MockPostgreSQLProvider(testConfigs.postgresql) },
            { name: 'MySQL', provider: new MockMySQLProvider(testConfigs.mysql) },
            { name: 'MongoDB', provider: new MockMongoDBProvider(testConfigs.mongodb) }
        ];
        
        for (const { name, provider } of providers) {
            await provider.connect();
            
            await this.test(`${name} - Insert Operation`, async () => {
                const result = await provider.insert('test_users', { 
                    name: 'John Doe', 
                    email: 'john@example.com',
                    age: 30
                });
                
                if (result.count !== 1) throw new Error('Insert failed');
                if (!result.data[0]) throw new Error('No data returned');
            });
            
            await this.test(`${name} - Find One Operation`, async () => {
                const result = await provider.findOne('test_users', { name: 'John Doe' });
                if (!result.data) throw new Error('FindOne failed');
                if (!result.metadata.found) throw new Error('Record not found');
            });
            
            await this.test(`${name} - Find Many Operation`, async () => {
                const result = await provider.findMany('test_users');
                if (result.count === 0) throw new Error('FindMany failed');
                if (!result.data.length) throw new Error('No data returned');
            });
            
            await this.test(`${name} - Update Operation`, async () => {
                const result = await provider.update('test_users', 
                    { age: 31 }, 
                    { name: 'John Doe' }
                );
                
                if (result.count === 0) throw new Error('Update failed');
                if (!result.metadata.affectedRows) throw new Error('No rows affected');
            });
            
            await this.test(`${name} - Count Operation`, async () => {
                const count = await provider.count('test_users');
                if (count === 0) throw new Error('Count failed');
            });
            
            await this.test(`${name} - Exists Operation`, async () => {
                const exists = await provider.exists('test_users', { name: 'John Doe' });
                if (!exists) throw new Error('Exists failed');
            });
            
            await this.test(`${name} - Delete Operation`, async () => {
                const result = await provider.delete('test_users', { name: 'John Doe' });
                if (!result.metadata.affectedRows) throw new Error('Delete failed');
            });
            
            await provider.disconnect();
        }
    }
    
    private async testTransactions(): Promise<void> {
        console.log('💼 Testing Transaction Operations...');
        
        const providers = [
            { name: 'PostgreSQL', provider: new MockPostgreSQLProvider(testConfigs.postgresql) },
            { name: 'MySQL', provider: new MockMySQLProvider(testConfigs.mysql) },
            { name: 'MongoDB', provider: new MockMongoDBProvider(testConfigs.mongodb) },
            { name: 'Redis', provider: new MockRedisProvider(testConfigs.redis) }
        ];
        
        for (const { name, provider } of providers) {
            await provider.connect();
            
            await this.test(`${name} - Transaction Commit`, async () => {
                const tx = await provider.beginTransaction();
                
                if (tx.status !== 'active') throw new Error('Transaction not active');
                
                await tx.insert('test_tx', { name: 'TX User 1', email: 'tx1@example.com' });
                await tx.insert('test_tx', { name: 'TX User 2', email: 'tx2@example.com' });
                
                await tx.commit();
                
                // Check if transaction is no longer active after commit
                if (tx.status === 'active') throw new Error('Transaction still active after commit');
            });
            
            await this.test(`${name} - Transaction Rollback`, async () => {
                const tx = await provider.beginTransaction();
                
                if (tx.status !== 'active') throw new Error('Transaction not active');
                
                await tx.insert('test_tx', { name: 'TX User 3', email: 'tx3@example.com' });
                await tx.rollback();
                
                // Check if transaction is no longer active after rollback
                if (tx.status === 'active') throw new Error('Transaction still active after rollback');
            });
            
            await provider.disconnect();
        }
    }
    
    private async testSpecialOperations(): Promise<void> {
        console.log('⚡ Testing Special Operations...');
        
        // Test Redis-specific operations
        await this.test('Redis - String Operations', async () => {
            const provider = new MockRedisProvider(testConfigs.redis);
            await provider.connect();
            
            await provider.set('test_key', 'test_value');
            const value = await provider.get('test_key');
            
            if (value !== 'test_value') throw new Error('String operations failed');
            
            const exists = await provider.exists('test_key');
            if (!exists) throw new Error('Key should exist');
            
            const deleted = await provider.del('test_key');
            if (deleted !== 1) throw new Error('Delete failed');
            
            await provider.disconnect();
        });
        
        await this.test('Redis - Hash Operations', async () => {
            const provider = new MockRedisProvider(testConfigs.redis);
            await provider.connect();
            
            await provider.hset('test_hash', 'field1', 'value1');
            await provider.hset('test_hash', 'field2', 'value2');
            
            const value = await provider.hget('test_hash', 'field1');
            if (value !== 'value1') throw new Error('Hash get failed');
            
            const hash = await provider.hgetall('test_hash');
            if (!hash || hash.field1 !== 'value1' || hash.field2 !== 'value2') {
                throw new Error('Hash getall failed');
            }
            
            await provider.del('test_hash');
            await provider.disconnect();
        });
        
        await this.test('Redis - List Operations', async () => {
            const provider = new MockRedisProvider(testConfigs.redis);
            await provider.connect();
            
            const length1 = await provider.lpush('test_list', 'item1', 'item2');
            if (length1 !== 2) throw new Error('List push failed');
            
            const length2 = await provider.rpush('test_list', 'item3');
            if (length2 !== 3) throw new Error('List push failed');
            
            const listLength = await provider.llen('test_list');
            if (listLength !== 3) throw new Error('List length failed');
            
            const item = await provider.lpop('test_list');
            if (!item) throw new Error('List pop failed');
            
            await provider.del('test_list');
            await provider.disconnect();
        });
        
        await this.test('Redis - Set Operations', async () => {
            const provider = new MockRedisProvider(testConfigs.redis);
            await provider.connect();
            
            const added = await provider.sadd('test_set', 'member1', 'member2', 'member1');
            if (added !== 2) throw new Error('Set add failed'); // Should only add 2 unique members
            
            const isMember = await provider.sismember('test_set', 'member1');
            if (!isMember) throw new Error('Set membership test failed');
            
            const members = await provider.smembers('test_set');
            if (members.length !== 2) throw new Error('Set members failed');
            
            const removed = await provider.srem('test_set', 'member1');
            if (removed !== 1) throw new Error('Set remove failed');
            
            await provider.del('test_set');
            await provider.disconnect();
        });
    }
    
    private async testErrorHandling(): Promise<void> {
        console.log('⚠️ Testing Error Handling...');
        
        await this.test('Invalid Connection', async () => {
            const invalidConfig: DatabaseConfig = {
                provider: 'postgresql',
                connection: { host: 'invalid-host', port: 5432 }
            };
            
            const provider = new MockPostgreSQLProvider(invalidConfig);
            
            try {
                await provider.connect();
                throw new Error('Should have failed to connect');
            } catch (error) {
                if (!(error instanceof Error) || !error.message.includes('connect')) {
                    throw new Error('Wrong error type');
                }
            }
        });
        
        await this.test('Operation on Disconnected Provider', async () => {
            const provider = new MockPostgreSQLProvider(testConfigs.postgresql);
            
            try {
                await provider.findOne('test_table', { id: 1 });
                throw new Error('Should have failed on disconnected provider');
            } catch (error) {
                if (!(error instanceof Error) || !error.message.includes('connected')) {
                    throw new Error('Wrong error type');
                }
            }
        });
        
        await this.test('Transaction Error Handling', async () => {
            const provider = new MockPostgreSQLProvider(testConfigs.postgresql);
            await provider.connect();
            
            const tx = await provider.beginTransaction();
            await tx.commit();
            
            try {
                await tx.insert('test_table', { name: 'test' });
                throw new Error('Should have failed on inactive transaction');
            } catch (error) {
                if (!(error instanceof Error) || !error.message.includes('not active')) {
                    throw new Error('Wrong error type');
                }
            }
            
            await provider.disconnect();
        });
    }
    
    private async testPerformance(): Promise<void> {
        console.log('⚡ Testing Performance...');
        
        await this.test('Bulk Insert Performance', async () => {
            const provider = new MockPostgreSQLProvider(testConfigs.postgresql);
            await provider.connect();
            
            const iterations = 100;
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                await provider.insert('test_perf', { 
                    name: `User ${i}`, 
                    email: `user${i}@example.com`,
                    value: Math.random()
                });
            }
            
            const duration = Date.now() - startTime;
            const opsPerSecond = (iterations / duration) * 1000;
            
            console.log(`    📈 ${iterations} inserts in ${duration}ms (${opsPerSecond.toFixed(2)} ops/sec)`);
            
            if (opsPerSecond < 10) throw new Error('Performance below threshold');
            
            await provider.disconnect();
        });
        
        await this.test('Concurrent Operations', async () => {
            const provider = new MockPostgreSQLProvider(testConfigs.postgresql);
            await provider.connect();
            
            const promises = [];
            const concurrency = 20;
            
            for (let i = 0; i < concurrency; i++) {
                promises.push(provider.insert('test_concurrent', { 
                    name: `Concurrent User ${i}`, 
                    email: `concurrent${i}@example.com` 
                }));
            }
            
            const results = await Promise.all(promises);
            
            if (results.length !== concurrency) throw new Error('Not all operations completed');
            if (!results.every(r => r.count === 1)) throw new Error('Some operations failed');
            
            await provider.disconnect();
        });
    }
    
    private printResults(): void {
        console.log('\n📋 Test Results Summary');
        console.log('========================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
        console.log(`Total Duration: ${totalDuration}ms`);
        console.log(`Average Duration: ${(totalDuration / total).toFixed(1)}ms`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        console.log('\n🎉 Database Integration Tests Complete!');
    }
    
    public async run(): Promise<void> {
        console.log('🧪 Starting PowerScript Database Tests...');
        console.log(`📅 Started at: ${new Date().toISOString()}`);
        console.log('='.repeat(60));
        
        try {
            await this.testProviderConnections();
            await this.testCRUDOperations();
            await this.testTransactions();
            await this.testSpecialOperations();
            await this.testErrorHandling();
            await this.testPerformance();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            this.printResults();
        }
    }
}

// Export for use in main test runner
export { DatabaseTestRunner };

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new DatabaseTestRunner();
    runner.run().then(() => {
        const failed = runner.testResults.filter(r => !r.passed).length;
        process.exit(failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}