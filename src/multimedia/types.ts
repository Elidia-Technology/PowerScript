import { EventEmitter } from 'events';

/**
 * PowerScript Graphics & Multimedia Module Types
 * 
 * Comprehensive type definitions for multimedia capabilities including
 * audio playback, video players, streaming, and multimedia processing.
 */

// ============================================================================
// CORE MULTIMEDIA INTERFACES
// ============================================================================

export type MediaState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error' | 'ended';

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'aac' | 'm4a' | 'flac';
export type VideoFormat = 'mp4' | 'webm' | 'ogg' | 'avi' | 'mov' | 'mkv';
export type StreamingProtocol = 'hls' | 'dash' | 'rtmp' | 'webrtc' | 'http';

export interface MediaMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  resolution?: { width: number; height: number };
  frameRate?: number;
  size?: number; // bytes
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
}

// ============================================================================
// AUDIO INTERFACES
// ============================================================================

export interface AudioPlayerConfig {
  volume?: number; // 0-1
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  crossOrigin?: 'anonymous' | 'use-credentials';
  enableLogo?: boolean;
  logoConfig?: LogoConfig;
}

export interface AudioPlayerControls {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
  toggleMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getState(): MediaState;
}

export interface AudioRecorderConfig {
  format?: AudioFormat;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  maxDuration?: number; // seconds
  autoStart?: boolean;
}

export interface AudioStreamConfig {
  url: string;
  format?: AudioFormat;
  bufferSize?: number;
  retryAttempts?: number;
  reconnectDelay?: number;
}

// ============================================================================
// VIDEO INTERFACES
// ============================================================================

export interface VideoPlayerConfig {
  width?: number;
  height?: number;
  volume?: number;
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  preload?: 'auto' | 'metadata' | 'none';
  crossOrigin?: 'anonymous' | 'use-credentials';
  enableCustomControls?: boolean;
  enableLogo?: boolean;
  logoConfig?: LogoConfig;
  controlsConfig?: VideoControlsConfig;
}

export interface VideoControlsConfig {
  showPlayPause?: boolean;
  showSeekBar?: boolean;
  showTimeDisplay?: boolean;
  showVolumeControl?: boolean;
  showFullscreenButton?: boolean;
  showQualitySelector?: boolean;
  showSpeedControl?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom' | 'top' | 'overlay';
}

export interface VideoPlayerControls extends AudioPlayerControls {
  setSize(width: number, height: number): void;
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  setQuality(quality: VideoQuality): void;
  getAvailableQualities(): VideoQuality[];
}

export interface VideoQuality {
  label: string;
  width: number;
  height: number;
  bitrate: number;
  url?: string;
}

// ============================================================================
// STREAMING INTERFACES
// ============================================================================

export interface StreamingConfig {
  protocol: StreamingProtocol;
  url: string;
  manifest?: string;
  segments?: StreamSegment[];
  bufferSize?: number;
  maxBufferLength?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableAdaptiveBitrate?: boolean;
  enableCaching?: boolean;
  cacheSize?: number; // MB
}

export interface StreamSegment {
  url: string;
  duration: number;
  sequence: number;
  quality?: VideoQuality;
  startTime?: number;
  endTime?: number;
}

export interface StreamingStats {
  bufferedTime: number;
  downloadSpeed: number; // bytes/sec
  currentBitrate: number;
  droppedFrames: number;
  totalFrames: number;
  bufferHealth: number; // 0-1
  adaptations: number;
}

// ============================================================================
// LOGO & BRANDING INTERFACES
// ============================================================================

export interface LogoConfig {
  enabled?: boolean;
  imageUrl?: string;
  text?: string;
  position?: LogoPosition;
  size?: { width: number; height: number };
  opacity?: number;
  clickUrl?: string;
  duration?: number; // seconds to show, 0 = always
  fadeIn?: boolean;
  fadeOut?: boolean;
}

export type LogoPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// ============================================================================
// MULTIMEDIA PROCESSING INTERFACES
// ============================================================================

