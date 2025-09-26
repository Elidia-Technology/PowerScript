"use strict";
/**
 * PowerScript Database Integrations Types
 * Comprehensive type definitions for database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationError = exports.ValidationError = exports.TransactionError = exports.QueryError = exports.ConnectionError = exports.DatabaseError = exports.DatabaseSeverity = exports.DatabaseEventType = void 0;
// Event Types
var DatabaseEventType;
(function (DatabaseEventType) {
    DatabaseEventType["CONNECTION_OPENED"] = "db.connection.opened";
    DatabaseEventType["CONNECTION_CLOSED"] = "db.connection.closed";
    DatabaseEventType["CONNECTION_ERROR"] = "db.connection.error";
    DatabaseEventType["QUERY_START"] = "db.query.start";
    DatabaseEventType["QUERY_SUCCESS"] = "db.query.success";
    DatabaseEventType["QUERY_ERROR"] = "db.query.error";
    DatabaseEventType["SLOW_QUERY"] = "db.query.slow";
    DatabaseEventType["TRANSACTION_START"] = "db.transaction.start";
    DatabaseEventType["TRANSACTION_COMMIT"] = "db.transaction.commit";
    DatabaseEventType["TRANSACTION_ROLLBACK"] = "db.transaction.rollback";
    DatabaseEventType["MIGRATION_START"] = "db.migration.start";
    DatabaseEventType["MIGRATION_SUCCESS"] = "db.migration.success";
    DatabaseEventType["MIGRATION_ERROR"] = "db.migration.error";
    DatabaseEventType["CACHE_HIT"] = "db.cache.hit";
    DatabaseEventType["CACHE_MISS"] = "db.cache.miss";
})(DatabaseEventType || (exports.DatabaseEventType = DatabaseEventType = {}));
var DatabaseSeverity;
(function (DatabaseSeverity) {
    DatabaseSeverity["LOW"] = "low";
    DatabaseSeverity["MEDIUM"] = "medium";
    DatabaseSeverity["HIGH"] = "high";
    DatabaseSeverity["CRITICAL"] = "critical";
})(DatabaseSeverity || (exports.DatabaseSeverity = DatabaseSeverity = {}));
// Error Types
class DatabaseError extends Error {
    constructor(message, code, category = 'query', severity = DatabaseSeverity.MEDIUM, retryable = false) {
        super(message);
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.retryable = retryable;
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ConnectionError extends DatabaseError {
    constructor(message, code = 'CONNECTION_ERROR', retryable = true) {
        super(message, code, 'connection', DatabaseSeverity.HIGH, retryable);
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
class QueryError extends DatabaseError {
    constructor(message, code = 'QUERY_ERROR', retryable = false) {
        super(message, code, 'query', DatabaseSeverity.MEDIUM, retryable);
        this.name = 'QueryError';
    }
}
exports.QueryError = QueryError;
class TransactionError extends DatabaseError {
    constructor(message, code = 'TRANSACTION_ERROR', retryable = false) {
        super(message, code, 'transaction', DatabaseSeverity.HIGH, retryable);
        this.name = 'TransactionError';
    }
}
exports.TransactionError = TransactionError;
class ValidationError extends DatabaseError {
    constructor(message, code = 'VALIDATION_ERROR', retryable = false) {
        super(message, code, 'validation', DatabaseSeverity.MEDIUM, retryable);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class MigrationError extends DatabaseError {
    constructor(message, code = 'MIGRATION_ERROR', retryable = false) {
        super(message, code, 'migration', DatabaseSeverity.HIGH, retryable);
        this.name = 'MigrationError';
    }
}
exports.MigrationError = MigrationError;
