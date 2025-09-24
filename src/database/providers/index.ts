/**
 * PowerScript Database Providers
 * Export all database provider implementations
 */

export { MockPostgreSQLProvider } from './MockPostgreSQLProvider';
export { MockMySQLProvider } from './MockMySQLProvider';
export { MockMongoDBProvider } from './MockMongoDBProvider';
export { MockRedisProvider } from './MockRedisProvider';

// Provider factory function
import { DatabaseConfig, DatabaseProvider } from '../types';
import { MockPostgreSQLProvider } from './MockPostgreSQLProvider';
import { MockMySQLProvider } from './MockMySQLProvider';
import { MockMongoDBProvider } from './MockMongoDBProvider';
import { MockRedisProvider } from './MockRedisProvider';

export function createDatabaseProvider(config: DatabaseConfig): DatabaseProvider {
    switch (config.provider) {
        case 'postgresql':
            return new MockPostgreSQLProvider(config);
        case 'mysql':
            return new MockMySQLProvider(config);
        case 'mongodb':
            return new MockMongoDBProvider(config);
        case 'redis':
            return new MockRedisProvider(config);
        default:
            throw new Error(`Unsupported database provider: ${config.provider}`);
    }
}

// Provider registry for dynamic loading
export const PROVIDER_REGISTRY = {
    postgresql: MockPostgreSQLProvider,
    mysql: MockMySQLProvider,
    mongodb: MockMongoDBProvider,
    redis: MockRedisProvider
} as const;

export type SupportedProviders = keyof typeof PROVIDER_REGISTRY;