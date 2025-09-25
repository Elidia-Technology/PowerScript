/**
 * Simple Node.js test for PowerScript Security Simple Module
 */

const { PowerScriptSecuritySimple } = require('./dist/security-simple/PowerScriptSecuritySimple');

async function testSecurity() {
  console.log('🔒 Testing PowerScript Simple Security Module...');
  
  try {
    // Test initialization
    const security = new PowerScriptSecuritySimple();
    await security.initialize();
    console.log('✓ Security module initialized');
    
    // Test password operations
    const password = 'testPassword123';
    const hash = await security.hashPassword(password);
    console.log('✓ Password hashed:', hash.substring(0, 20) + '...');
    
    const isValid = await security.verifyPassword(password, hash);
    console.log('✓ Password verification:', isValid);
    
    // Test input validation
    const emailValidation = await security.validateInput('test@example.com', [
      { type: 'email', required: true }
    ]);
    console.log('✓ Email validation:', emailValidation.isValid);
    
    // Test sandbox execution
    const result = await security.executeInSandbox('return 2 + 2;');
    console.log('✓ Sandbox execution result:', result);
    
    // Test random generation
    const randomBytes = security.generateRandomBytes(16);
    console.log('✓ Random bytes generated:', randomBytes.length, 'bytes');
    
    const randomString = security.generateRandomString(10);
    console.log('✓ Random string generated:', randomString);
    
    // Test sanitization
    const sanitized = security.sanitizeInput('<script>alert("xss")</script>test');
    console.log('✓ Input sanitized:', sanitized);
    
    // Test status
    const status = security.getStatus();
    console.log('✓ Security status:', {
      initialized: status.isInitialized,
      operations: status.operationsCount
    });
    
    await security.shutdown();
    console.log('✓ Security module shutdown completed');
    
    console.log('\n🎉 All security tests passed!');
    
  } catch (error) {
    console.error('❌ Security test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSecurity();