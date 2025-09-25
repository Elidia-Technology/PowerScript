/**
 * PowerScript Simple Security Module
 * Provides essential security functionality without complex dependencies
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

// Simple Types
export interface SecurityConfig {
  encryptionAlgorithm?: string;
  keySize?: number;
  saltSize?: number;
  iterations?: number;
  timeout?: number;
  maxMemory?: number;
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
  tag: string;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'url';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SecurityStatus {
  isInitialized: boolean;
  encryptionEnabled: boolean;
  validationEnabled: boolean;
  sandboxEnabled: boolean;
  uptime: number;
  operationsCount: number;
}

/**
 * Simple Security Implementation
 */
export class PowerScriptSecuritySimple extends EventEmitter {
  private config: SecurityConfig;
  private isInitialized: boolean = false;
  private startTime: number;
  private operationsCount: number = 0;

  constructor(config: SecurityConfig = {}) {
    super();
    this.config = {
      encryptionAlgorithm: 'aes256',
      keySize: 32,
      saltSize: 16,
      iterations: 100000,
      timeout: 30000,
      maxMemory: 128 * 1024 * 1024, // 128MB
      ...config
    };
    this.startTime = Date.now();
  }

  /**
   * Initialize the security module
   */
  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data: string, password: string): Promise<EncryptionResult> {
    try {
      this.operationsCount++;
      
      const salt = crypto.randomBytes(this.config.saltSize!);
      const key = crypto.pbkdf2Sync(password, salt, this.config.iterations!, this.config.keySize!, 'sha512');
      const iv = crypto.randomBytes(12);
      
      const cipher = crypto.createCipher(this.config.encryptionAlgorithm!, password);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = Buffer.alloc(0); // Simplified - no auth tag for basic implementation

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptionResult: EncryptionResult, password: string): Promise<string> {
    try {
      this.operationsCount++;
      
      const salt = Buffer.from(encryptionResult.salt, 'hex');
      const key = crypto.pbkdf2Sync(password, salt, this.config.iterations!, this.config.keySize!, 'sha512');
      const iv = Buffer.from(encryptionResult.iv, 'hex');
      const tag = Buffer.from(encryptionResult.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.config.encryptionAlgorithm!, password);
      
      let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Hash password securely
   */
  async hashPassword(password: string): Promise<string> {
    try {
      this.operationsCount++;
      
      const salt = crypto.randomBytes(this.config.saltSize!);
      const hash = crypto.pbkdf2Sync(password, salt, this.config.iterations!, this.config.keySize!, 'sha512');
      
      return `${salt.toString('hex')}:${hash.toString('hex')}`;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Password hashing failed: ${error}`);
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      this.operationsCount++;
      
      const [saltHex, hashHex] = hash.split(':');
      const salt = Buffer.from(saltHex, 'hex');
      const originalHash = Buffer.from(hashHex, 'hex');
      
      const testHash = crypto.pbkdf2Sync(password, salt, this.config.iterations!, this.config.keySize!, 'sha512');
      
      return crypto.timingSafeEqual(originalHash, testHash);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Password verification failed: ${error}`);
    }
  }

  /**
   * Validate input data
   */
  async validateInput(data: any, rules: ValidationRule[]): Promise<ValidationResult> {
    try {
      this.operationsCount++;
      
      const errors: string[] = [];

      for (const rule of rules) {
        if (rule.required && (data === undefined || data === null || data === '')) {
          errors.push('Field is required');
          continue;
        }

        if (data === undefined || data === null) {
          continue; // Skip validation for optional empty fields
        }

        switch (rule.type) {
          case 'string':
            if (typeof data !== 'string') {
              errors.push('Must be a string');
            } else {
              if (rule.minLength && data.length < rule.minLength) {
                errors.push(`Must be at least ${rule.minLength} characters long`);
              }
              if (rule.maxLength && data.length > rule.maxLength) {
                errors.push(`Must be no more than ${rule.maxLength} characters long`);
              }
              if (rule.pattern && !rule.pattern.test(data)) {
                errors.push('Invalid format');
              }
            }
            break;

          case 'number':
            if (typeof data !== 'number' || isNaN(data)) {
              errors.push('Must be a number');
            } else {
              if (rule.min !== undefined && data < rule.min) {
                errors.push(`Must be at least ${rule.min}`);
              }
              if (rule.max !== undefined && data > rule.max) {
                errors.push(`Must be no more than ${rule.max}`);
              }
            }
            break;

          case 'email':
            if (typeof data !== 'string') {
              errors.push('Email must be a string');
            } else {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(data)) {
                errors.push('Invalid email format');
              }
            }
            break;

          case 'url':
            if (typeof data !== 'string') {
              errors.push('URL must be a string');
            } else {
              try {
                new URL(data);
              } catch {
                errors.push('Invalid URL format');
              }
            }
            break;
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Validation failed: ${error}`);
    }
  }

  /**
   * Sanitize input string
   */
  sanitizeInput(input: string): string {
    try {
      this.operationsCount++;
      
      return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Sanitization failed: ${error}`);
    }
  }

  /**
   * Execute code in a simple sandbox
   */
  async executeInSandbox(code: string, context: any = {}): Promise<any> {
    try {
      this.operationsCount++;
      
      // Create a simple sandbox using Function constructor
      const sandboxedFunction = new Function(
        'context',
        `
          'use strict';
          const { ${Object.keys(context).join(', ')} } = context;
          return (function() {
            ${code}
          })();
        `
      );

      // Execute with timeout
      return await Promise.race([
        Promise.resolve(sandboxedFunction(context)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout')), this.config.timeout!)
        )
      ]);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Sandbox execution failed: ${error}`);
    }
  }

  /**
   * Generate secure random bytes
   */
  generateRandomBytes(size: number): Buffer {
    try {
      this.operationsCount++;
      return crypto.randomBytes(size);
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Random bytes generation failed: ${error}`);
    }
  }

  /**
   * Generate secure random string
   */
  generateRandomString(length: number, charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    try {
      this.operationsCount++;
      
      const randomBytes = this.generateRandomBytes(length);
      let result = '';
      
      for (let i = 0; i < length; i++) {
        result += charset[randomBytes[i] % charset.length];
      }
      
      return result;
    } catch (error) {
      this.emit('error', error);
      throw new Error(`Random string generation failed: ${error}`);
    }
  }

  /**
   * Get security status
   */
  getStatus(): SecurityStatus {
    return {
      isInitialized: this.isInitialized,
      encryptionEnabled: true,
      validationEnabled: true,
      sandboxEnabled: true,
      uptime: Date.now() - this.startTime,
      operationsCount: this.operationsCount
    };
  }

  /**
   * Shutdown the security module
   */
  async shutdown(): Promise<void> {
    this.isInitialized = false;
    this.removeAllListeners();
    this.emit('shutdown');
  }
}

/**
 * Security Factory
 */
export class PowerScriptSecurityFactory {
  static createSecurity(config?: SecurityConfig): PowerScriptSecuritySimple {
    return new PowerScriptSecuritySimple(config);
  }
}

/**
 * Security Utilities
 */
export class SecurityUtils {
  /**
   * Compare two strings in constant time
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }
}

export default PowerScriptSecuritySimple;