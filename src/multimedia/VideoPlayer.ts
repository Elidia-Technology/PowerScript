import { EventEmitter } from 'events';
import type {
  VideoPlayer,
  VideoPlayerConfig,
  VideoPlayerControls,
  MediaState,
  MediaMetadata,
  LogoConfig,
  LogoOverlay,
  VideoControls,
  VideoControlsConfig,
  VideoQuality,
  LogoPosition
} from './types';
import { MultimediaError } from './types';

/**
 * PowerScript Custom HTML5 Video Player with Logo and Custom Controls
 * 
 * Features:
 * - HTML5 Video element wrapper with enhanced controls
 * - Custom video control overlay with full styling control
 * - Logo overlay support with positioning and branding
 * - Quality selection and adaptive playback
 * - Fullscreen support with custom controls
 * - Event-driven architecture with comprehensive video events
 * - Cross-platform compatibility (Node.js mock + browser implementation)
 */

export class PowerScriptVideoPlayer extends EventEmitter implements VideoPlayer {
  public readonly element?: HTMLVideoElement;
  public readonly config: VideoPlayerConfig;
  public readonly controls?: VideoControls;
  public readonly logo?: LogoOverlay;
  
  private _metadata?: MediaMetadata;
  private _state: MediaState = 'idle';
  private _currentTime = 0;
  private _duration = 0;
  private _volume = 1;
  private _muted = false;
  private _playbackRate = 1;
  private _availableQualities: VideoQuality[] = [];
  private _currentQuality?: VideoQuality;

  constructor(config: VideoPlayerConfig = {}) {
    super();
    
    this.config = {
      width: 640,
      height: 360,
      volume: 1,
      muted: false,
      autoplay: false,
      loop: false,
      controls: false, // We use custom controls
      preload: 'metadata',
      enableCustomControls: true,
      enableLogo: false,
      ...config
    };

    // Initialize video element (browser only)
    if (typeof window !== 'undefined' && typeof HTMLVideoElement !== 'undefined') {
      this.element = document.createElement('video');
      this._setupVideoElement();
    }

    // Initialize custom controls
    if (this.config.enableCustomControls && this.config.controlsConfig) {
      this.controls = new VideoControlsOverlay(this.config.controlsConfig, this);
    }

    // Initialize logo overlay if enabled
    if (this.config.enableLogo && this.config.logoConfig) {
      this.logo = new VideoLogoOverlay(this.config.logoConfig);
    }

    // Apply initial configuration
    this._applyConfig();
  }

  // ============================================================================
  // PUBLIC API - VideoPlayerControls Implementation
  // ============================================================================

