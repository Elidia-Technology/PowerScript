"use strict";
/**
 * Core PowerScript module - Provides ActionScript 3 style classes and utilities
 * This is the foundation that enables AS3-style development in Node.js
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
// Event System
__exportStar(require("./EventDispatcher"), exports);
// Core AS3 Classes
__exportStar(require("./Timer"), exports);
__exportStar(require("./Vector"), exports);
__exportStar(require("./ByteArray"), exports);
// Infrastructure
__exportStar(require("./Logger"), exports);
__exportStar(require("./ErrorManager"), exports);
__exportStar(require("./ConfigLoader"), exports);
__exportStar(require("./DependencyContainer"), exports);
__exportStar(require("./PowerScriptCore"), exports);
//# sourceMappingURL=index.js.map