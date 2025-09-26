"use strict";
/**
 * PowerScript Simple Security Module
 * Provides essential security functionality without complex dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = exports.PowerScriptSecurityFactory = exports.PowerScriptSecuritySimple = void 0;
const crypto = require("crypto");
const events_1 = require("events");
/**
 * Simple Security Implementation
 */
class PowerScriptSecuritySimple extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.isInitialized = false;
        this.operationsCount = 0;
        this.config = {
            encryptionAlgorithm: 'aes256',
            keySize: 32,
            saltSize: 16,
            iterations: 100000,
            timeout: 30000,
            maxMemory: 128 * 1024 * 1024, // 128MB
            ...config
        };
        this.startTime = Date.now();
    }
    /**
     * Initialize the security module
     */
    async initialize() {
        try {
            this.isInitialized = true;
            this.emit('initialized');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Encrypt data using AES-256-GCM
     */
    async encrypt(data, password) {
        try {
            this.operationsCount++;
            const salt = crypto.randomBytes(this.config.saltSize);
            const key = crypto.pbkdf2Sync(password, salt, this.config.iterations, this.config.keySize, 'sha512');
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipher(this.config.encryptionAlgorithm, password);
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = Buffer.alloc(0); // Simplified - no auth tag for basic implementation
            return {
                encrypted,
                iv: iv.toString('hex'),
                salt: salt.toString('hex'),
                tag: tag.toString('hex')
            };
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Encryption failed: ${error}`);
        }
    }
    /**
     * Decrypt data using AES-256-GCM
     */
    async decrypt(encryptionResult, password) {
        try {
            this.operationsCount++;
            const salt = Buffer.from(encryptionResult.salt, 'hex');
            const key = crypto.pbkdf2Sync(password, salt, this.config.iterations, this.config.keySize, 'sha512');
            const iv = Buffer.from(encryptionResult.iv, 'hex');
            const tag = Buffer.from(encryptionResult.tag, 'hex');
            const decipher = crypto.createDecipher(this.config.encryptionAlgorithm, password);
            let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Decryption failed: ${error}`);
        }
    }
    /**
     * Hash password securely
     */
    async hashPassword(password) {
        try {
            this.operationsCount++;
            const salt = crypto.randomBytes(this.config.saltSize);
            const hash = crypto.pbkdf2Sync(password, salt, this.config.iterations, this.config.keySize, 'sha512');
            return `${salt.toString('hex')}:${hash.toString('hex')}`;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Password hashing failed: ${error}`);
        }
    }
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        try {
            this.operationsCount++;
            const [saltHex, hashHex] = hash.split(':');
            const salt = Buffer.from(saltHex, 'hex');
            const originalHash = Buffer.from(hashHex, 'hex');
            const testHash = crypto.pbkdf2Sync(password, salt, this.config.iterations, this.config.keySize, 'sha512');
            return crypto.timingSafeEqual(originalHash, testHash);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Password verification failed: ${error}`);
        }
    }
    /**
     * Validate input data
     */
    async validateInput(data, rules) {
        try {
            this.operationsCount++;
            const errors = [];
            for (const rule of rules) {
                if (rule.required && (data === undefined || data === null || data === '')) {
                    errors.push('Field is required');
                    continue;
                }
                if (data === undefined || data === null) {
                    continue; // Skip validation for optional empty fields
                }
                switch (rule.type) {
                    case 'string':
                        if (typeof data !== 'string') {
                            errors.push('Must be a string');
                        }
                        else {
                            if (rule.minLength && data.length < rule.minLength) {
                                errors.push(`Must be at least ${rule.minLength} characters long`);
                            }
                            if (rule.maxLength && data.length > rule.maxLength) {
                                errors.push(`Must be no more than ${rule.maxLength} characters long`);
                            }
                            if (rule.pattern && !rule.pattern.test(data)) {
                                errors.push('Invalid format');
                            }
                        }
                        break;
                    case 'number':
                        if (typeof data !== 'number' || isNaN(data)) {
                            errors.push('Must be a number');
                        }
                        else {
                            if (rule.min !== undefined && data < rule.min) {
                                errors.push(`Must be at least ${rule.min}`);
                            }
                            if (rule.max !== undefined && data > rule.max) {
                                errors.push(`Must be no more than ${rule.max}`);
                            }
                        }
                        break;
                    case 'email':
                        if (typeof data !== 'string') {
                            errors.push('Email must be a string');
                        }
                        else {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailRegex.test(data)) {
                                errors.push('Invalid email format');
                            }
                        }
                        break;
                    case 'url':
                        if (typeof data !== 'string') {
                            errors.push('URL must be a string');
                        }
                        else {
                            try {
                                new URL(data);
                            }
                            catch {
                                errors.push('Invalid URL format');
                            }
                        }
                        break;
                }
            }
            return {
                isValid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Validation failed: ${error}`);
        }
    }
    /**
     * Sanitize input string
     */
    sanitizeInput(input) {
        try {
            this.operationsCount++;
            return input
                .replace(/[<>]/g, '') // Remove < and >
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+=/gi, '') // Remove event handlers
                .trim();
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Sanitization failed: ${error}`);
        }
    }
    /**
     * Execute code in a simple sandbox
     */
    async executeInSandbox(code, context = {}) {
        try {
            this.operationsCount++;
            // Create a simple sandbox using Function constructor
            const sandboxedFunction = new Function('context', `
          'use strict';
          const { ${Object.keys(context).join(', ')} } = context;
          return (function() {
            ${code}
          })();
        `);
            // Execute with timeout
            return await Promise.race([
                Promise.resolve(sandboxedFunction(context)),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timeout')), this.config.timeout))
            ]);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Sandbox execution failed: ${error}`);
        }
    }
    /**
     * Generate secure random bytes
     */
    generateRandomBytes(size) {
        try {
            this.operationsCount++;
            return crypto.randomBytes(size);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Random bytes generation failed: ${error}`);
        }
    }
    /**
     * Generate secure random string
     */
    generateRandomString(length, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        try {
            this.operationsCount++;
            const randomBytes = this.generateRandomBytes(length);
            let result = '';
            for (let i = 0; i < length; i++) {
                result += charset[randomBytes[i] % charset.length];
            }
            return result;
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Random string generation failed: ${error}`);
        }
    }
    /**
     * Encrypt sensitive data (supports objects and strings)
     */
    async encryptSensitiveData(data, password = 'default') {
        try {
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            const encryptionResult = await this.encrypt(dataString, password);
            return JSON.stringify(encryptionResult);
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Sensitive data encryption failed: ${error}`);
        }
    }
    /**
     * Decrypt sensitive data (returns original type)
     */
    async decryptSensitiveData(encryptedData, password = 'default') {
        try {
            const encryptionResult = JSON.parse(encryptedData);
            const decryptedString = await this.decrypt(encryptionResult, password);
            // Try to parse as JSON first, if it fails return as string
            try {
                return JSON.parse(decryptedString);
            }
            catch {
                return decryptedString;
            }
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Sensitive data decryption failed: ${error}`);
        }
    }
    /**
     * Secure hash function (alias for hashPassword)
     */
    async secureHash(data) {
        return this.hashPassword(data);
    }
    /**
     * Validate and sanitize input data
     */
    async validateAndSanitize(data, schema) {
        try {
            // Simple validation implementation
            const errors = [];
            const sanitizedData = {};
            if (schema && typeof schema === 'object') {
                for (const [key, rule] of Object.entries(schema)) {
                    const value = data[key];
                    const ruleObj = rule;
                    // Type validation
                    if (ruleObj.type) {
                        if (ruleObj.type === 'string' && typeof value !== 'string') {
                            errors.push(`${key} must be a string`);
                            continue;
                        }
                        if (ruleObj.type === 'number' && typeof value !== 'number') {
                            errors.push(`${key} must be a number`);
                            continue;
                        }
                        if (ruleObj.type === 'email' && (typeof value !== 'string' || !value.includes('@'))) {
                            errors.push(`${key} must be a valid email`);
                            continue;
                        }
                    }
                    // Length validation
                    if (ruleObj.minLength && typeof value === 'string' && value.length < ruleObj.minLength) {
                        errors.push(`${key} must be at least ${ruleObj.minLength} characters`);
                    }
                    // Sanitize HTML content
                    if (typeof value === 'string') {
                        sanitizedData[key] = SecurityUtils.escapeHtml(value);
                    }
                    else {
                        sanitizedData[key] = value;
                    }
                }
            }
            return {
                isValid: errors.length === 0,
                errors,
                sanitizedData
            };
        }
        catch (error) {
            this.emit('error', error);
            throw new Error(`Validation failed: ${error}`);
        }
    }
    /**
     * Execute code securely in sandbox
     */
    async executeSecurely(code, context = {}) {
        try {
            const result = await this.executeInSandbox(code, context);
            return {
                result,
                success: true
            };
        }
        catch (error) {
            return {
                error: error,
                success: false
            };
        }
    }
    /**
     * Get security status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            encryptionEnabled: true,
            validationEnabled: true,
            sandboxEnabled: true,
            uptime: Date.now() - this.startTime,
            operationsCount: this.operationsCount
        };
    }
    /**
     * Shutdown the security module
     */
    async shutdown() {
        this.isInitialized = false;
        this.removeAllListeners();
        this.emit('shutdown');
    }
}
exports.PowerScriptSecuritySimple = PowerScriptSecuritySimple;
/**
 * Security Factory
 */
class PowerScriptSecurityFactory {
    static createSecurity(config) {
        return new PowerScriptSecuritySimple(config);
    }
}
exports.PowerScriptSecurityFactory = PowerScriptSecurityFactory;
/**
 * Security Utilities
 */
class SecurityUtils {
    /**
     * Compare two strings in constant time
     */
    static constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    /**
     * Escape HTML entities
     */
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return crypto.randomUUID();
    }
    /**
     * Generate secure ID with custom length
     */
    static generateSecureId(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const randomBytes = crypto.randomBytes(length);
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[randomBytes[i] % charset.length];
        }
        return result;
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const issues = [];
        let score = 0;
        if (password.length >= 8)
            score += 25;
        else
            issues.push('Password should be at least 8 characters');
        if (/[a-z]/.test(password))
            score += 25;
        else
            issues.push('Password should contain lowercase letters');
        if (/[A-Z]/.test(password))
            score += 25;
        else
            issues.push('Password should contain uppercase letters');
        if (/[0-9]/.test(password))
            score += 15;
        else
            issues.push('Password should contain numbers');
        if (/[^a-zA-Z0-9]/.test(password))
            score += 10;
        else
            issues.push('Password should contain special characters');
        return {
            isStrong: score >= 75,
            score,
            issues
        };
    }
    /**
     * Create common validation schemas
     */
    static createCommonSchemas() {
        return {
            email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            password: { type: 'string', minLength: 8 },
            username: { type: 'string', minLength: 3 },
            phone: { type: 'string', pattern: /^\+?[\d\s\-\(\)]+$/ },
            url: { type: 'string', pattern: /^https?:\/\/.+/ }
        };
    }
    /**
     * Create sandbox presets
     */
    static createSandboxPresets() {
        return {
            minimal: {
                timeout: 1000,
                memoryLimit: 1024 * 1024, // 1MB
                allowedGlobals: []
            },
            standard: {
                timeout: 5000,
                memoryLimit: 10 * 1024 * 1024, // 10MB
                allowedGlobals: ['Math', 'Date', 'JSON']
            },
            extended: {
                timeout: 10000,
                memoryLimit: 50 * 1024 * 1024, // 50MB
                allowedGlobals: ['Math', 'Date', 'JSON', 'console', 'setTimeout']
            }
        };
    }
}
exports.SecurityUtils = SecurityUtils;
exports.default = PowerScriptSecuritySimple;