  async play(): Promise<void> {
    try {
      if (this.element) {
        await this.element.play();
      } else {
        // Mock implementation for Node.js
        this._setState('playing');
        this.emit('play');
        this._startMockPlayback();
      }
    } catch (error) {
      const playError = new MultimediaError(
        `Failed to play video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PLAY_FAILED',
        { originalError: error }
      );
      this.emit('error', playError);
      throw playError;
    }
  }

  pause(): void {
    if (this.element) {
      this.element.pause();
    } else {
      this._setState('paused');
      this.emit('pause');
    }
  }

  stop(): void {
    if (this.element) {
      this.element.pause();
      this.element.currentTime = 0;
    } else {
      this._currentTime = 0;
      this._setState('stopped');
      this.emit('stop');
    }
  }

  seek(time: number): void {
    const clampedTime = Math.max(0, Math.min(time, this._duration));
    
    if (this.element) {
      this.element.currentTime = clampedTime;
    } else {
      this._currentTime = clampedTime;
      this.emit('seeking', clampedTime);
      this.emit('seeked', clampedTime);
      this.emit('timeupdate', this._currentTime, this._duration);
    }
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    
    if (this.element) {
      this.element.volume = this._volume;
    }
    
    this.emit('volumechange', this._volume, this._muted);
  }

  mute(): void {
    this._muted = true;
    
    if (this.element) {
      this.element.muted = true;
    }
    
    this.emit('volumechange', this._volume, this._muted);
  }

  unmute(): void {
    this._muted = false;
    
    if (this.element) {
      this.element.muted = false;
    }
    
    this.emit('volumechange', this._volume, this._muted);
  }

  toggleMute(): void {
    if (this._muted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  getCurrentTime(): number {
    return this.element ? this.element.currentTime : this._currentTime;
  }

  getDuration(): number {
    return this.element ? this.element.duration : this._duration;
  }

  getState(): MediaState {
    return this._state;
  }

  // Video-specific controls
  setSize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    if (this.element) {
      this.element.width = width;
      this.element.height = height;
    }
  }

  async enterFullscreen(): Promise<void> {
    if (this.element && this.element.requestFullscreen) {
      try {
        await this.element.requestFullscreen();
      } catch (error) {
        throw new MultimediaError(
          'Failed to enter fullscreen',
          'FULLSCREEN_FAILED',
          { originalError: error }
        );
      }
    }
  }

  async exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        throw new MultimediaError(
          'Failed to exit fullscreen',
          'FULLSCREEN_EXIT_FAILED',
          { originalError: error }
        );
      }
    }
  }

  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.25, Math.min(4, rate));
    
    if (this.element) {
      this.element.playbackRate = this._playbackRate;
    }
  }

  getPlaybackRate(): number {
    return this.element ? this.element.playbackRate : this._playbackRate;
  }

  setQuality(quality: VideoQuality): void {
    this._currentQuality = quality;
    
    if (this.element && quality.url) {
      const currentTime = this.getCurrentTime();
      const wasPlaying = this._state === 'playing';
      
      this.element.src = quality.url;
      this.element.load();
      
      this.element.addEventListener('loadedmetadata', () => {
        this.seek(currentTime);
        if (wasPlaying) {
          this.play();
        }
      }, { once: true });
    }
  }

  getAvailableQualities(): VideoQuality[] {
    return [...this._availableQualities];
  }

  // ============================================================================
  // PUBLIC API - VideoPlayer Implementation
  // ============================================================================

  get metadata(): MediaMetadata | undefined {
    return this._metadata;
  }

  async load(url: string): Promise<void> {
    try {
      this._setState('loading');
      this.emit('loading');

      if (this.element) {
        this.element.src = url;
        this.element.load();
        
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            this.element!.removeEventListener('loadedmetadata', onLoadedMetadata);
            this.element!.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            this.element!.removeEventListener('loadedmetadata', onLoadedMetadata);
            this.element!.removeEventListener('error', onError);
            reject(new Error('Failed to load video metadata'));
          };
          
          this.element!.addEventListener('loadedmetadata', onLoadedMetadata);
          this.element!.addEventListener('error', onError);
        });

        this._updateMetadata();
        this._detectAvailableQualities();
      } else {
        // Mock implementation for Node.js
        await new Promise(resolve => setTimeout(resolve, 200));
        this._createMockMetadata(url);
        this._createMockQualities();
      }

      this._setState('ready');
      this.emit('loaded', this._metadata!);
      this.emit('ready');
      
    } catch (error) {
      const loadError = new MultimediaError(
        `Failed to load video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LOAD_FAILED',
        { url, originalError: error }
      );
      this._setState('error');
      this.emit('error', loadError);
      throw loadError;
    }
  }

  attachTo(container: HTMLElement): void {
    if (this.element && typeof document !== 'undefined') {
      container.appendChild(this.element);
      
      // Attach controls if enabled
      if (this.controls) {
        container.appendChild(this.controls.element);
      }
      
      // Attach logo if enabled
      if (this.logo) {
        container.appendChild(this.logo.element);
      }
    }
  }

