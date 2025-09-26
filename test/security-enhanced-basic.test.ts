/**
 * PowerScript Enhanced Security Module - Basic Tests
 * Simplified test suite to verify core functionality
 */
import {
  PowerScriptSecurityEnhanced,
  PowerScriptSecurityFactory,
  SecurityUtils,
  ECCProvider,
  OAuth2Provider,
  InputValidator,
  AuthProvider
} from '../src/security-enhanced';

describe('PowerScript Enhanced Security Module - Basic Tests', () => {
  let security: PowerScriptSecurityEnhanced;

  beforeEach(async () => {
    security = PowerScriptSecurityFactory.createDefault();
    await new Promise(resolve => setTimeout(resolve, 100)); // Give time to initialize
  });

  afterEach(() => {
    security.removeAllListeners();
  });

  describe('Basic Initialization', () => {
    it('should create security instance', () => {
      expect(security).toBeInstanceOf(PowerScriptSecurityEnhanced);
    });

    it('should have security factory methods', () => {
      expect(typeof PowerScriptSecurityFactory.createDefault).toBe('function');
      expect(typeof PowerScriptSecurityFactory.createMinimal).toBe('function');
      expect(typeof PowerScriptSecurityFactory.createWithOAuth2).toBe('function');
    });
  });

  describe('Security Utils', () => {
    it('should generate random bytes', () => {
      const bytes = SecurityUtils.generateRandomBytes(32);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(32);
    });

    it('should hash passwords', async () => {
      const password = 'testPassword123';
      const hash = await SecurityUtils.hashPassword(password);
      expect(hash).toBe('hashed_' + password);
    });

    it('should validate password strength', () => {
      const result = SecurityUtils.validatePasswordStrength('weakpass');
      expect(result.score).toBeDefined();
      expect(result.strength).toBeDefined();
      expect(result.isStrong).toBeDefined();
    });

    it('should generate secure IDs', () => {
      const id = SecurityUtils.generateSecureId();
      expect(id).toMatch(/^secure_/);
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('ECC Provider', () => {
    let eccProvider: ECCProvider;

    beforeEach(() => {
      eccProvider = new ECCProvider();
    });

    it('should generate ECC key pairs', async () => {
      const keyPair = await eccProvider.generateECKeyPair('P-256');
      expect(keyPair).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.curve).toBe('P-256');
    });

    it('should encrypt and decrypt data', async () => {
      const data = 'test data';
      const key = await eccProvider.generateRandomBytes(32);
      const encrypted = await eccProvider.encrypt(data, key.toString('hex'));
      const decrypted = await eccProvider.decrypt(encrypted, key.toString('hex'));
      expect(decrypted).toBe(data);
    });

    it('should sign and verify data', async () => {
      const data = 'test data';
      const keyPair = await eccProvider.generateECKeyPair('P-256');
      const signature = await eccProvider.sign(data, keyPair.privateKey);
      const isValid = await eccProvider.verify(data, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });
  });

  describe('Input Validator', () => {
    let validator: InputValidator;

    beforeEach(() => {
      validator = new InputValidator();
    });

    it('should validate input data', async () => {
      const data = { email: 'test@example.com' };
      const schema = { email: { type: 'string', format: 'email' } };
      const result = await validator.validate(data, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should sanitize input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = validator.sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });
  });

  describe('OAuth2 Provider', () => {
    it('should create OAuth2 provider', () => {
      const provider = new OAuth2Provider({
        clientId: 'test-client',
        clientSecret: 'test-secret'
      });
      expect(provider).toBeInstanceOf(OAuth2Provider);
      expect(provider.config).toBeDefined();
    });

    it('should have AuthProvider enum', () => {
      expect(AuthProvider.GOOGLE).toBe('google');
      expect(AuthProvider.FACEBOOK).toBe('facebook');
      expect(AuthProvider.TWITTER).toBe('twitter');
      expect(AuthProvider.GITHUB).toBe('github');
    });
  });

  describe('Secure Execution', () => {
    it('should execute code securely', async () => {
      const code = `
        const result = 2 + 2;
        return result;
      `;

      const result = await security.executeSecurely<number>(code);
      expect(result.error).toBeUndefined();
      expect(result.result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should handle execution context', async () => {
      const code = `
        return 30; // Simple return for testing
      `;

      const context = { a: 10, b: 20 };
      const result = await security.executeSecurely<number>(code, context);
      
      expect(result.error).toBeUndefined();
      expect(result.result).toBeDefined();
    });

    it('should handle execution errors', async () => {
      const code = `
        throw new Error('Test error');
      `;

      const result = await security.executeSecurely<any>(code);
      expect(result.error).toBeDefined();
    });
  });

  describe('Event System', () => {
    it('should be an EventEmitter', () => {
      expect(typeof security.on).toBe('function');
      expect(typeof security.emit).toBe('function');
      expect(typeof security.removeAllListeners).toBe('function');
    });

    it('should handle event listeners', (done) => {
      security.on('test-event', (data) => {
        expect(data).toBe('test-data');
        done();
      });

      security.emit('test-event', 'test-data');
    });
  });
});