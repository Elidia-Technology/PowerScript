"use strict";
/**
 * PowerScript Database Providers
 * Export all database provider implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_REGISTRY = exports.MockRedisProvider = exports.MockMongoDBProvider = exports.MockMySQLProvider = exports.MockPostgreSQLProvider = void 0;
exports.createDatabaseProvider = createDatabaseProvider;
var MockPostgreSQLProvider_1 = require("./MockPostgreSQLProvider");
Object.defineProperty(exports, "MockPostgreSQLProvider", { enumerable: true, get: function () { return MockPostgreSQLProvider_1.MockPostgreSQLProvider; } });
var MockMySQLProvider_1 = require("./MockMySQLProvider");
Object.defineProperty(exports, "MockMySQLProvider", { enumerable: true, get: function () { return MockMySQLProvider_1.MockMySQLProvider; } });
var MockMongoDBProvider_1 = require("./MockMongoDBProvider");
Object.defineProperty(exports, "MockMongoDBProvider", { enumerable: true, get: function () { return MockMongoDBProvider_1.MockMongoDBProvider; } });
var MockRedisProvider_1 = require("./MockRedisProvider");
Object.defineProperty(exports, "MockRedisProvider", { enumerable: true, get: function () { return MockRedisProvider_1.MockRedisProvider; } });
const MockPostgreSQLProvider_2 = require("./MockPostgreSQLProvider");
const MockMySQLProvider_2 = require("./MockMySQLProvider");
const MockMongoDBProvider_2 = require("./MockMongoDBProvider");
const MockRedisProvider_2 = require("./MockRedisProvider");
function createDatabaseProvider(config) {
    switch (config.provider) {
        case 'postgresql':
            return new MockPostgreSQLProvider_2.MockPostgreSQLProvider(config);
        case 'mysql':
            return new MockMySQLProvider_2.MockMySQLProvider(config);
        case 'mongodb':
            return new MockMongoDBProvider_2.MockMongoDBProvider(config);
        case 'redis':
            return new MockRedisProvider_2.MockRedisProvider(config);
        default:
            throw new Error(`Unsupported database provider: ${config.provider}`);
    }
}
// Provider registry for dynamic loading
exports.PROVIDER_REGISTRY = {
    postgresql: MockPostgreSQLProvider_2.MockPostgreSQLProvider,
    mysql: MockMySQLProvider_2.MockMySQLProvider,
    mongodb: MockMongoDBProvider_2.MockMongoDBProvider,
    redis: MockRedisProvider_2.MockRedisProvider
};
