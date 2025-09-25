/**
 * PowerScript Enhanced Security Module - Working Test
 *
 * Tests the implemented functionality of the Enhanced Security Module.
 */

import { PowerScriptSecurityEnhanced } from '../src/security-enhanced';
import type { ValidationRule, SandboxConfig } from '../src/security-enhanced';

describe('PowerScript Enhanced Security Module - Working Implementation', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = new PowerScriptSecurityEnhanced({
      enableECC: true,
      enableOAuth2: true,
      enableOpenID: true,
      enableAdvancedHashing: true,
      enableInputValidation: true,
      enableSandboxing: true,
      enableAuditLogging: true,
      enableCompliance: true,
      enableMFA: true
    });
    
    await security.initialize();
  });

  afterEach(async () => {
    if (security) {
      // Remove all event listeners to prevent memory leaks
      security.removeAllListeners();
      await security.destroy();
    }
  });

  test('should initialize successfully', async () => {
    expect(security).toBeDefined();
    expect(security.name).toBe('PowerScriptSecurityEnhanced');
    expect(security.version).toBe('1.0.0');
  });

  test('should have correct security status', () => {
    const status = security.getSecurityStatus();
    
    expect(status.initialized).toBe(true);
    expect(status.enabledFeatures).toContain('ECC');
    expect(status.enabledFeatures).toContain('OAuth2');
    expect(status.enabledFeatures).toContain('OpenID');
    expect(status.enabledFeatures).toContain('AdvancedHashing');
    expect(status.enabledFeatures).toContain('InputValidation');
    expect(status.enabledFeatures).toContain('Sandboxing');
    expect(status.enabledFeatures).toContain('AuditLogging');
    expect(status.enabledFeatures).toContain('Compliance');
    expect(status.enabledFeatures).toContain('MFA');
    expect(status.auditLogSize).toBeGreaterThanOrEqual(0);
  });

  test('should generate ECC key pairs', async () => {
    const keyPair = await security.generateECCKeyPair('secp256r1');
    
    expect(keyPair).toBeDefined();
    expect(keyPair.privateKey).toContain('EC PRIVATE KEY');
    expect(keyPair.publicKey).toContain('EC PUBLIC KEY');
    expect(keyPair.curve).toBe('secp256r1');
  });

  test('should generate different ECC curves', async () => {
    const curves: Array<'secp256r1' | 'secp384r1' | 'secp521r1'> = ['secp256r1', 'secp384r1', 'secp521r1'];
    
    for (const curve of curves) {
      const keyPair = await security.generateECCKeyPair(curve);
      expect(keyPair.curve).toBe(curve);
      expect(keyPair.privateKey).toContain('EC PRIVATE KEY');
      expect(keyPair.publicKey).toContain('EC PUBLIC KEY');
    }
  });

  test('should perform advanced password hashing', async () => {
    const password = 'test-password-123';
    
    // Test bcrypt
    const bcryptResult = await security.hashPasswordAdvanced(password, 'bcrypt');
    expect(bcryptResult.hash).toBeDefined();
    expect(bcryptResult.salt).toBeDefined();
    expect(bcryptResult.algorithm).toBe('bcrypt');
    
    // Test argon2
    const argon2Result = await security.hashPasswordAdvanced(password, 'argon2');
    expect(argon2Result.hash).toBeDefined();
    expect(argon2Result.salt).toBeDefined();
    expect(argon2Result.algorithm).toBe('argon2');
    
    // Results should be different
    expect(bcryptResult.hash).not.toEqual(argon2Result.hash);
  });

  test('should initiate OAuth2 flow', async () => {
    const security = new PowerScriptSecurityEnhanced({
      oauth2Config: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        scope: ['openid', 'profile', 'email'],
        authorizationEndpoint: 'https://example.com/oauth/authorize',
        tokenEndpoint: 'https://example.com/oauth/token'
      }
    });
    
    await security.initialize();
    
    const authUrl = await security.initiateOAuth2Flow('google');
    expect(authUrl).toContain('https://example.com/oauth/authorize');
    expect(authUrl).toContain('client_id=test-client-id');
    expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
    expect(authUrl).toContain('scope=openid profile email');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('state=');
    
    await security.destroy();
  });

  test('should exchange OAuth2 authorization code', async () => {
    const security = new PowerScriptSecurityEnhanced({
      oauth2Config: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback',
        scope: ['openid', 'profile', 'email'],
        authorizationEndpoint: 'https://example.com/oauth/authorize',
        tokenEndpoint: 'https://example.com/oauth/token'
      }
    });
    
    await security.initialize();
    
    const token = await security.exchangeOAuth2Code('test-auth-code', 'test-state');
    expect(token.accessToken).toBeDefined();
    expect(token.refreshToken).toBeDefined();
    expect(token.tokenType).toBe('Bearer');
    expect(token.expiresIn).toBe(3600);
    expect(token.scope).toEqual(['openid', 'profile', 'email']);
    expect(token.issuedAt).toBeDefined();
    
    await security.destroy();
  });

  test('should validate input correctly', () => {
    const validData = {
      email: 'test@example.com',
      age: 25,
      name: 'John Doe',
      website: 'https://example.com'
    };
    
    const rules: ValidationRule[] = [
      { field: 'email', type: 'email', required: true },
      { field: 'age', type: 'number', required: true },
      { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 50 },
      { field: 'website', type: 'url', required: false }
    ];
    
    const result = security.validateInput(validData, rules);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized).toEqual(validData);
  });

  test('should validate input with errors', () => {
    const invalidData = {
      email: 'invalid-email',
      age: 'not-a-number',
      name: 'A',
      website: 'not-a-url'
    };
    
    const rules: ValidationRule[] = [
      { field: 'email', type: 'email', required: true },
      { field: 'age', type: 'number', required: true },
      { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 50 },
      { field: 'website', type: 'url', required: true },
      { field: 'missing', type: 'string', required: true }
    ];
    
    const result = security.validateInput(invalidData, rules);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain("Field 'email' must be a valid email");
    expect(result.errors).toContain("Field 'age' must be a number");
    expect(result.errors).toContain("Field 'name' must be at least 2 characters");
    expect(result.errors).toContain("Field 'website' must be a valid URL");
    expect(result.errors).toContain("Field 'missing' is required");
  });

  test('should execute code in sandbox', async () => {
    const code = 'console.log("Hello, World!"); return 42;';
    const config: SandboxConfig = {
      timeout: 5000,
      memoryLimit: 64 * 1024 * 1024, // 64MB
      allowedModules: [],
      blockedFunctions: ['eval', 'Function'],
      enableFileAccess: false,
      enableNetworkAccess: false
    };
    
    const result = await security.executeSandboxed(code, config);
    expect(result).toBeDefined();
    expect(result.output).toContain('Mock execution result');
  });

  test('should handle sandbox timeout', async () => {
    const code = 'while(true) {}'; // Infinite loop
    const config: SandboxConfig = {
      timeout: 100, // Very short timeout
      memoryLimit: 64 * 1024 * 1024,
      allowedModules: [],
      blockedFunctions: [],
      enableFileAccess: false,
      enableNetworkAccess: false
    };
    
    await expect(security.executeSandboxed(code, config)).rejects.toThrow('Sandbox execution timeout');
  });

  test('should generate TOTP secret', async () => {
    const userId = 'test-user-123';
    const totp = await security.generateTOTPSecret(userId);
    
    expect(totp.secret).toBeDefined();
    expect(totp.qrCode).toBeDefined();
    expect(totp.qrCode).toContain('otpauth://totp/');
    expect(totp.qrCode).toContain(userId);
    expect(totp.qrCode).toContain('PowerScript');
  });

  test('should verify TOTP token', async () => {
    const userId = 'test-user-123';
    const validToken = '123456';
    const invalidToken = 'invalid';
    const secret = 'test-secret';
    
    const validResult = await security.verifyTOTPToken(userId, validToken, secret);
    expect(validResult).toBe(true);
    
    const invalidResult = await security.verifyTOTPToken(userId, invalidToken, secret);
    expect(invalidResult).toBe(false);
  });

  test('should maintain audit log', async () => {
    const initialLogSize = security.getAuditLog().length;
    
    // Perform some operations that should generate audit entries
    await security.generateECCKeyPair();
    await security.hashPasswordAdvanced('test-password');
    
    const finalLogSize = security.getAuditLog().length;
    expect(finalLogSize).toBeGreaterThan(initialLogSize);
    
    const auditEntries = security.getAuditLog();
    expect(auditEntries.length).toBeGreaterThan(0);
    
    const entry = auditEntries[0];
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeInstanceOf(Date);
    expect(entry.action).toBeDefined();
    expect(entry.resource).toBe('enhanced-security');
    expect(entry.result).toMatch(/^(success|failure)$/);
    expect(entry.severity).toBeDefined();
    expect(Array.isArray(entry.compliance)).toBe(true);
  });

  test('should filter audit log', async () => {
    // Generate some test audit entries
    await security.generateECCKeyPair();
    await security.hashPasswordAdvanced('test-password');
    
    const allEntries = security.getAuditLog();
    expect(allEntries.length).toBeGreaterThan(0);
    
    // Filter by action
    const eccEntries = security.getAuditLog({ action: 'ecc_key_generation' });
    expect(eccEntries.length).toBeGreaterThan(0);
    expect(eccEntries.every(entry => entry.action === 'ecc_key_generation')).toBe(true);
    
    // Filter by date range
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentEntries = security.getAuditLog({ startDate: oneHourAgo });
    expect(recentEntries.length).toBeGreaterThanOrEqual(0);
  });

  test('should emit events during initialization', (done) => {
    const newSecurity = new PowerScriptSecurityEnhanced();
    
    newSecurity.on('initialized', (event) => {
      expect(event.timestamp).toBeInstanceOf(Date);
      done();
    });
    
    newSecurity.initialize();
  });

  test('should emit audit events', (done) => {
    security.on('auditEvent', (entry) => {
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.action).toBeDefined();
      done();
    });
    
    // Trigger an audit event
    security.generateECCKeyPair();
  });

  test('should handle disabled features', () => {
    const limitedSecurity = new PowerScriptSecurityEnhanced({
      enableECC: false,
      enableOAuth2: false,
      enableMFA: false
    });
    
    expect(() => limitedSecurity.generateECCKeyPair()).rejects.toThrow('ECC is disabled in configuration');
    expect(() => limitedSecurity.initiateOAuth2Flow('google')).rejects.toThrow('OAuth2 is not configured');
    expect(() => limitedSecurity.generateTOTPSecret('user123')).rejects.toThrow('MFA is disabled in configuration');
  });
});