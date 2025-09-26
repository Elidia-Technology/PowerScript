"use strict";
/**
 * PowerScript Security Core
 * Main security coordination system with comprehensive security capabilities
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
exports.PowerScriptSecurity = void 0;
const EventDispatcher_1 = require("../core/EventDispatcher");
const Logger_1 = require("../core/Logger");
const ErrorManager_1 = require("../core/ErrorManager");
const types_1 = require("./types");
class PowerScriptSecurity extends EventDispatcher_1.EventDispatcher {
    constructor(config) {
        super();
        this.cryptoProviders = new Map();
        this.authProviders = new Map();
        this.authzProviders = new Map();
        this.auditLog = [];
        this.keyStore = new Map();
        this.sessionStore = new Map();
        this.config = config;
        this.logger = new Logger_1.Logger();
        this.errorManager = new ErrorManager_1.ErrorManager(this.logger);
        this.initialize();
    }
    static initialize(config) {
        if (!PowerScriptSecurity.instance) {
            PowerScriptSecurity.instance = new PowerScriptSecurity(config);
        }
    }
    static getInstance(config) {
        if (!PowerScriptSecurity.instance) {
            if (!config) {
                throw new Error('Security configuration required for first initialization');
            }
            PowerScriptSecurity.instance = new PowerScriptSecurity(config);
        }
        return PowerScriptSecurity.instance;
    }
    async initialize() {
        try {
            this.logger.info('Initializing PowerScript Security system');
            // Initialize default providers
            await this.initializeProviders();
            // Setup audit logging
            if (this.config.audit.enabled) {
                this.setupAuditLogging();
            }
            // Setup key rotation if enabled
            if (this.config.keyManagement.keyRotation) {
                this.setupKeyRotation();
            }
            this.logger.info('PowerScript Security system initialized successfully');
            this.auditEvent(types_1.SecurityEventType.SECURITY_VIOLATION, types_1.SecuritySeverity.LOW, 'Security system initialized');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SECURITY_INIT_ERROR');
            throw error;
        }
    }
    async initializeProviders() {
        try {
            // Initialize built-in crypto provider
            const { NodeCryptoProvider } = await Promise.resolve().then(() => require('./encryption/NodeCryptoProvider'));
            const cryptoProvider = new NodeCryptoProvider(this.config.encryption);
            this.cryptoProviders.set('node', cryptoProvider);
            this.logger.info('Node.js crypto provider initialized');
            // Initialize JWT auth provider
            const { JWTProvider } = await Promise.resolve().then(() => require('./authentication/JWTProvider'));
            const jwtProvider = new JWTProvider(this.config.authentication);
            this.authProviders.set('jwt', jwtProvider);
            this.logger.info('JWT authentication provider initialized');
            // Initialize RBAC authorization provider
            const { RBACProvider } = await Promise.resolve().then(() => require('./authorization/RBACProvider'));
            const rbacProvider = new RBACProvider(this.config.authorization);
            this.authzProviders.set('rbac', rbacProvider);
            this.logger.info('RBAC authorization provider initialized');
        }
        catch (error) {
            this.logger.warn('Some security providers failed to initialize:', error);
        }
    }
    setupAuditLogging() {
        const { retention, realtime } = this.config.audit;
        // Setup log retention cleanup
        setInterval(() => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retention);
            this.auditLog = this.auditLog.filter(event => event.timestamp > cutoffDate);
        }, 24 * 60 * 60 * 1000); // Run daily
        if (realtime) {
            this.addEventListener('security-event', (event) => {
                this.logger.info('Security Event:', event.data);
            });
        }
    }
    setupKeyRotation() {
        const { rotationInterval } = this.config.keyManagement;
        setInterval(async () => {
            try {
                await this.rotateKeys();
            }
            catch (error) {
                this.logger.error('Key rotation failed:', error);
            }
        }, rotationInterval * 60 * 60 * 1000); // Convert hours to milliseconds
    }
    // Encryption Operations
    async encrypt(data, keyId, algorithm) {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            // Get or generate key
            const key = keyId ? this.getKey(keyId) : await this.generateKey();
            const result = await provider.encrypt(dataBuffer, key, algorithm || this.config.encryption.defaultAlgorithm);
            result.keyId = keyId;
            this.auditEvent(types_1.SecurityEventType.ENCRYPTION_PERFORMED, types_1.SecuritySeverity.LOW, 'Data encrypted', {
                algorithm: result.algorithm,
                keyId,
                dataSize: dataBuffer.length
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ENCRYPTION_ERROR');
            throw new types_1.EncryptionError(`Encryption failed: ${err.message}`);
        }
    }
    async decrypt(encryptedData, options) {
        try {
            const provider = this.getCryptoProvider('node');
            // Get key
            const key = options.keyId ? this.getKey(options.keyId) : this.getDefaultKey();
            const result = await provider.decrypt(encryptedData, key, options);
            this.auditEvent(types_1.SecurityEventType.DECRYPTION_PERFORMED, types_1.SecuritySeverity.LOW, 'Data decrypted', {
                algorithm: options.algorithm,
                keyId: options.keyId,
                dataSize: encryptedData.length
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'DECRYPTION_ERROR');
            throw new types_1.EncryptionError(`Decryption failed: ${err.message}`);
        }
    }
    async generateKeyPair(algorithm = 'RSA', keySize = 2048) {
        try {
            const provider = this.getCryptoProvider('node');
            const keyPair = await provider.generateKeyPair(algorithm, keySize);
            this.auditEvent(types_1.SecurityEventType.KEY_GENERATED, types_1.SecuritySeverity.MEDIUM, 'Key pair generated', {
                algorithm,
                keySize
            });
            return keyPair;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_GENERATION_ERROR');
            throw new types_1.KeyManagementError(`Key generation failed: ${err.message}`);
        }
    }
    async sign(data, privateKey, algorithm) {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            const result = await provider.sign(dataBuffer, privateKey, algorithm);
            this.auditEvent(types_1.SecurityEventType.SIGNATURE_CREATED, types_1.SecuritySeverity.LOW, 'Digital signature created', {
                algorithm: result.algorithm,
                dataSize: dataBuffer.length
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SIGNING_ERROR');
            throw new types_1.EncryptionError(`Signing failed: ${err.message}`);
        }
    }
    async verify(data, signature, publicKey, algorithm) {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            const isValid = await provider.verify(dataBuffer, signature, publicKey, algorithm);
            this.auditEvent(types_1.SecurityEventType.SIGNATURE_VERIFIED, types_1.SecuritySeverity.LOW, 'Digital signature verified', {
                algorithm,
                valid: isValid,
                dataSize: dataBuffer.length
            });
            return isValid;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'VERIFICATION_ERROR');
            throw new types_1.EncryptionError(`Verification failed: ${err.message}`);
        }
    }
    // Authentication Operations
    async authenticate(request) {
        try {
            const provider = this.getAuthProvider('jwt');
            const result = await provider.authenticate(request);
            const eventType = result.success ? types_1.SecurityEventType.AUTHENTICATION_SUCCESS : types_1.SecurityEventType.AUTHENTICATION_FAILURE;
            const severity = result.success ? types_1.SecuritySeverity.LOW : types_1.SecuritySeverity.HIGH;
            this.auditEvent(eventType, severity, `Authentication ${result.success ? 'successful' : 'failed'}`, {
                username: request.username,
                mfaRequired: result.mfaRequired,
                error: result.error
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'AUTHENTICATION_ERROR');
            this.auditEvent(types_1.SecurityEventType.AUTHENTICATION_FAILURE, types_1.SecuritySeverity.HIGH, 'Authentication error', {
                username: request.username,
                error: err.message
            });
            throw new types_1.AuthenticationError(`Authentication failed: ${err.message}`);
        }
    }
    async validateToken(token) {
        try {
            const provider = this.getAuthProvider('jwt');
            const user = await provider.validateToken(token);
            return user;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'TOKEN_VALIDATION_ERROR');
            return null;
        }
    }
    async authorize(request) {
        try {
            const provider = this.getAuthzProvider('rbac');
            const result = await provider.authorize(request);
            const eventType = result.decision === 'permit' ? types_1.SecurityEventType.AUTHORIZATION_GRANTED : types_1.SecurityEventType.AUTHORIZATION_DENIED;
            const severity = result.decision === 'permit' ? types_1.SecuritySeverity.LOW : types_1.SecuritySeverity.MEDIUM;
            this.auditEvent(eventType, severity, `Authorization ${result.decision}`, {
                subjectId: request.subject.id,
                resourceId: request.resource.id,
                actionId: request.action.id,
                decision: result.decision,
                reason: result.reason
            });
            return result;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'AUTHORIZATION_ERROR');
            throw new types_1.AuthorizationError(`Authorization failed: ${err.message}`);
        }
    }
    // Hash Operations
    async hash(data, algorithm = 'SHA-256', salt) {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            return await provider.hash(dataBuffer, algorithm, salt);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'HASHING_ERROR');
            throw new types_1.EncryptionError(`Hashing failed: ${err.message}`);
        }
    }
    async hashPassword(password) {
        try {
            const provider = this.getAuthProvider('jwt');
            return await provider.hashPassword(password);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'PASSWORD_HASHING_ERROR');
            throw new types_1.AuthenticationError(`Password hashing failed: ${err.message}`);
        }
    }
    async verifyPassword(password, hash) {
        try {
            const provider = this.getAuthProvider('jwt');
            return await provider.verifyPassword(password, hash);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'PASSWORD_VERIFICATION_ERROR');
            return false;
        }
    }
    // Multi-Factor Authentication
    async generateMFASecret(user) {
        try {
            const provider = this.getAuthProvider('jwt');
            const secret = await provider.generateMFASecret(user);
            this.auditEvent(types_1.SecurityEventType.MFA_SECRET_GENERATED, types_1.SecuritySeverity.MEDIUM, 'MFA secret generated', {
                userId: user.id,
                username: user.username
            });
            return secret;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'MFA_SECRET_GENERATION_ERROR');
            throw new types_1.AuthenticationError(`MFA secret generation failed: ${err.message}`);
        }
    }
    async verifyMFACode(user, code, secret) {
        try {
            const provider = this.getAuthProvider('jwt');
            const isValid = await provider.verifyMFACode(user, code, secret);
            this.auditEvent(types_1.SecurityEventType.MFA_VERIFICATION_PERFORMED, types_1.SecuritySeverity.MEDIUM, 'MFA code verified', {
                userId: user.id,
                username: user.username,
                success: isValid
            });
            return isValid;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'MFA_VERIFICATION_ERROR');
            return false;
        }
    }
    // Key Management
    async generateKey(keyId) {
        try {
            const provider = this.getCryptoProvider('node');
            const key = provider.randomBytes(32); // 256-bit key
            if (keyId) {
                this.keyStore.set(keyId, key);
            }
            this.auditEvent(types_1.SecurityEventType.KEY_GENERATED, types_1.SecuritySeverity.MEDIUM, 'Encryption key generated', {
                keyId,
                keySize: key.length * 8
            });
            return key;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_GENERATION_ERROR');
            throw new types_1.KeyManagementError(`Key generation failed: ${err.message}`);
        }
    }
    getKey(keyId) {
        const key = this.keyStore.get(keyId);
        if (!key) {
            throw new types_1.KeyManagementError(`Key not found: ${keyId}`);
        }
        return key;
    }
    getDefaultKey() {
        // Return the first available key or generate a new one
        const keys = Array.from(this.keyStore.values());
        if (keys.length > 0) {
            return keys[0];
        }
        // Generate a default key if none exist
        const defaultKey = this.getCryptoProvider('node').randomBytes(32);
        this.keyStore.set('default', defaultKey);
        return defaultKey;
    }
    async rotateKeys() {
        try {
            // Generate new keys for all existing key IDs
            const keyIds = Array.from(this.keyStore.keys());
            for (const keyId of keyIds) {
                const newKey = await this.generateKey();
                this.keyStore.set(keyId, newKey);
                this.auditEvent(types_1.SecurityEventType.KEY_ROTATED, types_1.SecuritySeverity.MEDIUM, 'Key rotated', {
                    keyId
                });
            }
            this.logger.info(`Rotated ${keyIds.length} keys`);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_ROTATION_ERROR');
            throw new types_1.KeyManagementError(`Key rotation failed: ${err.message}`);
        }
    }
    // Provider Management
    registerCryptoProvider(name, provider) {
        this.cryptoProviders.set(name, provider);
        this.logger.info(`Crypto provider '${name}' registered`);
    }
    registerAuthProvider(name, provider) {
        this.authProviders.set(name, provider);
        this.logger.info(`Auth provider '${name}' registered`);
    }
    registerAuthzProvider(name, provider) {
        this.authzProviders.set(name, provider);
        this.logger.info(`Authorization provider '${name}' registered`);
    }
    getCryptoProvider(name) {
        const provider = this.cryptoProviders.get(name);
        if (!provider) {
            throw new types_1.SecurityError(`Crypto provider '${name}' not found`, 'PROVIDER_NOT_FOUND', types_1.SecurityCategory.ENCRYPTION);
        }
        return provider;
    }
    getAuthProvider(name) {
        const provider = this.authProviders.get(name);
        if (!provider) {
            throw new types_1.SecurityError(`Auth provider '${name}' not found`, 'PROVIDER_NOT_FOUND', types_1.SecurityCategory.AUTHENTICATION);
        }
        return provider;
    }
    getAuthzProvider(name) {
        const provider = this.authzProviders.get(name);
        if (!provider) {
            throw new types_1.SecurityError(`Authorization provider '${name}' not found`, 'PROVIDER_NOT_FOUND', types_1.SecurityCategory.AUTHORIZATION);
        }
        return provider;
    }
    // Audit and Monitoring
    async logSecurityEvent(eventType, message, severity = types_1.SecuritySeverity.LOW, metadata = {}) {
        try {
            // Map string eventType to SecurityEventType enum
            const mappedType = eventType || types_1.SecurityEventType.SECURITY_VIOLATION;
            this.auditEvent(mappedType, severity, message, metadata);
        }
        catch (error) {
            this.logger.error('Failed to log security event:', error);
        }
    }
    auditEvent(type, severity, message, metadata = {}) {
        const event = {
            id: this.generateEventId(),
            type,
            timestamp: new Date(),
            severity,
            category: this.getEventCategory(type),
            result: 'success', // Default, can be overridden
            message,
            metadata
        };
        this.auditLog.push(event);
        // Dispatch event for real-time monitoring
        const dispatchEvent = new EventDispatcher_1.Event('security-event');
        dispatchEvent.data = event;
        this.dispatchEvent(dispatchEvent);
        // Log based on severity
        switch (severity) {
            case types_1.SecuritySeverity.CRITICAL:
                this.logger.error(`[SECURITY] ${message}`, metadata);
                break;
            case types_1.SecuritySeverity.HIGH:
                this.logger.warn(`[SECURITY] ${message}`, metadata);
                break;
            default:
                this.logger.info(`[SECURITY] ${message}`, metadata);
        }
    }
    getEventCategory(type) {
        if (type.startsWith('auth.'))
            return types_1.SecurityCategory.AUTHENTICATION;
        if (type.startsWith('authz.'))
            return types_1.SecurityCategory.AUTHORIZATION;
        if (type.includes('encryption') || type.includes('signature'))
            return types_1.SecurityCategory.ENCRYPTION;
        if (type.includes('key'))
            return types_1.SecurityCategory.KEY_MANAGEMENT;
        if (type.includes('session'))
            return types_1.SecurityCategory.SESSION;
        return types_1.SecurityCategory.AUDIT;
    }
    generateEventId() {
        return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getAuditLog(limit) {
        return limit ? this.auditLog.slice(-limit) : [...this.auditLog];
    }
    getSecurityMetrics() {
        const total = this.auditLog.length;
        const byType = this.auditLog.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {});
        const bySeverity = this.auditLog.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {});
        return {
            totalEvents: total,
            eventsByType: byType,
            eventsBySeverity: bySeverity,
            keysManaged: this.keyStore.size,
            providersRegistered: {
                crypto: this.cryptoProviders.size,
                auth: this.authProviders.size,
                authz: this.authzProviders.size
            }
        };
    }
    // Utility Methods
    generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        try {
            const provider = this.getCryptoProvider('node');
            return provider.randomString(length, charset);
        }
        catch (error) {
            // Fallback to basic random string generation
            let result = '';
            for (let i = 0; i < length; i++) {
                result += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return result;
        }
    }
    async cleanup() {
        try {
            this.logger.info('Cleaning up Security system');
            // Clear sensitive data
            this.keyStore.clear();
            this.sessionStore.clear();
            // Keep audit log based on retention policy
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - this.config.audit.retention);
            this.auditLog = this.auditLog.filter(event => event.timestamp > retentionDate);
            this.logger.info('Security system cleanup completed');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SECURITY_CLEANUP_ERROR');
            throw error;
        }
    }
}
exports.PowerScriptSecurity = PowerScriptSecurity;
// Export for external use
__exportStar(require("./types"), exports);
