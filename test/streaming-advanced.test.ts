/**
 * Advanced Streaming Features Test Suite
 * Tests the PowerScript advanced streaming system with all providers
 */

import { PowerScriptStreaming } from '../src/multimedia/Streaming';
import type { 
  StreamingConfig, 
  StreamingProviderConfig,
  AdaptiveStreamConfig,
  ProgressiveStreamConfig,
  DynamicStreamConfig,
  StreamQuality 
} from '../src/multimedia/types';

describe('Advanced Streaming System', () => {
  let streaming: PowerScriptStreaming;

  beforeEach(() => {
    const config: StreamingConfig = {
      enableAdaptiveStreaming: true,
      enableProgressiveStreaming: true,
      enableDynamicStreaming: true,
      enableCaching: true,
      bufferSize: 5 * 1024 * 1024, // 5MB
      maxBandwidth: 10 * 1024 * 1024, // 10MB/s
      cacheConfig: {
        enabled: true,
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 1800000, // 30 minutes
        enableDiskCache: false
      }
    };

    streaming = new PowerScriptStreaming(config);
  });

  afterEach(async () => {
    // Clean up all streams
    for (const [streamId] of (streaming as any)._providers) {
      await streaming.destroyStream(streamId);
    }
  });

  describe('Progressive Streaming', () => {
    test('should create and initialize progressive stream', async () => {
      const config: ProgressiveStreamConfig = {
        protocol: 'http',
        quality: {
          name: '720p',
          label: '720p HD',
          bitrate: 2500000,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        bufferSize: 2 * 1024 * 1024,
        retryAttempts: 3,
        type: 'progressive',
        chunkSize: 1024 * 1024, // 1MB chunks
        preloadSize: 5 * 1024 * 1024, // 5MB preload
        preloadChunks: 5
      };

      const provider = await streaming.createStream('http://example.com/video.mp4', config);
      
      expect(provider).toBeDefined();
      expect(provider.id).toMatch(/^progressive_/);
      expect(provider.url).toBe('http://example.com/video.mp4');
      expect(provider.state).toBe('ready');
      
      const metrics = provider.getMetrics();
      expect(metrics.streamId).toBe(provider.id);
      expect(metrics.quality).toBe('progressive');
      expect(metrics.bufferHealth).toBe(100);
      
      const qualities = provider.getAvailableQualities();
      expect(qualities).toHaveLength(1);
      expect(qualities[0].name).toBe('720p');
    });

    test('should handle progressive stream lifecycle', async () => {
      const config: ProgressiveStreamConfig = {
        protocol: 'http',
        quality: {
          name: '480p',
          label: '480p',
          bitrate: 1000000,
          resolution: { width: 854, height: 480 },
          frameRate: 24
        },
        bufferSize: 1024 * 1024,
        retryAttempts: 2,
        type: 'progressive',
        chunkSize: 512 * 1024,
        preloadSize: 2 * 1024 * 1024
      };

      const provider = await streaming.createStream('http://example.com/movie.mp4', config);
      const streamId = provider.id;

      // Test stream lifecycle
      expect(streaming.getStreamState(streamId)).toBe('ready');
      
      await streaming.startStream(streamId);
      expect(streaming.getStreamState(streamId)).toBe('streaming');
      
      await streaming.stopStream(streamId);
      // After stopping, if it's the only stream, state goes to idle
      
      await streaming.destroyStream(streamId);
      expect(streaming.getStreamState(streamId)).toBe('idle');
    });
  });

  describe('Adaptive Streaming', () => {
    test('should create adaptive stream with multiple qualities', async () => {
      const qualities: StreamQuality[] = [
        {
          name: '240p',
          label: '240p',
          bitrate: 500000,
          resolution: { width: 426, height: 240 },
          frameRate: 30
        },
        {
          name: '480p',
          label: '480p',
          bitrate: 1000000,
          resolution: { width: 854, height: 480 },
          frameRate: 30
        },
        {
          name: '720p',
          label: '720p HD',
          bitrate: 2500000,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        {
          name: '1080p',
          label: '1080p Full HD',
          bitrate: 5000000,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30
        }
      ];

      const config: AdaptiveStreamConfig = {
        protocol: 'hls',
        quality: qualities[2], // Start with 720p
        bufferSize: 10 * 1024 * 1024,
        retryAttempts: 3,
        type: 'adaptive',
        qualities,
        adaptationAlgorithm: 'bandwidth',
        enableAutomaticSwitching: true,
        switchingStrategy: 'bandwidth-based'
      };

      const provider = await streaming.createStream('http://example.com/playlist.m3u8', config);
      
      expect(provider).toBeDefined();
      expect(provider.id).toMatch(/^adaptive_/);
      expect(provider.state).toBe('ready');
      
      const availableQualities = provider.getAvailableQualities();
      expect(availableQualities).toHaveLength(4);
      
      const currentQuality = provider.quality;
      expect(currentQuality.name).toMatch(/auto|720p/); // Could be auto or the configured quality
    });

    test('should support quality switching', async () => {
      const qualities: StreamQuality[] = [
        {
          name: '480p',
          label: '480p',
          bitrate: 1000000,
          resolution: { width: 854, height: 480 },
          frameRate: 30
        },
        {
          name: '720p',
          label: '720p HD',
          bitrate: 2500000,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        }
      ];

      const config: AdaptiveStreamConfig = {
        protocol: 'dash',
        quality: qualities[0],
        bufferSize: 5 * 1024 * 1024,
        retryAttempts: 2,
        type: 'adaptive',
        qualities,
        adaptationAlgorithm: 'hybrid',
        enableAutomaticSwitching: false
      };

      const provider = await streaming.createStream('http://example.com/manifest.mpd', config);
      const streamId = provider.id;
      
      // Switch to higher quality
      await streaming.switchQuality(streamId, qualities[1]);
      
      const metrics = streaming.getStreamMetrics(streamId);
      expect(metrics).toBeDefined();
      expect(metrics?.currentQuality.name).toMatch(/720p|auto/);
    });
  });

  describe('Dynamic Streaming', () => {
    test('should create dynamic stream with runtime updates', async () => {
      const config: DynamicStreamConfig = {
        protocol: 'webrtc',
        quality: {
          name: 'dynamic',
          label: 'Dynamic Quality',
          bitrate: 0, // Will be set dynamically
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        bufferSize: 3 * 1024 * 1024,
        retryAttempts: 5,
        type: 'dynamic',
        adaptToNetwork: true,
        maxQualitySwitch: 10,
        allowRuntimeUpdates: true
      };

      const provider = await streaming.createStream('webrtc://example.com/stream', config);
      
      expect(provider).toBeDefined();
      expect(provider.id).toMatch(/^dynamic_/);
      expect(provider.state).toBe('ready');
      
      const metrics = provider.getMetrics();
      expect(metrics.quality).toBe('dynamic');
      expect(metrics.streamId).toBe(provider.id);
    });

    test('should handle dynamic configuration updates', async () => {
      const config: DynamicStreamConfig = {
        protocol: 'rtmp',
        quality: {
          name: 'live',
          label: 'Live Stream',
          bitrate: 2000000,
          resolution: { width: 1920, height: 1080 },
          frameRate: 60
        },
        bufferSize: 2 * 1024 * 1024,
        retryAttempts: 3,
        type: 'dynamic',
        adaptToNetwork: true,
        maxQualitySwitch: 5,
        allowRuntimeUpdates: true
      };

      const provider = await streaming.createStream('rtmp://live.example.com/stream', config);
      
      expect(provider.quality.frameRate).toBe(60);
      
      // Test that the provider maintains its configuration
      const availableQualities = provider.getAvailableQualities();
      expect(availableQualities).toHaveLength(1);
      expect(availableQualities[0].name).toBe('live');
    });
  });

  describe('Multi-Stream Management', () => {
    test('should handle multiple concurrent streams', async () => {
      // Create progressive stream
      const progressiveConfig: ProgressiveStreamConfig = {
        protocol: 'http',
        quality: {
          name: '720p',
          label: '720p',
          bitrate: 2500000,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        bufferSize: 2 * 1024 * 1024,
        retryAttempts: 3,
        type: 'progressive',
        chunkSize: 1024 * 1024,
        preloadSize: 3 * 1024 * 1024
      };

      // Create adaptive stream
      const adaptiveConfig: AdaptiveStreamConfig = {
        protocol: 'hls',
        quality: {
          name: '480p',
          label: '480p',
          bitrate: 1000000,
          resolution: { width: 854, height: 480 },
          frameRate: 30
        },
        bufferSize: 5 * 1024 * 1024,
        retryAttempts: 2,
        type: 'adaptive',
        qualities: [
          {
            name: '480p',
            label: '480p',
            bitrate: 1000000,
            resolution: { width: 854, height: 480 },
            frameRate: 30
          }
        ],
        adaptationAlgorithm: 'bandwidth'
      };

      const provider1 = await streaming.createStream('http://example.com/video1.mp4', progressiveConfig);
      const provider2 = await streaming.createStream('http://example.com/playlist.m3u8', adaptiveConfig);

      expect(provider1.id).toMatch(/^progressive_/);
      expect(provider2.id).toMatch(/^adaptive_/);
      expect(provider1.id).not.toBe(provider2.id);

      // Both should be ready
      expect(streaming.getStreamState(provider1.id)).toBe('ready');
      expect(streaming.getStreamState(provider2.id)).toBe('ready');

      // Start both streams
      await streaming.startStream(provider1.id);
      await streaming.startStream(provider2.id);

      expect(streaming.getStreamState(provider1.id)).toBe('streaming');
      expect(streaming.getStreamState(provider2.id)).toBe('streaming');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid stream type', async () => {
      const config = {
        protocol: 'http' as const,
        quality: {
          name: '720p',
          label: '720p',
          bitrate: 2500000,
          resolution: { width: 1280, height: 720 },
          frameRate: 30
        },
        bufferSize: 2 * 1024 * 1024,
        retryAttempts: 3,
        type: 'invalid' as any
      };

      await expect(streaming.createStream('http://example.com/video.mp4', config))
        .rejects.toThrow('Unsupported stream type: invalid');
    });

    test('should handle missing stream operations', async () => {
      const nonExistentStreamId = 'nonexistent_stream_123';

      await expect(streaming.startStream(nonExistentStreamId))
        .rejects.toThrow('Stream not found: nonexistent_stream_123');

      await expect(streaming.switchQuality(nonExistentStreamId, {
        name: '720p',
        label: '720p',
        bitrate: 2500000,
        resolution: { width: 1280, height: 720 },
        frameRate: 30
      })).rejects.toThrow('Stream not found: nonexistent_stream_123');

      // Stop and destroy should not throw for non-existent streams
      await streaming.stopStream(nonExistentStreamId); // Should not throw
      await streaming.destroyStream(nonExistentStreamId); // Should not throw
    });
  });

  describe('Configuration and Metrics', () => {
    test('should provide accurate stream metrics', async () => {
      const config: ProgressiveStreamConfig = {
        protocol: 'http',
        quality: {
          name: '1080p',
          label: '1080p Full HD',
          bitrate: 5000000,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30
        },
        bufferSize: 10 * 1024 * 1024,
        retryAttempts: 3,
        type: 'progressive',
        chunkSize: 2 * 1024 * 1024,
        preloadSize: 8 * 1024 * 1024
      };

      const provider = await streaming.createStream('http://example.com/uhd-video.mp4', config);
      const metrics = streaming.getStreamMetrics(provider.id);

      expect(metrics).toBeDefined();
      expect(metrics!.streamId).toBe(provider.id);
      expect(metrics!.quality).toBe('progressive');
      expect(metrics!.bufferHealth).toBe(100);
      expect(metrics!.droppedFrames).toBe(0);
      expect(metrics!.playbackStalls).toBe(0);
      expect(metrics!.currentQuality.name).toMatch(/1080p|auto/);
    });

    test('should support configuration validation', () => {
      // Test that the streaming instance is properly configured
      expect(streaming.config.enableAdaptiveStreaming).toBe(true);
      expect(streaming.config.enableProgressiveStreaming).toBe(true);
      expect(streaming.config.enableDynamicStreaming).toBe(true);
      expect(streaming.config.enableCaching).toBe(true);
      expect(streaming.config.bufferSize).toBe(5 * 1024 * 1024);
      expect(streaming.config.maxBandwidth).toBe(10 * 1024 * 1024);
    });
  });
});