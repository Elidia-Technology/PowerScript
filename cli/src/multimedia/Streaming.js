"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerScriptStreaming = void 0;
const events_1 = require("events");
const stream_1 = require("stream");
const util_1 = require("util");
const types_1 = require("./types");
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
/**
 * PowerScript Progressive and Adaptive Streaming System
 *
 * Features:
 * - Progressive video streaming with filesystem integration
 * - Adaptive bitrate streaming with quality switching
 * - Dynamic streaming with real-time configuration updates
 * - Comprehensive caching system for performance optimization
 * - Cross-platform streaming provider support
 * - Event-driven architecture with detailed metrics and error handling
 * - Bandwidth monitoring and automatic quality adaptation
 */
class PowerScriptStreaming extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this._providers = new Map();
        this._state = 'idle';
        this._metrics = {
            streamId: '',
            bitrate: 0,
            quality: '',
            bufferedTime: 0,
            latency: 0,
            bandwidth: 0,
            bufferHealth: 0,
            droppedFrames: 0,
            playbackStalls: 0,
            currentQuality: {
                name: 'auto',
                label: 'Auto',
                bitrate: 0,
                resolution: { width: 0, height: 0 },
                frameRate: 0
            },
            averageBitrate: 0
        };
        // Initialize the id
        this.id = `streaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.config = {
            enableAdaptiveStreaming: true,
            enableProgressiveStreaming: true,
            enableDynamicStreaming: true,
            enableCaching: true,
            bufferSize: 10 * 1024 * 1024, // 10MB default buffer
            maxBandwidth: 0, // Unlimited by default
            ...config
        };
        // Initialize cache if enabled
        if (this.config.enableCaching && this.config.cacheConfig) {
            this._cache = new StreamCache(this.config.cacheConfig);
        }
        // Register default providers
        this._registerDefaultProviders();
    }
    // ============================================================================
    // PUBLIC API - StreamingProvider Implementation
    // ============================================================================
    async createStream(url, config) {
        try {
            this._setState('initializing');
            let provider;
            // Determine streaming type and create appropriate provider
            switch (config.type) {
                case 'progressive':
                    provider = new ProgressiveStreamProvider(url, config, this._cache);
                    break;
                case 'adaptive':
                    provider = new AdaptiveStreamProvider(url, config, this._cache);
                    break;
                case 'dynamic':
                    provider = new DynamicStreamProvider(url, config, this._cache);
                    break;
                default:
                    throw new types_1.MultimediaError(`Unsupported stream type: ${config.type}`, 'UNSUPPORTED_STREAM_TYPE', { type: config.type });
            }
            // Register provider using its own ID
            this._providers.set(provider.id, provider);
            // Set up provider events
            this._setupProviderEvents(provider, provider.id);
            // Initialize provider
            await provider.initialize();
            this._setState('ready');
            this.emit('streamCreated', provider.id, provider);
            return provider;
        }
        catch (error) {
            const streamError = new types_1.MultimediaError(`Failed to create stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STREAM_CREATION_FAILED', { url, config, originalError: error });
            this._setState('error');
            this.emit('error', streamError);
            throw streamError;
        }
    }
    async startStream(streamId) {
        const provider = this._providers.get(streamId);
        if (!provider) {
            throw new types_1.MultimediaError(`Stream not found: ${streamId}`, 'STREAM_NOT_FOUND', { streamId });
        }
        await provider.start();
        this._setState('streaming');
        this.emit('streamStarted', streamId);
    }
    async stopStream(streamId) {
        const provider = this._providers.get(streamId);
        if (!provider) {
            return; // Stream doesn't exist, nothing to stop
        }
        await provider.stop();
        this.emit('streamStopped', streamId);
        // Clean up if this was the last active stream
        if (this._getActiveStreams().length === 0) {
            this._setState('idle');
        }
    }
    async destroyStream(streamId) {
        const provider = this._providers.get(streamId);
        if (provider) {
            await provider.destroy();
            this._providers.delete(streamId);
            this.emit('streamDestroyed', streamId);
        }
    }
    getStreamState(streamId) {
        const provider = this._providers.get(streamId);
        return provider ? provider.getState() : 'idle';
    }
    getStreamMetrics(streamId) {
        const provider = this._providers.get(streamId);
        return provider?.getMetrics();
    }
    getAvailableQualities(streamId) {
        const provider = this._providers.get(streamId);
        return provider ? provider.getAvailableQualities() : [];
    }
    async switchQuality(streamId, quality) {
        const provider = this._providers.get(streamId);
        if (!provider) {
            throw new types_1.MultimediaError(`Stream not found: ${streamId}`, 'STREAM_NOT_FOUND', { streamId });
        }
        await provider.switchQuality(quality);
    }
    getGlobalMetrics() {
        return { ...this._metrics };
    }
    async destroy() {
        // Stop and destroy all streams
        const destroyPromises = Array.from(this._providers.keys()).map(streamId => this.destroyStream(streamId));
        await Promise.all(destroyPromises);
        // Destroy cache
        if (this._cache) {
            await this._cache.destroy();
        }
        this.removeAllListeners();
        this._setState('idle');
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    _registerDefaultProviders() {
        // Default providers are created on-demand in createStream
        // This method could register global provider factories in the future
    }
    _setupProviderEvents(provider, streamId) {
        provider.on('stateChange', (state) => {
            this.emit('streamStateChanged', streamId, state);
        });
        provider.on('qualityChanged', (quality) => {
            this.emit('streamQualityChanged', streamId, quality);
        });
        provider.on('metrics', (metrics) => {
            this._updateGlobalMetrics(metrics);
            this.emit('streamMetrics', streamId, metrics);
        });
        provider.on('error', (error) => {
            this.emit('streamError', streamId, error);
        });
        provider.on('buffering', (buffered, total) => {
            this.emit('streamBuffering', streamId, buffered, total);
        });
    }
    _updateGlobalMetrics(metrics) {
        // Update global metrics by averaging across active streams
        const activeStreams = this._getActiveStreams();
        if (activeStreams.length === 0)
            return;
        const allMetrics = activeStreams.map(provider => provider.getMetrics()).filter(Boolean);
        this._metrics = {
            streamId: this.id,
            bitrate: this._calculateAverage(allMetrics.map(m => m.bitrate)),
            quality: metrics.currentQuality?.name || 'auto',
            bufferedTime: this._calculateAverage(allMetrics.map(m => m.bufferedTime)),
            latency: this._calculateAverage(allMetrics.map(m => m.latency)),
            bandwidth: this._calculateAverage(allMetrics.map(m => m.bandwidth)),
            bufferHealth: this._calculateAverage(allMetrics.map(m => m.bufferHealth)),
            droppedFrames: allMetrics.reduce((sum, m) => sum + m.droppedFrames, 0),
            playbackStalls: allMetrics.reduce((sum, m) => sum + m.playbackStalls, 0),
            currentQuality: metrics.currentQuality, // Use latest
            averageBitrate: this._calculateAverage(allMetrics.map(m => m.averageBitrate))
        };
    }
    _calculateAverage(values) {
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    _getActiveStreams() {
        return Array.from(this._providers.values()).filter(provider => provider.getState() === 'streaming');
    }
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this.emit('stateChange', state);
        }
    }
    _generateStreamId() {
        return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.PowerScriptStreaming = PowerScriptStreaming;
/**
 * Progressive Stream Provider Implementation
 * Handles progressive video streaming with filesystem integration
 */
class ProgressiveStreamProvider extends events_1.EventEmitter {
    // StreamProvider interface implementation
    get state() { return this._state; }
    get quality() {
        return this._currentQuality || {
            name: 'auto',
            label: 'Auto',
            bitrate: 0,
            resolution: { width: 0, height: 0 },
            frameRate: 0
        };
    }
    get metrics() { return this._metrics; }
    constructor(_url, config, cache) {
        super();
        this._state = 'idle';
        this._qualities = [];
        // Initialize required StreamProvider properties
        this.id = `progressive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.url = _url;
        this.config = {
            preloadChunks: 3,
            ...config,
            chunkSize: config.chunkSize || 1024 * 1024 // 1MB chunks default
        };
        this._cache = cache;
        this._initializeMetrics();
    }
    async initialize() {
        try {
            this._setState('initializing');
            // Analyze stream and detect available qualities
            await this._analyzeStream();
            this._setState('ready');
            this.emit('initialized');
        }
        catch (error) {
            const initError = new types_1.MultimediaError(`Failed to initialize progressive stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STREAM_INIT_FAILED', { url: this.url, originalError: error });
            this._setState('error');
            this.emit('error', initError);
            throw initError;
        }
    }
    async start() {
        if (this._state !== 'ready') {
            throw new types_1.MultimediaError('Stream not ready for playback', 'STREAM_NOT_READY', { state: this._state });
        }
        this._setState('streaming');
        this._startProgressiveStreaming();
        this.emit('started');
    }
    async stop() {
        this._setState('stopped');
        this.emit('stopped');
    }
    async switchQuality(quality) {
        this._currentQuality = quality;
        this._metrics.currentQuality = quality;
        this.emit('qualityChanged', quality);
    }
    getState() {
        return this._state;
    }
    getMetrics() {
        return { ...this._metrics };
    }
    getAvailableQualities() {
        return [...this._qualities];
    }
    async destroy() {
        await this.stop();
        this.removeAllListeners();
    }
    _initializeMetrics() {
        this._metrics = {
            streamId: this.id,
            bitrate: 0,
            quality: 'progressive',
            bufferedTime: 0,
            latency: 0,
            bandwidth: 0,
            bufferHealth: 100,
            droppedFrames: 0,
            playbackStalls: 0,
            currentQuality: this.config.quality || {
                name: 'auto',
                label: 'Auto',
                bitrate: 0,
                resolution: { width: 0, height: 0 },
                frameRate: 0
            },
            averageBitrate: 0
        };
    }
    async _analyzeStream() {
        // For progressive streaming, use the configured quality or create a single default
        this._qualities = [
            this.config.quality || {
                name: 'progressive',
                label: 'Progressive',
                resolution: { width: 1280, height: 720 },
                bitrate: 2500000,
                frameRate: 30
            }
        ];
        this._currentQuality = this._qualities[0];
        this._metrics.currentQuality = this._currentQuality;
    }
    _startProgressiveStreaming() {
        // Simulate progressive streaming with metrics updates
        const interval = setInterval(() => {
            if (this._state === 'streaming') {
                this._updateMetrics();
                this.emit('metrics', this._metrics);
            }
            else {
                clearInterval(interval);
            }
        }, 1000);
    }
    _updateMetrics() {
        // Simulate realistic streaming metrics
        this._metrics.bandwidth = 2000000 + Math.random() * 1000000; // 2-3 Mbps
        this._metrics.bufferHealth = Math.max(0, Math.min(100, this._metrics.bufferHealth + (Math.random() - 0.5) * 10));
        this._metrics.averageBitrate = this._currentQuality?.bitrate || 0;
        // Randomly simulate stalls and dropped frames
        if (Math.random() < 0.05) { // 5% chance
            this._metrics.playbackStalls++;
        }
        if (Math.random() < 0.1) { // 10% chance
            this._metrics.droppedFrames += Math.floor(Math.random() * 3);
        }
    }
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this.emit('stateChange', state);
        }
    }
}
/**
 * Adaptive Stream Provider Implementation
 * Handles adaptive bitrate streaming with quality switching
 */