  destroy(): void {
    if (this.element) {
      this.element.pause();
      this.element.src = '';
      this.element.load();
      
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }

    if (this.controls) {
      this.controls.destroy();
    }

    if (this.logo) {
      this.logo.destroy();
    }

    this.removeAllListeners();
    this._setState('idle');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private _setupVideoElement(): void {
    if (!this.element) return;

    // Set up event listeners
    this.element.addEventListener('loadstart', () => this.emit('loading'));
    this.element.addEventListener('loadedmetadata', () => {
      this._updateMetadata();
      this.emit('loaded', this._metadata!);
    });
    this.element.addEventListener('canplay', () => {
      this._setState('ready');
      this.emit('ready');
    });
    this.element.addEventListener('play', () => {
      this._setState('playing');
      this.emit('play');
    });
    this.element.addEventListener('pause', () => {
      this._setState('paused');
      this.emit('pause');
    });
    this.element.addEventListener('ended', () => {
      this._setState('ended');
      this.emit('ended');
    });
    this.element.addEventListener('timeupdate', () => {
      this._currentTime = this.element!.currentTime;
      this._duration = this.element!.duration;
      this.emit('timeupdate', this._currentTime, this._duration);
      
      // Update controls
      if (this.controls) {
        this.controls.update(this._currentTime, this._duration);
      }
    });
    this.element.addEventListener('progress', () => {
      const buffered = this.element!.buffered.length > 0 
        ? this.element!.buffered.end(this.element!.buffered.length - 1) 
        : 0;
      this.emit('progress', buffered, this._duration);
    });
    this.element.addEventListener('volumechange', () => {
      this._volume = this.element!.volume;
      this._muted = this.element!.muted;
      this.emit('volumechange', this._volume, this._muted);
    });
    this.element.addEventListener('ratechange', () => {
      this._playbackRate = this.element!.playbackRate;
    });
    this.element.addEventListener('seeking', () => {
      this.emit('seeking', this.element!.currentTime);
    });
    this.element.addEventListener('seeked', () => {
      this.emit('seeked', this.element!.currentTime);
    });
    this.element.addEventListener('error', () => {
      const error = new MultimediaError(
        'Video playback error',
        'PLAYBACK_ERROR',
        { error: this.element!.error }
      );
      this._setState('error');
      this.emit('error', error);
    });
  }

  private _applyConfig(): void {
    if (this.element) {
      this.element.width = this.config.width || 640;
      this.element.height = this.config.height || 360;
      this.element.volume = this.config.volume || 1;
      this.element.muted = this.config.muted || false;
      this.element.autoplay = this.config.autoplay || false;
      this.element.loop = this.config.loop || false;
      this.element.controls = this.config.controls || false;
      this.element.preload = this.config.preload || 'metadata';
      this.element.crossOrigin = this.config.crossOrigin || null;
      
      if (this.config.poster) {
        this.element.poster = this.config.poster;
      }
    }

    // Apply mock config
    this._volume = this.config.volume || 1;
    this._muted = this.config.muted || false;
  }

  private _updateMetadata(): void {
    if (!this.element) return;

    this._duration = this.element.duration || 0;
    this._metadata = {
      duration: this._duration,
      resolution: {
        width: this.element.videoWidth || this.config.width || 640,
        height: this.element.videoHeight || this.config.height || 360
      }
    };
  }

  private _createMockMetadata(url: string): void {
    this._duration = 300; // 5 minutes mock duration
    this._metadata = {
      duration: this._duration,
      bitrate: 2000000, // 2 Mbps
      codec: 'h264',
      resolution: {
        width: this.config.width || 640,
        height: this.config.height || 360
      },
      frameRate: 30,
      title: `Video File - ${url.split('/').pop()}`,
    };
  }

  private _detectAvailableQualities(): void {
    // In a real implementation, this would analyze the video source
    // For now, create mock qualities
    this._createMockQualities();
  }

  private _createMockQualities(): void {
    this._availableQualities = [
      {
        label: '360p',
        width: 640,
        height: 360,
        bitrate: 1000000
      },
      {
        label: '720p',
        width: 1280,
        height: 720,
        bitrate: 2500000
      },
      {
        label: '1080p',
        width: 1920,
        height: 1080,
        bitrate: 5000000
      }
    ];

    // Set default quality based on current resolution
    this._currentQuality = this._availableQualities.find(q => 
      q.width === (this._metadata?.resolution?.width || 640)
    ) || this._availableQualities[0];
  }

  private _setState(state: MediaState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('statechange', state);
    }
  }

  private _startMockPlayback(): void {
    const interval = setInterval(() => {
      if (this._state === 'playing') {
        this._currentTime += 0.1;
        if (this._currentTime >= this._duration) {
          this._currentTime = this._duration;
          this._setState('ended');
          this.emit('ended');
          clearInterval(interval);
        } else {
          this.emit('timeupdate', this._currentTime, this._duration);
          
          // Update controls
          if (this.controls) {
            this.controls.update(this._currentTime, this._duration);
          }
        }
      } else {
        clearInterval(interval);
      }
    }, 100);
  }
}

/**
 * Video Controls Overlay Implementation
 * Provides custom video controls with full styling control
 */
export class VideoControlsOverlay extends EventEmitter implements VideoControls {
  public readonly config: VideoControlsConfig;
  public readonly element: HTMLElement;

  private _player: VideoPlayer;
  private _visible = true;
  private _hideTimer?: NodeJS.Timeout;

