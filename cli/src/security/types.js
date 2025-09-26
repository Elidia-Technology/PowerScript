"use strict";
/**
 * PowerScript Security Types
 * Comprehensive type definitions for security and cryptography
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyManagementError = exports.EncryptionError = exports.AuthorizationError = exports.AuthenticationError = exports.SecurityError = exports.SecurityCategory = exports.SecuritySeverity = exports.SecurityEventType = void 0;
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["AUTHENTICATION_SUCCESS"] = "auth.success";
    SecurityEventType["AUTHENTICATION_FAILURE"] = "auth.failure";
    SecurityEventType["AUTHORIZATION_GRANTED"] = "authz.granted";
    SecurityEventType["AUTHORIZATION_DENIED"] = "authz.denied";
    SecurityEventType["SESSION_CREATED"] = "session.created";
    SecurityEventType["SESSION_DESTROYED"] = "session.destroyed";
    SecurityEventType["PASSWORD_CHANGED"] = "password.changed";
    SecurityEventType["ACCOUNT_LOCKED"] = "account.locked";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "account.unlocked";
    SecurityEventType["MFA_ENABLED"] = "mfa.enabled";
    SecurityEventType["MFA_DISABLED"] = "mfa.disabled";
    SecurityEventType["MFA_SECRET_GENERATED"] = "mfa.secret.generated";
    SecurityEventType["MFA_VERIFICATION_PERFORMED"] = "mfa.verification.performed";
    SecurityEventType["KEY_GENERATED"] = "key.generated";
    SecurityEventType["KEY_ROTATED"] = "key.rotated";
    SecurityEventType["ENCRYPTION_PERFORMED"] = "encryption.performed";
    SecurityEventType["DECRYPTION_PERFORMED"] = "decryption.performed";
    SecurityEventType["SIGNATURE_CREATED"] = "signature.created";
    SecurityEventType["SIGNATURE_VERIFIED"] = "signature.verified";
    SecurityEventType["SECURITY_VIOLATION"] = "security.violation";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var SecuritySeverity;
(function (SecuritySeverity) {
    SecuritySeverity["LOW"] = "low";
    SecuritySeverity["MEDIUM"] = "medium";
    SecuritySeverity["HIGH"] = "high";
    SecuritySeverity["CRITICAL"] = "critical";
})(SecuritySeverity || (exports.SecuritySeverity = SecuritySeverity = {}));
var SecurityCategory;
(function (SecurityCategory) {
    SecurityCategory["AUTHENTICATION"] = "authentication";
    SecurityCategory["AUTHORIZATION"] = "authorization";
    SecurityCategory["ENCRYPTION"] = "encryption";
    SecurityCategory["KEY_MANAGEMENT"] = "key_management";
    SecurityCategory["SESSION"] = "session";
    SecurityCategory["AUDIT"] = "audit";
    SecurityCategory["COMPLIANCE"] = "compliance";
})(SecurityCategory || (exports.SecurityCategory = SecurityCategory = {}));
// Error Types
class SecurityError extends Error {
    constructor(message, code, category, severity = SecuritySeverity.MEDIUM) {
        super(message);
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
class AuthenticationError extends SecurityError {
    constructor(message, code = 'AUTH_ERROR') {
        super(message, code, SecurityCategory.AUTHENTICATION, SecuritySeverity.HIGH);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends SecurityError {
    constructor(message, code = 'AUTHZ_ERROR') {
        super(message, code, SecurityCategory.AUTHORIZATION, SecuritySeverity.HIGH);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class EncryptionError extends SecurityError {
    constructor(message, code = 'ENCRYPTION_ERROR') {
        super(message, code, SecurityCategory.ENCRYPTION, SecuritySeverity.HIGH);
        this.name = 'EncryptionError';
    }
}
exports.EncryptionError = EncryptionError;
class KeyManagementError extends SecurityError {
    constructor(message, code = 'KEY_ERROR') {
        super(message, code, SecurityCategory.KEY_MANAGEMENT, SecuritySeverity.CRITICAL);
        this.name = 'KeyManagementError';
    }
}
exports.KeyManagementError = KeyManagementError;
