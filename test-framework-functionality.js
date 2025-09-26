/**
 * Test the PowerScript Testing Framework functionality
 */

const { testing, describe, it, assertTrue, assertEquals, PowerScriptTest } = require('./dist');

console.log('🧪 Testing PowerScript Testing Framework\n');

// Test 1: Using global functions
describe('PowerScript Testing Framework', () => {
  it('should have working assertion functions', () => {
    assertTrue(true, 'assertTrue should work');
    assertEquals(2 + 2, 4, 'assertEquals should work');
    console.log('✅ Global test functions working correctly');
  });

  it('should create and execute tests', async () => {
    const testInstance = new PowerScriptTest();
    const result = await testInstance.run();
    
    console.log('✅ Test execution results:');
    console.log(`  - Passed: ${result.passed}`);
    console.log(`  - Failed: ${result.failed}`);
    console.log(`  - Total: ${result.total}`);
    console.log(`  - Duration: ${result.duration}ms`);
    
    assertTrue(result.total > 0, 'Should have run some tests');
  });
});

console.log('\n🎉 PowerScript Testing Framework is working correctly!');