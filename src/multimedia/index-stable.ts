import { EventEmitter } from 'events';
import { PowerScriptAudioPlayer } from './AudioPlayer';
import { PowerScriptVideoPlayer } from './VideoPlayer';
// import { PowerScriptStreaming } from './Streaming'; // TEMPORARILY DISABLED - needs type fixes
// import { PowerScriptMultimediaProcessor } from './Processing'; // TEMPORARILY DISABLED
import type {
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
} from './types';
import { MultimediaError } from './types';

/**
 * PowerScript Graphics & Multimedia Module (Phase 15) - STABLE VERSION
 * 
 * Core multimedia system providing:
 * 
 * 🎵 Audio Features:
 * - HTML5 Audio wrapper with enhanced controls and logo overlay support
 * - Cross-platform compatibility (browser HTMLAudioElement + Node.js mock)
 * 
 * 🎬 Video Features:
 * - Custom HTML5 Video player with full control customization and logo branding
 * - Quality selection, fullscreen support, custom control overlays
 * 
 * Note: Streaming and Processing features temporarily disabled pending API stabilization
 */
export interface PowerScriptGraphicsConfig extends MultimediaConfig {
  enableAudioPlayer?: boolean;
  enableVideoPlayer?: boolean;
  enableStreaming?: boolean; // Currently disabled
  enableProcessing?: boolean; // Currently disabled

  audioPlayerConfig?: AudioPlayerConfig;
  videoPlayerConfig?: VideoPlayerConfig;
}

/**
 * Main Graphics & Multimedia Module - Stable Implementation
 */
export class PowerScriptGraphics extends EventEmitter {
  public readonly name = 'PowerScriptGraphics';
  public readonly capabilities: string[] = [];

  private _config: PowerScriptGraphicsConfig;
  private _audioPlayer?: PowerScriptAudioPlayer;
  private _videoPlayer?: PowerScriptVideoPlayer;
  private _initialized = false;

  constructor(config: PowerScriptGraphicsConfig = {}) {
    super();

    // Set default configuration
    this._config = {
      enableAudioPlayer: true,
      enableVideoPlayer: true,
      enableStreaming: false, // DISABLED pending type fixes
      enableProcessing: false, // DISABLED pending type fixes
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
        // Note: AudioPlayer doesn't have initialize method - this is part of API stabilization needed
        this.emit('audioPlayerReady', this._audioPlayer);
      }

      // Initialize video player if enabled
      if (this._config.enableVideoPlayer) {
        this._videoPlayer = new PowerScriptVideoPlayer(this._config.videoPlayerConfig || {});
        // Note: VideoPlayer doesn't have initialize method - this is part of API stabilization needed
        this.emit('videoPlayerReady', this._videoPlayer);
      }

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

    // Basic format detection for HTML5 Audio/Video
    if (typeof Audio !== 'undefined') {
      const audio = new Audio();
      if (audio.canPlayType('audio/mp3')) formats.audio.push('mp3');
      if (audio.canPlayType('audio/wav')) formats.audio.push('wav');
      if (audio.canPlayType('audio/ogg')) formats.audio.push('ogg');
      if (audio.canPlayType('audio/aac')) formats.audio.push('aac');
    }

    if (typeof document !== 'undefined') {
      const video = document.createElement('video');
      if (video.canPlayType('video/mp4')) formats.video.push('mp4');
      if (video.canPlayType('video/webm')) formats.video.push('webm');
      if (video.canPlayType('video/ogg')) formats.video.push('ogg');
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
        // Note: AudioPlayer destroy method needs to be implemented as part of API stabilization
        this._audioPlayer = undefined;
      }

      if (this._videoPlayer) {
        // Note: VideoPlayer destroy method needs to be implemented as part of API stabilization
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

    // Note: streaming and processing capabilities will be added when those subsystems are stabilized
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