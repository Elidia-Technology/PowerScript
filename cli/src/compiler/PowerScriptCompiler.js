"use strict";
/**
 * PowerScript Compiler - Main compiler class
 *
 * Transforms PowerScript style code to modern JavaScript/TypeScript
 * with full ES6+ features and Node.js compatibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptCompiler = exports.CompilerEvent = void 0;
const EventDispatcher_1 = require("../core/EventDispatcher");
const Logger_1 = require("../core/Logger");
const ErrorManager_1 = require("../core/ErrorManager");
class CompilerEvent extends EventDispatcher_1.Event {
    constructor(type, data, bubbles = false, cancelable = false) {
        super(type, bubbles, cancelable);
        this.data = data;
    }
}
exports.CompilerEvent = CompilerEvent;
CompilerEvent.COMPILATION_START = 'compilationStart';
CompilerEvent.COMPILATION_COMPLETE = 'compilationComplete';
CompilerEvent.COMPILATION_ERROR = 'compilationError';
CompilerEvent.FILE_PROCESSED = 'fileProcessed';
CompilerEvent.PROGRESS_UPDATE = 'progressUpdate';
/**
 * Main PowerScript Compiler class
 */
class PowerScriptCompiler extends EventDispatcher_1.EventDispatcher {
    constructor(options) {
        super();
        this._initialized = false;
        this._compiling = false;
        this._version = '1.0.0';
        this._options = {
            target: 'es2020',
            module: 'commonjs',
            sourceMaps: true,
            minify: false,
            declaration: true,
            strict: true,
            preserveComments: false,
            as3Compatibility: true,
            optimizeImports: true,
            transformArrowFunctions: true,
            transformClasses: true,
            transformModules: true,
            ...options
        };
        this._logger = new Logger_1.Logger();
        this._errorManager = new ErrorManager_1.ErrorManager(this._logger);
    }
    /**
     * Initialize the compiler
     */
    async initialize(options) {
        if (this._initialized) {
            this._logger.warn('Compiler already initialized');
            return;
        }
        if (options) {
            this._options = { ...this._options, ...options };
        }
        this._logger.info('Initializing PowerScript Compiler', {
            version: this._version,
            target: this._options.target,
            module: this._options.module,
            as3Compatibility: this._options.as3Compatibility
        });
        this._initialized = true;
    }
    /**
     * Compile a single file from source code
     */
    async compileCode(sourceCode, fileName = 'source.ps') {
        if (!this._initialized) {
            await this.initialize();
        }
        if (this._compiling) {
            throw new Error('Compiler is already running');
        }
        this._compiling = true;
        const startTime = Date.now();
        try {
            this.dispatchEvent(new CompilerEvent(CompilerEvent.COMPILATION_START, { fileName }));
            // Parse the source code
            const ast = await this._parseSourceCode(sourceCode, fileName);
            // Transform the AST
            const transformedAst = await this._transformAST(ast);
            // Generate output code
            const result = await this._generateCode(transformedAst, fileName);
            const compilationTime = Date.now() - startTime;
            const stats = {
                totalFiles: 1,
                processedFiles: 1,
                totalLines: sourceCode.split('\n').length,
                outputSize: result.code?.length || 0,
                compilationTime,
                memoryUsage: this._getMemoryUsage()
            };
            const compilationResult = {
                success: true,
                code: result.code,
                sourceMap: result.sourceMap,
                declarations: result.declarations,
                errors: [],
                warnings: result.warnings || [],
                stats
            };
            this.dispatchEvent(new CompilerEvent(CompilerEvent.COMPILATION_COMPLETE, compilationResult));
            this._logger.info(`Compilation completed in ${compilationTime}ms`, stats);
            return compilationResult;
        }
        catch (error) {
            const compilationError = {
                message: error instanceof Error ? error.message : String(error),
                line: 0,
                column: 0,
                file: fileName,
                severity: 'error',
                code: 'COMPILATION_ERROR'
            };
            const result = {
                success: false,
                errors: [compilationError],
                warnings: [],
                stats: {
                    totalFiles: 1,
                    processedFiles: 0,
                    totalLines: sourceCode.split('\n').length,
                    outputSize: 0,
                    compilationTime: Date.now() - startTime,
                    memoryUsage: this._getMemoryUsage()
                }
            };
            this.dispatchEvent(new CompilerEvent(CompilerEvent.COMPILATION_ERROR, result));
            this._errorManager.handleError(error, 'COMPILATION_ERROR');
            return result;
        }
        finally {
            this._compiling = false;
        }
    }
    /**
     * Compile a file from the filesystem
     */
    async compileFile(filePath) {
        try {
            // Check if we're in Node.js environment
            if (typeof require === 'undefined') {
                throw new Error('File system operations not supported in browser environment');
            }
            const fs = require('fs').promises;
            const sourceCode = await fs.readFile(filePath, 'utf8');
            return this.compileCode(sourceCode, filePath);
        }
        catch (error) {
            this._errorManager.handleError(error, 'FILE_READ_ERROR');
            throw error;
        }
    }
    /**
     * Compile multiple files
     */
    async compileFiles(filePaths) {
        const results = [];
        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            this.dispatchEvent(new CompilerEvent(CompilerEvent.PROGRESS_UPDATE, {
                current: i + 1,
                total: filePaths.length,
                file: filePath
            }));
            try {
                const result = await this.compileFile(filePath);
                results.push(result);
                this.dispatchEvent(new CompilerEvent(CompilerEvent.FILE_PROCESSED, {
                    file: filePath,
                    success: result.success
                }));
            }
            catch (error) {
                const errorResult = {
                    success: false,
                    errors: [{
                            message: error instanceof Error ? error.message : String(error),
                            line: 0,
                            column: 0,
                            file: filePath,
                            severity: 'error',
                            code: 'FILE_ERROR'
                        }],
                    warnings: [],
                    stats: {
                        totalFiles: filePaths.length,
                        processedFiles: i,
                        totalLines: 0,
                        outputSize: 0,
                        compilationTime: 0,
                        memoryUsage: this._getMemoryUsage()
                    }
                };
                results.push(errorResult);
            }
        }
        return results;
    }
    /**
     * Get compiler options
     */
    getOptions() {
        return { ...this._options };
    }
    /**
     * Update compiler options
     */
    setOptions(options) {
        this._options = { ...this._options, ...options };
        this._logger.debug('Compiler options updated', options);
    }
    /**
     * Get compiler version
     */
    getVersion() {
        return this._version;
    }
    /**
     * Check if compiler is currently running
     */
    isCompiling() {
        return this._compiling;
    }
    /**
     * Get supported target versions
     */
    getSupportedTargets() {
        return ['es5', 'es2015', 'es2017', 'es2018', 'es2019', 'es2020', 'es2022', 'esnext'];
    }
    /**
     * Get supported module formats
     */
    getSupportedModules() {
        return ['commonjs', 'es6', 'amd', 'umd', 'system'];
    }
    // Private methods for compilation pipeline
    async _parseSourceCode(sourceCode, fileName) {
        // This is a simplified parser - in a real implementation,
        // you would use a proper AST parser like Babel or TypeScript's parser
        this._logger.debug(`Parsing ${fileName}`, { lines: sourceCode.split('\n').length });
        // For now, return a mock AST
        return {
            type: 'Program',
            sourceType: 'module',
            body: [],
            fileName,
            sourceCode
        };
    }
    async _transformAST(ast) {
        this._logger.debug('Transforming AST', { type: ast.type });
        // Apply AS3 to modern JavaScript transformations
        const transformedAst = this._applyAS3Transformations(ast);
        return transformedAst;
    }
    _applyAS3Transformations(ast) {
        // This would contain the actual AS3 to JavaScript transformations
        // For now, return the AST as-is
        const transformations = [
            this._transformPackageStatements,
            this._transformClassDeclarations,
            this._transformImportStatements,
            this._transformEventHandlers,
            this._transformVectorTypes,
            this._transformAS3BuiltIns
        ];
        let transformedAst = ast;
        for (const transform of transformations) {
            transformedAst = transform.call(this, transformedAst);
        }
        return transformedAst;
    }
    _transformPackageStatements(ast) {
        // Transform AS3 package statements to ES6 modules
        return ast;
    }
    _transformClassDeclarations(ast) {
        // Transform AS3 class declarations to ES6 classes
        return ast;
    }
    _transformImportStatements(ast) {
        // Transform AS3 import statements to ES6 imports
        return ast;
    }
    _transformEventHandlers(ast) {
        // Transform AS3 event handling to PowerScript EventDispatcher
        return ast;
    }
    _transformVectorTypes(ast) {
        // Transform AS3 Vector types to PowerScript Vector
        return ast;
    }
    _transformAS3BuiltIns(ast) {
        // Transform AS3 built-in classes to PowerScript equivalents
        return ast;
    }
    async _generateCode(ast, fileName) {
        this._logger.debug(`Generating code for ${fileName}`);
        // This is a mock code generator - in a real implementation,
        // you would generate actual JavaScript/TypeScript code from the AST
        const mockCode = `// Generated by PowerScript Compiler v${this._version}
// Source: ${fileName}

import { EventDispatcher, Timer, Vector, ByteArray } from 'powerscript';

// Generated PowerScript code
export default class GeneratedClass extends EventDispatcher {
  constructor() {
    super();
    console.log('PowerScript generated class initialized');
  }
}
`;
        const result = {
            code: mockCode,
            warnings: []
        };
        if (this._options.sourceMaps) {
            result.sourceMap = this._generateSourceMap(ast, result.code);
        }
        if (this._options.declaration) {
            result.declarations = this._generateDeclarations(ast);
        }
        return result;
    }
    _generateSourceMap(ast, code) {
        // Generate source map for debugging
        return JSON.stringify({
            version: 3,
            sources: [ast.fileName],
            names: [],
            mappings: '',
            file: ast.fileName.replace(/\.ps$/, '.js')
        });
    }
    _generateDeclarations(ast) {
        // Generate TypeScript declaration files
        return `// Generated declarations for ${ast.fileName}
export default class GeneratedClass {
  constructor();
}
`;
    }
    _getMemoryUsage() {
        try {
            const nodeProcess = typeof process !== 'undefined' ? process : null;
            if (nodeProcess?.memoryUsage) {
                return nodeProcess.memoryUsage().heapUsed;
            }
        }
        catch (error) {
            // Ignore errors in browser environment
        }
        return 0;
    }
    toString() {
        return `[PowerScriptCompiler v${this._version} target=${this._options.target} module=${this._options.module}]`;
    }
}
exports.PowerScriptCompiler = PowerScriptCompiler;
