/**
 * PowerScript Enhanced Security Module - Simplified Tests
 */

import { 
  PowerScriptSecurityEnhanced, 
  PowerScriptSecurityFactory, 
  SecurityUtils 
} from '../src/security-enhanced';

describe('PowerScript Enhanced Security Module (Simplified)', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = PowerScriptSecurityFactory.createDefault();
    
    // Wait for initialization
    await new Promise<void>((resolve) => {
      security.on('initialized', () => resolve());
    });
  });

  afterEach(() => {
    security.removeAllListeners();
  });

  describe('Security System Initialization', () => {
    test('should initialize successfully', async () => {
      const status = await security.getSecurityStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.providers.crypto).toBe('active');
      expect(status.providers.validation).toBe('active');
      expect(status.providers.sandbox).toBe('active');
      expect(status.providers.audit).toBe('active');
    });

    test('should create with factory methods', () => {
      const defaultSecurity = PowerScriptSecurityFactory.createDefault();
      const minimalSecurity = PowerScriptSecurityFactory.createMinimal();
      
      expect(defaultSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
      expect(minimalSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
    });
  });

  describe('Encryption and Decryption', () => {
    test('should encrypt and decrypt data successfully', async () => {
      const originalData = { message: 'Hello, World!', number: 42 };
      
      const encrypted = await security.encryptSensitiveData(originalData, 'user123');
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');

      const decrypted = await security.decryptSensitiveData(encrypted, 'user123');
      expect(decrypted).toEqual(originalData);
    });

    test('should encrypt and decrypt string data', async () => {
      const originalString = 'Test string data';
      
      const encrypted = await security.encryptSensitiveData(originalString);
      const decrypted = await security.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalString);
    });

    test('should handle encryption errors', async () => {
      await expect(security.decryptSensitiveData('invalid-data')).rejects.toThrow();
    });
  });

  describe('Secure Password Hashing', () => {
    test('should hash and verify passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await security.secureHash(password);
      
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);

      const isValid = await security.verifySecureHash(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await security.verifySecureHash('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should validate valid input', async () => {
      const data = {
        email: 'test@example.com',
        age: 25,
        name: 'John Doe'
      };

      const schema = {
        email: {
          type: 'email',
          required: true,
          rules: [{ type: 'email' as const, message: 'Invalid email' }]
        },
        age: {
          type: 'number',
          required: true,
          rules: [{ type: 'number' as const, min: 18, message: 'Must be 18+' }]
        },
        name: {
          type: 'string',
          required: true,
          rules: [{ type: 'string' as const, min: 1, message: 'Name required' }]
        }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    test('should detect validation errors', async () => {
      const data = {
        email: 'invalid-email',
        age: 15,
        name: ''
      };

      const schema = {
        email: {
          type: 'email',
          required: true,
          rules: [{ type: 'email' as const, message: 'Invalid email' }]
        },
        name: {
          type: 'string',
          required: true,
          rules: [{ type: 'string' as const, min: 1, message: 'Name required' }]
        }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize HTML content', async () => {
      const data = {
        comment: '<script>alert("xss")</script>Hello World'
      };

      const schema = {
        comment: {
          type: 'string',
          required: true,
          rules: [{ type: 'string' as const, message: 'Comment required' }]
        }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.sanitizedData?.comment).not.toContain('<script>');
      expect(result.sanitizedData?.comment).toContain('Hello World');
    });
  });

  describe('Secure Sandbox Execution', () => {
    test('should execute safe code', async () => {
      const code = `
        const result = 2 + 2;
        return result;
      `;

      const result = await security.executeSecurely<number>(code);
      expect(result.result).toBe(4);
      expect(result.error).toBeUndefined();
      expect(result.timeout).toBe(false);
    });

    test('should execute code with context', async () => {
      const code = `
        const sum = a + b;
        return sum;
      `;

      const context = { a: 10, b: 20 };
      const result = await security.executeSecurely<number>(code, context);
      
      expect(result.result).toBe(30);
      expect(result.error).toBeUndefined();
    });

    test('should handle syntax errors', async () => {
      const code = `
        const invalid syntax here
      `;

      const result = await security.executeSecurely(code);
      expect(result.result).toBeUndefined();
      expect(result.error).toBeTruthy();
    });
  });

  describe('Security Status and Monitoring', () => {
    test('should provide security status', async () => {
      const status = await security.getSecurityStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.providers).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.metrics.totalEvents).toBeGreaterThanOrEqual(0);
      expect(status.metrics.securityScore).toBeGreaterThanOrEqual(0);
      expect(status.metrics.securityScore).toBeLessThanOrEqual(100);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });

    test('should track security events', async () => {
      // Perform operations to generate events
      await security.encryptSensitiveData('test-data', 'user123');
      await security.secureHash('password123');
      
      const status = await security.getSecurityStatus();
      expect(status.metrics.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Security Utilities', () => {
    test('should generate secure IDs', () => {
      const id1 = SecurityUtils.generateSecureId();
      const id2 = SecurityUtils.generateSecureId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(32);

      const shortId = SecurityUtils.generateSecureId(16);
      expect(shortId.length).toBe(16);
    });

    test('should validate password strength', () => {
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

    test('should create common validation schemas', () => {
      const schemas = SecurityUtils.createCommonSchemas();
      
      expect(schemas.email).toBeDefined();
      expect(schemas.password).toBeDefined();
      expect(schemas.username).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle multiple encryption operations', async () => {
      const promises = [];
      const testData = 'performance test data';
      
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

    test('should complete operations in reasonable time', async () => {
      const startTime = Date.now();
      
      await security.encryptSensitiveData('test data');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});

export {};