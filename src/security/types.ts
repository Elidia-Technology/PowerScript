/**
 * PowerScript Security Types
 * Comprehensive type definitions for security and cryptography
 */

export interface SecurityConfig {
    encryption: EncryptionConfig;
    authentication: AuthenticationConfig;
    authorization: AuthorizationConfig;
    keyManagement: KeyManagementConfig;
    audit: AuditConfig;
}

export interface EncryptionConfig {
    defaultAlgorithm: 'AES-256-GCM' | 'AES-192-GCM' | 'AES-128-GCM';
    keyDerivation: 'PBKDF2' | 'scrypt' | 'argon2';
    iterations: number;
    saltLength: number;
    tagLength: number;
    rsaKeySize: 2048 | 3072 | 4096;
    eccCurve: 'P-256' | 'P-384' | 'P-521';
}

export interface AuthenticationConfig {
    jwt: JWTConfig;
    oauth2: OAuth2Config;
    mfa: MFAConfig;
    session: SessionConfig;
    password: PasswordConfig;
}

export interface AuthorizationConfig {
    rbac: RBACConfig;
    abac: ABACConfig;
    defaultPermissions: string[];
    superAdminRoles: string[];
}

export interface KeyManagementConfig {
    keyRotation: boolean;
    rotationInterval: number; // hours
    keyStorage: 'memory' | 'file' | 'vault';
    backup: boolean;
    compression: boolean;
}

export interface AuditConfig {
    enabled: boolean;
    logLevel: 'minimal' | 'standard' | 'verbose';
    storage: 'memory' | 'file' | 'database';
    retention: number; // days
    realtime: boolean;
}

// JWT Configuration
export interface JWTConfig {
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
    clockTolerance: number;
}

// OAuth2 Configuration
export interface OAuth2Config {
    providers: OAuth2Provider[];
    defaultProvider: string;
    scopes: string[];
    redirectUri: string;
    state: boolean;
    pkce: boolean;
}

export interface OAuth2Provider {
    name: string;
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scopes: string[];
}

// Multi-Factor Authentication
export interface MFAConfig {
    enabled: boolean;
    methods: MFAMethod[];
    backupCodes: boolean;
    codeLength: number;
    windowSize: number;
}

export interface MFAMethod {
    type: 'totp' | 'sms' | 'email' | 'hardware';
    enabled: boolean;
    config: Record<string, any>;
}

// Session Configuration
export interface SessionConfig {
    storage: 'memory' | 'redis' | 'database';
    maxAge: number;
    rolling: boolean;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
}

// Password Configuration
export interface PasswordConfig {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    hashAlgorithm: 'bcrypt' | 'scrypt' | 'argon2';
    saltRounds: number;
}

// RBAC Configuration
export interface RBACConfig {
    roles: Role[];
    permissions: Permission[];
    inheritance: boolean;
    caching: boolean;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    inherits?: string[];
    metadata?: Record<string, any>;
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    conditions?: string[];
}

// ABAC Configuration
export interface ABACConfig {
    policies: ABACPolicy[];
    attributes: AttributeDefinition[];
    defaultDecision: 'permit' | 'deny';
    combiningAlgorithm: 'permit-overrides' | 'deny-overrides' | 'first-applicable';
}

export interface ABACPolicy {
    id: string;
    name: string;
    description: string;
    effect: 'permit' | 'deny';
    target: PolicyTarget;
    condition: PolicyCondition;
    obligations?: PolicyObligation[];
}

export interface PolicyTarget {
    subject?: AttributeMatch[];
    resource?: AttributeMatch[];
    action?: AttributeMatch[];
    environment?: AttributeMatch[];
}

export interface AttributeMatch {
    id: string;
    value: any;
    function: 'equals' | 'contains' | 'matches' | 'greater-than' | 'less-than';
}

export interface PolicyCondition {
    expression: string;
    function: string;
    parameters: Record<string, any>;
}

export interface PolicyObligation {
    id: string;
    type: 'advice' | 'obligation';
    expression: string;
}

