/**
 * PowerScript Enhanced AI/ML Module - Type Definitions
 * 
 * Comprehensive type definitions for advanced AI/ML capabilities including:
 * - Text generation, summarization, code generation
 * - Image generation, editing, style transfer
 * - Video generation & animation
 * - Audio: TTS, ASR, music generation
 * - Local model support (LLaMA, Mistral, Stable Diffusion)
 * - Hardware optimization (GPU/CUDA/ROCm/WebGPU)
 */

import { EventEmitter } from 'events';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main configuration for PowerScript Enhanced AI
 */
export interface AIEnhancedConfig {
  // Hardware preferences
  preferredDevice?: DeviceType;
  enableGPU?: boolean;
  cudaPath?: string;
  rocmPath?: string;
  
  // Model preferences
  defaultTextModel?: string;
  defaultImageModel?: string;
  defaultAudioModel?: string;
  defaultVideoModel?: string;
  
  // Performance settings
  maxConcurrentTasks?: number;
  memoryLimit?: number; // MB
  timeoutMs?: number;
  
  // Cache settings
  enableModelCache?: boolean;
  cacheDirectory?: string;
  maxCacheSize?: number; // MB
  
  // Security
  sandboxEnabled?: boolean;
  allowRemoteModels?: boolean;
}

/**
 * Device types for AI processing
 */
export type DeviceType = 'cpu' | 'gpu' | 'cuda' | 'rocm' | 'webgpu' | 'mps' | 'auto';

/**
 * AI task types
 */
export type AITaskType = 
  | 'text_generation' 
  | 'text_summarization' 
  | 'code_generation'
  | 'image_generation' 
  | 'image_editing' 
  | 'style_transfer'
  | 'video_generation' 
  | 'video_editing'
  | 'text_to_speech' 
  | 'speech_to_text' 
  | 'audio_generation'
  | 'music_generation'
  | 'translation'
  | 'embedding'
  | 'classification';

// ============================================================================
// TEXT AI INTERFACES
// ============================================================================

/**
 * Configuration for text generation tasks
 */
export interface TextGenerationConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  streaming?: boolean;
}

/**
 * Text generation request
 */
export interface TextGenerationRequest {
  prompt: string;
  config?: TextGenerationConfig;
  context?: string[];
}

/**
 * Text generation response
 */
export interface TextGenerationResponse {
  text: string;
  tokensGenerated: number;
  timeMs: number;
  model: string;
  finishReason: 'completed' | 'max_tokens' | 'stop_sequence' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Text summarization configuration
 */
export interface SummarizationConfig {
  model?: string;
  maxLength?: number;
  minLength?: number;
  extractive?: boolean; // vs abstractive
  focus?: 'general' | 'technical' | 'news' | 'academic';
}

/**
 * Code generation configuration
 */
export interface CodeGenerationConfig {
  language: string;
  model?: string;
  includeComments?: boolean;
  includeTests?: boolean;
  style?: 'clean' | 'verbose' | 'minimal';
}

// ============================================================================
// IMAGE AI INTERFACES
// ============================================================================

/**
 * Image generation configuration
 */
export interface ImageGenerationConfig {
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  seed?: number;
  scheduler?: string;
  safety?: boolean;
}

/**
 * Image generation request
 */
export interface ImageGenerationRequest {
  prompt: string;
  config?: ImageGenerationConfig;
  referenceImage?: Buffer | string; // for img2img
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  images: Buffer[];
  metadata: {
    model: string;
    prompt: string;
    config: ImageGenerationConfig;
    seed: number;
    timeMs: number;
    device?: string;
    warning?: string;
  };
}

/**
 * Image editing operations
 */
export type ImageEditOperation = 
  | 'inpaint' 
  | 'outpaint' 
  | 'upscale' 
  | 'enhance' 
  | 'colorize' 
  | 'style_transfer'
  | 'background_removal'
  | 'object_removal';

/**
 * Image editing configuration
 */
export interface ImageEditingConfig {
  operation: ImageEditOperation;
  model?: string;
  strength?: number;
  mask?: Buffer; // for inpainting
  targetStyle?: string; // for style transfer
  upscaleFactor?: number; // for upscaling
}

// ============================================================================
// AUDIO AI INTERFACES
// ============================================================================

/**
 * Text-to-Speech configuration
 */
export interface TTSConfig {
  model?: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
  format?: 'wav' | 'mp3' | 'ogg';
  sampleRate?: number;
}

/**
 * Speech-to-Text configuration
 */
export interface STTConfig {
  model?: string;
  language?: string;
  enableTimestamps?: boolean;
  enableWordTimestamps?: boolean;
  punctuation?: boolean;
  diarization?: boolean; // speaker identification
}

/**
 * Audio generation configuration
 */
export interface AudioGenerationConfig {
  model?: string;
  duration?: number; // seconds
  tempo?: number;
  key?: string;
  style?: string;
  instruments?: string[];
}

// ============================================================================
// VIDEO AI INTERFACES
// ============================================================================

/**
 * Video generation configuration
 */
export interface VideoGenerationConfig {
  model?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number; // seconds
  frames?: number;
  motionBucket?: number;
  conditioningAugmentation?: number;
}

/**
 * Video generation request
 */
export interface VideoGenerationRequest {
  prompt: string;
  config?: VideoGenerationConfig;
  referenceImage?: Buffer; // for image-to-video
  referenceVideo?: Buffer; // for video-to-video
}

// ============================================================================
// MODEL INTERFACES
// ============================================================================

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  type: AITaskType[];
  size: number; // bytes
  parameters?: number;
  precision?: 'fp32' | 'fp16' | 'int8' | 'int4';
  architecture?: string;
  provider: string;
  local: boolean;
  requiresGPU?: boolean;
  memoryRequirement?: number; // MB
  supportedDevices: DeviceType[];
  downloadUrl?: string;
  license?: string;
}

