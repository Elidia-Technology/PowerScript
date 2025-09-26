"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioLogoOverlay = exports.PowerScriptAudioPlayer = void 0;
const events_1 = require("events");
const types_1 = require("./types");
/**
 * PowerScript Custom Audio Player with Logo Support
 *
 * Features:
 * - HTML5 Audio element wrapper with enhanced controls
 * - Custom logo overlay support with positioning and branding
 * - Event-driven architecture with comprehensive playback events
 * - Volume control, seeking, and playback state management
 * - Cross-platform compatibility (Node.js mock + browser implementation)
 */
class PowerScriptAudioPlayer extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this._state = 'idle';
        this._currentTime = 0;
        this._duration = 0;
        this._volume = 1;
        this._muted = false;
        this.config = {
            volume: 1,
            muted: false,
            autoplay: false,
            loop: false,
            preload: 'metadata',
            enableLogo: false,
            ...config
        };
        // Initialize audio element (browser only)
        if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
            this.element = new Audio();
            this._setupAudioElement();
        }
        // Initialize logo overlay if enabled
        if (this.config.enableLogo && this.config.logoConfig) {
            this.logo = new AudioLogoOverlay(this.config.logoConfig);
        }
        // Apply initial configuration
        this._applyConfig();
    }
    // ============================================================================
    // PUBLIC API - AudioPlayerControls Implementation
    // ============================================================================
    async play() {
        try {
            if (this.element) {
                await this.element.play();
            }
            else {
                // Mock implementation for Node.js
                this._setState('playing');
                this.emit('play');
                this._startMockPlayback();
            }
        }
        catch (error) {
            const playError = new types_1.MultimediaError(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`, 'PLAY_FAILED', { originalError: error });
            this.emit('error', playError);
            throw playError;
        }
    }
    pause() {
        if (this.element) {
            this.element.pause();
        }
        else {
            // Mock implementation
            this._setState('paused');
            this.emit('pause');
        }
    }
    stop() {
        if (this.element) {
            this.element.pause();
            this.element.currentTime = 0;
        }
        else {
            // Mock implementation
            this._currentTime = 0;
            this._setState('stopped');
            this.emit('stop');
        }
    }
    seek(time) {
        const clampedTime = Math.max(0, Math.min(time, this._duration));
        if (this.element) {
            this.element.currentTime = clampedTime;
        }
        else {
            // Mock implementation
            this._currentTime = clampedTime;
            this.emit('seeking', clampedTime);
            this.emit('seeked', clampedTime);
            this.emit('timeupdate', this._currentTime, this._duration);
        }
    }
    setVolume(volume) {
        this._volume = Math.max(0, Math.min(1, volume));
        if (this.element) {
            this.element.volume = this._volume;
        }
        this.emit('volumechange', this._volume, this._muted);
    }
    mute() {
        this._muted = true;
        if (this.element) {
            this.element.muted = true;
        }
        this.emit('volumechange', this._volume, this._muted);
    }
    unmute() {
        this._muted = false;
        if (this.element) {
            this.element.muted = false;
        }
        this.emit('volumechange', this._volume, this._muted);
    }
    toggleMute() {
        if (this._muted) {
            this.unmute();
        }
        else {
            this.mute();
        }
    }
    getCurrentTime() {
        return this.element ? this.element.currentTime : this._currentTime;
    }
    getDuration() {
        return this.element ? this.element.duration : this._duration;
    }
    getState() {
        return this._state;
    }
    // ============================================================================
    // PUBLIC API - AudioPlayer Implementation
    // ============================================================================
    get metadata() {
        return this._metadata;
    }
    async load(url) {
        try {
            this._setState('loading');
            this.emit('loading');
            if (this.element) {
                this.element.src = url;
                this.element.load();
                // Wait for metadata to be loaded
                await new Promise((resolve, reject) => {
                    const onLoadedMetadata = () => {
                        this.element.removeEventListener('loadedmetadata', onLoadedMetadata);
                        this.element.removeEventListener('error', onError);
                        resolve();
                    };
                    const onError = () => {
                        this.element.removeEventListener('loadedmetadata', onLoadedMetadata);
                        this.element.removeEventListener('error', onError);
                        reject(new Error('Failed to load audio metadata'));
                    };
                    this.element.addEventListener('loadedmetadata', onLoadedMetadata);
                    this.element.addEventListener('error', onError);
                });
                this._updateMetadata();
            }
            else {
                // Mock implementation for Node.js
                const delay = (process.env.NODE_ENV === 'test') ? 10 : 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                this._createMockMetadata(url);
            }
            this._setState('ready');
            this.emit('loaded', this._metadata);
            this.emit('ready');
        }
        catch (error) {
            const loadError = new types_1.MultimediaError(`Failed to load audio: ${error instanceof Error ? error.message : 'Unknown error'}`, 'LOAD_FAILED', { url, originalError: error });
            this._setState('error');
            this.emit('error', loadError);
            throw loadError;
        }
    }
    destroy() {
        if (this.element) {
            this.element.pause();
            this.element.src = '';
            this.element.load();
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
    _setupAudioElement() {
        if (!this.element)
            return;
        // Set up event listeners
        this.element.addEventListener('loadstart', () => this.emit('loading'));
        this.element.addEventListener('loadedmetadata', () => {
            this._updateMetadata();
            this.emit('loaded', this._metadata);
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
            this._currentTime = this.element.currentTime;
            this._duration = this.element.duration;
            this.emit('timeupdate', this._currentTime, this._duration);
        });
        this.element.addEventListener('progress', () => {
            const buffered = this.element.buffered.length > 0
                ? this.element.buffered.end(this.element.buffered.length - 1)
                : 0;
            this.emit('progress', buffered, this._duration);
        });
        this.element.addEventListener('volumechange', () => {
            this._volume = this.element.volume;
            this._muted = this.element.muted;
            this.emit('volumechange', this._volume, this._muted);
        });
        this.element.addEventListener('seeking', () => {
            this.emit('seeking', this.element.currentTime);
        });
        this.element.addEventListener('seeked', () => {
            this.emit('seeked', this.element.currentTime);
        });
        this.element.addEventListener('error', () => {
            const error = new types_1.MultimediaError('Audio playback error', 'PLAYBACK_ERROR', { error: this.element.error });
            this._setState('error');
            this.emit('error', error);
        });
    }
    _applyConfig() {
        if (this.element) {
            this.element.volume = this.config.volume || 1;
            this.element.muted = this.config.muted || false;
            this.element.autoplay = this.config.autoplay || false;
            this.element.loop = this.config.loop || false;
            this.element.preload = this.config.preload || 'metadata';
            this.element.crossOrigin = this.config.crossOrigin || null;
        }
        // Apply mock config
        this._volume = this.config.volume || 1;
        this._muted = this.config.muted || false;
    }
    _updateMetadata() {
        if (!this.element)
            return;
        this._duration = this.element.duration || 0;
        this._metadata = {
            duration: this._duration,
            // Note: Additional metadata would require more advanced audio analysis
            // This is a basic implementation
        };
    }
    _createMockMetadata(url) {
        // Create mock metadata for Node.js environment
        this._duration = 180; // 3 minutes mock duration
        this._metadata = {
            duration: this._duration,
            bitrate: 320000,
            sampleRate: 44100,
            channels: 2,
            codec: 'mp3',
            title: `Audio File - ${url.split('/').pop()}`,
        };
    }
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this.emit('statechange', state);
        }
    }
    _startMockPlayback() {
        // Mock playback for Node.js - simulate time updates
        const interval = setInterval(() => {
            if (this._state === 'playing') {
                this._currentTime += 0.1;
                if (this._currentTime >= this._duration) {
                    this._currentTime = this._duration;
                    this._setState('ended');
                    this.emit('ended');
                    clearInterval(interval);
                }
                else {
                    this.emit('timeupdate', this._currentTime, this._duration);
                }
            }
            else {
                clearInterval(interval);
            }
        }, 100);
    }
    // Add missing methods required by MultimediaProvider interface
    async initialize() {
        // Already initialized in constructor, this is for interface compliance
        this._setState('ready');
    }
    getSupportedFormats() {
        return ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
    }
}
exports.PowerScriptAudioPlayer = PowerScriptAudioPlayer;
/**
 * Audio Logo Overlay Implementation
 * Provides branding and logo display for audio players
 */
class AudioLogoOverlay extends events_1.EventEmitter {
    constructor(config) {
        super();
        this._visible = false;
        this.config = {
            enabled: true,
            position: 'top-right',
            opacity: 0.8,
            duration: 0, // Always visible by default
            fadeIn: true,
            fadeOut: true,
            ...config
        };
        // Create logo element (browser only)
        this.element = this._createElement();
        this._applyStyles();
        this._setupEvents();
        // Auto-show if enabled
        if (this.config.enabled) {
            this.show();
        }
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    show() {
        this._visible = true;
        this.element.style.display = 'block';
        if (this.config.fadeIn) {
            this._fadeIn();
        }
        else {
            this.element.style.opacity = String(this.config.opacity || 1);
        }
        // Auto-hide after duration
        if (this.config.duration && this.config.duration > 0) {
            this._fadeTimer = setTimeout(() => {
                this.hide();
            }, this.config.duration * 1000);
        }
        this.emit('show');
    }
    hide() {
        if (this._fadeTimer) {
            clearTimeout(this._fadeTimer);
            this._fadeTimer = undefined;
        }
        this._visible = false;
        if (this.config.fadeOut) {
            this._fadeOut();
        }
        else {
            this.element.style.display = 'none';
        }
        this.emit('hide');
    }
    setPosition(position) {
        this.config.position = position;
        this._applyPositionStyles();
    }
    setOpacity(opacity) {
        this.config.opacity = Math.max(0, Math.min(1, opacity));
        if (this._visible) {
            this.element.style.opacity = String(this.config.opacity);
        }
    }
    destroy() {
        this.hide();
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.removeAllListeners();
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    _createElement() {
        if (typeof document === 'undefined') {
            // Mock element for Node.js
            return {
                style: {},
                addEventListener: () => { },
                removeEventListener: () => { },
            };
        }
        const element = document.createElement('div');
        element.className = 'powerscript-audio-logo';
        if (this.config.imageUrl) {
            const img = document.createElement('img');
            img.src = this.config.imageUrl;
            img.alt = 'Logo';
            element.appendChild(img);
        }
        else if (this.config.text) {
            const text = document.createElement('span');
            text.textContent = this.config.text;
            element.appendChild(text);
        }
        return element;
    }
    _applyStyles() {
        // Base styles
        Object.assign(this.element.style, {
            position: 'absolute',
            zIndex: '1000',
            pointerEvents: this.config.clickUrl ? 'auto' : 'none',
            display: 'none',
            transition: 'opacity 0.3s ease-in-out',
        });
        // Size styles
        if (this.config.size) {
            this.element.style.width = `${this.config.size.width}px`;
            this.element.style.height = `${this.config.size.height}px`;
        }
        this._applyPositionStyles();
    }
    _applyPositionStyles() {
        const position = this.config.position || 'top-right';
        const [vertical, horizontal] = position.split('-');
        // Reset position styles
        this.element.style.top = '';
        this.element.style.bottom = '';
        this.element.style.left = '';
        this.element.style.right = '';
        // Apply vertical positioning
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
        // Apply horizontal positioning
        switch (horizontal) {
            case 'left':
                this.element.style.left = '10px';
                break;
            case 'center':
                this.element.style.left = '50%';
                this.element.style.transform = 'translateX(-50%)';
                break;
            case 'right':
                this.element.style.right = '10px';
                break;
        }
        // Handle center positioning
        if (position === 'middle-center') {
            this.element.style.transform = 'translate(-50%, -50%)';
        }
    }
    _setupEvents() {
        if (this.config.clickUrl && typeof window !== 'undefined') {
            this.element.addEventListener('click', () => {
                window.open(this.config.clickUrl, '_blank');
                this.emit('click', this.config.clickUrl);
            });
        }
    }
    _fadeIn() {
        this.element.style.opacity = '0';
        const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout;
        raf(() => {
            this.element.style.opacity = String(this.config.opacity || 1);
        });
    }
    _fadeOut() {
        this.element.style.opacity = '0';
        setTimeout(() => {
            if (!this._visible) {
                this.element.style.display = 'none';
            }
        }, 300);
    }
}
exports.AudioLogoOverlay = AudioLogoOverlay;
