"use strict";
/**
 * PowerScript Filesystem & Storage Module - Entry Point
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
exports.PowerScriptFileSystem = void 0;
var PowerScriptFileSystem_1 = require("./PowerScriptFileSystem");
Object.defineProperty(exports, "PowerScriptFileSystem", { enumerable: true, get: function () { return PowerScriptFileSystem_1.PowerScriptFileSystem; } });
__exportStar(require("./types"), exports);
const PowerScriptFileSystem_2 = require("./PowerScriptFileSystem");
exports.default = PowerScriptFileSystem_2.PowerScriptFileSystem;