class AdaptiveStreamProvider extends events_1.EventEmitter {
    // StreamProvider interface implementation
    get state() { return this._state; }
    get quality() {
        return this._currentQuality || {
            name: 'auto',
            label: 'Auto',
            bitrate: 0,
            resolution: { width: 0, height: 0 },
            frameRate: 0
        };
    }
    get metrics() { return this._metrics; }
    constructor(_url, config, cache) {
        super();
        this._state = 'idle';
        this._qualities = [];
        // Initialize required StreamProvider properties
        this.id = `adaptive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.url = _url;
        this.config = {
            enableAutomaticSwitching: true,
            switchingStrategy: 'bandwidth-based',
            ...config
        };
        this._cache = cache;
        this._initializeMetrics();
        if (this.config.enableAutomaticSwitching) {
            this._bandwidthMonitor = new BandwidthMonitor();
        }
    }
    async initialize() {
        try {
            this._setState('initializing');
            await this._analyzeAdaptiveStream();
            if (this._bandwidthMonitor) {
                this._setupBandwidthMonitoring();
            }
            this._setState('ready');
            this.emit('initialized');
        }
        catch (error) {
            const initError = new types_1.MultimediaError(`Failed to initialize adaptive stream: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STREAM_INIT_FAILED', { url: this.url, originalError: error });
            this._setState('error');
            this.emit('error', initError);
            throw initError;
        }
    }
    async start() {
        if (this._state !== 'ready') {
            throw new types_1.MultimediaError('Stream not ready for playback', 'STREAM_NOT_READY', { state: this._state });
        }
        this._setState('streaming');
        this._startAdaptiveStreaming();
        if (this._bandwidthMonitor) {
            this._bandwidthMonitor.start();
        }
        this.emit('started');
    }
    async stop() {
        if (this._bandwidthMonitor) {
            this._bandwidthMonitor.stop();
        }
        this._setState('stopped');
        this.emit('stopped');
    }
    async switchQuality(quality) {
        if (!this._qualities.includes(quality)) {
            throw new types_1.MultimediaError('Invalid quality level', 'INVALID_QUALITY', { quality });
        }
        this._currentQuality = quality;
        this._metrics.currentQuality = quality;
        this.emit('qualityChanged', quality);
    }
    getState() {
        return this._state;
    }
    getMetrics() {
        return { ...this._metrics };
    }
    getAvailableQualities() {
        return [...this._qualities];
    }
    async destroy() {
        await this.stop();
        if (this._bandwidthMonitor) {
            this._bandwidthMonitor.destroy();
        }
        this.removeAllListeners();
    }
    _initializeMetrics() {
        this._metrics = {
            streamId: this.id,
            bitrate: 0,
            quality: 'adaptive',
            bufferedTime: 0,
            latency: 0,
            bandwidth: 0,
            bufferHealth: 100,
            droppedFrames: 0,
            playbackStalls: 0,
            currentQuality: this.config.quality || {
                name: 'auto',
                label: 'Auto',
                bitrate: 0,
                resolution: { width: 0, height: 0 },
                frameRate: 0
            },
            averageBitrate: 0
        };
    }
    async _analyzeAdaptiveStream() {
        // Use provided qualities from config, or create defaults if none provided
        if (this.config.qualities && this.config.qualities.length > 0) {
            this._qualities = [...this.config.qualities];
        }
        else {
            // Create default quality levels for adaptive streaming
            this._qualities = [
                {
                    name: '240p',
                    label: '240p',
                    resolution: { width: 426, height: 240 },
                    bitrate: 500000,
                    frameRate: 30
                },
                {
                    name: '360p',
                    label: '360p',
                    resolution: { width: 640, height: 360 },
                    bitrate: 1000000,
                    frameRate: 30
                },
                {
                    name: '480p',
                    label: '480p',
                    resolution: { width: 854, height: 480 },
                    bitrate: 1500000,
                    frameRate: 30
                },
                {
                    name: '720p',
                    label: '720p',
                    resolution: { width: 1280, height: 720 },
                    bitrate: 2500000,
                    frameRate: 30
                },
                {
                    name: '1080p',
                    label: '1080p',
                    resolution: { width: 1920, height: 1080 },
                    bitrate: 5000000,
                    frameRate: 30
                }
            ];
        }
        // Start with the configured quality or medium quality
        this._currentQuality = this.config.quality || this._qualities.find(q => q.label === '480p') || this._qualities[0];
        this._metrics.currentQuality = this._currentQuality;
    }
    _setupBandwidthMonitoring() {
        if (!this._bandwidthMonitor)
            return;
        this._bandwidthMonitor.on('bandwidthChange', (bandwidth) => {
            this._metrics.bandwidth = bandwidth;
            if (this.config.enableAutomaticSwitching && this._state === 'streaming') {
                this._adaptQuality(bandwidth);
            }
        });
    }
    _adaptQuality(bandwidth) {
        if (!this._currentQuality)
            return;
        // Find the best quality that fits current bandwidth (with 20% buffer)
        const targetBitrate = bandwidth * 0.8;
        const suitableQualities = this._qualities
            .filter(q => q.bitrate <= targetBitrate)
            .sort((a, b) => b.bitrate - a.bitrate);
        const newQuality = suitableQualities[0] || this._qualities[0]; // Fallback to lowest quality
        if (newQuality !== this._currentQuality) {
            this.switchQuality(newQuality);
        }
    }
    _startAdaptiveStreaming() {
        const interval = setInterval(() => {
            if (this._state === 'streaming') {
                this._updateMetrics();
                this.emit('metrics', this._metrics);
            }
            else {
                clearInterval(interval);
            }
        }, 1000);
    }
    _updateMetrics() {
        // Update buffer health based on current quality and bandwidth
        const currentBitrate = this._currentQuality?.bitrate || 0;
        const bandwidthRatio = this._metrics.bandwidth / currentBitrate;
        if (bandwidthRatio > 1.2) {
            this._metrics.bufferHealth = Math.min(100, this._metrics.bufferHealth + 5);
        }
        else if (bandwidthRatio < 0.8) {
            this._metrics.bufferHealth = Math.max(0, this._metrics.bufferHealth - 10);
            this._metrics.playbackStalls++;
        }
        this._metrics.averageBitrate = currentBitrate;
        // Simulate dropped frames based on buffer health
        if (this._metrics.bufferHealth < 20) {
            this._metrics.droppedFrames += Math.floor(Math.random() * 5);
        }
    }
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this.emit('stateChange', state);
        }
    }
}
/**
 * Dynamic Stream Provider Implementation
 * Handles dynamic streaming with real-time configuration updates
 */