export interface VideoEncoderConfig {
  format: VideoFormat;
  quality?: VideoQuality;
  codec?: string;
  bitrate?: number;
  frameRate?: number;
  keyframeInterval?: number;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

export interface VideoDecoderConfig {
  format: VideoFormat;
  outputFormat?: VideoFormat;
  quality?: VideoQuality;
  enableHardwareAcceleration?: boolean;
}

export interface AudioEncoderConfig {
  format: AudioFormat;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  quality?: 'low' | 'medium' | 'high' | 'lossless';
}

export interface AudioDecoderConfig {
  format: AudioFormat;
  outputFormat?: AudioFormat;
  sampleRate?: number;
  channels?: number;
}

export interface MediaProcessingJob {
  id: string;
  type: 'encode' | 'decode' | 'transcode' | 'extract';
  input: string | Buffer;
  output?: string;
  config: VideoEncoderConfig | VideoDecoderConfig | AudioEncoderConfig | AudioDecoderConfig;
  progress: number; // 0-100
  state: 'queued' | 'processing' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: Error;
}

// ============================================================================
// SCENE GRAPH INTERFACES (Integration with Graphics Module)
// ============================================================================

export interface SceneGraphConfig {
  enableRendering?: boolean;
  renderer?: 'canvas' | 'webgl' | 'auto';
  width?: number;
  height?: number;
  backgroundColor?: string;
  antialias?: boolean;
  enableInteraction?: boolean;
}

export interface MediaDisplayObject {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  visible: boolean;
  interactive: boolean;
}

export interface AudioVisualizationConfig {
  type: 'waveform' | 'spectrum' | 'bars' | 'circular';
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  smoothing?: number;
  fftSize?: number;
  enableInteraction?: boolean;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

export interface MediaPlayerEvents {
  'loading': () => void;
  'loaded': (metadata: MediaMetadata) => void;
  'ready': () => void;
  'play': () => void;
  'pause': () => void;
  'stop': () => void;
  'ended': () => void;
  'timeupdate': (currentTime: number, duration: number) => void;
  'progress': (buffered: number, duration: number) => void;
  'volumechange': (volume: number, muted: boolean) => void;
  'error': (error: Error) => void;
  'statechange': (state: MediaState) => void;
  'seeking': (time: number) => void;
  'seeked': (time: number) => void;
}

export interface StreamingPlayerEvents extends MediaPlayerEvents {
  'buffering': (buffered: number) => void;
  'qualitychange': (quality: VideoQuality) => void;
  'bitratechange': (bitrate: number) => void;
  'segmentloaded': (segment: StreamSegment) => void;
  'manifestloaded': (manifest: any) => void;
  'adaptation': (from: VideoQuality, to: VideoQuality) => void;
}

export interface RecorderEvents {
  'start': () => void;
  'stop': (data: Blob) => void;
  'pause': () => void;
  'resume': () => void;
  'dataavailable': (data: Blob) => void;
  'error': (error: Error) => void;
}

// ============================================================================
// MAIN MULTIMEDIA INTERFACES
// ============================================================================

export interface MultimediaProvider extends EventEmitter {
  readonly name: string;
  readonly capabilities: string[];
  
  // Audio capabilities
  createAudioPlayer?(config?: AudioPlayerConfig): Promise<AudioPlayer>;
  createAudioRecorder?(config?: AudioRecorderConfig): Promise<AudioRecorder>;
  createAudioStream?(config: AudioStreamConfig): Promise<AudioStream>;
  
  // Video capabilities  
  createVideoPlayer?(config?: VideoPlayerConfig): Promise<VideoPlayer>;
  createStreamingPlayer?(config: StreamingConfig): Promise<StreamingPlayer>;
  
  // Processing capabilities
  encodeVideo?(input: string | Buffer, config: VideoEncoderConfig): Promise<MediaProcessingJob>;
  decodeVideo?(input: string | Buffer, config: VideoDecoderConfig): Promise<MediaProcessingJob>;
  encodeAudio?(input: string | Buffer, config: AudioEncoderConfig): Promise<MediaProcessingJob>;
  decodeAudio?(input: string | Buffer, config: AudioDecoderConfig): Promise<MediaProcessingJob>;
  
  // Utility methods
  getSupportedFormats(): { audio: AudioFormat[]; video: VideoFormat[] };
  isFormatSupported(format: AudioFormat | VideoFormat): boolean;
  getCapabilities(): string[];
}

export interface AudioPlayer extends EventEmitter, AudioPlayerControls {
  readonly element?: HTMLAudioElement;
  readonly config: AudioPlayerConfig;
  readonly metadata?: MediaMetadata;
  
  load(url: string): Promise<void>;
  destroy(): void;
}

export interface AudioRecorder extends EventEmitter {
  readonly config: AudioRecorderConfig;
  readonly isRecording: boolean;
  
  start(): Promise<void>;
  stop(): Promise<Blob>;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface AudioStream extends EventEmitter {
  readonly config: AudioStreamConfig;
  readonly isConnected: boolean;
  
  connect(): Promise<void>;
  disconnect(): void;
  destroy(): void;
}

export interface VideoPlayer extends EventEmitter, VideoPlayerControls {
  readonly element?: HTMLVideoElement;
  readonly config: VideoPlayerConfig;
  readonly metadata?: MediaMetadata;
  readonly controls?: VideoControls;
  readonly logo?: LogoOverlay;
  
