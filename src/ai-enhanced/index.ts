/**
 * PowerScript Enhanced AI/ML Module - Main Entry Point
 * 
 * Advanced AI/ML capabilities including:
 * - Text generation, summarization, code generation
 * - Image generation, editing, style transfer
 * - Video generation & animation
 * - Audio: TTS, ASR, music generation
 * - Local model support (LLaMA, Mistral, Stable Diffusion)
 * - Hardware optimization (GPU/CUDA/ROCm/WebGPU)
 */

// Main class
export { PowerScriptAIEnhanced as default } from './PowerScriptAIEnhanced';
export { PowerScriptAIEnhanced } from './PowerScriptAIEnhanced';

// Type definitions
export * from './types';

// Providers
export { LocalModelProvider } from './providers/LocalModelProvider';
export { GenerationProvider } from './providers/GenerationProvider';
export { HardwareProvider } from './providers/HardwareProvider';

// Re-export commonly used types for convenience
export type {
  AIEnhancedConfig,
  DeviceType,
  AITaskType,
  AITask,
  ModelInfo,
  LoadedModel,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  VideoGenerationRequest,
  TTSConfig,
  STTConfig,
  SummarizationConfig,
  CodeGenerationConfig,
  ImageEditingConfig,
  AudioGenerationConfig,
  HardwareInfo,
  BenchmarkResult,
  CacheStats
} from './types';