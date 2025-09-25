import { EventEmitter } from 'events';
import { PowerScriptAudioPlayer } from './AudioPlayer';
import { PowerScriptVideoPlayer } from './VideoPlayer';
import { PowerScriptStreaming } from './Streaming';
import { PowerScriptMultimediaProcessor } from './Processing';
import type {
  MultimediaProvider,
  MultimediaConfig,
  AudioPlayerConfig,
  VideoPlayerConfig,
  StreamingConfig,
  MultimediaProcessorConfig,
  AudioPlayer,
  VideoPlayer,
  StreamingProvider,
  MultimediaProcessor,
  MediaState,
  MediaMetadata,
  ProcessingResult,
  AudioProcessingOptions,
  VideoProcessingOptions,
  ImageProcessingOptions,
  AudioFormat,
  VideoFormat
} from './types';
import { MultimediaError } from './types';

/**
 * PowerScript Graphics & Multimedia Module (Phase 15)
 * 
 * Complete multimedia system providing:
 * 
 * 🎵 Audio Features:
 * - HTML5 Audio wrapper with enhanced controls and logo overlay support
 * - Cross-platform compatibility (browser HTMLAudioElement + Node.js mock)
 * - Advanced audio processing (filters, effects, format conversion, compression)
 * 
 * 🎬 Video Features:
 * - Custom HTML5 Video player with full control customization and logo branding
 * - Quality selection, fullscreen support, custom control overlays
 * - Advanced video processing (editing, effects, transcoding, compression)
 * 
 * 📡 Streaming Features:
 * - Progressive video streaming with filesystem integration and caching
 * - Adaptive bitrate streaming with automatic quality switching
 * - Dynamic streaming with real-time configuration updates
 * - Comprehensive bandwidth monitoring and buffer management
 * 
 * 🛠️ Processing Features:
 * - Cross-format media conversion (audio, video, image)
 * - Real-time processing with progress monitoring and cancellation
 * - Batch processing capabilities for multiple files
 * - Hardware acceleration support where available
 * 
 * 🏗️ Architecture:
 * - TypeScript-first with comprehensive type definitions
 * - EventEmitter-based patterns for real-time updates
 * - Modular design with pluggable components
 * - Cross-platform compatibility and mock implementations for testing
 */

export class PowerScriptGraphics extends EventEmitter implements MultimediaProvider {
  public readonly name = 'PowerScriptGraphics';
  public readonly capabilities = ['audio', 'video', 'streaming', 'processing'];
  public readonly config: MultimediaConfig;
  public readonly audioPlayer: AudioPlayer;
  public readonly videoPlayer: VideoPlayer;
  public readonly streaming: StreamingProvider;
  public readonly processor: MultimediaProcessor;

  private _initialized = false;

  constructor(config: MultimediaConfig = {}) {
    super();
    
    this.config = {
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: true,
      enableProcessing: true,
      enableGlobalLogo: false,
      ...config
    };

    // Initialize components based on configuration
    this.audioPlayer = new PowerScriptAudioPlayer(this.config.audioConfig);
    this.videoPlayer = new PowerScriptVideoPlayer(this.config.videoConfig);
    this.streaming = new PowerScriptStreaming(this.config.streamingConfig);
    this.processor = new PowerScriptMultimediaProcessor(this.config.processingConfig);

    // Set up component event forwarding
    this._setupEventForwarding();
  }

  // ============================================================================
  // PUBLIC API - MultimediaProvider Implementation
  // ============================================================================

  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      this.emit('initializing');

      // Initialize all components
      const initPromises: Promise<void>[] = [];

      // Audio player is ready by default (no async init required)
      
      // Video player is ready by default (no async init required)

      // Streaming may need initialization
      // Note: Streaming initializes on-demand when streams are created

      // Processor is ready by default (no async init required)

      await Promise.all(initPromises);