  load(url: string): Promise<void>;
  attachTo(container: HTMLElement): void;
  destroy(): void;
}

export interface StreamingPlayer extends EventEmitter {
  readonly config: StreamingConfig;
  readonly stats: StreamingStats;
  readonly currentQuality?: VideoQuality;
  
  load(manifest: string): Promise<void>;
  getQualities(): VideoQuality[];
  setQuality(quality: VideoQuality): void;
  enableAdaptiveBitrate(enabled: boolean): void;
  destroy(): void;
}

export interface VideoControls extends EventEmitter {
  readonly config: VideoControlsConfig;
  readonly element: HTMLElement;
  
  show(): void;
  hide(): void;
  toggle(): void;
  update(currentTime: number, duration: number): void;
  destroy(): void;
}

export interface LogoOverlay extends EventEmitter {
  readonly config: LogoConfig;
  readonly element: HTMLElement;
  
  show(): void;
  hide(): void;
  setPosition(position: LogoPosition): void;
  setOpacity(opacity: number): void;
  destroy(): void;
}

// ============================================================================
// CACHE & STORAGE INTERFACES
// ============================================================================

export interface MediaCache {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  totalSize: number;
  totalEntries: number;
  hitRate: number;
  missRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface MultimediaConfig {
  // Provider settings
  defaultAudioProvider?: string;
  defaultVideoProvider?: string;
  
  // Performance settings
  maxConcurrentStreams?: number;
  bufferSize?: number;
  cacheSize?: number; // MB
  enableCaching?: boolean;
  
  // Quality settings
  defaultAudioQuality?: AudioFormat;
  defaultVideoQuality?: VideoQuality;
  enableAdaptiveBitrate?: boolean;
  
  // UI settings
  defaultTheme?: 'light' | 'dark' | 'auto';
  enableCustomControls?: boolean;
  enableLogo?: boolean;
  logoConfig?: LogoConfig;
  
  // Processing settings
  enableHardwareAcceleration?: boolean;
  maxProcessingJobs?: number;
  tempDirectory?: string;
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

export class MultimediaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MultimediaError';
  }
}

export class MediaPlayerError extends MultimediaError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'MediaPlayerError';
  }
}

export class StreamingError extends MultimediaError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'StreamingError';
  }
}

export class ProcessingError extends MultimediaError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'ProcessingError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MediaSource = string | File | Blob | ArrayBuffer;

export interface MediaInfo {
  format: AudioFormat | VideoFormat;
  metadata: MediaMetadata;
  isSupported: boolean;
  recommendations?: {
    codec?: string;
    quality?: VideoQuality;
    bitrate?: number;
  };
}

// ============================================================================
// MULTIMEDIA PROCESSING TYPES
// ============================================================================

export type ProcessingState = 'idle' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface MultimediaProcessor {
  processAudio(inputData: Buffer | string, options: AudioProcessingOptions): Promise<ProcessingResult>;
  processVideo(inputData: Buffer | string, options: VideoProcessingOptions): Promise<ProcessingResult>;
  processImage(inputData: Buffer | string, options: ImageProcessingOptions): Promise<ProcessingResult>;
  batchProcess(
    inputs: Array<{ data: Buffer | string; options: ProcessingOptions }>,
    batchOptions?: { concurrency?: number; stopOnError?: boolean }
  ): Promise<ProcessingResult[]>;
  getSupportedFormats(): MediaFormat[];
  getOperationStatus(operationId: string): ProcessingOperation | undefined;
  cancelOperation(operationId: string): Promise<void>;
  getActiveOperations(): ProcessingOperation[];
  destroy(): Promise<void>;
}

export interface MultimediaProcessorConfig {
  enableHardwareAcceleration?: boolean;
  maxConcurrentOperations?: number;
  enableBatchProcessing?: boolean;
  tempDirectory?: string;
  enablePlugins?: boolean;
}

export interface ProcessingOperation {
  id: string;
  type: 'audio' | 'video' | 'image';
  state: ProcessingState;
  progress: number;
  inputFormat: MediaFormat;
  outputFormat: MediaFormat;
  startTime: number;
  endTime?: number;
  options: ProcessingOptions;
  result?: ProcessingResult;
  error?: Error;
}

