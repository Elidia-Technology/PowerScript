/**
 * PowerScript Security Core
 * Main security coordination system with comprehensive security capabilities
 */

import { EventDispatcher, Event } from '../core/EventDispatcher';
import { Logger } from '../core/Logger';
import { ErrorManager } from '../core/ErrorManager';
import {
    SecurityConfig,
    CryptoProvider,
    AuthProvider,
    AuthzProvider,
    SecurityEvent,
    SecurityEventType,
    SecuritySeverity,
    SecurityCategory,
    AuthenticationResult,
    AuthenticationRequest,
    AuthorizationRequest,
    AuthorizationResult,
    User,
    Subject,
    Resource,
    Action,
    Environment,
    EncryptionResult,
    DecryptionOptions,
    KeyPair,
    SignatureResult,
    HashResult,
    SecurityError,
    AuthenticationError,
    AuthorizationError,
    EncryptionError,
    KeyManagementError
} from './types';

export class PowerScriptSecurity extends EventDispatcher {
    private static instance: PowerScriptSecurity;
    private cryptoProviders: Map<string, CryptoProvider> = new Map();
    private authProviders: Map<string, AuthProvider> = new Map();
    private authzProviders: Map<string, AuthzProvider> = new Map();
    private config: SecurityConfig;
    private logger: Logger;
    private errorManager: ErrorManager;
    private auditLog: SecurityEvent[] = [];
    private keyStore: Map<string, Buffer> = new Map();
    private sessionStore: Map<string, any> = new Map();

    private constructor(config: SecurityConfig) {
        super();
        this.config = config;
        this.logger = new Logger();
        this.errorManager = new ErrorManager(this.logger);
        this.initialize();
    }

    public static getInstance(config?: SecurityConfig): PowerScriptSecurity {
        if (!PowerScriptSecurity.instance) {
            if (!config) {
                throw new Error('Security configuration required for first initialization');
            }
            PowerScriptSecurity.instance = new PowerScriptSecurity(config);
        }
        return PowerScriptSecurity.instance;
    }