/**
 * Model provider interface
 */
export interface ModelProvider extends EventEmitter {
  name: string;
  supportsDevice(device: DeviceType): boolean;
  listModels(): Promise<ModelInfo[]>;
  downloadModel(modelId: string, onProgress?: (progress: number) => void): Promise<void>;
  loadModel(modelId: string, device?: DeviceType): Promise<LoadedModel>;
  unloadModel(modelId: string): Promise<void>;
  getLoadedModels(): string[];
}

/**
 * Loaded model interface
 */
export interface LoadedModel extends EventEmitter {
  id: string;
  info: ModelInfo;
  device: DeviceType;
  memoryUsage: number; // MB
  isLoaded: boolean;
  
  // Text operations
  generateText?(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  summarizeText?(text: string, config?: SummarizationConfig): Promise<string>;
  generateCode?(prompt: string, config?: CodeGenerationConfig): Promise<string>;
  
  // Image operations
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
  editImage?(image: Buffer, config: ImageEditingConfig): Promise<Buffer>;
  
  // Audio operations
  textToSpeech?(text: string, config?: TTSConfig): Promise<Buffer>;
  speechToText?(audio: Buffer, config?: STTConfig): Promise<string>;
  generateAudio?(prompt: string, config?: AudioGenerationConfig): Promise<Buffer>;
  
  // Video operations
  generateVideo?(request: VideoGenerationRequest): Promise<Buffer>;
  
  // Utility operations
  generateEmbedding?(text: string): Promise<number[]>;
  classify?(input: string | Buffer, classes: string[]): Promise<{ class: string; confidence: number }[]>;
  
  unload(): Promise<void>;
}

// ============================================================================
// HARDWARE INTERFACES
// ============================================================================

/**
 * Hardware information
 */
export interface HardwareInfo {
  device: DeviceType;
  name: string;
  totalMemory: number; // MB
  availableMemory: number; // MB
  computeCapability?: string; // for CUDA
  cores?: number;
  clockSpeed?: number; // MHz
  supported: boolean;
  active: boolean;
}

/**
 * Hardware provider interface
 */
export interface HardwareProvider extends EventEmitter {
  name: string;
  deviceType: DeviceType;
  
  isAvailable(): Promise<boolean>;
  getDeviceInfo(): Promise<HardwareInfo[]>;
  optimizeForDevice(device: DeviceType): Promise<void>;
  getMemoryUsage(): Promise<{ used: number; total: number }>;
  benchmark(): Promise<{ score: number; timeMs: number }>;
}

// ============================================================================
// TASK INTERFACES
// ============================================================================

/**
 * AI task status
 */
export type AITaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * AI task
 */
export interface AITask {
  id: string;
  type: AITaskType;
  status: AITaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  priority: number; // 1-10
  model: string;
  device: DeviceType;
  
