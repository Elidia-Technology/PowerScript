/**
 * PowerScript Enhanced Security Module
 * Main exports for enhanced security functionality
 */

export * from './PowerScriptSecurityEnhanced';

// Re-export base security types and functionality
export * from '../security/types';
export { PowerScriptSecurity } from '../security/PowerScriptSecurity';

// Enhanced security specific exports
export type {
  EnhancedSecurityConfig,
  ComplianceFramework,
  ECCKeyPair,
  OAuth2Token,
  OpenIDToken,
  ValidationRule,
  SandboxConfig,
  AuditLogEntry,
  MFAConfig,
  MFAProvider
} from './PowerScriptSecurityEnhanced';