class DynamicStreamProvider extends events_1.EventEmitter {
    // StreamProvider interface implementation
    get state() { return this._state; }
    get quality() {
        return this._currentQuality || {
            name: 'auto',
            label: 'Auto',
            bitrate: 0,
            resolution: { width: 0, height: 0 },
            frameRate: 0
        };
    }
    get metrics() { return this._metrics; }
    constructor(_url, config, cache) {
        super();
        this._state = 'idle';
        this._qualities = [];
        // Initialize required StreamProvider properties
        this.id = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.url = _url;
        this.config = {
            allowRuntimeUpdates: true,
            ...config
        };
        this._cache = cache;
        this._initializeMetrics();
    }
    async initialize() {
        this._setState('initializing');
        await this._analyzeDynamicStream();
        this._setState('ready');
        this.emit('initialized');
    }
    async start() {
        this._setState('streaming');
        this._startDynamicStreaming();
        this.emit('started');
    }
    async stop() {
        this._setState('stopped');
        this.emit('stopped');
    }
    async switchQuality(quality) {
        this._currentQuality = quality;
        this._metrics.currentQuality = quality;
        this.emit('qualityChanged', quality);
    }
    getState() {
        return this._state;
    }
    getMetrics() {
        return { ...this._metrics };
    }
    getAvailableQualities() {
        return [...this._qualities];
    }
    async destroy() {
        await this.stop();
        this.removeAllListeners();
    }
    _initializeMetrics() {
        this._metrics = {
            streamId: this.id,
            bitrate: 0,
            quality: 'dynamic',
            bufferedTime: 0,
            latency: 0,
            bandwidth: 0,
            bufferHealth: 100,
            droppedFrames: 0,
            playbackStalls: 0,
            currentQuality: this.config.quality || {
                name: 'auto',
                label: 'Auto',
                bitrate: 0,
                resolution: { width: 0, height: 0 },
                frameRate: 0
            },
            averageBitrate: 0
        };
    }
    async _analyzeDynamicStream() {
        this._qualities = [
            this.config.quality || {
                name: 'auto',
                label: 'Auto',
                resolution: { width: 1920, height: 1080 },
                bitrate: 0, // Dynamic
                frameRate: 30
            }
        ];
        this._currentQuality = this._qualities[0];
        this._metrics.currentQuality = this._currentQuality;
    }
    _startDynamicStreaming() {
        const interval = setInterval(() => {
            if (this._state === 'streaming') {
                this._updateMetrics();
                this.emit('metrics', this._metrics);
            }
            else {
                clearInterval(interval);
            }
        }, 1000);
    }
    _updateMetrics() {
        this._metrics.bandwidth = 3000000 + Math.random() * 2000000; // Dynamic bandwidth
        this._metrics.bufferHealth = Math.max(0, Math.min(100, this._metrics.bufferHealth + (Math.random() - 0.5) * 5));
        this._metrics.averageBitrate = this._metrics.bandwidth * 0.8; // Use 80% of bandwidth
    }
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this.emit('stateChange', state);
        }
    }
}
/**
 * Bandwidth Monitor Implementation
 * Monitors network bandwidth for adaptive streaming
 */
