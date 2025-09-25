/**
 * PowerScript Graphics & Multimedia Module - Simple Working Test
 * 
 * Basic functionality testing to validate the multimedia module works correctly.
 */

import { PowerScriptGraphics } from '../src/multimedia';

describe('PowerScript Graphics & Multimedia Module - Basic Tests', () => {
  let multimedia: PowerScriptGraphics;

  beforeEach(() => {
    multimedia = new PowerScriptGraphics({
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: true,
      enableProcessing: true
    });
  });

  describe('Module Initialization', () => {
    test('should create multimedia module successfully', () => {
      expect(multimedia).toBeDefined();
      expect(multimedia).toBeInstanceOf(PowerScriptGraphics);
    });

    test('should have all components initialized', () => {
      expect(multimedia.audioPlayer).toBeDefined();
      expect(multimedia.videoPlayer).toBeDefined();
      expect(multimedia.streaming).toBeDefined();
      expect(multimedia.processor).toBeDefined();
    });

    test('should have correct configuration', () => {
      expect(multimedia.config.enableAudioPlayer).toBe(true);
      expect(multimedia.config.enableVideoPlayer).toBe(true);
      expect(multimedia.config.enableStreaming).toBe(true);
      expect(multimedia.config.enableProcessing).toBe(true);
    });
  });

  describe('Audio Player Basic Functionality', () => {
    test('should have audio player with basic methods', () => {
      const audioPlayer = multimedia.audioPlayer;
      
      expect(typeof audioPlayer.load).toBe('function');
      expect(typeof audioPlayer.play).toBe('function');
      expect(typeof audioPlayer.pause).toBe('function');
      expect(typeof audioPlayer.stop).toBe('function');
    });

    test('should handle basic audio control methods', () => {
      const audioPlayer = multimedia.audioPlayer;
      
      // These should not throw errors
      expect(() => audioPlayer.getCurrentTime()).not.toThrow();
      expect(() => audioPlayer.getDuration()).not.toThrow();
      expect(() => audioPlayer.getState()).not.toThrow();
    });
  });

  describe('Video Player Basic Functionality', () => {
    test('should have video player with basic methods', () => {
      const videoPlayer = multimedia.videoPlayer;
      
      expect(typeof videoPlayer.load).toBe('function');
      expect(typeof videoPlayer.play).toBe('function');
      expect(typeof videoPlayer.pause).toBe('function');
      expect(typeof videoPlayer.stop).toBe('function');
    });

    test('should handle basic video control methods', () => {
      const videoPlayer = multimedia.videoPlayer;
      
      // These should not throw errors
      expect(() => videoPlayer.getCurrentTime()).not.toThrow();
      expect(() => videoPlayer.getDuration()).not.toThrow();
      expect(() => videoPlayer.getState()).not.toThrow();
    });

    test('should have video-specific methods', () => {
      const videoPlayer = multimedia.videoPlayer;
      
      expect(typeof videoPlayer.getAvailableQualities).toBe('function');
      expect(typeof videoPlayer.enterFullscreen).toBe('function');
      expect(typeof videoPlayer.exitFullscreen).toBe('function');
    });
  });

  describe('Streaming Basic Functionality', () => {
    test('should have streaming provider with basic methods', () => {
      const streaming = multimedia.streaming;
      
      expect(streaming).toBeDefined();
      expect(typeof streaming.getStreamState).toBe('function');
    });
  });

  describe('Processing Basic Functionality', () => {
    test('should have media processor with basic methods', () => {
      const processor = multimedia.processor;
      
      expect(processor).toBeDefined();
      expect(typeof processor.processAudio).toBe('function');
      expect(typeof processor.processVideo).toBe('function');
      expect(typeof processor.processImage).toBe('function');
    });

    test('should handle basic processing calls without throwing', () => {
      const processor = multimedia.processor;
      const mockBuffer = Buffer.from('test data');
      
      const audioInputFormat = {
        name: 'WAV',
        extension: 'wav',
        type: 'audio' as const,
        mimeType: 'audio/wav'
      };
      
      const audioOutputFormat = {
        name: 'MP3',
        extension: 'mp3', 
        type: 'audio' as const,
        mimeType: 'audio/mpeg'
      };
      
      const videoInputFormat = {
        name: 'MP4',
        extension: 'mp4',
        type: 'video' as const,
        mimeType: 'video/mp4'
      };
      
      const videoOutputFormat = {
        name: 'WebM',
        extension: 'webm',
        type: 'video' as const,
        mimeType: 'video/webm'
      };
      
      const imageInputFormat = {
        name: 'PNG',
        extension: 'png',
        type: 'image' as const,
        mimeType: 'image/png'
      };
      
      const imageOutputFormat = {
        name: 'JPEG',
        extension: 'jpeg',
        type: 'image' as const,
        mimeType: 'image/jpeg'
      };
      
      // These should not throw synchronously
      expect(() => {
        processor.processAudio(mockBuffer, {
          type: 'audio',
          operation: 'convert',
          inputFormat: audioInputFormat,
          outputFormat: audioOutputFormat
        });
      }).not.toThrow();
      
      expect(() => {
        processor.processVideo(mockBuffer, {
          type: 'video',
          operation: 'convert',
          inputFormat: videoInputFormat,
          outputFormat: videoOutputFormat
        });
      }).not.toThrow();
      
      expect(() => {
        processor.processImage(mockBuffer, {
          type: 'image',
          operation: 'convert',
          inputFormat: imageInputFormat,
          outputFormat: imageOutputFormat
        });
      }).not.toThrow();
    });
  });

  describe('Configuration Options', () => {
    test('should allow selective component enabling', () => {
      const selectiveMultimedia = new PowerScriptGraphics({
        enableAudioPlayer: true,
        enableVideoPlayer: false,
        enableStreaming: true,
        enableProcessing: false
      });
      
      expect(selectiveMultimedia.config.enableAudioPlayer).toBe(true);
      expect(selectiveMultimedia.config.enableVideoPlayer).toBe(false);
      expect(selectiveMultimedia.config.enableStreaming).toBe(true);
      expect(selectiveMultimedia.config.enableProcessing).toBe(false);
    });

    test('should use default configuration when none provided', () => {
      const defaultMultimedia = new PowerScriptGraphics();
      
      expect(defaultMultimedia.config.enableAudioPlayer).toBe(true);
      expect(defaultMultimedia.config.enableVideoPlayer).toBe(true);
      expect(defaultMultimedia.config.enableStreaming).toBe(true);
      expect(defaultMultimedia.config.enableProcessing).toBe(true);
    });
  });

  describe('Event System', () => {
    test('should be an EventEmitter', () => {
      expect(typeof multimedia.on).toBe('function');
      expect(typeof multimedia.emit).toBe('function');
      expect(typeof multimedia.removeListener).toBe('function');
    });

    test('should handle event listeners', (done) => {
      multimedia.on('test-event', (data) => {
        expect(data).toBe('test-data');
        done();
      });
      
      multimedia.emit('test-event', 'test-data');
    });
  });
});