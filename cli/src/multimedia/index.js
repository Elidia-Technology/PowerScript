"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptMultimediaProcessor = exports.PowerScriptStreaming = exports.PowerScriptVideoPlayer = exports.PowerScriptAudioPlayer = exports.PowerScriptGraphics = void 0;
exports.createMultimediaProvider = createMultimediaProvider;
const events_1 = require("events");
const AudioPlayer_1 = require("./AudioPlayer");
Object.defineProperty(exports, "PowerScriptAudioPlayer", { enumerable: true, get: function () { return AudioPlayer_1.PowerScriptAudioPlayer; } });
const VideoPlayer_1 = require("./VideoPlayer");
Object.defineProperty(exports, "PowerScriptVideoPlayer", { enumerable: true, get: function () { return VideoPlayer_1.PowerScriptVideoPlayer; } });
const Streaming_1 = require("./Streaming");
Object.defineProperty(exports, "PowerScriptStreaming", { enumerable: true, get: function () { return Streaming_1.PowerScriptStreaming; } });
const Processing_1 = require("./Processing");
Object.defineProperty(exports, "PowerScriptMultimediaProcessor", { enumerable: true, get: function () { return Processing_1.PowerScriptMultimediaProcessor; } });
const types_1 = require("./types");
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
class PowerScriptGraphics extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.name = 'PowerScriptGraphics';
        this.capabilities = ['audio', 'video', 'streaming', 'processing'];
        this._initialized = false;
        this.config = {
            enableAudioPlayer: true,
            enableVideoPlayer: true,
            enableStreaming: true,
            enableProcessing: true,
            enableGlobalLogo: false,
            ...config
        };
        // Initialize components based on configuration
        this.audioPlayer = new AudioPlayer_1.PowerScriptAudioPlayer(this.config.audioConfig);
        this.videoPlayer = new VideoPlayer_1.PowerScriptVideoPlayer(this.config.videoConfig);
        this.streaming = new Streaming_1.PowerScriptStreaming(this.config.streamingConfig);
        this.processor = new Processing_1.PowerScriptMultimediaProcessor(this.config.processingConfig);
        // Set up component event forwarding
        this._setupEventForwarding();
    }
    // ============================================================================
    // PUBLIC API - MultimediaProvider Implementation
    // ============================================================================
    async initialize() {
        if (this._initialized) {
            return;
        }
        try {
            this.emit('initializing');
            // Initialize all components
            const initPromises = [];
            // Audio player is ready by default (no async init required)
            // Video player is ready by default (no async init required)
            // Streaming may need initialization
            // Note: Streaming initializes on-demand when streams are created
            // Processor is ready by default (no async init required)
            await Promise.all(initPromises);
            this._initialized = true;
            this.emit('initialized');
        }
        catch (error) {
            const initError = new types_1.MultimediaError(`Failed to initialize PowerScript Graphics: ${error instanceof Error ? error.message : 'Unknown error'}`, 'INITIALIZATION_FAILED', { originalError: error });
            this.emit('error', initError);
            throw initError;
        }
    }
    // ============================================================================
    // AUDIO API
    // ============================================================================
    async createAudioPlayer(config) {
        if (!this.config.enableAudioPlayer) {
            throw new types_1.MultimediaError('Audio player is disabled', 'FEATURE_DISABLED', { feature: 'audioPlayer' });
        }
        const playerConfig = { ...this.config.audioConfig, ...config };
        const player = new AudioPlayer_1.PowerScriptAudioPlayer(playerConfig);
        this.emit('audioPlayerCreated', player);
        return player;
    }
    getAudioPlayer() {
        return this.audioPlayer;
    }
    // ============================================================================
    // VIDEO API
    // ============================================================================
    async createVideoPlayer(config) {
        if (!this.config.enableVideoPlayer) {
            throw new types_1.MultimediaError('Video player is disabled', 'FEATURE_DISABLED', { feature: 'videoPlayer' });
        }
        const playerConfig = { ...this.config.videoConfig, ...config };
        const player = new VideoPlayer_1.PowerScriptVideoPlayer(playerConfig);
        this.emit('videoPlayerCreated', player);
        return player;
    }
    getVideoPlayer() {
        return this.videoPlayer;
    }
    // ============================================================================
    // STREAMING API
    // ============================================================================
    async createStream(url, streamConfig) {
        if (!this.config.enableStreaming) {
            throw new types_1.MultimediaError('Streaming is disabled', 'FEATURE_DISABLED', { feature: 'streaming' });
        }
        const stream = await this.streaming.createStream(url, streamConfig);
        this.emit('streamCreated', stream);
        return stream;
    }
    getStreaming() {
        return this.streaming;
    }
    // ============================================================================
    // PROCESSING API
    // ============================================================================
    async processAudio(inputData, options) {
        if (!this.config.enableProcessing) {
            throw new types_1.MultimediaError('Processing is disabled', 'FEATURE_DISABLED', { feature: 'processing' });
        }
        return await this.processor.processAudio(inputData, options);
    }
    async processVideo(inputData, options) {
        if (!this.config.enableProcessing) {
            throw new types_1.MultimediaError('Processing is disabled', 'FEATURE_DISABLED', { feature: 'processing' });
        }
        return await this.processor.processVideo(inputData, options);
    }
    async processImage(inputData, options) {
        if (!this.config.enableProcessing) {
            throw new types_1.MultimediaError('Processing is disabled', 'FEATURE_DISABLED', { feature: 'processing' });
        }
        return await this.processor.processImage(inputData, options);
    }
    async batchProcess(inputs, batchOptions) {
        if (!this.config.enableProcessing) {
            throw new types_1.MultimediaError('Processing is disabled', 'FEATURE_DISABLED', { feature: 'processing' });
        }
        return await this.processor.batchProcess(inputs, batchOptions);
    }
    getProcessor() {
        return this.processor;
    }
    // ============================================================================
    // UTILITY & MANAGEMENT API
    // ============================================================================
    getSupportedFormats() {
        const allFormats = this.processor.getSupportedFormats();
        return {
            audio: allFormats.filter(f => f.type === 'audio'),
            video: allFormats.filter(f => f.type === 'video')
        };
    }
    isFormatSupported(format) {
        const supportedFormats = this.getSupportedFormats();
        return [...supportedFormats.audio, ...supportedFormats.video].includes(format);
    }
    getCapabilities() {
        return [...this.capabilities];
    }
    getGlobalStatus() {
        return {
            initialized: this._initialized,
            audioPlayerState: this.audioPlayer.getState(),
            videoPlayerState: this.videoPlayer.getState(),
            activeOperations: this.processor.getActiveOperations().length,
            activeStreams: 0 // Would need to implement stream counting in streaming provider
        };
    }
    async destroy() {
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
        }
        catch (error) {
            const destroyError = new types_1.MultimediaError(`Failed to destroy PowerScript Graphics: ${error instanceof Error ? error.message : 'Unknown error'}`, 'DESTRUCTION_FAILED', { originalError: error });
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
    async playAudio(url, config) {
        const player = config ? await this.createAudioPlayer(config) : this.audioPlayer;
        await player.load(url);
        await player.play();
    }
    /**
     * Quick video playback with minimal configuration
     */
    async playVideo(url, container, config) {
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
    async convertAudio(input, fromFormat, toFormat, options) {
        const processingOptions = {
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
    async convertVideo(input, fromFormat, toFormat, options) {
        const processingOptions = {
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
    async createProgressiveStream(url, config) {
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
    async createAdaptiveStream(url, config) {
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
    _setupEventForwarding() {
        // Forward audio player events
        this.audioPlayer.on('play', () => this.emit('audioPlay'));
        this.audioPlayer.on('pause', () => this.emit('audioPause'));
        this.audioPlayer.on('stop', () => this.emit('audioStop'));
        this.audioPlayer.on('ended', () => this.emit('audioEnded'));
        this.audioPlayer.on('error', (error) => this.emit('audioError', error));
        this.audioPlayer.on('timeupdate', (time) => this.emit('audioTimeUpdate', time));
        this.audioPlayer.on('volumechange', (volume) => this.emit('audioVolumeChange', volume));
        this.audioPlayer.on('loadstart', () => this.emit('audioLoadStart'));
        this.audioPlayer.on('loadeddata', () => this.emit('audioLoadedData'));
        this.audioPlayer.on('canplay', () => this.emit('audioCanPlay'));
        this.audioPlayer.on('canplaythrough', () => this.emit('audioCanPlayThrough'));
        // Forward video player events
        this.videoPlayer.on('play', () => this.emit('videoPlay'));
        this.videoPlayer.on('pause', () => this.emit('videoPause'));
        this.videoPlayer.on('stop', () => this.emit('videoStop'));
        this.videoPlayer.on('ended', () => this.emit('videoEnded'));
        this.videoPlayer.on('error', (error) => this.emit('videoError', error));
        this.videoPlayer.on('timeupdate', (time) => this.emit('videoTimeUpdate', time));
        this.videoPlayer.on('volumechange', (volume) => this.emit('videoVolumeChange', volume));
        this.videoPlayer.on('loadstart', () => this.emit('videoLoadStart'));
        this.videoPlayer.on('loadeddata', () => this.emit('videoLoadedData'));
        this.videoPlayer.on('canplay', () => this.emit('videoCanPlay'));
        this.videoPlayer.on('canplaythrough', () => this.emit('videoCanPlayThrough'));
        this.videoPlayer.on('seeking', () => this.emit('videoSeeking'));
        this.videoPlayer.on('seeked', () => this.emit('videoSeeked'));
        this.videoPlayer.on('ratechange', (rate) => this.emit('videoRateChange', rate));
        this.videoPlayer.on('durationchange', (duration) => this.emit('videoDurationChange', duration));
        this.videoPlayer.on('progress', (buffered) => this.emit('videoProgress', buffered));
        this.videoPlayer.on('qualitychange', (quality) => this.emit('videoQualityChange', quality));
        this.videoPlayer.on('fullscreenchange', (isFullscreen) => this.emit('videoFullscreenChange', isFullscreen));
        // Forward streaming events (cast to EventEmitter to access event methods)
        this.streaming.on('streamCreated', (id, provider) => this.emit('streamCreated', id, provider));
        this.streaming.on('streamStarted', (id) => this.emit('streamStarted', id));
        this.streaming.on('streamStopped', (id) => this.emit('streamStopped', id));
        this.streaming.on('streamError', (id, error) => this.emit('streamError', id, error));
        // Forward processing events (cast to EventEmitter to access event methods)
        this.processor.on('operationStarted', (operation) => this.emit('processingStarted', operation));
        this.processor.on('operationCompleted', (operation) => this.emit('processingCompleted', operation));
        this.processor.on('operationProgress', (operation) => this.emit('processingProgress', operation));
        this.processor.on('operationError', (id, error) => this.emit('processingError', id, error));
    }
}
exports.PowerScriptGraphics = PowerScriptGraphics;
// ============================================================================
// DEFAULT EXPORT & CONVENIENCE FACTORY
// ============================================================================
/**
 * Create a new PowerScript Graphics & Multimedia instance with default configuration
 */
function createMultimediaProvider(config) {
    return new PowerScriptGraphics(config);
}
/**
 * Default export - PowerScript Graphics & Multimedia Module
 */
exports.default = PowerScriptGraphics;
// Export all types for external usage
__exportStar(require("./types"), exports);
