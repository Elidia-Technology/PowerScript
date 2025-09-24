/**
 * PowerScript Database Module
 * 
 * Provides comprehensive database integration capabilities with support for
 * multiple database providers (PostgreSQL, MySQL, MongoDB, Redis), ORM features,
 * transaction management, migrations, and caching.
 */

// Core Database Classes
export * from './PowerScriptDatabase';
export * from './types';

// Database Providers
export * from './providers';

// Default exports for convenience
export { PowerScriptDatabase } from './PowerScriptDatabase';
export { createDatabaseProvider } from './providers';

// Type exports
export type {
    DatabaseConfig,
    DatabaseProvider,
    QueryResult,
    QueryOptions,
    WhereClause,
    Transaction,
    ModelDefinition,
    Migration,
    MigrationResult,
    SingleResult,
    FieldDefinition,
    RelationDefinition,
    IndexDefinition,
    ModelHooks,
    Model,
    ValidationResult,
    ValidationError,
    DatabaseEvent
} from './types';