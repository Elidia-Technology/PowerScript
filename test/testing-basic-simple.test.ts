/**
 * Simple test for PowerScript Testing Module
 */

describe('PowerScript Testing Module - Basic Simple', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import testing module', async () => {
    const { PowerScriptTest, assertTrue, assertEquals } = await import('../src/testing');
    expect(typeof PowerScriptTest).toBe('function');
    expect(typeof assertTrue).toBe('function');
    expect(typeof assertEquals).toBe('function');
  });

  it('should support basic operations', () => {
    const numbers = [1, 2, 3];
    expect(numbers.length).toBe(3);
    expect(numbers[0]).toBe(1);
  });
});