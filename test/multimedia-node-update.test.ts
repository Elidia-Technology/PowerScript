import { PowerScriptGraphics } from '../src/multimedia/index-minimal';

describe('PowerScript Multimedia Module - Post Node.js Update Test', () => {
  let multimedia: PowerScriptGraphics;

  beforeEach(async () => {
    multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false,
      enableProcessing: false
    });
    await multimedia.initialize();
  });

  afterEach(async () => {
    if (multimedia) {
      await multimedia.destroy();
    }
  });

  test('should create multimedia system successfully', () => {
    expect(multimedia).toBeDefined();
    expect(multimedia.capabilities).toContain('audio');
    expect(multimedia.capabilities).toContain('video');
  });

  test('should create audio player with required methods', async () => {
    const audioPlayer = await multimedia.createAudioPlayer();
    expect(audioPlayer).toBeDefined();
    expect(typeof audioPlayer.play).toBe('function');
    expect(typeof audioPlayer.pause).toBe('function');
    expect(typeof audioPlayer.stop).toBe('function');
    expect(typeof audioPlayer.setVolume).toBe('function');
  });

  test('should create video player with required methods', async () => {
    const videoPlayer = await multimedia.createVideoPlayer();
    expect(videoPlayer).toBeDefined();
    expect(typeof videoPlayer.play).toBe('function');
    expect(typeof videoPlayer.pause).toBe('function');
    expect(typeof videoPlayer.stop).toBe('function');
    expect(typeof videoPlayer.setVolume).toBe('function');
  });

  test('should return supported formats correctly', () => {
    const formats = multimedia.getSupportedFormats();
    expect(formats).toBeDefined();
    expect(formats.audio).toBeDefined();
    expect(formats.video).toBeDefined();
    expect(Array.isArray(formats.audio)).toBe(true);
    expect(Array.isArray(formats.video)).toBe(true);
  });

  test('should handle disabled features gracefully', async () => {
    expect(() => multimedia.createStream('test-url', {})).rejects.toThrow('Streaming is not supported');
    expect(() => multimedia.getStreaming()).toThrow('Streaming is not supported');
    expect(() => multimedia.processAudio(Buffer.from('test'), {})).rejects.toThrow('Audio processing is not supported');
    expect(() => multimedia.getProcessor()).toThrow('Processing is not supported');
  });

  test('should initialize and destroy cleanly', async () => {
    const newMultimedia = new PowerScriptGraphics();
    await newMultimedia.initialize();
    expect(newMultimedia.capabilities.length).toBeGreaterThan(0);
    
    await newMultimedia.destroy();
    // Should not throw after destroy
  });
});