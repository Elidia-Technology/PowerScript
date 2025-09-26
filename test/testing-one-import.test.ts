/**
 * Test one import at a time
 */

describe('PowerScript Testing - One Import', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import testing module', async () => {
    const { PowerScriptTest } = await import('../src/testing');
    expect(typeof PowerScriptTest).toBe('function');
  });
});