      this._initialized = true;
      this.emit('initialized');

    } catch (error) {
      const initError = new MultimediaError(
        `Failed to initialize PowerScript Graphics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED',
        { originalError: error }
      );
      this.emit('error', initError);
      throw initError;
    }
  }

  // ============================================================================
  // AUDIO API
  // ============================================================================

  async createAudioPlayer(config?: AudioPlayerConfig): Promise<AudioPlayer> {
    if (!this.config.enableAudioPlayer) {
      throw new MultimediaError(
        'Audio player is disabled',
        'FEATURE_DISABLED',
        { feature: 'audioPlayer' }
      );
    }

    const playerConfig = { ...this.config.audioConfig, ...config };
    const player = new PowerScriptAudioPlayer(playerConfig);
    
    this.emit('audioPlayerCreated', player);
    return player;
  }

  getAudioPlayer(): AudioPlayer {
    return this.audioPlayer;
  }

  // ============================================================================
  // VIDEO API
  // ============================================================================

  async createVideoPlayer(config?: VideoPlayerConfig): Promise<VideoPlayer> {
    if (!this.config.enableVideoPlayer) {
      throw new MultimediaError(
        'Video player is disabled',
        'FEATURE_DISABLED',
        { feature: 'videoPlayer' }
      );
    }

    const playerConfig = { ...this.config.videoConfig, ...config };
    const player = new PowerScriptVideoPlayer(playerConfig);
    
    this.emit('videoPlayerCreated', player);
    return player;
  }

  getVideoPlayer(): VideoPlayer {
    return this.videoPlayer;
  }

  // ============================================================================
  // STREAMING API
  // ============================================================================

  async createStream(url: string, streamConfig: any): Promise<any> {
    if (!this.config.enableStreaming) {
      throw new MultimediaError(
        'Streaming is disabled',
        'FEATURE_DISABLED',
        { feature: 'streaming' }
      );
    }

    const stream = await this.streaming.createStream(url, streamConfig);
    this.emit('streamCreated', stream);
    return stream;
  }

  getStreaming(): StreamingProvider {
    return this.streaming;
  }

  // ============================================================================
  // PROCESSING API
  // ============================================================================

  async processAudio(
    inputData: Buffer | string,
    options: AudioProcessingOptions
  ): Promise<ProcessingResult> {
    if (!this.config.enableProcessing) {
      throw new MultimediaError(
        'Processing is disabled',
        'FEATURE_DISABLED',
        { feature: 'processing' }
      );
    }

    return await this.processor.processAudio(inputData, options);
  }

  async processVideo(
    inputData: Buffer | string,
    options: VideoProcessingOptions
  ): Promise<ProcessingResult> {
    if (!this.config.enableProcessing) {
      throw new MultimediaError(
        'Processing is disabled',
        'FEATURE_DISABLED',
        { feature: 'processing' }
      );
    }

    return await this.processor.processVideo(inputData, options);
  }

  async processImage(
    inputData: Buffer | string,
    options: ImageProcessingOptions
  ): Promise<ProcessingResult> {
    if (!this.config.enableProcessing) {
      throw new MultimediaError(
        'Processing is disabled',
        'FEATURE_DISABLED',
        { feature: 'processing' }
      );
    }

    return await this.processor.processImage(inputData, options);
  }

  async batchProcess(
    inputs: Array<{ data: Buffer | string; options: any }>,
    batchOptions?: { concurrency?: number; stopOnError?: boolean }
  ): Promise<ProcessingResult[]> {
    if (!this.config.enableProcessing) {
      throw new MultimediaError(
        'Processing is disabled',
        'FEATURE_DISABLED',
        { feature: 'processing' }
      );
    }

    return await this.processor.batchProcess(inputs, batchOptions);
  }

  getProcessor(): MultimediaProcessor {
    return this.processor;
  }

  // ============================================================================
  // UTILITY & MANAGEMENT API
  // ============================================================================

  getSupportedFormats(): { audio: AudioFormat[]; video: VideoFormat[] } {
    const allFormats = this.processor.getSupportedFormats();
    return {
      audio: allFormats.filter(f => f.type === 'audio') as any[],
      video: allFormats.filter(f => f.type === 'video') as any[]
    };
  }

  isFormatSupported(format: AudioFormat | VideoFormat): boolean {
    const supportedFormats = this.getSupportedFormats();
    return [...supportedFormats.audio, ...supportedFormats.video].includes(format as any);
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  getGlobalStatus(): {
    initialized: boolean;
    audioPlayerState: MediaState;
    videoPlayerState: MediaState;
    activeOperations: number;
    activeStreams: number;
  } {
    return {
      initialized: this._initialized,
      audioPlayerState: this.audioPlayer.getState(),
      videoPlayerState: this.videoPlayer.getState(),
      activeOperations: this.processor.getActiveOperations().length,
      activeStreams: 0 // Would need to implement stream counting in streaming provider
    };
  }

  async destroy(): Promise<void> {
    try {
      // Destroy all components
      await Promise.all([
        this.audioPlayer.destroy(),
        this.videoPlayer.destroy(),
        this.streaming.destroy(),
        this.processor.destroy()
      ]);

      this._initialized = false;
      this.removeAllListeners();
      this.emit('destroyed');

    } catch (error) {
      const destroyError = new MultimediaError(
        `Failed to destroy PowerScript Graphics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DESTRUCTION_FAILED',
        { originalError: error }
      );
      this.emit('error', destroyError);
      throw destroyError;
    }
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Quick audio playback with minimal configuration
   */
  async playAudio(url: string, config?: Partial<AudioPlayerConfig>): Promise<void> {
    const player = config ? await this.createAudioPlayer(config) : this.audioPlayer;
    await player.load(url);
    await player.play();
  }

  /**
   * Quick video playback with minimal configuration
   */
  async playVideo(url: string, container?: HTMLElement, config?: Partial<VideoPlayerConfig>): Promise<void> {
    const player = config ? await this.createVideoPlayer(config) : this.videoPlayer;
    await player.load(url);
    
    if (container) {
      player.attachTo(container);
    }
    
    await player.play();
  }

  /**
   * Quick audio format conversion
   */
  async convertAudio(
    input: Buffer | string,
    fromFormat: string,
    toFormat: string,
    options?: Partial<AudioProcessingOptions>
  ): Promise<ProcessingResult> {
    const processingOptions: AudioProcessingOptions = {
      type: 'audio',
      operation: 'convert',
      inputFormat: { name: fromFormat, extension: fromFormat, type: 'audio', mimeType: `audio/${fromFormat}` },
      outputFormat: { name: toFormat, extension: toFormat, type: 'audio', mimeType: `audio/${toFormat}` },
      ...options
    };

    return await this.processAudio(input, processingOptions);
  }

  /**
   * Quick video format conversion
   */
  async convertVideo(
    input: Buffer | string,
    fromFormat: string,
    toFormat: string,
    options?: Partial<VideoProcessingOptions>
  ): Promise<ProcessingResult> {
    const processingOptions: VideoProcessingOptions = {
      type: 'video',
      operation: 'convert',
      inputFormat: { name: fromFormat, extension: fromFormat, type: 'video', mimeType: `video/${fromFormat}` },
      outputFormat: { name: toFormat, extension: toFormat, type: 'video', mimeType: `video/${toFormat}` },
      ...options
    };

    return await this.processVideo(input, processingOptions);
  }

  /**
   * Create a progressive stream for video playback
   */
  async createProgressiveStream(url: string, config?: any): Promise<any> {
    const streamConfig = {
      type: 'progressive',
      chunkSize: 1024 * 1024, // 1MB chunks
      preloadChunks: 3,
      enableRangeRequests: true,
      ...config
    };

    return await this.createStream(url, streamConfig);
  }

  /**
   * Create an adaptive stream with quality switching
   */
  async createAdaptiveStream(url: string, config?: any): Promise<any> {
    const streamConfig = {
      type: 'adaptive',
      enableAutomaticSwitching: true,
      switchingStrategy: 'bandwidth-based',
      minBufferLength: 5,
      maxBufferLength: 30,
      ...config
    };

    return await this.createStream(url, streamConfig);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private _setupEventForwarding(): void {
    // Forward audio player events
    this.audioPlayer.on('play', () => this.emit('audioPlay'));
    this.audioPlayer.on('pause', () => this.emit('audioPause'));
    this.audioPlayer.on('stop', () => this.emit('audioStop'));
    this.audioPlayer.on('ended', () => this.emit('audioEnded'));
    this.audioPlayer.on('error', (error: Error) => this.emit('audioError', error));
    this.audioPlayer.on('timeupdate', (time: number) => this.emit('audioTimeUpdate', time));
    this.audioPlayer.on('volumechange', (volume: number) => this.emit('audioVolumeChange', volume));
    this.audioPlayer.on('loadstart', () => this.emit('audioLoadStart'));
    this.audioPlayer.on('loadeddata', () => this.emit('audioLoadedData'));
    this.audioPlayer.on('canplay', () => this.emit('audioCanPlay'));
    this.audioPlayer.on('canplaythrough', () => this.emit('audioCanPlayThrough'));

    // Forward video player events
    this.videoPlayer.on('play', () => this.emit('videoPlay'));
    this.videoPlayer.on('pause', () => this.emit('videoPause'));
    this.videoPlayer.on('stop', () => this.emit('videoStop'));
    this.videoPlayer.on('ended', () => this.emit('videoEnded'));
    this.videoPlayer.on('error', (error: Error) => this.emit('videoError', error));
    this.videoPlayer.on('timeupdate', (time: number) => this.emit('videoTimeUpdate', time));
    this.videoPlayer.on('volumechange', (volume: number) => this.emit('videoVolumeChange', volume));
    this.videoPlayer.on('loadstart', () => this.emit('videoLoadStart'));
    this.videoPlayer.on('loadeddata', () => this.emit('videoLoadedData'));
    this.videoPlayer.on('canplay', () => this.emit('videoCanPlay'));
    this.videoPlayer.on('canplaythrough', () => this.emit('videoCanPlayThrough'));
    this.videoPlayer.on('seeking', () => this.emit('videoSeeking'));
    this.videoPlayer.on('seeked', () => this.emit('videoSeeked'));
    this.videoPlayer.on('ratechange', (rate: number) => this.emit('videoRateChange', rate));
    this.videoPlayer.on('durationchange', (duration: number) => this.emit('videoDurationChange', duration));
    this.videoPlayer.on('progress', (buffered: number) => this.emit('videoProgress', buffered));
    this.videoPlayer.on('qualitychange', (quality: string) => this.emit('videoQualityChange', quality));
    this.videoPlayer.on('fullscreenchange', (isFullscreen: boolean) => this.emit('videoFullscreenChange', isFullscreen));

    // Forward streaming events (cast to EventEmitter to access event methods)
    (this.streaming as any).on('streamCreated', (id: string, provider: any) =>
      this.emit('streamCreated', id, provider)
    );

    (this.streaming as any).on('streamStarted', (id: string) => this.emit('streamStarted', id));
    (this.streaming as any).on('streamStopped', (id: string) => this.emit('streamStopped', id));
    (this.streaming as any).on('streamError', (id: string, error: Error) => this.emit('streamError', id, error));

    // Forward processing events (cast to EventEmitter to access event methods)
    (this.processor as any).on('operationStarted', (operation: any) =>
      this.emit('processingStarted', operation)
    );

    (this.processor as any).on('operationCompleted', (operation: any) =>
      this.emit('processingCompleted', operation)
    );

    (this.processor as any).on('operationProgress', (operation: any) =>
      this.emit('processingProgress', operation)
    );

    (this.processor as any).on('operationError', (id: string, error: Error) =>
      this.emit('processingError', id, error)
    );
  }
}

// ============================================================================
// DEFAULT EXPORT & CONVENIENCE FACTORY
// ============================================================================

/**
 * Create a new PowerScript Graphics & Multimedia instance with default configuration
 */
export function createMultimediaProvider(config?: MultimediaConfig): PowerScriptGraphics {
  return new PowerScriptGraphics(config);
}

/**
 * Default export - PowerScript Graphics & Multimedia Module
 */
export default PowerScriptGraphics;

// Export all component classes for direct usage
export {
  PowerScriptAudioPlayer,
  PowerScriptVideoPlayer,
  PowerScriptStreaming,
  PowerScriptMultimediaProcessor
};

// Export all types for external usage
export * from './types';