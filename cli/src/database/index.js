"use strict";
/**
 * PowerScript Database Module
 *
 * Provides comprehensive database integration capabilities with support for
 * multiple database providers (PostgreSQL, MySQL, MongoDB, Redis), ORM features,
 * transaction management, migrations, and caching.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseProvider = exports.PowerScriptDatabase = void 0;
// Core Database Classes
__exportStar(require("./PowerScriptDatabase"), exports);
__exportStar(require("./types"), exports);
// Database Providers
__exportStar(require("./providers"), exports);
// Default exports for convenience
var PowerScriptDatabase_1 = require("./PowerScriptDatabase");
Object.defineProperty(exports, "PowerScriptDatabase", { enumerable: true, get: function () { return PowerScriptDatabase_1.PowerScriptDatabase; } });
var providers_1 = require("./providers");
Object.defineProperty(exports, "createDatabaseProvider", { enumerable: true, get: function () { return providers_1.createDatabaseProvider; } });
