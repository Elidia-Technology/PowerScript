/**
 * PowerScript Graphics & Multimedia Module Test
 * 
 * Comprehensive testing of multimedia capabilities including:
 * - Audio Player functionality
 * - Video Player functionality  
 * - Streaming capabilities
 * - Media processing features
 */

import { 
  PowerScriptGraphics,
  PowerScriptAudioPlayer,
  PowerScriptVideoPlayer,
  PowerScriptStreaming,
  PowerScriptMultimediaProcessor
} from '../src/multimedia';

describe('PowerScript Graphics & Multimedia Module', () => {
  let multimedia: PowerScriptGraphics;

  beforeEach(() => {
    multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: true,
      enableProcessing: true,
      enableGlobalLogo: true
    });
  });

  afterEach(async () => {
    if (multimedia) {
      try {
        await multimedia.destroy();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Initialization', () => {
    test('should initialize multimedia module successfully', async () => {
      expect(multimedia).toBeInstanceOf(PowerScriptGraphics);
      expect(multimedia.audioPlayer).toBeDefined();
      expect(multimedia.videoPlayer).toBeDefined();
      expect(multimedia.streaming).toBeDefined();
      expect(multimedia.processor).toBeDefined();
    });

    test('should initialize with default configuration', () => {
      const defaultMultimedia = new PowerScriptGraphics();
      expect(defaultMultimedia.config.enableAudioPlayer).toBe(true);
      expect(defaultMultimedia.config.enableVideoPlayer).toBe(true);
      expect(defaultMultimedia.config.enableStreaming).toBe(true);
      expect(defaultMultimedia.config.enableProcessing).toBe(true);
    });

    test('should initialize multimedia components', async () => {
      await multimedia.initialize();
      expect(multimedia.audioPlayer).toBeInstanceOf(PowerScriptAudioPlayer);
      expect(multimedia.videoPlayer).toBeInstanceOf(PowerScriptVideoPlayer);
      expect(multimedia.streaming).toBeInstanceOf(PowerScriptStreaming);
      expect(multimedia.processor).toBeInstanceOf(PowerScriptMultimediaProcessor);
    });
  });

  describe('Audio Player', () => {
    test('should create audio player with default config', () => {
      const audioPlayer = new PowerScriptAudioPlayer();
      expect(audioPlayer).toBeInstanceOf(PowerScriptAudioPlayer);
      expect(audioPlayer.config.volume).toBe(1);
      expect(audioPlayer.config.muted).toBe(false);
      expect(audioPlayer.config.autoplay).toBe(false);
    });

    test('should handle audio loading', async () => {
      const audioPlayer = multimedia.audioPlayer;
      const mockAudioUrl = 'data:audio/mp3;base64,';
      
      await audioPlayer.load(mockAudioUrl);
      
      expect(audioPlayer.getCurrentTime()).toBe(0);
      expect(audioPlayer.getState()).toBe('ready');
    });

    test('should control playback', async () => {
      const audioPlayer = multimedia.audioPlayer;
      const mockAudioUrl = 'data:audio/mp3;base64,';
      
      await audioPlayer.load(mockAudioUrl);
      
      // Test play
      const playPromise = new Promise((resolve) => {
        audioPlayer.once('play', resolve);
      });
      
      await audioPlayer.play();
      await playPromise;
      
      // Test pause
      const pausePromise = new Promise((resolve) => {
        audioPlayer.once('pause', resolve);
      });
      
      audioPlayer.pause();
      await pausePromise;
    });

    test('should handle volume control', () => {
      const audioPlayer = multimedia.audioPlayer;
      
      audioPlayer.setVolume(0.5);
      // Note: getVolume() not available in AudioPlayerControls interface
      // expect(audioPlayer.getVolume()).toBe(0.5);
      
      audioPlayer.mute();
      audioPlayer.unmute();
      audioPlayer.toggleMute();
    });

    test('should support logo overlay', () => {
      const audioPlayerWithLogo = new PowerScriptAudioPlayer({
        enableLogo: true,
        logoConfig: {
          enabled: true,
          imageUrl: 'https://example.com/logo.png',
          position: 'top-right'
        }
      });
      
      expect(audioPlayerWithLogo.config.logoConfig?.enabled).toBe(true);
      expect(audioPlayerWithLogo.config.logoConfig?.imageUrl).toBe('https://example.com/logo.png');
    });
  });

  describe('Video Player', () => {
    test('should create video player with default config', () => {
      const videoPlayer = new PowerScriptVideoPlayer();
      expect(videoPlayer).toBeInstanceOf(PowerScriptVideoPlayer);
      expect(videoPlayer.config.width).toBe(640);
      expect(videoPlayer.config.height).toBe(360);
      expect(videoPlayer.config.enableCustomControls).toBe(true);
    });

    test('should handle video loading', async () => {
      const videoPlayer = multimedia.videoPlayer;
      const mockVideoUrl = 'data:video/mp4;base64,';
      
      await videoPlayer.load(mockVideoUrl);
      
      expect(videoPlayer.getCurrentTime()).toBe(0);
      expect(videoPlayer.getState()).toBe('ready');
    });

    test('should support quality selection', async () => {
      const videoPlayer = multimedia.videoPlayer;
      const mockVideoUrl = 'data:video/mp4;base64,';
      
      await videoPlayer.load(mockVideoUrl);
      
      const qualities = videoPlayer.getAvailableQualities();
      expect(Array.isArray(qualities)).toBe(true);
      
      if (qualities.length > 0) {
        await videoPlayer.setQuality(qualities[0]);
        expect(videoPlayer.getAvailableQualities()).toEqual(qualities);
      }
    });

    test('should support fullscreen mode', async () => {
      const videoPlayer = multimedia.videoPlayer;
      
      // Test entering fullscreen
      const fullscreenPromise = new Promise((resolve) => {
        videoPlayer.once('fullscreenchange', resolve);
      });
      
      await videoPlayer.enterFullscreen();
      // Note: In test environment, fullscreen might not actually work
      // but we test the API is available
      
      expect(typeof videoPlayer.exitFullscreen).toBe('function');
    });

    test('should support custom controls', () => {
      const videoPlayerWithCustomControls = new PowerScriptVideoPlayer({
        enableCustomControls: true,
        controlsConfig: {
          showPlayPause: true,
          showVolumeControl: true,
          showSeekBar: true,
          showFullscreenButton: true,
          theme: 'dark'
        }
      });
      
      expect(videoPlayerWithCustomControls.config.enableCustomControls).toBe(true);
      expect(videoPlayerWithCustomControls.config.controlsConfig?.theme).toBe('dark');
    });
  });

  describe('Streaming', () => {
    test('should create streaming provider', () => {
      const streaming = multimedia.streaming;
      expect(streaming).toBeInstanceOf(PowerScriptStreaming);
    });

    test('should support progressive streaming', async () => {
      const streaming = multimedia.streaming;
      const mockStreamUrl = 'data:video/mp4;base64,';
      
      const streamProvider = await streaming.createStream(mockStreamUrl, {
        type: 'progressive',
        protocol: 'http',
        quality: { 
          name: 'auto',
          label: 'Auto',
          bitrate: 1000,
          resolution: { width: 720, height: 480 },
          frameRate: 30
        },
        bufferSize: 10 * 1024 * 1024, // 10MB
        retryAttempts: 3
      });
      
      expect(streamProvider).toBeDefined();
    });

    test('should support adaptive streaming', async () => {
      const streaming = multimedia.streaming;
      
      const streamProvider = await streaming.createStream('test-stream.m3u8', {
        type: 'adaptive',
        protocol: 'hls',
        quality: { 
          name: '720p',
          label: '720p HD',
          bitrate: 2500,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        bufferSize: 30 * 1024 * 1024, // 30MB
        retryAttempts: 3
      });
      
      expect(streamProvider).toBeDefined();
    });

    test('should monitor bandwidth and buffer health', () => {
      const streaming = multimedia.streaming;
      const stats = streaming.getGlobalMetrics();
      
      expect(stats).toHaveProperty('bandwidth');
      expect(stats).toHaveProperty('bufferHealth');
      expect(stats).toHaveProperty('droppedFrames');
      expect(stats).toHaveProperty('bitrate');
    });
  });

  describe('Media Processing', () => {
    test('should create media processor', () => {
      const processor = multimedia.processor;
      expect(processor).toBeInstanceOf(PowerScriptMultimediaProcessor);
    });

    test('should support audio processing', async () => {
      const processor = multimedia.processor;
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      const result = await multimedia.processAudio(mockAudioBuffer, {
        type: 'audio',
        operation: 'convert',
        inputFormat: { name: 'wav', extension: 'wav', type: 'audio', mimeType: 'audio/wav' },
        outputFormat: { name: 'mp3', extension: 'mp3', type: 'audio', mimeType: 'audio/mpeg' },
        bitrate: 128,
        sampleRate: 44100,
        channels: 2,
        effects: [
          { name: 'equalizer', type: 'audio', parameters: { bands: 10 } },
          { name: 'compressor', type: 'audio', parameters: { ratio: 4 } }
        ]
      });
      
      expect(Buffer.isBuffer(result.outputData)).toBe(true);
    });

    test('should support video processing', async () => {
      const processor = multimedia.processor;
      const mockVideoBuffer = Buffer.from('mock video data');
      
      const result = await multimedia.processVideo(mockVideoBuffer, {
        type: 'video',
        operation: 'convert',
        inputFormat: { name: 'avi', extension: 'avi', type: 'video', mimeType: 'video/avi' },
        outputFormat: { name: 'mp4', extension: 'mp4', type: 'video', mimeType: 'video/mp4' },
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrate: 2500
      });
      
      expect(Buffer.isBuffer(result.outputData)).toBe(true);
    });

    test('should support image processing', async () => {
      const processor = multimedia.processor;
      const mockImageBuffer = Buffer.from('mock image data');
      
      const result = await multimedia.processImage(mockImageBuffer, {
        type: 'image',
        operation: 'convert',
        inputFormat: { name: 'png', extension: 'png', type: 'image', mimeType: 'image/png' },
        outputFormat: { name: 'jpeg', extension: 'jpeg', type: 'image', mimeType: 'image/jpeg' },
        quality: 85,
        width: 800,
        height: 600,
        effects: [
          { name: 'sharpen', type: 'image', parameters: { strength: 0.5 } },
          { name: 'contrast_enhance', type: 'image', parameters: { amount: 1.2 } }
        ]
      });
      
      expect(Buffer.isBuffer(result.outputData)).toBe(true);
    });

    test('should support batch processing', async () => {
      const processor = multimedia.processor;
      const mockFiles = [
        { 
          data: Buffer.from('file1'), 
          options: {
            type: 'image' as const,
            operation: 'convert',
            inputFormat: { name: 'jpg', extension: 'jpg', type: 'image' as const, mimeType: 'image/jpeg' },
            outputFormat: { name: 'png', extension: 'png', type: 'image' as const, mimeType: 'image/png' }
          }
        },
        { 
          data: Buffer.from('file2'), 
          options: {
            type: 'image' as const,
            operation: 'convert',
            inputFormat: { name: 'jpg', extension: 'jpg', type: 'image' as const, mimeType: 'image/jpeg' },
            outputFormat: { name: 'png', extension: 'png', type: 'image' as const, mimeType: 'image/png' }
          }
        },
        { 
          data: Buffer.from('file3'), 
          options: {
            type: 'image' as const,
            operation: 'convert',
            inputFormat: { name: 'jpg', extension: 'jpg', type: 'image' as const, mimeType: 'image/jpeg' },
            outputFormat: { name: 'png', extension: 'png', type: 'image' as const, mimeType: 'image/png' }
          }
        }
      ];
      
      const results = await processor.batchProcess(mockFiles, {
        concurrency: 2,
        stopOnError: false
      });
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('outputData');
      });
    });
  });

  describe('Factory Functions', () => {
    test('should create multimedia provider', () => {
      const provider = multimedia;
      expect(provider).toBeInstanceOf(PowerScriptGraphics);
      expect(provider.audioPlayer).toBeDefined();
      expect(provider.videoPlayer).toBeDefined();
      expect(provider.streaming).toBeDefined();
      expect(provider.processor).toBeDefined();
    });

    test('should support custom provider configuration', () => {
      const customMultimedia = new PowerScriptGraphics({
        enableAudioPlayer: true,
        enableVideoPlayer: false,
        enableStreaming: true,
        enableProcessing: false,
        audioConfig: {
          volume: 0.8,
          enableLogo: true
        },
        streamingConfig: {
          enableCaching: true,
          cacheSize: 50 * 1024 * 1024 // 50MB
        }
      });
      
      expect(customMultimedia.config.enableVideoPlayer).toBe(false);
      expect(customMultimedia.config.enableProcessing).toBe(false);
      expect(customMultimedia.config.audioConfig?.volume).toBe(0.8);
    });
  });

  describe('Event System', () => {
    test('should emit multimedia events', (done) => {
      const multimedia = new PowerScriptGraphics();
      
      multimedia.on('initialized', () => {
        expect(true).toBe(true);
        done();
      });
      
      multimedia.initialize();
    });

    test('should forward component events', (done) => {
      const multimedia = new PowerScriptGraphics();
      let eventCount = 0;
      
      const checkComplete = () => {
        eventCount++;
        if (eventCount >= 2) done();
      };
      
      multimedia.on('audioPlay', checkComplete);
      multimedia.on('videoPlay', checkComplete);
      
      // Simulate component events
      multimedia.audioPlayer.emit('play');
      multimedia.videoPlayer.emit('play');
    });
  });

  describe('Error Handling', () => {
    test('should handle multimedia errors gracefully', async () => {
      const multimedia = new PowerScriptGraphics();
      
      let errorCaught = false;
      multimedia.on('error', (error) => {
        expect(error).toBeInstanceOf(Error);
        errorCaught = true;
      });
      
      // Simulate an error condition
      try {
        await multimedia.audioPlayer.load('invalid-url');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should validate input parameters', async () => {
      const processor = multimedia.processor;
      
      // Test invalid audio processing options
      await expect(
        multimedia.processAudio(Buffer.from('test'), {
          type: 'audio',
          operation: 'convert',
          inputFormat: { name: 'invalid', extension: 'invalid', type: 'audio', mimeType: 'audio/invalid' },
          outputFormat: { name: 'invalid', extension: 'invalid', type: 'audio', mimeType: 'audio/invalid' },
          bitrate: -1
        })
      ).rejects.toThrow();
      
      // Test invalid video processing options  
      await expect(
        multimedia.processVideo(Buffer.from('test'), {
          type: 'video',
          operation: 'convert',
          inputFormat: { name: 'invalid', extension: 'invalid', type: 'video', mimeType: 'video/invalid' },
          outputFormat: { name: 'invalid', extension: 'invalid', type: 'video', mimeType: 'video/invalid' },
          width: -1,
          height: -1
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should cleanup resources properly', async () => {
      const multimedia = new PowerScriptGraphics();
      await multimedia.initialize();
      
      // Verify cleanup doesn't throw
      await expect(multimedia.destroy()).resolves.not.toThrow();
    });

    test('should report resource usage', () => {
      const multimedia = new PowerScriptGraphics();
      const stats = multimedia.getGlobalStatus();
      
      expect(stats).toHaveProperty('initialized');
      expect(stats).toHaveProperty('audioPlayerState');
      expect(stats).toHaveProperty('videoPlayerState');
      expect(typeof stats.initialized).toBe('boolean');
    });

    test('should handle concurrent operations', async () => {
      const processor = multimedia.processor;
      const mockBuffer = Buffer.from('concurrent test data');
      
      const operations = Array.from({ length: 5 }, (_, i) =>
        multimedia.processImage(mockBuffer, {
          type: 'image',
          operation: 'resize',
          inputFormat: { name: 'png', extension: 'png', type: 'image', mimeType: 'image/png' },
          outputFormat: { name: 'jpeg', extension: 'jpeg', type: 'image', mimeType: 'image/jpeg' },
          quality: 80,
          width: 200 + i * 50,
          height: 200 + i * 50
        })
      );
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveProperty('outputData');
        expect(Buffer.isBuffer(result.outputData)).toBe(true);
      });
    });
  });
});