export interface AttributeDefinition {
    id: string;
    name: string;
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    category: 'subject' | 'resource' | 'action' | 'environment';
    required: boolean;
    defaultValue?: any;
}

// Encryption Types
export interface EncryptionResult {
    data: Buffer;
    iv: Buffer;
    tag?: Buffer;
    salt?: Buffer;
    algorithm: string;
    keyId?: string;
}

export interface DecryptionOptions {
    iv: Buffer;
    tag?: Buffer;
    salt?: Buffer;
    algorithm: string;
    keyId?: string;
}

export interface KeyPair {
    publicKey: string;
    privateKey: string;
    algorithm: string;
    keySize: number;
    format: 'pem' | 'der' | 'jwk';
}

export interface SignatureResult {
    signature: Buffer;
    algorithm: string;
    keyId?: string;
}

export interface HashResult {
    hash: Buffer;
    algorithm: string;
    salt?: Buffer;
}

// Authentication Types
export interface AuthenticationResult {
    success: boolean;
    user?: User;
    token?: string;
    refreshToken?: string;
    expiresIn?: number;
    mfaRequired?: boolean;
    mfaToken?: string;
    error?: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    roles: string[];
    permissions: string[];
    attributes: Record<string, any>;
    lastLogin?: Date;
    mfaEnabled: boolean;
    locked: boolean;
    verified: boolean;
}

export interface AuthenticationRequest {
    username: string;
    password: string;
    mfaCode?: string;
    mfaToken?: string;
    rememberMe?: boolean;
    metadata?: Record<string, any>;
}

// Authorization Types
export interface AuthorizationRequest {
    subject: Subject;
    resource: Resource;
    action: Action;
    environment?: Environment;
}

export interface AuthorizationResult {
    decision: 'permit' | 'deny' | 'indeterminate';
    obligations?: PolicyObligation[];
    advice?: PolicyObligation[];
    reason?: string;
    evaluationTime: number;
}

export interface Subject {
    id: string;
    attributes: Record<string, any>;
}

export interface Resource {
    id: string;
    type: string;
    attributes: Record<string, any>;
}

export interface Action {
    id: string;
    attributes: Record<string, any>;
}

export interface Environment {
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: string;
    attributes: Record<string, any>;
}

// Security Event Types
export interface SecurityEvent {
    id: string;
    type: SecurityEventType;
    timestamp: Date;
    severity: SecuritySeverity;
    category: SecurityCategory;
    subject?: Subject;
    resource?: Resource;
    action?: Action;
    result: 'success' | 'failure' | 'error';
    message: string;
    metadata: Record<string, any>;
    clientInfo?: ClientInfo;
}

export enum SecurityEventType {
    AUTHENTICATION_SUCCESS = 'auth.success',
    AUTHENTICATION_FAILURE = 'auth.failure',
    AUTHORIZATION_GRANTED = 'authz.granted',
    AUTHORIZATION_DENIED = 'authz.denied',
    SESSION_CREATED = 'session.created',
    SESSION_DESTROYED = 'session.destroyed',
    PASSWORD_CHANGED = 'password.changed',
    ACCOUNT_LOCKED = 'account.locked',
    ACCOUNT_UNLOCKED = 'account.unlocked',
    MFA_ENABLED = 'mfa.enabled',
    MFA_DISABLED = 'mfa.disabled',
    MFA_SECRET_GENERATED = 'mfa.secret.generated',
    MFA_VERIFICATION_PERFORMED = 'mfa.verification.performed',
    KEY_GENERATED = 'key.generated',
    KEY_ROTATED = 'key.rotated',
    ENCRYPTION_PERFORMED = 'encryption.performed',
    DECRYPTION_PERFORMED = 'decryption.performed',
    SIGNATURE_CREATED = 'signature.created',
    SIGNATURE_VERIFIED = 'signature.verified',
    SECURITY_VIOLATION = 'security.violation'
}

export enum SecuritySeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum SecurityCategory {
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    ENCRYPTION = 'encryption',
    KEY_MANAGEMENT = 'key_management',
    SESSION = 'session',
    AUDIT = 'audit',
    COMPLIANCE = 'compliance'
}

