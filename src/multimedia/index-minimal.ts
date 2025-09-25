import { EventEmitter } from 'events';
import { PowerScriptAudioPlayer } from './AudioPlayer';
import { PowerScriptVideoPlayer } from './VideoPlayer';
// import { PowerScriptStreaming } from './Streaming'; // TEMPORARILY DISABLED
// import { PowerScriptMultimediaProcessor } from './Processing'; // TEMPORARILY DISABLED
import type {
  MultimediaProvider,
  MultimediaConfig,
  AudioPlayerConfig,
  VideoPlayerConfig,
  // StreamingConfig,
  // MultimediaProcessorConfig,
  AudioPlayer,
  VideoPlayer,
  // StreamingProvider,
  // MultimediaProcessor,
  MediaState,
  MediaMetadata,
  // ProcessingResult,
  // AudioProcessingOptions,
  // VideoProcessingOptions,
  // ImageProcessingOptions,
  AudioFormat,
  VideoFormat
} from './types';
import { MultimediaError } from './types';

/**
 * PowerScript Graphics & Multimedia Module (Phase 15) - MINIMAL VERSION
 * 
 * Basic multimedia system providing:
 * 
 * 🎵 Audio Features:
 * - HTML5 Audio wrapper with enhanced controls and logo overlay support
 * - Cross-platform compatibility (browser HTMLAudioElement + Node.js mock)
 * 
 * 🎬 Video Features:
 * - Custom HTML5 Video player with full control customization and logo branding
 * - Quality selection, fullscreen support, custom control overlays
 * 
 * Note: Streaming and Processing features temporarily disabled for testing
 */
export interface PowerScriptGraphicsConfig extends MultimediaConfig {
  enableAudioPlayer?: boolean;
  enableVideoPlayer?: boolean;
  enableStreaming?: boolean;
  enableProcessing?: boolean;

  audioPlayerConfig?: AudioPlayerConfig;
  videoPlayerConfig?: VideoPlayerConfig;
  // streamingConfig?: StreamingConfig;
  // processingConfig?: MultimediaProcessorConfig;
}

/**
 * Main Graphics & Multimedia Module
 */
export class PowerScriptGraphics extends EventEmitter implements MultimediaProvider {
  public readonly name = 'PowerScriptGraphics';
  public readonly capabilities: string[] = [];

  private _config: PowerScriptGraphicsConfig;
  private _audioPlayer?: PowerScriptAudioPlayer;
  private _videoPlayer?: PowerScriptVideoPlayer;
  // private _streaming?: PowerScriptStreaming;
  // private _processor?: PowerScriptMultimediaProcessor;
  private _initialized = false;

  constructor(config: PowerScriptGraphicsConfig = {}) {
    super();

    // Set default configuration
    this._config = {
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false, // DISABLED
      enableProcessing: false, // DISABLED
      ...config
    };

    // Initialize capabilities
    this._initializeCapabilities();
  }

  /**
   * Initialize the multimedia system
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // Initialize audio player if enabled
      if (this._config.enableAudioPlayer) {
        this._audioPlayer = new PowerScriptAudioPlayer(this._config.audioPlayerConfig || {});
        await this._audioPlayer.initialize();
        this.emit('audioPlayerReady', this._audioPlayer);
      }

      // Initialize video player if enabled
      if (this._config.enableVideoPlayer) {
        this._videoPlayer = new PowerScriptVideoPlayer(this._config.videoPlayerConfig || {});
        await this._videoPlayer.initialize();
        this.emit('videoPlayerReady', this._videoPlayer);
      }

      // Note: Streaming and Processing disabled for now

      this._initialized = true;
      this.emit('initialized');

    } catch (error) {
      const multimediaError = new MultimediaError(
        `Failed to initialize multimedia system: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_ERROR',
        error instanceof Error ? error : undefined
      );
      this.emit('error', multimediaError);
      throw multimediaError;
    }
  }

  /**
   * Create and configure an audio player
   */
  async createAudioPlayer(config?: AudioPlayerConfig): Promise<AudioPlayer> {
    if (!this._config.enableAudioPlayer) {
      throw new MultimediaError('Audio player is disabled', 'FEATURE_DISABLED');
    }

    const player = new PowerScriptAudioPlayer({
      ...this._config.audioPlayerConfig,
      ...config
    });

    await player.initialize();
    this.emit('audioPlayerCreated', player);
    return player as AudioPlayer;
  }