  constructor(config: VideoControlsConfig, player: VideoPlayer) {
    super();
    
    this.config = {
      showPlayPause: true,
      showSeekBar: true,
      showTimeDisplay: true,
      showVolumeControl: true,
      showFullscreenButton: true,
      showQualitySelector: false,
      showSpeedControl: false,
      theme: 'dark',
      position: 'bottom',
      ...config
    };

    this._player = player;
    this.element = this._createElement();
    this._setupEvents();
    this._applyStyles();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  show(): void {
    this._visible = true;
    this.element.style.display = 'flex';
    this.emit('show');
  }

  hide(): void {
    this._visible = false;
    this.element.style.display = 'none';
    this.emit('hide');
  }

  toggle(): void {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  update(currentTime: number, duration: number): void {
    // Update seek bar
    const seekBar = this.element.querySelector('.seek-bar') as HTMLInputElement;
    if (seekBar && duration > 0) {
      seekBar.value = String((currentTime / duration) * 100);
    }

    // Update time display
    const timeDisplay = this.element.querySelector('.time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `${this._formatTime(currentTime)} / ${this._formatTime(duration)}`;
    }
  }

  destroy(): void {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
    }
    
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.removeAllListeners();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private _createElement(): HTMLElement {
    if (typeof document === 'undefined') {
      return { style: {}, querySelector: () => null } as any;
    }

    const controls = document.createElement('div');
    controls.className = 'powerscript-video-controls';

    // Play/Pause button
    if (this.config.showPlayPause) {
      const playButton = document.createElement('button');
      playButton.className = 'play-pause-btn';
      playButton.textContent = '▶';
      playButton.addEventListener('click', () => {
        if (this._player.getState() === 'playing') {
          this._player.pause();
          playButton.textContent = '▶';
        } else {
          this._player.play();
          playButton.textContent = '⏸';
        }
      });
      controls.appendChild(playButton);
    }

    // Seek bar
    if (this.config.showSeekBar) {
      const seekBar = document.createElement('input');
      seekBar.type = 'range';
      seekBar.className = 'seek-bar';
      seekBar.min = '0';
      seekBar.max = '100';
      seekBar.value = '0';
      seekBar.addEventListener('input', () => {
        const duration = this._player.getDuration();
        const time = (parseFloat(seekBar.value) / 100) * duration;
        this._player.seek(time);
      });
      controls.appendChild(seekBar);
    }

    // Time display
    if (this.config.showTimeDisplay) {
      const timeDisplay = document.createElement('span');
      timeDisplay.className = 'time-display';
      timeDisplay.textContent = '00:00 / 00:00';
      controls.appendChild(timeDisplay);
    }

    // Volume control
    if (this.config.showVolumeControl) {
      const volumeContainer = document.createElement('div');
      volumeContainer.className = 'volume-container';
      
      const muteButton = document.createElement('button');
      muteButton.className = 'mute-btn';
      muteButton.textContent = '🔊';
      muteButton.addEventListener('click', () => {
        this._player.toggleMute();
        // Update icon based on mute state would be handled by volume change event
      });
      
      const volumeSlider = document.createElement('input');
      volumeSlider.type = 'range';
      volumeSlider.className = 'volume-slider';
      volumeSlider.min = '0';
      volumeSlider.max = '100';
      volumeSlider.value = '100';
      volumeSlider.addEventListener('input', () => {
        const volume = parseFloat(volumeSlider.value) / 100;
        this._player.setVolume(volume);
      });
      
      volumeContainer.appendChild(muteButton);
      volumeContainer.appendChild(volumeSlider);
      controls.appendChild(volumeContainer);
    }

    // Fullscreen button
    if (this.config.showFullscreenButton) {
      const fullscreenButton = document.createElement('button');
      fullscreenButton.className = 'fullscreen-btn';
      fullscreenButton.textContent = '⛶';
      fullscreenButton.addEventListener('click', () => {
        this._player.toggleFullscreen();
      });
      controls.appendChild(fullscreenButton);
    }

    return controls;
  }

  private _setupEvents(): void {
    // Listen to player events to update controls
    this._player.on('play', () => {
      const playButton = this.element.querySelector('.play-pause-btn');
      if (playButton) {
        playButton.textContent = '⏸';
      }
    });

    this._player.on('pause', () => {
      const playButton = this.element.querySelector('.play-pause-btn');
      if (playButton) {
        playButton.textContent = '▶';
      }
    });

    this._player.on('volumechange', (volume: number, muted: boolean) => {
      const muteButton = this.element.querySelector('.mute-btn');
      const volumeSlider = this.element.querySelector('.volume-slider') as HTMLInputElement;
      
      if (muteButton) {
        muteButton.textContent = muted ? '🔇' : '🔊';
      }
      
      if (volumeSlider) {
        volumeSlider.value = String(volume * 100);
      }
    });

    // Auto-hide controls
    this._setupAutoHide();
  }

  private _setupAutoHide(): void {
    const resetHideTimer = () => {
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
      }
      
      this.show();
      
      this._hideTimer = setTimeout(() => {
        if (this._player.getState() === 'playing') {
          this.hide();
        }
      }, 3000);
    };

    // Show controls on mouse movement
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', resetHideTimer);
      this.element.addEventListener('mouseenter', () => this.show());
    }
  }