    private async initialize(): Promise<void> {
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
            this.auditEvent(SecurityEventType.SECURITY_VIOLATION, SecuritySeverity.LOW, 'Security system initialized');
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SECURITY_INIT_ERROR');
            throw error;
        }
    }

    private async initializeProviders(): Promise<void> {
        try {
            // Initialize built-in crypto provider
            const { NodeCryptoProvider } = await import('./encryption/NodeCryptoProvider');
            const cryptoProvider = new NodeCryptoProvider(this.config.encryption);
            this.cryptoProviders.set('node', cryptoProvider);
            this.logger.info('Node.js crypto provider initialized');

            // Initialize JWT auth provider
            const { JWTProvider } = await import('./authentication/JWTProvider');
            const jwtProvider = new JWTProvider(this.config.authentication);
            this.authProviders.set('jwt', jwtProvider);
            this.logger.info('JWT authentication provider initialized');

            // Initialize RBAC authorization provider
            const { RBACProvider } = await import('./authorization/RBACProvider');
            const rbacProvider = new RBACProvider(this.config.authorization);
            this.authzProviders.set('rbac', rbacProvider);
            this.logger.info('RBAC authorization provider initialized');

        } catch (error) {
            this.logger.warn('Some security providers failed to initialize:', error);
        }
    }

    private setupAuditLogging(): void {
        const { retention, realtime } = this.config.audit;
        
        // Setup log retention cleanup
        setInterval(() => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retention);
            
            this.auditLog = this.auditLog.filter(event => event.timestamp > cutoffDate);
        }, 24 * 60 * 60 * 1000); // Run daily

        if (realtime) {
            this.addEventListener('security-event', (event: any) => {
                this.logger.info('Security Event:', event.data);
            });
        }
    }

    private setupKeyRotation(): void {
        const { rotationInterval } = this.config.keyManagement;
        
        setInterval(async () => {
            try {
                await this.rotateKeys();
            } catch (error) {
                this.logger.error('Key rotation failed:', error);
            }
        }, rotationInterval * 60 * 60 * 1000); // Convert hours to milliseconds
    }

    // Encryption Operations
    public async encrypt(data: Buffer | string, keyId?: string, algorithm?: string): Promise<EncryptionResult> {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            
            // Get or generate key
            const key = keyId ? this.getKey(keyId) : await this.generateKey();
            
            const result = await provider.encrypt(dataBuffer, key, algorithm || this.config.encryption.defaultAlgorithm);
            result.keyId = keyId;

            this.auditEvent(SecurityEventType.ENCRYPTION_PERFORMED, SecuritySeverity.LOW, 'Data encrypted', {
                algorithm: result.algorithm,
                keyId,
                dataSize: dataBuffer.length
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'ENCRYPTION_ERROR');
            throw new EncryptionError(`Encryption failed: ${err.message}`);
        }
    }

    public async decrypt(encryptedData: Buffer, options: DecryptionOptions): Promise<Buffer> {
        try {
            const provider = this.getCryptoProvider('node');
            
            // Get key
            const key = options.keyId ? this.getKey(options.keyId) : this.getDefaultKey();
            
            const result = await provider.decrypt(encryptedData, key, options);

            this.auditEvent(SecurityEventType.DECRYPTION_PERFORMED, SecuritySeverity.LOW, 'Data decrypted', {
                algorithm: options.algorithm,
                keyId: options.keyId,
                dataSize: encryptedData.length
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'DECRYPTION_ERROR');
            throw new EncryptionError(`Decryption failed: ${err.message}`);
        }
    }

    public async generateKeyPair(algorithm: string = 'RSA', keySize: number = 2048): Promise<KeyPair> {
        try {
            const provider = this.getCryptoProvider('node');
            const keyPair = await provider.generateKeyPair(algorithm, keySize);
            
            this.auditEvent(SecurityEventType.KEY_GENERATED, SecuritySeverity.MEDIUM, 'Key pair generated', {
                algorithm,
                keySize
            });

            return keyPair;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_GENERATION_ERROR');
            throw new KeyManagementError(`Key generation failed: ${err.message}`);
        }
    }

    public async sign(data: Buffer | string, privateKey: string, algorithm?: string): Promise<SignatureResult> {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            
            const result = await provider.sign(dataBuffer, privateKey, algorithm);

            this.auditEvent(SecurityEventType.SIGNATURE_CREATED, SecuritySeverity.LOW, 'Digital signature created', {
                algorithm: result.algorithm,
                dataSize: dataBuffer.length
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SIGNING_ERROR');
            throw new EncryptionError(`Signing failed: ${err.message}`);
        }
    }

    public async verify(data: Buffer | string, signature: Buffer, publicKey: string, algorithm?: string): Promise<boolean> {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            
            const isValid = await provider.verify(dataBuffer, signature, publicKey, algorithm);

            this.auditEvent(SecurityEventType.SIGNATURE_VERIFIED, SecuritySeverity.LOW, 'Digital signature verified', {
                algorithm,
                valid: isValid,
                dataSize: dataBuffer.length
            });

            return isValid;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'VERIFICATION_ERROR');
            throw new EncryptionError(`Verification failed: ${err.message}`);
        }
    }

    // Authentication Operations
    public async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
        try {
            const provider = this.getAuthProvider('jwt');
            const result = await provider.authenticate(request);

            const eventType = result.success ? SecurityEventType.AUTHENTICATION_SUCCESS : SecurityEventType.AUTHENTICATION_FAILURE;
            const severity = result.success ? SecuritySeverity.LOW : SecuritySeverity.HIGH;

            this.auditEvent(eventType, severity, `Authentication ${result.success ? 'successful' : 'failed'}`, {
                username: request.username,
                mfaRequired: result.mfaRequired,
                error: result.error
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'AUTHENTICATION_ERROR');
            this.auditEvent(SecurityEventType.AUTHENTICATION_FAILURE, SecuritySeverity.HIGH, 'Authentication error', {
                username: request.username,
                error: err.message
            });
            throw new AuthenticationError(`Authentication failed: ${err.message}`);
        }
    }

    public async validateToken(token: string): Promise<User | null> {
        try {
            const provider = this.getAuthProvider('jwt');
            const user = await provider.validateToken(token);
            return user;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'TOKEN_VALIDATION_ERROR');
            return null;
        }
    }

    public async authorize(request: AuthorizationRequest): Promise<AuthorizationResult> {
        try {
            const provider = this.getAuthzProvider('rbac');
            const result = await provider.authorize(request);

            const eventType = result.decision === 'permit' ? SecurityEventType.AUTHORIZATION_GRANTED : SecurityEventType.AUTHORIZATION_DENIED;
            const severity = result.decision === 'permit' ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM;

            this.auditEvent(eventType, severity, `Authorization ${result.decision}`, {
                subjectId: request.subject.id,
                resourceId: request.resource.id,
                actionId: request.action.id,
                decision: result.decision,
                reason: result.reason
            });

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'AUTHORIZATION_ERROR');
            throw new AuthorizationError(`Authorization failed: ${err.message}`);
        }
    }

    // Hash Operations
    public async hash(data: Buffer | string, algorithm: string = 'SHA-256', salt?: Buffer): Promise<HashResult> {
        try {
            const provider = this.getCryptoProvider('node');
            const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
            
            return await provider.hash(dataBuffer, algorithm, salt);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'HASHING_ERROR');
            throw new EncryptionError(`Hashing failed: ${err.message}`);
        }
    }

    public async hashPassword(password: string): Promise<string> {
        try {
            const provider = this.getAuthProvider('jwt');
            return await provider.hashPassword(password);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'PASSWORD_HASHING_ERROR');
            throw new AuthenticationError(`Password hashing failed: ${err.message}`);
        }
    }

    public async verifyPassword(password: string, hash: string): Promise<boolean> {
        try {
            const provider = this.getAuthProvider('jwt');
            return await provider.verifyPassword(password, hash);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'PASSWORD_VERIFICATION_ERROR');
            return false;
        }
    }

    // Multi-Factor Authentication
    public async generateMFASecret(user: User): Promise<string> {
        try {
            const provider = this.getAuthProvider('jwt');
            const secret = await provider.generateMFASecret(user);
            
            this.auditEvent(SecurityEventType.MFA_SECRET_GENERATED, SecuritySeverity.MEDIUM, 'MFA secret generated', {
                userId: user.id,
                username: user.username
            });
            
            return secret;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'MFA_SECRET_GENERATION_ERROR');
            throw new AuthenticationError(`MFA secret generation failed: ${err.message}`);
        }
    }

    public async verifyMFACode(user: User, code: string, secret: string): Promise<boolean> {
        try {
            const provider = this.getAuthProvider('jwt');
            const isValid = await provider.verifyMFACode(user, code, secret);
            
            this.auditEvent(SecurityEventType.MFA_VERIFICATION_PERFORMED, SecuritySeverity.MEDIUM, 'MFA code verified', {
                userId: user.id,
                username: user.username,
                success: isValid
            });
            
            return isValid;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'MFA_VERIFICATION_ERROR');
            return false;
        }
    }

    // Key Management
    public async generateKey(keyId?: string): Promise<Buffer> {
        try {
            const provider = this.getCryptoProvider('node');
            const key = provider.randomBytes(32); // 256-bit key
            
            if (keyId) {
                this.keyStore.set(keyId, key);
            }

            this.auditEvent(SecurityEventType.KEY_GENERATED, SecuritySeverity.MEDIUM, 'Encryption key generated', {
                keyId,
                keySize: key.length * 8
            });

            return key;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_GENERATION_ERROR');
            throw new KeyManagementError(`Key generation failed: ${err.message}`);
        }
    }

    public getKey(keyId: string): Buffer {
        const key = this.keyStore.get(keyId);
        if (!key) {
            throw new KeyManagementError(`Key not found: ${keyId}`);
        }
        return key;
    }

    public getDefaultKey(): Buffer {
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

    private async rotateKeys(): Promise<void> {
        try {
            // Generate new keys for all existing key IDs
            const keyIds = Array.from(this.keyStore.keys());
            
            for (const keyId of keyIds) {
                const newKey = await this.generateKey();
                this.keyStore.set(keyId, newKey);
                
                this.auditEvent(SecurityEventType.KEY_ROTATED, SecuritySeverity.MEDIUM, 'Key rotated', {
                    keyId
                });
            }

            this.logger.info(`Rotated ${keyIds.length} keys`);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'KEY_ROTATION_ERROR');
            throw new KeyManagementError(`Key rotation failed: ${err.message}`);
        }
    }

    // Provider Management
    public registerCryptoProvider(name: string, provider: CryptoProvider): void {
        this.cryptoProviders.set(name, provider);
        this.logger.info(`Crypto provider '${name}' registered`);
    }

    public registerAuthProvider(name: string, provider: AuthProvider): void {
        this.authProviders.set(name, provider);
        this.logger.info(`Auth provider '${name}' registered`);
    }

    public registerAuthzProvider(name: string, provider: AuthzProvider): void {
        this.authzProviders.set(name, provider);
        this.logger.info(`Authorization provider '${name}' registered`);
    }

    private getCryptoProvider(name: string): CryptoProvider {
        const provider = this.cryptoProviders.get(name);
        if (!provider) {
            throw new SecurityError(`Crypto provider '${name}' not found`, 'PROVIDER_NOT_FOUND', SecurityCategory.ENCRYPTION);
        }
        return provider;
    }

    private getAuthProvider(name: string): AuthProvider {
        const provider = this.authProviders.get(name);
        if (!provider) {
            throw new SecurityError(`Auth provider '${name}' not found`, 'PROVIDER_NOT_FOUND', SecurityCategory.AUTHENTICATION);
        }
        return provider;
    }

    private getAuthzProvider(name: string): AuthzProvider {
        const provider = this.authzProviders.get(name);
        if (!provider) {
            throw new SecurityError(`Authorization provider '${name}' not found`, 'PROVIDER_NOT_FOUND', SecurityCategory.AUTHORIZATION);
        }
        return provider;
    }

    // Audit and Monitoring
    public async logSecurityEvent(eventType: string, message: string, severity: SecuritySeverity = SecuritySeverity.LOW, metadata: Record<string, any> = {}): Promise<void> {
        try {
            // Map string eventType to SecurityEventType enum
            const mappedType = eventType as SecurityEventType || SecurityEventType.SECURITY_VIOLATION;
            this.auditEvent(mappedType, severity, message, metadata);
        } catch (error) {
            this.logger.error('Failed to log security event:', error);
        }
    }

    private auditEvent(type: SecurityEventType, severity: SecuritySeverity, message: string, metadata: Record<string, any> = {}): void {
        const event: SecurityEvent = {
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
        const dispatchEvent = new Event('security-event');
        (dispatchEvent as any).data = event;
        this.dispatchEvent(dispatchEvent);

        // Log based on severity
        switch (severity) {
            case SecuritySeverity.CRITICAL:
                this.logger.error(`[SECURITY] ${message}`, metadata);
                break;
            case SecuritySeverity.HIGH:
                this.logger.warn(`[SECURITY] ${message}`, metadata);
                break;
            default:
                this.logger.info(`[SECURITY] ${message}`, metadata);
        }
    }

    private getEventCategory(type: SecurityEventType): SecurityCategory {
        if (type.startsWith('auth.')) return SecurityCategory.AUTHENTICATION;
        if (type.startsWith('authz.')) return SecurityCategory.AUTHORIZATION;
        if (type.includes('encryption') || type.includes('signature')) return SecurityCategory.ENCRYPTION;
        if (type.includes('key')) return SecurityCategory.KEY_MANAGEMENT;
        if (type.includes('session')) return SecurityCategory.SESSION;
        return SecurityCategory.AUDIT;
    }

    private generateEventId(): string {
        return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public getAuditLog(limit?: number): SecurityEvent[] {
        return limit ? this.auditLog.slice(-limit) : [...this.auditLog];
    }

    public getSecurityMetrics(): Record<string, any> {
        const total = this.auditLog.length;
        const byType = this.auditLog.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const bySeverity = this.auditLog.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

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
    public generateRandomString(length: number = 32, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
        try {
            const provider = this.getCryptoProvider('node');
            return provider.randomString(length, charset);
        } catch (error) {
            // Fallback to basic random string generation
            let result = '';
            for (let i = 0; i < length; i++) {
                result += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return result;
        }
    }

    public async cleanup(): Promise<void> {
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
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.errorManager.handleError(err, 'SECURITY_CLEANUP_ERROR');
            throw error;
        }
    }
}

// Export for external use
export * from './types';