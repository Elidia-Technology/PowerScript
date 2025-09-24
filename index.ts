/**
 * PowerScript - Main Entry Point
 * Advanced ActionScript-inspired development platform for Node.js
 */

// AI & Machine Learning
export { PowerScriptML } from './src/ml/PowerScriptML';
import { PowerScriptML } from './src/ml/PowerScriptML';

// Security & Cryptography
export { PowerScriptSecurity } from './src/security/PowerScriptSecurity';
export { NodeCryptoProvider } from './src/security/encryption/NodeCryptoProvider';
export { JWTProvider } from './src/security/authentication/JWTProvider';
export { RBACProvider } from './src/security/authorization/RBACProvider';
import { PowerScriptSecurity } from './src/security/PowerScriptSecurity';

// Type Definitions
export * from './src/ml/types';
export * from './src/security/types';

// Version Information
export const VERSION = '1.0.0-alpha';
export const BUILD_DATE = new Date().toISOString();

/**
 * Main PowerScript class combining all modules
 */
export class PowerScript {
    public readonly version = VERSION;
    public readonly buildDate = BUILD_DATE;
    
    // Module instances
    public ml: PowerScriptML;
    public security: PowerScriptSecurity;
    
    constructor(config?: any) {
        // Initialize ML module with default config
        const mlConfig = config?.ml || {
            caching: { enabled: true, maxSize: 1000, ttl: 300000 },
            events: { enabled: true },
            metrics: { enabled: true, detailed: true }
        };
        this.ml = PowerScriptML.getInstance(mlConfig);
        
        // Initialize Security module with default config
        const securityConfig = config?.security || {
            encryption: { algorithm: 'AES-256-GCM', keyLength: 256, saltLength: 32 },
            authentication: {
                jwt: { algorithm: 'HS256', expiresIn: '1h', refreshExpiresIn: '7d', issuer: 'PowerScript', audience: 'PowerScript-App', clockTolerance: 30 },
                oauth2: { providers: [], defaultProvider: 'jwt', scopes: ['read', 'write'], redirectUri: 'http://localhost:3000/callback' },
                mfa: { issuer: 'PowerScript', window: 1, secretLength: 32 },
                session: { maxAge: 86400000, secure: false, httpOnly: true, sameSite: 'lax' },
                password: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialChars: true, saltRounds: 12 }
            },
            authorization: {
                rbac: { strictMode: true, enableInheritance: true },
                abac: { enablePolicyEvaluation: true, defaultDecision: 'deny' },
                defaultPermissions: ['read:public'],
                superAdminRoles: ['admin']
            },
            keyManagement: {
                keyRotation: true,
                rotationInterval: 86400000,
                keyDerivation: { algorithm: 'PBKDF2', iterations: 100000, keyLength: 32 }
            },
            audit: { enabled: true, logLevel: 'info', includeSensitive: false, retentionDays: 90 }
        };
        this.security = PowerScriptSecurity.getInstance(securityConfig);
    }
    
    /**
     * Initialize PowerScript with all modules
     */
    public async initialize(): Promise<void> {
        console.log(`Initializing PowerScript v${this.version}...`);
        
        // ML module is ready (providers registered as needed)
        console.log('✅ ML module ready');
        
        // Security module is ready (providers registered as needed)
        console.log('✅ Security module ready');
        
        console.log('🚀 PowerScript initialized successfully!');
    }
    
    /**
     * Get system information
     */
    public getSystemInfo(): any {
        return {
            version: this.version,
            buildDate: this.buildDate,
            modules: {
                ml: { status: 'active', version: '1.0.0', providers: 'loaded' },
                security: { status: 'active', version: '1.0.0', providers: 'crypto+auth+authz' }
            },
            nodejs: process.version,
            platform: process.platform
        };
    }
}