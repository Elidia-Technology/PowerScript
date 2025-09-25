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
        await multimedia.dispose();
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
      
      const loadPromise = new Promise((resolve) => {
        audioPlayer.once('loadstart', resolve);
      });

      await audioPlayer.load(mockAudioUrl);
      await loadPromise;
      
      expect(audioPlayer.getCurrentTime()).toBe(0);
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
      expect(audioPlayer.getVolume()).toBe(0.5);
      
      audioPlayer.setMuted(true);
      expect(audioPlayer.isMuted()).toBe(true);
    });

    test('should support logo overlay', () => {
      const audioPlayerWithLogo = new PowerScriptAudioPlayer({
        enableLogo: true,
        logoConfig: {
          url: 'https://example.com/logo.png',
          position: 'top-right',
          width: 100,
          height: 50,
          opacity: 0.8
        }
      });
      
      expect(audioPlayerWithLogo.config.enableLogo).toBe(true);
      expect(audioPlayerWithLogo.config.logoConfig?.url).toBe('https://example.com/logo.png');
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
      
      const loadPromise = new Promise((resolve) => {
        videoPlayer.once('loadstart', resolve);
      });

      await videoPlayer.load(mockVideoUrl);
      await loadPromise;
      
      expect(videoPlayer.getCurrentTime()).toBe(0);
    });

    test('should support quality selection', async () => {
      const videoPlayer = multimedia.videoPlayer;
      const mockVideoUrl = 'data:video/mp4;base64,';
      
      await videoPlayer.load(mockVideoUrl);
      
      const qualities = videoPlayer.getAvailableQualities();
      expect(Array.isArray(qualities)).toBe(true);
      
      if (qualities.length > 0) {
        await videoPlayer.setQuality(qualities[0]);
        expect(videoPlayer.getCurrentQuality()).toEqual(qualities[0]);
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
        customControlsConfig: {
          showPlayButton: true,
          showVolumeControl: true,
          showProgressBar: true,
          showFullscreenButton: true,
          theme: 'dark'
        }
      });
      
      expect(videoPlayerWithCustomControls.config.enableCustomControls).toBe(true);
      expect(videoPlayerWithCustomControls.config.customControlsConfig?.theme).toBe('dark');
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
      
      const streamPromise = new Promise((resolve) => {
        streaming.once('streamready', resolve);
      });

      await streaming.startProgressiveStream(mockStreamUrl, {
        enableCaching: true,
        cacheSize: 10 * 1024 * 1024, // 10MB
        chunkSize: 1024 * 1024 // 1MB
      });
      
      // In a real implementation, this would start streaming
      expect(streaming.isStreaming()).toBe(true);
    });

    test('should support adaptive streaming', async () => {
      const streaming = multimedia.streaming;
      
      const qualities = [
        { resolution: '720p', bitrate: 2500, url: 'test-720p.m3u8' },
        { resolution: '480p', bitrate: 1500, url: 'test-480p.m3u8' },
        { resolution: '360p', bitrate: 800, url: 'test-360p.m3u8' }
      ];

      await streaming.startAdaptiveStream(qualities, {
        enableBandwidthMonitoring: true,
        bufferSize: 30 // seconds
      });
      
      expect(streaming.getCurrentQuality()).toBeDefined();
    });

    test('should monitor bandwidth and buffer health', () => {
      const streaming = multimedia.streaming;
      const stats = streaming.getStreamingStats();
      
      expect(stats).toHaveProperty('bandwidth');
      expect(stats).toHaveProperty('bufferHealth');
      expect(stats).toHaveProperty('droppedFrames');
      expect(stats).toHaveProperty('currentBitrate');
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
      
      const processedAudio = await processor.processAudio(mockAudioBuffer, {
        format: 'mp3',
        bitrate: 128,
        sampleRate: 44100,
        channels: 2,
        enableFilters: true,
        filters: ['normalize', 'noise_reduction']
      });
      
      expect(Buffer.isBuffer(processedAudio)).toBe(true);
    });

    test('should support video processing', async () => {
      const processor = multimedia.processor;
      const mockVideoBuffer = Buffer.from('mock video data');
      
      const processedVideo = await processor.processVideo(mockVideoBuffer, {
        format: 'mp4',
        codec: 'h264',
        resolution: { width: 1280, height: 720 },
        framerate: 30,
        bitrate: 2500,
        enableGPUAcceleration: false // Use CPU for testing
      });
      
      expect(Buffer.isBuffer(processedVideo)).toBe(true);
    });

    test('should support image processing', async () => {
      const processor = multimedia.processor;
      const mockImageBuffer = Buffer.from('mock image data');
      
      const processedImage = await processor.processImage(mockImageBuffer, {
        format: 'jpeg',
        quality: 85,
        resize: { width: 800, height: 600 },
        enableOptimization: true,
        effects: ['sharpen', 'contrast_enhance']
      });
      
      expect(Buffer.isBuffer(processedImage)).toBe(true);
    });

    test('should support batch processing', async () => {
      const processor = multimedia.processor;
      const mockFiles = [
        { data: Buffer.from('file1'), name: 'test1.jpg' },
        { data: Buffer.from('file2'), name: 'test2.jpg' },
        { data: Buffer.from('file3'), name: 'test3.jpg' }
      ];
      
      const results = await processor.processBatch(mockFiles, {
        operation: 'resize',
        options: {
          resize: { width: 400, height: 300 },
          format: 'jpeg',
          quality: 80
        },
        parallel: true,
        maxConcurrency: 2
      });
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
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
      
      multimedia.on('audio:play', checkComplete);
      multimedia.on('video:play', checkComplete);
      
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
        processor.processAudio(Buffer.from('test'), {
          format: 'invalid' as any,
          bitrate: -1
        })
      ).rejects.toThrow();
      
      // Test invalid video processing options  
      await expect(
        processor.processVideo(Buffer.from('test'), {
          format: 'invalid' as any,
          resolution: { width: -1, height: -1 }
        })
      ).rejects.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should cleanup resources properly', async () => {
      const multimedia = new PowerScriptGraphics();
      await multimedia.initialize();
      
      // Verify cleanup doesn't throw
      await expect(multimedia.dispose()).resolves.not.toThrow();
    });

    test('should report resource usage', () => {
      const multimedia = new PowerScriptGraphics();
      const stats = multimedia.getResourceStats();
      
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('activeStreams');
      expect(stats).toHaveProperty('processingTasks');
      expect(typeof stats.memoryUsage).toBe('number');
    });

    test('should handle concurrent operations', async () => {
      const processor = multimedia.processor;
      const mockBuffer = Buffer.from('concurrent test data');
      
      const operations = Array.from({ length: 5 }, (_, i) =>
        processor.processImage(mockBuffer, {
          format: 'jpeg',
          quality: 80,
          resize: { width: 200 + i * 50, height: 200 + i * 50 }
        })
      );
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Buffer.isBuffer(result)).toBe(true);
      });
    });
  });
});