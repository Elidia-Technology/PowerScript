"use strict";
/**
 * Cloud Provider Exports
 * Centralized export for all cloud providers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUD_PROVIDERS = exports.EdgeProvider = exports.NetlifyProvider = exports.VercelProvider = exports.AzureProvider = exports.GCPProvider = exports.AWSProvider = exports.BaseCloudProvider = void 0;
var BaseProvider_1 = require("./BaseProvider");
Object.defineProperty(exports, "BaseCloudProvider", { enumerable: true, get: function () { return BaseProvider_1.BaseCloudProvider; } });
var AWSProvider_1 = require("./AWSProvider");
Object.defineProperty(exports, "AWSProvider", { enumerable: true, get: function () { return AWSProvider_1.AWSProvider; } });
var GCPProvider_1 = require("./GCPProvider");
Object.defineProperty(exports, "GCPProvider", { enumerable: true, get: function () { return GCPProvider_1.GCPProvider; } });
var AzureProvider_1 = require("./AzureProvider");
Object.defineProperty(exports, "AzureProvider", { enumerable: true, get: function () { return AzureProvider_1.AzureProvider; } });
var VercelProvider_1 = require("./VercelProvider");
Object.defineProperty(exports, "VercelProvider", { enumerable: true, get: function () { return VercelProvider_1.VercelProvider; } });
var NetlifyProvider_1 = require("./NetlifyProvider");
Object.defineProperty(exports, "NetlifyProvider", { enumerable: true, get: function () { return NetlifyProvider_1.NetlifyProvider; } });
var EdgeProvider_1 = require("./EdgeProvider");
Object.defineProperty(exports, "EdgeProvider", { enumerable: true, get: function () { return EdgeProvider_1.EdgeProvider; } });
// Provider registry for dynamic loading
exports.CLOUD_PROVIDERS = {
    aws: () => Promise.resolve().then(() => require('./AWSProvider')).then(m => m.AWSProvider),
    gcp: () => Promise.resolve().then(() => require('./GCPProvider')).then(m => m.GCPProvider),
    azure: () => Promise.resolve().then(() => require('./AzureProvider')).then(m => m.AzureProvider),
    vercel: () => Promise.resolve().then(() => require('./VercelProvider')).then(m => m.VercelProvider),
    netlify: () => Promise.resolve().then(() => require('./NetlifyProvider')).then(m => m.NetlifyProvider),
    edge: () => Promise.resolve().then(() => require('./EdgeProvider')).then(m => m.EdgeProvider),
    cloudflare: () => Promise.resolve().then(() => require('./EdgeProvider')).then(m => m.EdgeProvider), // Alias for edge
    deno: () => Promise.resolve().then(() => require('./EdgeProvider')).then(m => m.EdgeProvider), // Alias for edge
    bun: () => Promise.resolve().then(() => require('./EdgeProvider')).then(m => m.EdgeProvider) // Alias for edge
};