  input: any;
  output?: any;
  error?: Error;
  
  metadata: {
    memoryUsage?: number;
    timeMs?: number;
    tokensProcessed?: number;
    estimatedCost?: number;
  };
}

/**
 * Task queue configuration
 */
export interface TaskQueueConfig {
  maxConcurrentTasks?: number;
  priorityEnabled?: boolean;
  retryAttempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

/**
 * Model cache entry
 */
export interface CacheEntry {
  key: string;
  modelId: string;
  data: Buffer;
  size: number;
  accessCount: number;
  lastAccessed: Date;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // 0-1
  missRate: number; // 0-1
  evictions: number;
  oldestEntry?: Date;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * AI events
 */
export interface AIEvents {
  // Model events
  'model:loading': (modelId: string) => void;
  'model:loaded': (modelId: string, model: LoadedModel) => void;
  'model:unloaded': (modelId: string) => void;
  'model:error': (modelId: string, error: Error) => void;
  
  // Task events
  'task:created': (task: AITask) => void;
  'task:started': (task: AITask) => void;
  'task:progress': (task: AITask, progress: number) => void;
  'task:completed': (task: AITask) => void;
  'task:failed': (task: AITask, error: Error) => void;
  
  // Hardware events
  'hardware:detected': (devices: HardwareInfo[]) => void;
  'hardware:changed': (device: HardwareInfo) => void;
  'hardware:error': (device: DeviceType, error: Error) => void;
  
  // Cache events
  'cache:hit': (key: string) => void;
  'cache:miss': (key: string) => void;
  'cache:evicted': (key: string) => void;
  'cache:cleared': () => void;
  
  // General events
  'ready': () => void;
  'error': (error: Error) => void;
  'warning': (message: string) => void;
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

/**
 * AI-specific error types
 */
export class AIEnhancedError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AIEnhancedError';
  }
}

export class ModelNotFoundError extends AIEnhancedError {
  constructor(modelId: string) {
    super(`Model not found: ${modelId}`, 'MODEL_NOT_FOUND', { modelId });
    this.name = 'ModelNotFoundError';
  }
}

export class DeviceNotSupportedError extends AIEnhancedError {
  constructor(device: DeviceType, model: string) {
    super(`Device ${device} not supported for model ${model}`, 'DEVICE_NOT_SUPPORTED', { device, model });
    this.name = 'DeviceNotSupportedError';
  }
}

export class InsufficientMemoryError extends AIEnhancedError {
  constructor(required: number, available: number) {
    super(`Insufficient memory: required ${required}MB, available ${available}MB`, 'INSUFFICIENT_MEMORY', { required, available });
    this.name = 'InsufficientMemoryError';
  }
}

export class TaskTimeoutError extends AIEnhancedError {
  constructor(taskId: string, timeoutMs: number) {
    super(`Task ${taskId} timed out after ${timeoutMs}ms`, 'TASK_TIMEOUT', { taskId, timeoutMs });
    this.name = 'TaskTimeoutError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Streaming response callback
 */
export type StreamingCallback<T> = (chunk: T, isComplete: boolean) => void;

/**
 * Progress callback
 */
export type ProgressCallback = (progress: number, message?: string) => void;

/**
 * Model download progress
 */
export interface DownloadProgress {
  downloaded: number;
  total: number;
  speed: number; // bytes/sec
  eta: number; // seconds
  percentage: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  device: DeviceType;
  model: string;
  task: AITaskType;
  tokensPerSecond?: number;
  imagesPerSecond?: number;
  latencyMs: number;
  memoryUsage: number;
  score: number;
}

/**
 * Configuration for model optimization
 */
export interface OptimizationConfig {
  quantization?: 'int8' | 'int4' | 'fp16';
  pruning?: boolean;
  distillation?: boolean;
  tensorrt?: boolean; // NVIDIA TensorRT
  coreml?: boolean; // Apple Core ML
  onnx?: boolean; // ONNX optimization
}