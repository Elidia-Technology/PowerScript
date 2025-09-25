/**
 * PowerScript Graphics & Multimedia Module - Minimal Working Test
 *
 * Tests basic multimedia functionality without complex streaming features.
 */

describe('PowerScript Graphics & Multimedia Module - Minimal Test', () => {
  
  test('should import multimedia module successfully', () => {
    // Test basic import without instantiation
    expect(() => {
      const { PowerScriptGraphics } = require('../src/multimedia/index-minimal');
      expect(PowerScriptGraphics).toBeDefined();
    }).not.toThrow();
  });

  test('should create multimedia module without streaming', () => {
    const { PowerScriptGraphics } = require('../src/multimedia/index-minimal');
    
    // Create with minimal config to avoid streaming issues
    const multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false, // Disable problematic streaming
      enableProcessing: false // Disable problematic processing
    });

    expect(multimedia).toBeDefined();
    expect(multimedia.name).toBe('PowerScriptGraphics');
    expect(multimedia.capabilities).toContain('audio');
    expect(multimedia.capabilities).toContain('video');
  });

  test('should have basic API methods', () => {
    const { PowerScriptGraphics } = require('../src/multimedia/index-minimal');
    
    const multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false,
      enableProcessing: false
    });

    // Test that the required interface methods exist
    expect(typeof multimedia.initialize).toBe('function');
    expect(typeof multimedia.createAudioPlayer).toBe('function');
    expect(typeof multimedia.getAudioPlayer).toBe('function');
    expect(typeof multimedia.createVideoPlayer).toBe('function');
    expect(typeof multimedia.getVideoPlayer).toBe('function');
    expect(typeof multimedia.getSupportedFormats).toBe('function');
    expect(typeof multimedia.isFormatSupported).toBe('function');
    expect(typeof multimedia.getCapabilities).toBe('function');
    expect(typeof multimedia.destroy).toBe('function');
  });

  test('should return capabilities correctly', () => {
    const { PowerScriptGraphics } = require('../src/multimedia/index-minimal');
    
    const multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false,
      enableProcessing: false
    });

    const capabilities = multimedia.getCapabilities();
    expect(Array.isArray(capabilities)).toBe(true);
    expect(capabilities.length).toBeGreaterThan(0);
  });

});