  /**
   * Get the main audio player instance
   */
  getAudioPlayer(): AudioPlayer {
    if (!this._audioPlayer) {
      throw new MultimediaError('Audio player not initialized', 'NOT_INITIALIZED');
    }
    return this._audioPlayer as AudioPlayer;
  }

  /**
   * Create and configure a video player
   */
  async createVideoPlayer(config?: VideoPlayerConfig): Promise<VideoPlayer> {
    if (!this._config.enableVideoPlayer) {
      throw new MultimediaError('Video player is disabled', 'FEATURE_DISABLED');
    }

    const player = new PowerScriptVideoPlayer({
      ...this._config.videoPlayerConfig,
      ...config
    });

    await player.initialize();
    this.emit('videoPlayerCreated', player);
    return player as VideoPlayer;
  }

  /**
   * Get the main video player instance
   */
  getVideoPlayer(): VideoPlayer {
    if (!this._videoPlayer) {
      throw new MultimediaError('Video player not initialized', 'NOT_INITIALIZED');
    }
    return this._videoPlayer as VideoPlayer;
  }

  /**
   * Get supported media formats
   */
  getSupportedFormats(): { audio: AudioFormat[]; video: VideoFormat[] } {
    const formats = {
      audio: [] as AudioFormat[],
      video: [] as VideoFormat[]
    };

    if (this._audioPlayer) {
      formats.audio = this._audioPlayer.getSupportedFormats() as AudioFormat[];
    }

    if (this._videoPlayer) {
      formats.video = this._videoPlayer.getSupportedFormats() as VideoFormat[];
    }

    return formats;
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: AudioFormat | VideoFormat): boolean {
    const formats = this.getSupportedFormats();
    
    // Check if it's an audio format
    if (formats.audio.includes(format as AudioFormat)) {
      return true;
    }
    
    // Check if it's a video format
    if (formats.video.includes(format as VideoFormat)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get system capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  /**
   * Cleanup and destroy all multimedia components
   */
  async destroy(): Promise<void> {
    try {
      if (this._audioPlayer) {
        await this._audioPlayer.destroy();
        this._audioPlayer = undefined;
      }

      if (this._videoPlayer) {
        await this._videoPlayer.destroy();
        this._videoPlayer = undefined;
      }

      this._initialized = false;
      this.emit('destroyed');

    } catch (error) {
      const multimediaError = new MultimediaError(
        `Failed to destroy multimedia system: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEANUP_ERROR',
        error instanceof Error ? error : undefined
      );
      this.emit('error', multimediaError);
      throw multimediaError;
    }
  }

  /**
   * Initialize capabilities based on configuration
   */
  private _initializeCapabilities(): void {
    this.capabilities.length = 0; // Clear existing capabilities

    if (this._config.enableAudioPlayer) {
      this.capabilities.push('audio', 'audioPlayback', 'audioControls');
    }

    if (this._config.enableVideoPlayer) {
      this.capabilities.push('video', 'videoPlayback', 'videoControls');
    }

    // Note: streaming and processing capabilities disabled
  }

  // Missing methods from MultimediaProvider interface - minimal implementations
  async createStream(url: string, streamConfig: any): Promise<any> {
    throw new MultimediaError('Streaming is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  getStreaming(): any {
    throw new MultimediaError('Streaming is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  async processAudio(inputData: Buffer | string, options: any): Promise<any> {
    throw new MultimediaError('Audio processing is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  async processVideo(inputData: Buffer | string, options: any): Promise<any> {
    throw new MultimediaError('Video processing is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  async processImage(inputData: Buffer | string, options: any): Promise<any> {
    throw new MultimediaError('Image processing is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  async batchProcess(inputs: Array<{ data: Buffer | string; options: any }>, batchOptions?: any): Promise<any[]> {
    throw new MultimediaError('Batch processing is not supported in minimal configuration', 'FEATURE_DISABLED');
  }

  getProcessor(): any {
    throw new MultimediaError('Processing is not supported in minimal configuration', 'FEATURE_DISABLED');
  }
}

// Export commonly used types and classes
export {
  PowerScriptAudioPlayer,
  PowerScriptVideoPlayer,
  MultimediaError
};

export type {
  MultimediaProvider,
  MultimediaConfig,
  AudioPlayerConfig,
  VideoPlayerConfig,
  AudioPlayer,
  VideoPlayer,
  MediaState,
  MediaMetadata,
  AudioFormat,
  VideoFormat
};