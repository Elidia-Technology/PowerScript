"use strict";
/**
 * PowerScript AS3 Compilation Pipeline
 *
 * Enhanced compiler that provides better AS3 syntax support, dynamic classes,
 * and improved error handling for PowerScript to TypeScript compilation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AS3Compiler = void 0;
const PowerScriptCompiler_1 = require("../compiler/PowerScriptCompiler");
class AS3Compiler extends PowerScriptCompiler_1.PowerScriptCompiler {
    constructor(options = {}) {
        super();
        this.as3Keywords = new Set([
            'as', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete',
            'do', 'else', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements',
            'import', 'in', 'instanceof', 'interface', 'internal', 'is', 'namespace', 'native',
            'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'super',
            'switch', 'this', 'throw', 'throws', 'true', 'try', 'typeof', 'use', 'var',
            'void', 'while', 'with', 'dynamic', 'each', 'get', 'set', 'override', 'static',
            'final', 'abstract'
        ]);
        this.as3Types = new Map([
            ['int', 'number'],
            ['uint', 'number'],
            ['Number', 'number'],
            ['String', 'string'],
            ['Boolean', 'boolean'],
            ['Object', 'any'],
            ['Array', 'PSArray'],
            ['Vector', 'PSVector'],
            ['ByteArray', 'PSByteArray'],
            ['void', 'void'],
            ['*', 'any']
        ]);
        this.options = {
            target: 'es2018',
            module: 'commonjs',
            strict: false,
            allowDynamicClasses: true,
            enableAS3Utilities: true,
            sourceMaps: true,
            declaration: false,
            ...options
        };
    }
    /**
     * Compile AS3-style PowerScript code to TypeScript
     */
    async compileAS3(source, filename) {
        const result = {
            success: false,
            errors: [],
            warnings: []
        };
        try {
            // Pre-process AS3 syntax
            let processedSource = this.preprocessAS3Syntax(source);
            // Add AS3 utility imports if enabled
            if (this.options.enableAS3Utilities) {
                processedSource = this.addAS3Imports(processedSource);
            }
            // Compile using base compiler
            const compileResult = await this.compileCode(processedSource, filename);
            if (compileResult.success) {
                result.success = true;
                result.output = compileResult.code;
                result.sourceMap = compileResult.sourceMap;
                result.declarations = compileResult.declarations;
            }
            else {
                result.errors = compileResult.errors.map(e => e.message) || [];
            }
            // Post-process for AS3 compatibility
            if (result.output) {
                result.output = this.postProcessAS3Output(result.output);
            }
        }
        catch (error) {
            result.errors.push(`AS3 Compilation Error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return result;
    }
    /**
     * Pre-process AS3 syntax to make it TypeScript compatible
     */
    preprocessAS3Syntax(source) {
        let processed = source;
        // Handle AS3 package declarations
        processed = processed.replace(/package\s+([\w.]*)\s*\{/g, (match, packageName) => {
            if (packageName) {
                return `export namespace ${packageName.replace(/\./g, '_')} {`;
            }
            return 'export namespace PowerScript {';
        });
        // Handle AS3 import statements
        processed = processed.replace(/import\s+([\w.*]+);/g, (match, importPath) => {
            // Convert AS3 import to TypeScript import
            const parts = importPath.split('.');
            const className = parts[parts.length - 1];
            const modulePath = parts.slice(0, -1).join('/') || '.';
            if (className === '*') {
                return `import * as ${parts[parts.length - 2]} from '${modulePath}';`;
            }
            return `import { ${className} } from '${modulePath}';`;
        });
        // Handle AS3 variable declarations with types
        processed = processed.replace(/var\s+(\w+)\s*:\s*(\w+)(\s*=\s*[^;]+)?;/g, (match, varName, varType, initializer) => {
            const tsType = this.as3Types.get(varType) || varType;
            return `let ${varName}: ${tsType}${initializer || ''};`;
        });
        // Handle AS3 function declarations with types
        processed = processed.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)/g, (match, funcName, params, returnType) => {
            const tsReturnType = this.as3Types.get(returnType) || returnType;
            const processedParams = this.processAS3Parameters(params);
            return `function ${funcName}(${processedParams}): ${tsReturnType}`;
        });
        // Handle AS3 class declarations
        processed = processed.replace(/class\s+(\w+)(\s+extends\s+\w+)?(\s+implements\s+[\w,\s]+)?\s*\{/g, (match, className, extendsClause, implementsClause) => {
            let result = `export class ${className}`;
            if (extendsClause)
                result += extendsClause;
            if (implementsClause)
                result += implementsClause;
            result += ' {';
            return result;
        });
        // Handle AS3 access modifiers and property declarations
        processed = processed.replace(/(public|private|protected|internal)\s+(static\s+)?(var|const)\s+(\w+)\s*:\s*(\w+)(\s*=\s*[^;]+)?;/g, (match, access, staticMod, varType, varName, type, initializer) => {
            const tsAccess = access === 'internal' ? 'public' : access;
            const tsType = this.as3Types.get(type) || type;
            const modifier = varType === 'const' ? 'readonly' : '';
            const static_ = staticMod || '';
            return `${tsAccess} ${static_}${modifier} ${varName}: ${tsType}${initializer || ''};`;
        });
        // Handle AS3 method declarations
        processed = processed.replace(/(public|private|protected|internal)\s+(static\s+)?(override\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*:\s*(\w+)/g, (match, access, staticMod, overrideMod, methodName, params, returnType) => {
            const tsAccess = access === 'internal' ? 'public' : access;
            const tsReturnType = this.as3Types.get(returnType) || returnType;
            const processedParams = this.processAS3Parameters(params);
            const static_ = staticMod || '';
            return `${tsAccess} ${static_}${methodName}(${processedParams}): ${tsReturnType}`;
        });
        // Handle AS3 for each loops
        processed = processed.replace(/for\s+each\s*\(\s*var\s+(\w+)\s*:\s*(\w+)\s+in\s+([^)]+)\)/g, (match, varName, varType, collection) => {
            const tsType = this.as3Types.get(varType) || varType;
            return `for (const ${varName}: ${tsType} of ${collection})`;
        });
        // Handle AS3 vector type declarations
        processed = processed.replace(/Vector\.<(\w+)>/g, (match, elementType) => {
            const tsElementType = this.as3Types.get(elementType) || elementType;
            return `PSVector<${tsElementType}>`;
        });
        // Handle AS3 'is' operator
        processed = processed.replace(/(\w+)\s+is\s+(\w+)/g, '$1 instanceof $2');
        // Handle AS3 'as' operator
        processed = processed.replace(/(\w+)\s+as\s+(\w+)/g, '($1 as $2)');
        return processed;
    }
    /**
     * Process AS3 function parameters
     */
    processAS3Parameters(params) {
        if (!params.trim())
            return '';
        return params.split(',').map(param => {
            const trimmed = param.trim();
            if (!trimmed)
                return '';
            // Handle parameter with type
            const match = trimmed.match(/(\w+)\s*:\s*(\w+)(\s*=\s*[^,]+)?/);
            if (match) {
                const [, paramName, paramType, defaultValue] = match;
                const tsType = this.as3Types.get(paramType) || paramType;
                return `${paramName}: ${tsType}${defaultValue || ''}`;
            }
            // Handle parameter without type (assume any)
            return `${trimmed}: any`;
        }).join(', ');
    }
    /**
     * Add necessary AS3 utility imports
     */
    addAS3Imports(source) {
        const imports = [];
        // Check which AS3 utilities are used
        if (source.includes('Timer') || source.includes('PSTimer')) {
            imports.push('Timer');
        }
        if (source.includes('PSMath') || source.includes('Math.')) {
            imports.push('PSMath');
        }
        if (source.includes('PSArray') || source.includes('Array')) {
            imports.push('PSArray');
        }
        if (source.includes('PSVector') || source.includes('Vector')) {
            imports.push('PSVector');
        }
        if (source.includes('PSByteArray') || source.includes('ByteArray')) {
            imports.push('PSByteArray');
        }
        if (imports.length > 0) {
            const importStatement = `import { ${imports.join(', ')} } from './AS3Utilities';\n\n`;
            return importStatement + source;
        }
        return source;
    }
    /**
     * Post-process compiled output for AS3 compatibility
     */
    postProcessAS3Output(output) {
        let processed = output;
        // Add runtime AS3 compatibility helpers
        if (this.options.enableAS3Utilities) {
            const runtimeHelpers = `
// AS3 Runtime Compatibility
const trace = console.log;
const int = (value: any): number => Math.floor(Number(value)) | 0;
const uint = (value: any): number => Math.floor(Number(value)) >>> 0;

`;
            processed = runtimeHelpers + processed;
        }
        return processed;
    }
    /**
     * Validate AS3 syntax and provide helpful error messages
     */
    validateAS3Syntax(source) {
        const errors = [];
        const warnings = [];
        // Check for common AS3 syntax issues
        const lines = source.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;
            // Check for untyped variables (warning)
            if (line.match(/var\s+\w+\s*=/) && !line.includes(':')) {
                warnings.push(`Line ${lineNum}: Untyped variable declaration (consider adding type annotation)`);
            }
            // Check for untyped function parameters (warning)
            if (line.includes('function') && line.includes('(')) {
                const paramMatch = line.match(/function\s+\w+\s*\(([^)]*)\)/);
                if (paramMatch && paramMatch[1]) {
                    const params = paramMatch[1].split(',');
                    for (const param of params) {
                        if (param.trim() && !param.includes(':')) {
                            warnings.push(`Line ${lineNum}: Untyped parameter '${param.trim()}' (consider adding type annotation)`);
                        }
                    }
                }
            }
            // Check for missing return type (warning)
            if (line.includes('function') && !line.includes(':') && line.includes('{')) {
                warnings.push(`Line ${lineNum}: Function missing return type annotation`);
            }
            // Check for deprecated AS3 syntax
            if (line.includes('arguments.callee')) {
                errors.push(`Line ${lineNum}: 'arguments.callee' is not supported in strict mode`);
            }
            // Check for AS3-specific issues
            if (line.includes('import ') && !line.endsWith(';')) {
                errors.push(`Line ${lineNum}: Import statement missing semicolon`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * Get AS3 compilation suggestions
     */
    getAS3Suggestions(source) {
        const suggestions = [];
        // Analyze code and provide suggestions
        if (source.includes('var ') && !source.includes('let ') && !source.includes('const ')) {
            suggestions.push("Consider using 'let' or 'const' instead of 'var' for better scoping");
        }
        if (source.includes('==') && !source.includes('===')) {
            suggestions.push("Consider using strict equality (===) instead of loose equality (==)");
        }
        if (source.includes('Array') && !source.includes('PSArray')) {
            suggestions.push("Consider using PSArray for better AS3 compatibility");
        }
        if (source.includes('setTimeout') || source.includes('setInterval')) {
            suggestions.push("Consider using Timer class for AS3-style timing operations");
        }
        return suggestions;
    }
    /**
     * Generate AS3 type definitions
     */
    generateAS3TypeDefinitions() {
        return `
// AS3 Type Definitions for PowerScript
declare global {
    function trace(...args: any[]): void;
    function int(value: any): number;
    function uint(value: any): number;
    
    // AS3 Constants
    const undefined: undefined;
    const NaN: number;
    const Infinity: number;
}

// AS3 Utility Type Aliases
export type int = number;
export type uint = number;
export type Number = number;
export type String = string;
export type Boolean = boolean;
export type Object = any;

// Export AS3 Utilities
export { Timer, PSMath as Math, PSArray as Array, PSVector as Vector, PSByteArray as ByteArray } from './AS3Utilities';
`;
    }
}
exports.AS3Compiler = AS3Compiler;
// Export enhanced compiler
exports.default = AS3Compiler;
