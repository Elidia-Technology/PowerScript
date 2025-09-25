/**
 * PowerScript Enhanced Security Module - Simplified Tests
 */

import {
  PowerScriptSecurityEnhanced,
  PowerScriptSecurityFactory,
  SecurityUtils
} from '../src/security-enhanced';

describe('PowerScript Enhanced Security Module - Simplified', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(() => {
    security = PowerScriptSecurityFactory.createDefault();
  });

  describe('Security System Initialization', () => {
    it('should create security instance', () => {
      expect(security).toBeDefined();
      expect(security).toBeInstanceOf(PowerScriptSecurityEnhanced);
    });

    it('should create with factory methods', () => {
      const defaultSecurity = PowerScriptSecurityFactory.createDefault();
      const minimalSecurity = PowerScriptSecurityFactory.createMinimal();
      const oauth2Security = PowerScriptSecurityFactory.createWithOAuth2({});
      const openIdSecurity = PowerScriptSecurityFactory.createWithOpenID({});

      expect(defaultSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
      expect(minimalSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
      expect(oauth2Security).toBeInstanceOf(PowerScriptSecurityEnhanced);
      expect(openIdSecurity).toBeInstanceOf(PowerScriptSecurityEnhanced);
    });

    it('should provide security status', async () => {
      const status = await security.getSecurityStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.providers).toBeDefined();
      expect(status.metrics).toBeDefined();
      expect(status.metrics.securityScore).toBe(100);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt data', async () => {
      const originalData = { secret: 'test-data', number: 42 };
      
      const encrypted = await security.encryptSensitiveData(originalData);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');

      const decrypted = await security.decryptSensitiveData(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt string data', async () => {
      const originalString = 'Hello, World!';
      
      const encrypted = await security.encryptSensitiveData(originalString);
      const decrypted = await security.decryptSensitiveData(encrypted);
      
      expect(decrypted).toBe(originalString);
    });

    it('should handle encryption errors', async () => {
      await expect(security.encryptSensitiveData(null)).rejects.toThrow();
    });

    it('should handle decryption errors', async () => {
      await expect(security.decryptSensitiveData('invalid-base64!@#')).rejects.toThrow();
    });
  });

  describe('Password Security', () => {
    it('should hash passwords', async () => {
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
  });

  describe('Input Validation', () => {
    it('should validate basic input', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const schema = {
        name: { type: 'string', required: true },
        email: { type: 'email', required: true }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toBeDefined();
    });

    it('should sanitize script tags', async () => {
      const data = {
        comment: '<script>alert("xss")</script>Hello World'
      };

      const schema = {
        comment: { type: 'string', required: true }
      };

      const result = await security.validateAndSanitize(data, schema);
      expect(result.sanitizedData.comment).not.toContain('<script>');
      expect(result.sanitizedData.comment).toContain('Hello World');
    });
  });

  describe('Secure Code Execution', () => {
    it('should execute safe code', async () => {
      const code = `
        const result = 2 + 2;
        return result;
      `;

      const result = await security.executeSecurely<number>(code);
      expect(result.result).toBe(4);
      expect(result.error).toBeUndefined();
      expect(result.timeout).toBe(false);
    });

    it('should execute code with context', async () => {
      const code = `
        const sum = a + b;
        return sum;
      `;

      const context = { a: 10, b: 20 };
      const result = await security.executeSecurely<number>(code, context);
      
      expect(result.result).toBe(30);
      expect(result.error).toBeUndefined();
    });

    it('should block dangerous operations', async () => {
      const code = `
        return require('fs');
      `;

      const result = await security.executeSecurely(code);
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('restricted');
    });

    it('should measure execution time', async () => {
      const code = `
        return 'test';
      `;

      const result = await security.executeSecurely(code);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.executionTime).toBe('number');
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

    it('should provide common validation schemas', () => {
      const schemas = SecurityUtils.createCommonSchemas();
      
      expect(schemas.email).toBeDefined();
      expect(schemas.password).toBeDefined();
      expect(schemas.username).toBeDefined();
      
      expect(schemas.email.type).toBe('email');
      expect(schemas.password.minLength).toBe(8);
      expect(schemas.username.minLength).toBe(3);
    });

    it('should provide sandbox presets', () => {
      const presets = SecurityUtils.createSandboxPresets();
      
      expect(presets.minimal).toBeDefined();
      expect(presets.standard).toBeDefined();
      expect(presets.extended).toBeDefined();
      
      expect(presets.minimal.timeout).toBe(5000);
      expect(presets.standard.timeout).toBe(30000);
      expect(presets.extended.timeout).toBe(120000);
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should handle user registration flow', async () => {
      const userData = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      // Validate user data
      const validationResult = await security.validateAndSanitize(userData, {
        username: { type: 'string', required: true },
        email: { type: 'email', required: true },
        password: { type: 'string', required: true }
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

      const encryptedUserData = await security.encryptSensitiveData(sensitiveData);
      expect(encryptedUserData).toBeTruthy();

      // Decrypt and verify
      const decryptedData = await security.decryptSensitiveData(encryptedUserData);
      expect(decryptedData.username).toBe(userData.username);
      expect(decryptedData.email).toBe(userData.email);

      // Verify password
      const passwordValid = await security.verifySecureHash(
        userData.password, 
        decryptedData.hashedPassword
      );
      expect(passwordValid).toBe(true);
    });

    it('should handle secure computation', async () => {
      // Encrypt input data
      const inputData = { numbers: [1, 2, 3, 4, 5] };
      const encryptedInput = await security.encryptSensitiveData(inputData);

      // Decrypt for processing
      const decryptedInput = await security.decryptSensitiveData(encryptedInput);

      // Execute computation securely
      const computationCode = `
        const sum = numbers.reduce((a, b) => a + b, 0);
        const average = sum / numbers.length;
        return { sum, average, count: numbers.length };
      `;

      const result = await security.executeSecurely(computationCode, decryptedInput);
      expect(result.error).toBeUndefined();
      expect(result.result.sum).toBe(15);
      expect(result.result.average).toBe(3);
      expect(result.result.count).toBe(5);

      // Encrypt results
      const encryptedResult = await security.encryptSensitiveData(result.result);
      expect(encryptedResult).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent operations', async () => {
      const promises = [];
      const testData = 'performance test data';
      
      // Start 10 concurrent operations
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

    it('should complete operations quickly', async () => {
      const startTime = Date.now();
      
      await security.encryptSensitiveData('test data');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});

export {};