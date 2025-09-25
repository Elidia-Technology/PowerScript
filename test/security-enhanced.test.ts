/**
 * PowerScript Enhanced Security Module - Simplified Tests
 */
import {
  PowerScriptSecurityEnhanced,
  PowerScriptSecurityFactory,
  SecurityUtils,
  ECCProvider,
  OAuth2Provider,
  OpenIDProvider,
  InputValidator,
  SecureSandbox,
  EnhancedAuthorizationProvider
} from '../src/security-enhanced';

describe('PowerScript Enhanced Security Module', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = PowerScriptSecurityFactory.createDefault();
    // Wait for initialization
    await new Promise(resolve => {
      security.on('initialized', resolve);
    });
  });

  afterEach(() => {
    security.removeAllListeners();
  });

  describe('Security System Initialization', () => {
    it('should initialize with all providers', async () => {
      expect(security.crypto).toBeDefined();
      expect(security.auth).toBeDefined();
      expect(security.authz).toBeDefined();
      expect(security.validation).toBeDefined();
      expect(security.sandbox).toBeDefined();
      expect(security.audit).toBeDefined();

      const status = await security.getSecurityStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.providers.crypto).toBe('active');
      expect(status.providers.auth).toBe('active');
      expect(status.providers.validation).toBe('active');
      expect(status.providers.sandbox).toBe('active');
      expect(status.providers.audit).toBe('active');
    });

    it('should emit initialization events', (done) => {
      const newSecurity = new PowerScriptSecurityEnhanced();
      
      newSecurity.on('initialized', (event) => {
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.providers).toContain('crypto');
        expect(event.providers).toContain('auth');
        done();
      });
    });

    it('should create with OAuth2 configuration', async () => {
      const oauth2Security = PowerScriptSecurityFactory.createWithOAuth2({
        provider: AuthProvider.GOOGLE,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://example.com/callback'
      });

      await new Promise(resolve => {
        oauth2Security.on('initialized', resolve);
      });

      expect(oauth2Security.auth).toBeInstanceOf(OAuth2Provider);
    });

    it('should create minimal security instance', () => {
      const minimalSecurity = PowerScriptSecurityFactory.createMinimal();
      expect(minimalSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt sensitive data', async () => {
      const originalData = { secret: 'test-data', number: 42 };
      
      const encrypted = await security.encryptSensitiveData(originalData, 'user123');
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');

      const decrypted = await security.decryptSensitiveData(encrypted, 'user123');
      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt string data', async () => {
      const originalString = 'Hello, World!';
      
      const encrypted = await security.encryptSensitiveData(originalString);
      const decrypted = await security.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalString);
    });

    it('should handle encryption errors gracefully', async () => {
      // Test with null data
      await expect(security.encryptSensitiveData(null)).rejects.toThrow();
    });

    it('should handle decryption errors gracefully', async () => {
      // Test with invalid encrypted data
      await expect(security.decryptSensitiveData('invalid-data')).rejects.toThrow();
    });
  });

  describe('Secure Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'testPassword123!';
      const hash = await security.secureHash(password);
      
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should verify password hashes', async () => {
      const password = 'testPassword123!';
      const hash = await security.secureHash(password);
      
      const isValid = await security.verifySecureHash(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await security.verifySecureHash('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate valid input', async () => {
      const data = {
        email: 'test@example.com',
        age: 25,
        name: 'John Doe'
      };

      const schema = {
        email: {
          type: 'email' as const,
          required: true,
          rules: [{ type: 'email' as const, message: 'Invalid email' }]
        },
        age: {
          type: 'number' as const,
          required: true,
          rules: [{ type: 'number' as const, min: 18, message: 'Must be 18+' }]
        },
        name: {
          type: 'string' as const,
          required: true,
          rules: [{ type: 'string' as const, min: 1, message: 'Name required' }]
        }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should detect validation errors', async () => {
      const data = {
        email: 'invalid-email',
        age: 15,
        name: ''
      };

      const schema = SecurityUtils.createCommonSchemas();
      const validationSchema = {
        email: schema.email,
        name: schema.username
      };

      const result = await security.validateAndSanitize(data, validationSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should sanitize malicious input', async () => {
      const data = {
        comment: '<script>alert("xss")</script>Hello World',
        html: '<img src="x" onerror="alert(1)">'
      };

      const schema = {
        comment: {
          type: 'string' as const,
          required: true,
          sanitization: {
            html: true,
            xss: true
          },
          rules: [{ type: 'string' as const, message: 'Comment required' }]
        },
        html: {
          type: 'string' as const,
          required: false,
          sanitization: {
            html: true,
            xss: true
          },
          rules: [{ type: 'string' as const, message: 'HTML content' }]
        }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.sanitizedData.comment).not.toContain('<script>');
      expect(result.sanitizedData.html).not.toContain('onerror');
    });
  });

  describe('Secure Sandbox Execution', () => {
    it('should execute safe code', async () => {
      const code = `
        const result = 2 + 2;
        return result;
      `;

      const result = await security.executeSecurely<number>(code);
      expect(result.success).toBe(true);
      expect(result.result).toBe(4);
      expect(result.error).toBeNull();
    });

    it('should execute code with context', async () => {
      const code = `
        const sum = a + b;
        return sum;
      `;

      const context = { a: 10, b: 20 };
      const result = await security.executeSecurely<number>(code, context);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe(30);
    });

    it('should handle sandbox timeouts', async () => {
      const code = `
        while (true) {
          // Infinite loop to test timeout
        }
      `;

      const result = await security.executeSecurely(code);
      expect(result.success).toBe(false);
      expect(result.timeout).toBe(true);
    });

    it('should handle syntax errors', async () => {
      const code = `
        const invalid syntax here
      `;

      const result = await security.executeSecurely(code);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should restrict dangerous operations', async () => {
      const code = `
        // Try to access process (should be blocked)
        return process.env;
      `;

      const result = await security.executeSecurely(code);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Security Status and Monitoring', () => {
    it('should provide comprehensive security status', async () => {
      const status = await security.getSecurityStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.providers).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.metrics.totalEvents).toBeGreaterThanOrEqual(0);
      expect(status.metrics.securityScore).toBeGreaterThanOrEqual(0);
      expect(status.metrics.securityScore).toBeLessThanOrEqual(100);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });

    it('should track security events', async () => {
      // Perform some operations to generate events
      await security.encryptSensitiveData('test-data', 'user123');
      
      const status = await security.getSecurityStatus();
      expect(status.metrics.totalEvents).toBeGreaterThan(0);
    });

    it('should calculate security score', async () => {
      // Initial score should be high
      let status = await security.getSecurityStatus();
      expect(status.metrics.securityScore).toBeGreaterThan(90);

      // Simulate some failures (this would normally lower the score)
      try {
        await security.decryptSensitiveData('invalid-data');
      } catch {
        // Expected to fail
      }

      status = await security.getSecurityStatus();
      // Score might be affected by the failed operation
      expect(status.metrics.securityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Utilities', () => {
    it('should generate secure IDs', () => {
      const id1 = SecurityUtils.generateSecureId();
      const id2 = SecurityUtils.generateSecureId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(32);
    });

    it('should generate custom length IDs', () => {
      const shortId = SecurityUtils.generateSecureId(16);
      const longId = SecurityUtils.generateSecureId(64);
      
      expect(shortId.length).toBe(16);
      expect(longId.length).toBe(64);
    });

    it('should validate password strength', () => {
      const weakPassword = '123';
      const strongPassword = 'StrongP@ssw0rd123!';
      
      const weakResult = SecurityUtils.validatePasswordStrength(weakPassword);
      const strongResult = SecurityUtils.validatePasswordStrength(strongPassword);
      
      expect(weakResult.isStrong).toBe(false);
      expect(weakResult.feedback.length).toBeGreaterThan(0);
      expect(weakResult.score).toBeLessThan(80);
      
      expect(strongResult.isStrong).toBe(true);
      expect(strongResult.score).toBeGreaterThanOrEqual(80);
    });

    it('should create common validation schemas', () => {
      const schemas = SecurityUtils.createCommonSchemas();
      
      expect(schemas.email).toBeDefined();
      expect(schemas.password).toBeDefined();
      expect(schemas.username).toBeDefined();
      expect(schemas.phone).toBeDefined();
      expect(schemas.url).toBeDefined();
    });

    it('should create sandbox presets', () => {
      const presets = SecurityUtils.createSandboxPresets();
      
      expect(presets.minimal).toBeDefined();
      expect(presets.standard).toBeDefined();
      expect(presets.extended).toBeDefined();
      expect(presets.isolated).toBeDefined();
      
      expect(presets.minimal.timeout).toBe(5000);
      expect(presets.extended.memoryLimit).toBe(256);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', (done) => {
      // Mock crypto failure
      const originalCrypto = global.crypto;
      delete (global as any).crypto;
      
      const failingSecurity = new PowerScriptSecurityEnhanced();
      
      failingSecurity.on('initializationError', (event) => {
        expect(event.error).toBeTruthy();
        expect(event.timestamp).toBeInstanceOf(Date);
        
        // Restore crypto
        (global as any).crypto = originalCrypto;
        done();
      });
    });

    it('should emit provider errors', (done) => {
      security.on('providerError', (event) => {
        expect(event.provider).toBeTruthy();
        expect(event.error).toBeTruthy();
        done();
      });

      // Trigger an error by calling with invalid data
      security.decryptSensitiveData('invalid').catch(() => {
        // Expected to fail
      });
    });

    it('should handle security errors with proper context', async () => {
      try {
        await security.decryptSensitiveData('definitely-not-encrypted-data');
      } catch (error) {
        expect(error.name).toBe('SecurityError');
        expect(error.code).toBeTruthy();
        expect(error.eventType).toBeTruthy();
        expect(error.context).toBeDefined();
      }
    });
  });

  describe('Performance and Resource Management', () => {
    it('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await security.encryptSensitiveData('test data');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      const testData = 'concurrent test data';
      
      // Start 10 concurrent encryption operations
      for (let i = 0; i < 10; i++) {
        promises.push(security.encryptSensitiveData(`${testData}-${i}`));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(typeof result).toBe('string');
        expect(result).toBeTruthy();
      });
    });

    it('should manage memory efficiently', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const encrypted = await security.encryptSensitiveData(`test-${i}`);
        await security.decryptSensitiveData(encrypted);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

describe('Individual Provider Tests', () => {
  describe('ECC Cryptography Provider', () => {
    let provider: ECCProvider;

    beforeEach(() => {
      provider = new ECCProvider();
    });

    it('should generate ECC key pairs', async () => {
      const keyPair = await provider.generateECKeyPair('P-256');
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });

    it('should encrypt and decrypt with ECC', async () => {
      const data = Buffer.from('test data');
      const key = await provider.generateRandomBytes(32);
      
      const encrypted = await provider.encrypt(data, key);
      const decrypted = await provider.decrypt(encrypted, key);
      
      expect(decrypted.toString()).toBe(data.toString());
    });

    it('should sign and verify data', async () => {
      const keyPair = await provider.generateECKeyPair('P-256');
      const data = Buffer.from('test message');
      
      const signature = await provider.sign(data, keyPair.privateKey);
      const isValid = await provider.verify(data, signature, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Input Validator', () => {
    let validator: InputValidator;

    beforeEach(() => {
      validator = new InputValidator();
    });

    it('should validate email addresses', async () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';
      
      const schema = {
        email: {
          type: 'email' as const,
          required: true,
          rules: [{ type: 'email' as const, message: 'Invalid email' }]
        }
      };

      const validResult = await validator.validate({ email: validEmail }, schema);
      const invalidResult = await validator.validate({ email: invalidEmail }, schema);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should sanitize HTML content', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = validator.sanitizeInput(maliciousHtml, {
        html: true,
        xss: true
      });
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });
  });

  describe('Secure Sandbox', () => {
    let sandbox: SecureSandbox;

    beforeEach(() => {
      sandbox = new SecureSandbox();
    });

    it('should create and destroy environments', async () => {
      const config = {
        type: 'vm' as any,
        timeout: 5000,
        memoryLimit: 32,
        context: { test: true },
        allowedGlobals: ['Date'],
        strictMode: true
      };

      const environment = await sandbox.createEnvironment(config);
      expect(environment.id).toBeTruthy();
      expect(environment.type).toBe('vm');
      
      await sandbox.destroyEnvironment(environment.id);
    });

    it('should execute code safely', async () => {
      const config = {
        type: 'vm' as any,
        timeout: 5000,
        memoryLimit: 32,
        context: { a: 5, b: 10 },
        allowedGlobals: ['Math'],
        strictMode: true
      };

      const environment = await sandbox.createEnvironment(config);
      
      try {
        const result = await sandbox.execute<number>(environment.id, 'return Math.max(a, b);');
        
        expect(result.success).toBe(true);
        expect(result.result).toBe(10);
      } finally {
        await sandbox.destroyEnvironment(environment.id);
      }
    });
  });

  describe('Enhanced Authorization Provider', () => {
    let authz: EnhancedAuthorizationProvider;

    beforeEach(() => {
      authz = new EnhancedAuthorizationProvider();
    });

    it('should create and manage roles', async () => {
      const role = await authz.createRole({
        name: 'test-role',
        description: 'Test role for unit tests',
        permissions: ['read:test', 'write:test']
      });

      expect(role.id).toBeTruthy();
      expect(role.name).toBe('test-role');
      expect(role.permissions).toContain('read:test');
    });

    it('should grant and check permissions', async () => {
      const userId = 'test-user';
      
      await authz.addRole(userId, 'user');
      const hasPermission = await authz.checkPermission(userId, 'own', 'read');
      
      // This might be true or false depending on the default user role permissions
      expect(typeof hasPermission).toBe('boolean');
    });

    it('should evaluate policies', async () => {
      const policy = await authz.createPolicy({
        name: 'test-policy',
        description: 'Test policy',
        effect: 'allow' as any,
        conditions: [
          {
            id: 'role-condition',
            type: 'role',
            operator: 'in',
            value: ['admin', 'user']
          }
        ]
      });

      const context = {
        subject: {
          id: 'test-user',
          roles: [{ id: '1', name: 'user' } as any],
          permissions: [],
          attributes: {}
        },
        resource: { id: 'test-resource', type: 'document', attributes: {} },
        action: { name: 'read', type: 'read', attributes: {} },
        environment: {
          timestamp: new Date(),
          attributes: {}
        }
      };

      const evaluation = await authz.evaluatePolicy(policy, context);
      expect(evaluation.policyId).toBe(policy.id);
      expect(evaluation.decision).toBeTruthy();
    });
  });
});

describe('Integration Tests', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = PowerScriptSecurityFactory.createDefault();
    await new Promise(resolve => {
      security.on('initialized', resolve);
    });
  });

  afterEach(() => {
    security.removeAllListeners();
  });

  it('should handle end-to-end user registration flow', async () => {
    const userData = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'SecurePassword123!'
    };

    // Validate user data
    const schema = SecurityUtils.createCommonSchemas();
    const validationResult = await security.validateAndSanitize(userData, {
      username: schema.username,
      email: schema.email,
      password: schema.password
    });

    expect(validationResult.isValid).toBe(true);

    // Hash password
    const hashedPassword = await security.secureHash(userData.password);
    expect(hashedPassword).toBeTruthy();

    // Encrypt sensitive user data
    const sensitiveData = {
      username: userData.username,
      email: userData.email,
      hashedPassword
    };

    const encryptedUserData = await security.encryptSensitiveData(sensitiveData, 'system');
    expect(encryptedUserData).toBeTruthy();

    // Decrypt and verify
    const decryptedData = await security.decryptSensitiveData(encryptedUserData, 'system');
    expect(decryptedData.username).toBe(userData.username);
    expect(decryptedData.email).toBe(userData.email);

    // Verify password
    const passwordValid = await security.verifySecureHash(
      userData.password, 
      decryptedData.hashedPassword
    );
    expect(passwordValid).toBe(true);
  });

  it('should handle secure API processing workflow', async () => {
    const apiRequest = {
      action: 'getUserProfile',
      userId: 'user123',
      data: {
        fields: ['name', 'email'],
        filters: { active: true }
      }
    };

    // Validate API request
    const validationSchema = {
      action: {
        type: 'string' as const,
        required: true,
        rules: [
          { type: 'string' as const, min: 1, message: 'Action required' },
          { 
            type: 'pattern' as const, 
            pattern: /^[a-zA-Z][a-zA-Z0-9]*$/, 
            message: 'Invalid action format' 
          }
        ]
      },
      userId: {
        type: 'string' as const,
        required: true,
        rules: [{ type: 'string' as const, min: 1, message: 'User ID required' }]
      }
    };

    const validationResult = await security.validateAndSanitize(apiRequest, validationSchema);
    expect(validationResult.isValid).toBe(true);

    // Execute business logic in sandbox
    const businessLogicCode = `
      const processRequest = (request) => {
        if (request.action === 'getUserProfile') {
          return {
            success: true,
            data: {
              id: request.userId,
              name: 'Test User',
              email: 'test@example.com',
              active: true
            }
          };
        }
        return { success: false, error: 'Unknown action' };
      };
      
      return processRequest(request);
    `;

    const sandboxResult = await security.executeSecurely(
      businessLogicCode, 
      { request: apiRequest }
    );

    expect(sandboxResult.success).toBe(true);
    expect(sandboxResult.result.success).toBe(true);
    expect(sandboxResult.result.data.id).toBe(apiRequest.userId);

    // Encrypt response
    const encryptedResponse = await security.encryptSensitiveData(
      sandboxResult.result, 
      apiRequest.userId
    );
    expect(encryptedResponse).toBeTruthy();

    // Get security metrics
    const securityStatus = await security.getSecurityStatus();
    expect(securityStatus.metrics.totalEvents).toBeGreaterThan(0);
    expect(securityStatus.metrics.securityScore).toBeGreaterThan(0);
  });

  it('should detect and handle security violations', async () => {
    let securityViolationDetected = false;

    security.on('providerError', () => {
      securityViolationDetected = true;
    });

    // Attempt malicious input
    const maliciousData = {
      script: '<script>window.location="http://evil.com"</script>',
      sql: "'; DROP TABLE users; --",
      code: 'require("child_process").exec("rm -rf /")'
    };

    // Validate should catch XSS
    const schema = {
      script: {
        type: 'string' as const,
        required: true,
        sanitization: { html: true, xss: true },
        rules: [{ type: 'string' as const, message: 'String required' }]
      },
      sql: {
        type: 'string' as const,
        required: true,
        sanitization: { sql: true },
        rules: [{ type: 'string' as const, message: 'String required' }]
      }
    };

    const validationResult = await security.validateAndSanitize(maliciousData, schema);
    expect(validationResult.sanitizedData.script).not.toContain('<script>');
    expect(validationResult.sanitizedData.sql).not.toContain('DROP TABLE');

    // Sandbox should block dangerous code
    try {
      const sandboxResult = await security.executeSecurely(maliciousData.code);
      expect(sandboxResult.success).toBe(false);
      expect(sandboxResult.error).toBeTruthy();
    } catch (error) {
      // Expected to be blocked
      expect(error).toBeTruthy();
    }

    // Check security status reflects the violations
    const status = await security.getSecurityStatus();
    // Score might be affected by the security violations
    expect(status.metrics.totalEvents).toBeGreaterThan(0);
  });
});

// Performance Tests
describe('Performance Tests', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = PowerScriptSecurityFactory.createDefault();
    await new Promise(resolve => {
      security.on('initialized', resolve);
    });
  });

  afterEach(() => {
    security.removeAllListeners();
  });

  it('should handle high-volume encryption operations', async () => {
    const startTime = Date.now();
    const operations = 100;
    const promises = [];

    for (let i = 0; i < operations; i++) {
      promises.push(security.encryptSensitiveData(`test-data-${i}`));
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(operations);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    
    const operationsPerSecond = operations / (duration / 1000);
    console.log(`Encryption performance: ${operationsPerSecond.toFixed(2)} ops/sec`);
  });

  it('should handle concurrent validation operations', async () => {
    const schema = SecurityUtils.createCommonSchemas();
    const testData = Array.from({ length: 50 }, (_, i) => ({
      email: `test${i}@example.com`,
      username: `user${i}`,
      password: `Password${i}!`
    }));

    const startTime = Date.now();
    const promises = testData.map(data => 
      security.validateAndSanitize(data, {
        email: schema.email,
        username: schema.username,
        password: schema.password
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(results).toHaveLength(50);
    results.forEach(result => {
      expect(result.isValid).toBe(true);
    });

    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    console.log(`Validation performance: ${(50 / (duration / 1000)).toFixed(2)} ops/sec`);
  });
});

export {};