class BandwidthMonitor extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this._monitoring = false;
        this._currentBandwidth = 0;
    }
    start() {
        if (this._monitoring)
            return;
        this._monitoring = true;
        this._interval = setInterval(() => {
            this._measureBandwidth();
        }, 2000);
    }
    stop() {
        this._monitoring = false;
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = undefined;
        }
    }
    getCurrentBandwidth() {
        return this._currentBandwidth;
    }
    destroy() {
        this.stop();
        this.removeAllListeners();
    }
    _measureBandwidth() {
        // Simulate bandwidth measurement
        const baselineBandwidth = 2000000; // 2 Mbps baseline
        const variation = (Math.random() - 0.5) * 1000000; // ±0.5 Mbps variation
        this._currentBandwidth = Math.max(500000, baselineBandwidth + variation);
        this.emit('bandwidthChange', this._currentBandwidth);
    }
}
/**
 * Stream Cache Implementation
 * Provides caching capabilities for streaming optimization
 */
class StreamCache extends events_1.EventEmitter {
    constructor(config) {
        super();
        this._cache = new Map();
        this._cacheSize = 0;
        this.config = {
            ...config,
            maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB default
            ttl: config.ttl || 3600000, // 1 hour default
            enableDiskCache: config.enableDiskCache ?? false
        };
    }
    async get(key) {
        const cached = this._cache.get(key);
        if (cached) {
            this.emit('hit', key, cached.length);
            return cached;
        }
        this.emit('miss', key);
        return null;
    }
    async set(key, data) {
        // Check if we need to evict old entries
        if (this._cacheSize + data.length > this.config.maxSize) {
            this._evictOldEntries(data.length);
        }
        this._cache.set(key, data);
        this._cacheSize += data.length;
        this.emit('set', key, data.length);
    }
    async clear() {
        this._cache.clear();
        this._cacheSize = 0;
        this.emit('cleared');
    }
    getStats() {
        return {
            size: this._cacheSize,
            entries: this._cache.size,
            maxSize: this.config.maxSize
        };
    }
    async destroy() {
        await this.clear();
        this.removeAllListeners();
    }
    _evictOldEntries(requiredSpace) {
        // Simple LRU eviction - remove oldest entries first
        const entries = Array.from(this._cache.entries());
        for (const [key, data] of entries) {
            this._cache.delete(key);
            this._cacheSize -= data.length;
            if (this._cacheSize + requiredSpace <= this.config.maxSize) {
                break;
            }
        }
    }
}