export interface ProcessingResult {
  success: boolean;
  outputData: Buffer;
  outputFormat: MediaFormat;
  metadata?: ProcessingMetadata;
  processingTime: number;
  operationId: string;
  compressionRatio?: number;
  appliedEffects?: FilterEffect[];
  editOperations?: string[];
}

export interface MediaFormat {
  name: string;
  extension: string;
  type: 'audio' | 'video' | 'image';
  mimeType: string;
}

export interface ProcessingOptions {
  type: 'audio' | 'video' | 'image';
  operation: string;
  inputFormat: MediaFormat;
  outputFormat: MediaFormat;
}

export interface AudioProcessingOptions extends ProcessingOptions {
  type: 'audio';
  operation: 'convert' | 'filter' | 'compress';
  sampleRate?: number;
  bitrate?: number;
  channels?: number;
  effects?: FilterEffect[];
  compression?: CompressionSettings;
  conversion?: ConversionSettings;
}

export interface VideoProcessingOptions extends ProcessingOptions {
  type: 'video';
  operation: 'convert' | 'filter' | 'compress' | 'edit';
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: number;
  effects?: FilterEffect[];
  compression?: CompressionSettings;
  conversion?: ConversionSettings;
  editOptions?: {
    startTime?: number;
    endTime?: number;
    fadeIn?: boolean;
    fadeOut?: boolean;
  };
}

export interface ImageProcessingOptions extends ProcessingOptions {
  type: 'image';
  operation: 'convert' | 'resize' | 'filter' | 'compress';
  width?: number;
  height?: number;
  quality?: number;
  effects?: FilterEffect[];
  compression?: CompressionSettings;
  resizeOptions?: {
    maintainAspectRatio?: boolean;
    algorithm?: 'bilinear' | 'bicubic' | 'lanczos';
  };
}

export interface ProcessingMetadata {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  codec?: string;
  width?: number;
  height?: number;
  frameRate?: number;
  format?: string;
  colorSpace?: string;
  dpi?: number;
}

export interface FilterEffect {
  name: string;
  type: 'audio' | 'video' | 'image';
  parameters: Record<string, any>;
}

export interface CompressionSettings {
  quality: number; // 0-100
  algorithm?: string;
  lossless?: boolean;
}

export interface ConversionSettings {
  codec?: string;
  bitrate?: number;
  sampleRate?: number;
  frameRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

// ============================================================================
// MAIN MODULE TYPES
// ============================================================================

export interface StreamingProvider {
  createStream(url: string, config: StreamingProviderConfig): Promise<StreamProvider>;
  startStream(streamId: string): Promise<void>;
  stopStream(streamId: string): Promise<void>;
  destroyStream(streamId: string): Promise<void>;
  getStreamState(streamId: string): StreamingState;
  getStreamMetrics(streamId: string): StreamingMetrics | undefined;
  getAvailableQualities(streamId: string): StreamQuality[];
  switchQuality(streamId: string, quality: StreamQuality): Promise<void>;
  getGlobalMetrics(): StreamingMetrics;
  destroy(): Promise<void>;
}

export interface MultimediaProvider {
  initialize(): Promise<void>;
  createAudioPlayer(config?: AudioPlayerConfig): Promise<AudioPlayer>;
  getAudioPlayer(): AudioPlayer;
  createVideoPlayer(config?: VideoPlayerConfig): Promise<VideoPlayer>;
  getVideoPlayer(): VideoPlayer;
  createStream(url: string, streamConfig: any): Promise<any>;
  getStreaming(): StreamingProvider;
  processAudio(inputData: Buffer | string, options: AudioProcessingOptions): Promise<ProcessingResult>;
  processVideo(inputData: Buffer | string, options: VideoProcessingOptions): Promise<ProcessingResult>;
  processImage(inputData: Buffer | string, options: ImageProcessingOptions): Promise<ProcessingResult>;
  batchProcess(
    inputs: Array<{ data: Buffer | string; options: any }>,
    batchOptions?: { concurrency?: number; stopOnError?: boolean }
  ): Promise<ProcessingResult[]>;
  getProcessor(): MultimediaProcessor;
  getSupportedFormats(): { audio: AudioFormat[]; video: VideoFormat[] };
  destroy(): Promise<void>;
}

export interface MultimediaConfig {
  enableAudioPlayer?: boolean;
  enableVideoPlayer?: boolean;
  enableStreaming?: boolean;
  enableProcessing?: boolean;
  enableGlobalLogo?: boolean;
  audioConfig?: AudioPlayerConfig;
  videoConfig?: VideoPlayerConfig;
  streamingConfig?: StreamingConfig;
  processingConfig?: MultimediaProcessorConfig;
}