export interface ClientInfo {
    ipAddress: string;
    userAgent: string;
    platform: string;
    browser: string;
    location?: GeoLocation;
}

export interface GeoLocation {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
}

// Provider Interfaces
export interface CryptoProvider {
    name: string;
    version: string;
    
    // Symmetric Encryption
    encrypt(data: Buffer, key: Buffer, algorithm?: string): Promise<EncryptionResult>;
    decrypt(encryptedData: Buffer, key: Buffer, options: DecryptionOptions): Promise<Buffer>;
    
    // Asymmetric Encryption
    generateKeyPair(algorithm: string, keySize: number): Promise<KeyPair>;
    encryptAsymmetric(data: Buffer, publicKey: string): Promise<Buffer>;
    decryptAsymmetric(encryptedData: Buffer, privateKey: string): Promise<Buffer>;
    
    // Digital Signatures
    sign(data: Buffer, privateKey: string, algorithm?: string): Promise<SignatureResult>;
    verify(data: Buffer, signature: Buffer, publicKey: string, algorithm?: string): Promise<boolean>;
    
    // Hashing
    hash(data: Buffer, algorithm?: string, salt?: Buffer): Promise<HashResult>;
    
    // Key Derivation
    deriveKey(password: string, salt: Buffer, iterations: number, keyLength: number, algorithm?: string): Promise<Buffer>;
    
    // Random Generation
    randomBytes(size: number): Buffer;
    randomString(length: number, charset?: string): string;
}

export interface AuthProvider {
    name: string;
    version: string;
    
    authenticate(request: AuthenticationRequest): Promise<AuthenticationResult>;
    validateToken(token: string): Promise<User | null>;
    refreshToken(refreshToken: string): Promise<AuthenticationResult>;
    logout(token: string): Promise<void>;
    
    // Password Management
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    
    // MFA
    generateMFASecret(user: User): Promise<string>;
    verifyMFACode(user: User, code: string, secret: string): Promise<boolean>;
}

export interface AuthzProvider {
    name: string;
    version: string;
    
    authorize(request: AuthorizationRequest): Promise<AuthorizationResult>;
    hasPermission(subject: Subject, permission: string): Promise<boolean>;
    getRoles(subject: Subject): Promise<string[]>;
    getPermissions(subject: Subject): Promise<string[]>;
    
    // Policy Management
    addPolicy(policy: ABACPolicy): Promise<void>;
    removePolicy(policyId: string): Promise<void>;
    updatePolicy(policy: ABACPolicy): Promise<void>;
    
    // Role Management
    addRole(role: Role): Promise<void>;
    removeRole(roleId: string): Promise<void>;
    assignRole(subjectId: string, roleId: string): Promise<void>;
    revokeRole(subjectId: string, roleId: string): Promise<void>;
}

// Error Types
export class SecurityError extends Error {
    constructor(
        message: string,
        public code: string,
        public category: SecurityCategory,
        public severity: SecuritySeverity = SecuritySeverity.MEDIUM
    ) {
        super(message);
        this.name = 'SecurityError';
    }
}

export class AuthenticationError extends SecurityError {
    constructor(message: string, code: string = 'AUTH_ERROR') {
        super(message, code, SecurityCategory.AUTHENTICATION, SecuritySeverity.HIGH);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends SecurityError {
    constructor(message: string, code: string = 'AUTHZ_ERROR') {
        super(message, code, SecurityCategory.AUTHORIZATION, SecuritySeverity.HIGH);
        this.name = 'AuthorizationError';
    }
}

export class EncryptionError extends SecurityError {
    constructor(message: string, code: string = 'ENCRYPTION_ERROR') {
        super(message, code, SecurityCategory.ENCRYPTION, SecuritySeverity.HIGH);
        this.name = 'EncryptionError';
    }
}

export class KeyManagementError extends SecurityError {
    constructor(message: string, code: string = 'KEY_ERROR') {
        super(message, code, SecurityCategory.KEY_MANAGEMENT, SecuritySeverity.CRITICAL);
        this.name = 'KeyManagementError';
    }
}