/**
 * Direct test of PowerScript Testing Framework
 */

const { 
  PowerScriptTest, 
  testing, 
  describe, 
  it, 
  assertTrue, 
  assertEquals, 
  assertDeepEquals,
  createMock, 
  captureSnapshot, 
  startTimer, 
  endTimer 
} = require('./dist/testing');

console.log('🧪 Testing PowerScript Testing Framework...\n');

// Test basic functionality
try {
  // Create test framework instance
  const testFramework = new PowerScriptTest();
  console.log('✅ PowerScriptTest instance created successfully');

  // Test basic assertions
  assertTrue(true);
  assertEquals(5, 5);
  assertEquals('hello', 'hello');
  console.log('✅ Basic assertions working');

  // Test deep equality
  const obj1 = { name: 'test', data: [1, 2, 3] };
  const obj2 = { name: 'test', data: [1, 2, 3] };
  assertDeepEquals(obj1, obj2);
  console.log('✅ Deep equality assertion working');

  // Test mock creation
  const mockFn = createMock('testFunction');
  mockFn.mockReturnValue('mocked result');
  const result = mockFn('test input');
  assertEquals(result, 'mocked result');
  console.log('✅ Mock functions working');

  // Test snapshots
  const snapshot = captureSnapshot('test snapshot');
  assertTrue(snapshot.timestamp.length > 0);
  assertTrue(snapshot.memory.heapUsed >= 0);
  assertTrue(Array.isArray(snapshot.stack));
  console.log('✅ Debug snapshots working');

  // Test timers
  startTimer('test-timer');
  
  // Simulate some work
  for (let i = 0; i < 1000; i++) {
    Math.sqrt(i);
  }
  
  const duration = endTimer('test-timer');
  assertTrue(duration >= 0);
  console.log('✅ Performance timers working');

  console.log('\n🎉 All testing framework features working correctly!');
  console.log('❌ Issue: Jest integration needs fixing for TS files');

} catch (error) {
  console.error('❌ Testing framework error:', error.message);
  process.exit(1);
}