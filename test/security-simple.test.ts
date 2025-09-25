/**
 * Simple Security Module Tests
 */

import { PowerScriptSecuritySimple } from '../src/security-simple/PowerScriptSecuritySimple';

describe('PowerScriptSecuritySimple', () => {
  let security: PowerScriptSecuritySimple;

  beforeAll(async () => {
    security = new PowerScriptSecuritySimple();
    await security.initialize();
  });

  afterAll(async () => {
    await security.shutdown();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      const status = security.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.encryptionEnabled).toBe(true);
    });
  });

  describe('Password Operations', () => {
    test('should hash and verify password', async () => {
      const password = 'testPassword123';
      const hash = await security.hashPassword(password);
      
      expect(hash).toContain(':');
      
      const isValid = await security.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await security.verifyPassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate string input', async () => {
      const result = await security.validateInput('test@example.com', [
        { type: 'email', required: true }
      ]);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid email', async () => {
      const result = await security.validateInput('invalid-email', [
        { type: 'email', required: true }
      ]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Sandbox Execution', () => {
    test('should execute simple code', async () => {
      const result = await security.executeInSandbox('return 2 + 2;');
      expect(result).toBe(4);
    });

    test('should execute code with context', async () => {
      const result = await security.executeInSandbox(
        'return a + b;',
        { a: 5, b: 3 }
      );
      expect(result).toBe(8);
    });
  });

  describe('Utilities', () => {
    test('should generate random bytes', () => {
      const bytes = security.generateRandomBytes(16);
      expect(bytes.length).toBe(16);
    });

    test('should generate random string', () => {
      const str = security.generateRandomString(10);
      expect(str.length).toBe(10);
    });

    test('should sanitize input', () => {
      const result = security.sanitizeInput('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });
  });
});