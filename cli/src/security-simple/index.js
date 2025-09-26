"use strict";
/**
 * PowerScript Simple Security Module - Entry Point
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = exports.PowerScriptSecurityFactory = exports.PowerScriptSecuritySimple = void 0;
var PowerScriptSecuritySimple_1 = require("./PowerScriptSecuritySimple");
Object.defineProperty(exports, "PowerScriptSecuritySimple", { enumerable: true, get: function () { return PowerScriptSecuritySimple_1.PowerScriptSecuritySimple; } });
Object.defineProperty(exports, "PowerScriptSecurityFactory", { enumerable: true, get: function () { return PowerScriptSecuritySimple_1.PowerScriptSecurityFactory; } });
Object.defineProperty(exports, "SecurityUtils", { enumerable: true, get: function () { return PowerScriptSecuritySimple_1.SecurityUtils; } });
const PowerScriptSecuritySimple_2 = require("./PowerScriptSecuritySimple");
exports.default = PowerScriptSecuritySimple_2.PowerScriptSecuritySimple;
