/**
 * Tests for PowerScript Testing Module (Module 24)
 */

import { PowerScriptTest, testing, describe, it, assertTrue, assertEquals, createMock, captureSnapshot, startTimer, endTimer } from '../src/testing';

describe('PowerScript Testing Module', () => {
  it('should create test framework instance', () => {
    const testFramework = new PowerScriptTest();
    assertTrue(testFramework instanceof PowerScriptTest);
  });

  it('should support basic assertions', () => {
    assertTrue(true);
    assertEquals(5, 5);
    assertEquals('hello', 'hello');
  });

  it('should create and use mocks', () => {
    const mockFn = createMock('testFunction', {
      returnValue: 'mocked result'
    });
    
    const result = mockFn('test input');
    assertEquals(result, 'mocked result');
    assertTrue(mockFn.toHaveBeenCalled());
    assertTrue(mockFn.toHaveBeenCalledWith('test input'));
  });

  it('should capture debug snapshots', () => {
    const snapshot = captureSnapshot('test snapshot');
    assertTrue(snapshot.timestamp > 0);
    assertTrue(snapshot.memory.used > 0);
    assertTrue(Array.isArray(snapshot.callStack));
  });

  it('should handle timers', () => {
    startTimer('test-timer');
    
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.sqrt(i);
    }
    
    const duration = endTimer('test-timer');
    assertTrue(duration >= 0);
  });
});

describe('PowerScript Testing Assertions', () => {
  it('should validate deep equality', () => {
    const obj1 = { name: 'test', data: [1, 2, 3] };
    const obj2 = { name: 'test', data: [1, 2, 3] };
    testing.assertDeepEquals(obj1, obj2);
  });

  it('should validate array contains', () => {
    const arr = ['apple', 'banana', 'cherry'];
    testing.assertContains(arr, 'banana');
  });

  it('should validate instance types', () => {
    const date = new Date();
    testing.assertInstanceOf(date, Date);
  });

  it('should validate typeof checks', () => {
    const str = 'hello';
    const num = 42;
    testing.assertTypeOf(str, 'string');
    testing.assertTypeOf(num, 'number');
  });
});

describe('PowerScript Mock System', () => {
  it('should track function calls', () => {
    const mockCallback = createMock('callback');
    
    // Call the mock multiple times
    mockCallback('arg1');
    mockCallback('arg2');
    mockCallback('arg3');
    
    assertTrue(mockCallback.toHaveBeenCalledTimes(3));
    assertTrue(mockCallback.toHaveBeenCalledWith('arg2'));
  });

  it('should allow mock implementations', () => {
    const mockProcessor = createMock('processor', {
      implementation: (input: string) => input.toUpperCase()
    });
    
    const result = mockProcessor('hello world');
    assertEquals(result, 'HELLO WORLD');
  });

  it('should support mock chaining', () => {
    const mock = createMock('chainable')
      .mockReturnValue('first')
      .mockImplementation(() => 'second');
    
    const result = mock();
    assertEquals(result, 'second'); // Implementation overrides return value
  });
});