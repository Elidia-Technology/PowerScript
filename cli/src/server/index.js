"use strict";
/**
 * PowerScript Server & Microservices Framework
 * Main exports for server functionality
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
exports.Gateway = exports.ServiceDiscovery = exports.LoadBalancer = exports.Middleware = exports.Router = exports.PowerScriptServer = exports.server = void 0;
__exportStar(require("./PowerScriptServer"), exports);
__exportStar(require("./types"), exports);
const PowerScriptServer_1 = require("./PowerScriptServer");
Object.defineProperty(exports, "PowerScriptServer", { enumerable: true, get: function () { return PowerScriptServer_1.PowerScriptServer; } });
// Factory functions for easy server creation
exports.server = {
    create: (config) => new PowerScriptServer_1.PowerScriptServer(config),
    createCluster: (config) => PowerScriptServer_1.PowerScriptServer.createCluster(config),
    createMicroservice: (config) => PowerScriptServer_1.PowerScriptServer.createMicroservice(config)
};
exports.default = PowerScriptServer_1.PowerScriptServer;
// Convenience exports
var Router_1 = require("./Router");
Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return Router_1.Router; } });
var Middleware_1 = require("./Middleware");
Object.defineProperty(exports, "Middleware", { enumerable: true, get: function () { return Middleware_1.Middleware; } });
var LoadBalancer_1 = require("./LoadBalancer");
Object.defineProperty(exports, "LoadBalancer", { enumerable: true, get: function () { return LoadBalancer_1.LoadBalancer; } });
var ServiceDiscovery_1 = require("./ServiceDiscovery");
Object.defineProperty(exports, "ServiceDiscovery", { enumerable: true, get: function () { return ServiceDiscovery_1.ServiceDiscovery; } });
var Gateway_1 = require("./Gateway");
Object.defineProperty(exports, "Gateway", { enumerable: true, get: function () { return Gateway_1.Gateway; } });