  private _applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
      padding: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: '100',
    });

    // Apply theme-specific styles
    if (this.config.theme === 'light') {
      this.element.style.background = 'linear-gradient(transparent, rgba(255,255,255,0.9))';
      this.element.style.color = '#000';
    } else {
      this.element.style.color = '#fff';
    }
  }

  private _formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Video Logo Overlay Implementation
 * Provides branding and logo display for video players
 */
export class VideoLogoOverlay extends EventEmitter implements LogoOverlay {
  public readonly config: LogoConfig;
  public readonly element: HTMLElement;

  private _visible = false;
  private _fadeTimer?: NodeJS.Timeout;

  constructor(config: LogoConfig) {
    super();
    
    this.config = {
      enabled: true,
      position: 'top-right',
      opacity: 0.8,
      duration: 0,
      fadeIn: true,
      fadeOut: true,
      ...config
    };

    this.element = this._createElement();
    this._applyStyles();
    this._setupEvents();

    if (this.config.enabled) {
      this.show();
    }
  }

  show(): void {
    this._visible = true;
    this.element.style.display = 'block';
    
    if (this.config.fadeIn) {
      this._fadeIn();
    } else {
      this.element.style.opacity = String(this.config.opacity || 1);
    }

    if (this.config.duration && this.config.duration > 0) {
      this._fadeTimer = setTimeout(() => {
        this.hide();
      }, this.config.duration * 1000);
    }

    this.emit('show');
  }

  hide(): void {
    if (this._fadeTimer) {
      clearTimeout(this._fadeTimer);
      this._fadeTimer = undefined;
    }

    this._visible = false;

    if (this.config.fadeOut) {
      this._fadeOut();
    } else {
      this.element.style.display = 'none';
    }

    this.emit('hide');
  }

  setPosition(position: LogoPosition): void {
    this.config.position = position;
    this._applyPositionStyles();
  }

  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    if (this._visible) {
      this.element.style.opacity = String(this.config.opacity);
    }
  }

  destroy(): void {
    this.hide();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.removeAllListeners();
  }

  private _createElement(): HTMLElement {
    if (typeof document === 'undefined') {
      return { style: {}, addEventListener: () => {} } as any;
    }

    const element = document.createElement('div');
    element.className = 'powerscript-video-logo';

    if (this.config.imageUrl) {
      const img = document.createElement('img');
      img.src = this.config.imageUrl;
      img.alt = 'Logo';
      element.appendChild(img);
    } else if (this.config.text) {
      const text = document.createElement('span');
      text.textContent = this.config.text;
      element.appendChild(text);
    }

    return element;
  }

  private _applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      zIndex: '1000',
      pointerEvents: this.config.clickUrl ? 'auto' : 'none',
      display: 'none',
      transition: 'opacity 0.3s ease-in-out',
    });

    if (this.config.size) {
      this.element.style.width = `${this.config.size.width}px`;
      this.element.style.height = `${this.config.size.height}px`;
    }

    this._applyPositionStyles();
  }

  private _applyPositionStyles(): void {
    const position = this.config.position || 'top-right';
    const [vertical, horizontal] = position.split('-');

    // Reset position styles
    this.element.style.top = '';
    this.element.style.bottom = '';
    this.element.style.left = '';
    this.element.style.right = '';
    this.element.style.transform = '';

    // Apply positioning
    switch (vertical) {
      case 'top':
        this.element.style.top = '10px';
        break;
      case 'middle':
        this.element.style.top = '50%';
        this.element.style.transform = 'translateY(-50%)';
        break;
      case 'bottom':
        this.element.style.bottom = '10px';
        break;
    }

    switch (horizontal) {
      case 'left':
        this.element.style.left = '10px';
        break;
      case 'center':
        this.element.style.left = '50%';
        this.element.style.transform += ' translateX(-50%)';
        break;
      case 'right':
        this.element.style.right = '10px';
        break;
    }

    if (position === 'middle-center') {
      this.element.style.transform = 'translate(-50%, -50%)';
    }
  }

  private _setupEvents(): void {
    if (this.config.clickUrl && typeof window !== 'undefined') {
      this.element.addEventListener('click', () => {
        window.open(this.config.clickUrl!, '_blank');
        this.emit('click', this.config.clickUrl);
      });
    }
  }

  private _fadeIn(): void {
    this.element.style.opacity = '0';
    requestAnimationFrame(() => {
      this.element.style.opacity = String(this.config.opacity || 1);
    });
  }

  private _fadeOut(): void {
    this.element.style.opacity = '0';
    setTimeout(() => {
      if (!this._visible) {
        this.element.style.display = 'none';
      }
    }, 300);
  }
}