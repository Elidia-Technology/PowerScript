/**
 * Simple test to verify testing framework exports
 */

describe('Simple Test', () => {
  test('should import testing functions', () => {
    const { 
      PowerScriptTest, 
      testing, 
      describe: psDescribe, 
      it: psIt, 
      assertTrue, 
      assertEquals, 
      createMock 
    } = require('../src/testing');

    expect(PowerScriptTest).toBeDefined();
    expect(testing).toBeDefined();
    expect(psDescribe).toBeDefined();
    expect(psIt).toBeDefined();
    expect(assertTrue).toBeDefined();
    expect(assertEquals).toBeDefined();
    expect(createMock).toBeDefined();
  });

  test('should create test framework instance', () => {
    const { PowerScriptTest } = require('../src/testing');
    const testFramework = new PowerScriptTest();
    expect(testFramework).toBeInstanceOf(PowerScriptTest);
  });

  test('should support basic assertions', () => {
    const { assertTrue, assertEquals } = require('../src/testing');
    
    // These should not throw
    assertTrue(true);
    assertEquals(5, 5);
    assertEquals('hello', 'hello');
  });

  test('should create mocks', () => {
    const { createMock } = require('../src/testing');
    
    const mockFn = createMock('testFunction');
    expect(mockFn).toBeDefined();
    expect(typeof mockFn).toBe('function');
    
    mockFn.mockReturnValue('test result');
    const result = mockFn('input');
    expect(result).toBe('test result');
  });
});