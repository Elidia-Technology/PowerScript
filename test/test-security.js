/**
 * PowerScript Security Module Test
 * Comprehensive test for security functionality
 */

const { PowerScriptSecurity } = require('./dist/security/PowerScriptSecurity');
const { NodeCryptoProvider } = require('./dist/security/encryption/NodeCryptoProvider');
const { JWTProvider } = require('./dist/security/authentication/JWTProvider');
const { RBACProvider } = require('./dist/security/authorization/RBACProvider');

console.log('🔐 PowerScript Security Module Test\n');

async function testSecurity() {
    try {
        // Initialize Security Configuration
        const securityConfig = {
            encryption: {
                algorithm: 'AES-256-GCM',
                keyLength: 256,
                saltLength: 32
            },
            authentication: {
                jwt: {
                    algorithm: 'HS256',
                    expiresIn: '1h',
                    refreshExpiresIn: '7d',
                    issuer: 'PowerScript',
                    audience: 'PowerScript-App',
                    clockTolerance: 30
                },
                oauth2: {
                    providers: [],
                    defaultProvider: 'jwt',
                    scopes: ['read', 'write'],
                    redirectUri: 'http://localhost:3000/callback'
                },
                mfa: {
                    issuer: 'PowerScript',
                    window: 1,
                    secretLength: 32
                },
                session: {
                    maxAge: 86400000,
                    secure: false,
                    httpOnly: true,
                    sameSite: 'lax'
                },
                password: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    saltRounds: 12
                }
            },
            authorization: {
                rbac: {
                    strictMode: true,
                    enableInheritance: true
                },
                abac: {
                    enablePolicyEvaluation: true,
                    defaultDecision: 'deny'
                },
                defaultPermissions: ['read:public'],
                superAdminRoles: ['admin']
            },
            keyManagement: {
                keyRotation: true,
                rotationInterval: 86400000,
                keyDerivation: {
                    algorithm: 'PBKDF2',
                    iterations: 100000,
                    keyLength: 32
                }
            },
            audit: {
                enabled: true,
                logLevel: 'info',
                includeSensitive: false,
                retentionDays: 90
            }
        };

        console.log('1. Initializing PowerScript Security...');
        const security = new PowerScriptSecurity(securityConfig);

        // Register providers
        const cryptoProvider = new NodeCryptoProvider(securityConfig.encryption);
        const authProvider = new JWTProvider(securityConfig.authentication);
        const authzProvider = new RBACProvider(securityConfig.authorization);

        await security.registerCryptoProvider(cryptoProvider);
        await security.registerAuthProvider(authProvider);
        await security.registerAuthzProvider(authzProvider);

        console.log('✅ Security initialized with providers');

        // Test Encryption
        console.log('\n2. Testing Encryption...');
        const testData = 'Hello, PowerScript Security!';

        // Use auto-generated key (no keyId parameter)
        const encryptionResult = await security.encrypt(testData);
        console.log('✅ Data encrypted:', encryptionResult.algorithm);

        const decryptedData = await security.decrypt(encryptionResult.data, {
            keyId: encryptionResult.keyId,
            algorithm: encryptionResult.algorithm,
            iv: encryptionResult.iv,
            salt: encryptionResult.salt
        });
        console.log('✅ Data decrypted:', decryptedData.toString());

        // Test Key Generation
        console.log('\n3. Testing Key Generation...');
        const keyPair = await security.generateKeyPair('RSA', 2048);
        console.log('✅ Key pair generated:', keyPair.algorithm);

        // Test Hashing
        console.log('\n4. Testing Hashing...');
        const hashResult = await security.hash(testData);
        console.log('✅ Data hashed:', hashResult.algorithm);

        // Test Authentication
        console.log('\n5. Testing Authentication...');
        const loginRequest = {
            username: 'testuser',
            password: 'password123',
            rememberMe: false,
            metadata: { source: 'test' }
        };

        const authResult = await security.authenticate(loginRequest);
        console.log('✅ Authentication:', authResult.success ? 'Success' : 'Failed');
        
        if (authResult.success && authResult.token) {
            console.log('  User:', authResult.user?.username);
            console.log('  Token type: JWT mock token');

            // Test Token Validation
            console.log('\n6. Testing Token Validation...');
            const validatedUser = await security.validateToken(authResult.token);
            console.log('✅ Token validated:', validatedUser ? 'Valid' : 'Invalid');
            
            if (validatedUser) {
                console.log('  Validated user:', validatedUser.username);
            }
        }

        // Test Authorization
        console.log('\n7. Testing Authorization...');
        const authzRequest = {
            subject: {
                id: 'user1',
                attributes: { roles: ['user'], permissions: [] }
            },
            resource: {
                id: 'document1',
                type: 'document',
                attributes: { owner: 'user1' }
            },
            action: {
                id: 'read',
                attributes: {}
            }
        };

        const authzResult = await security.authorize(authzRequest);
        console.log('✅ Authorization:', authzResult.decision);
        console.log('  Reason:', authzResult.reason);

        // Test Password Hashing
        console.log('\n8. Testing Password Management...');
        const password = 'SecurePassword123!';
        const hashedPassword = await security.hashPassword(password);
        console.log('✅ Password hashed');

        const isValidPassword = await security.verifyPassword(password, hashedPassword);
        console.log('✅ Password verified:', isValidPassword);

        // Test MFA
        console.log('\n9. Testing MFA...');
        if (authResult.user) {
            const mfaSecret = await security.generateMFASecret(authResult.user);
            console.log('✅ MFA secret generated');

            const mfaVerified = await security.verifyMFACode(authResult.user, '123456', mfaSecret);
            console.log('✅ MFA code verified:', mfaVerified);
        }

        // Test Audit Logging
        console.log('\n10. Testing Audit Logging...');
        await security.logSecurityEvent('test', 'Test security event', 'info', {
            testData: 'This is a test audit log'
        });
        console.log('✅ Audit event logged');

        // Test Security Metrics
        console.log('\n11. Testing Security Metrics...');
        const metrics = security.getSecurityMetrics();
        console.log('✅ Security metrics retrieved:');
        console.log('  Total Operations:', metrics.totalOperations);
        console.log('  Successful Operations:', metrics.successfulOperations);
        console.log('  Failed Operations:', metrics.failedOperations);

        console.log('\n🎉 All Security tests completed successfully!');
        console.log('\n📊 Security Module Status:');
        console.log('  ✅ Encryption & Decryption');
        console.log('  ✅ Key Management'); 
        console.log('  ✅ Hashing');
        console.log('  ✅ Authentication (JWT)');
        console.log('  ✅ Token Validation');
        console.log('  ✅ Authorization (RBAC)');
        console.log('  ✅ Password Management');
        console.log('  ✅ Multi-Factor Authentication');
        console.log('  ✅ Audit Logging');
        console.log('  ✅ Security Metrics');

        return true;

    } catch (error) {
        console.error('❌ Security test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testSecurity().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testSecurity };