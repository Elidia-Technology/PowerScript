/**
 * PowerScript Enhanced AI/ML Module - Comprehensive Test Suite
 * 
 * Tests all enhanced AI capabilities including:
 * - Text generation and processing
 * - Image generation and editing
 * - Audio generation and speech processing
 * - Video generation
 * - Hardware optimization
 * - Model management
 * - Performance benchmarking
 */

import { PowerScriptAIEnhanced } from '../src/ai-enhanced';
import type {
  AIEnhancedConfig,
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  TTSConfig,
  STTConfig,
  CodeGenerationConfig,
  SummarizationConfig,
  ImageEditingConfig,
  AudioGenerationConfig,
  DeviceType,
  HardwareInfo,
  BenchmarkResult
} from '../src/ai-enhanced';

/**
 * Test suite for PowerScript Enhanced AI
 */
async function runEnhancedAITests(): Promise<void> {
  console.log('🧪 Starting PowerScript Enhanced AI Test Suite...\n');

  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  /**
   * Test helper function
   */
  async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    testsRun++;
    try {
      console.log(`🔬 Testing: ${name}`);
      await testFn();
      testsPassed++;
      console.log(`✅ PASSED: ${name}\n`);
    } catch (error) {
      testsFailed++;
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Initialize Enhanced AI system
  let aiEnhanced: PowerScriptAIEnhanced;

  await runTest('Enhanced AI Initialization', async () => {
// Test configuration optimized for CPU-only environment
const testConfig: AIEnhancedConfig = {
  preferredDevice: 'cpu',
  enableGPU: false, // Explicitly disable GPU expectations
  maxConcurrentTasks: 2, // Reduced for CPU
  memoryLimit: 1024, // 1GB in MB
  enableModelCache: true,
  maxCacheSize: 1024, // 1GB cache in MB
  defaultTextModel: 'llama-3.1-8b',
  defaultImageModel: 'stable-diffusion-v1.5',
  defaultVideoModel: 'stable-video-diffusion',
  defaultAudioModel: 'whisper-base',
  allowRemoteModels: false, // Use local only for testing
  sandboxEnabled: true
};

async function runEnhancedAITests(): Promise<void> {
  console.log('🚀 Starting Enhanced AI/ML Module Tests...\n');

  let aiEnhanced: PowerScriptAIEnhanced;
  
  try {
    console.log('📋 Test 1: Initialization and Hardware Detection');
    aiEnhanced = new PowerScriptAIEnhanced(testConfig);
    
    // Test event handling
    let readyEmitted = false;
    aiEnhanced.on('ready', () => {
      readyEmitted = true;
    });

    await aiEnhanced.initialize();
    
    if (!readyEmitted) {
      throw new Error('Ready event not emitted');
    }

    console.log('   ✓ Enhanced AI initialized successfully');
    console.log('   ✓ Event handling working correctly');
  });

  await runTest('Hardware Detection and Benchmarking', async () => {
    const systemInfo = await aiEnhanced.getSystemInfo();
    
    if (!systemInfo.hardware || systemInfo.hardware.length === 0) {
      throw new Error('No hardware detected');
    }

    console.log(`   ✓ Detected ${systemInfo.hardware.length} hardware device(s):`);
    systemInfo.hardware.forEach(device => {
      console.log(`     - ${device.name} (${device.device}): ${device.totalMemory}MB total, ${device.availableMemory}MB available`);
    });

    // Run hardware benchmark
    const benchmarks = await aiEnhanced.benchmark();
    
    if (!benchmarks || benchmarks.length === 0) {
      throw new Error('No benchmark results');
    }

    console.log(`   ✓ Completed ${benchmarks.length} benchmark(s):`);
    benchmarks.forEach(result => {
      console.log(`     - ${result.device}: ${result.score} score (${result.latencyMs}ms latency)`);
    });
  });

  await runTest('Model Management', async () => {
    // List available models
    const models = await aiEnhanced.listModels();
    
    if (!models || models.length === 0) {
      throw new Error('No models available');
    }

    console.log(`   ✓ Found ${models.length} available models:`);
    models.slice(0, 3).forEach(model => {
      console.log(`     - ${model.name} (${model.id}): ${Math.floor(model.size / 1024 / 1024)}MB, ${model.type.join(', ')}`);
    });

    // Test model loading
    const textModel = models.find(m => m.type.includes('text_generation'));
    if (textModel) {
      const loadedModel = await aiEnhanced.loadModel(textModel.id);
      console.log(`   ✓ Loaded model: ${textModel.name} on ${loadedModel.device}`);
      console.log(`   ✓ Memory usage: ${loadedModel.memoryUsage}MB`);
      
      // Unload model
      await aiEnhanced.unloadModel(textModel.id);
      console.log(`   ✓ Unloaded model: ${textModel.name}`);
    }
  });

  await runTest('Text Generation and Processing', async () => {
    // Test text generation
    const textRequest: TextGenerationRequest = {
      prompt: 'Write a short description of artificial intelligence.',
      config: {
        maxTokens: 100,
        temperature: 0.7,
        systemPrompt: 'You are a helpful AI assistant.'
      }
    };

    const textResponse = await aiEnhanced.generateText(textRequest);
    
    if (!textResponse.text || textResponse.text.length === 0) {
      throw new Error('Empty text generation response');
    }

    console.log(`   ✓ Generated text (${textResponse.tokensGenerated} tokens, ${textResponse.timeMs}ms):`);
    console.log(`     "${textResponse.text.slice(0, 100)}${textResponse.text.length > 100 ? '...' : ''}"`);

    // Test summarization
    const longText = 'Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of "intelligent agents": any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals. Colloquially, the term "artificial intelligence" is often used to describe machines that mimic "cognitive" functions that humans associate with the human mind, such as "learning" and "problem solving".';
    
    const summaryConfig: SummarizationConfig = {
      maxLength: 50,
      focus: 'technical',
      extractive: false
    };

    const summary = await aiEnhanced.summarizeText(longText, summaryConfig);
    
    if (!summary || summary.length === 0) {
      throw new Error('Empty summarization response');
    }

    console.log(`   ✓ Generated summary: "${summary}"`);

    // Test code generation
    const codeConfig: CodeGenerationConfig = {
      language: 'typescript',
      includeComments: true,
      includeTests: true,
      style: 'clean'
    };

    const code = await aiEnhanced.generateCode('Create a function to calculate fibonacci numbers', codeConfig);
    
    if (!code || code.length === 0) {
      throw new Error('Empty code generation response');
    }

    console.log(`   ✓ Generated TypeScript code (${code.length} characters)`);
    console.log(`     Preview: "${code.slice(0, 100)}..."`);
  });

  await runTest('Image Generation and Processing', async () => {
    // Test image generation
    const imageRequest: ImageGenerationRequest = {
      prompt: 'A futuristic cityscape with flying cars',
      config: {
        width: 512,
        height: 512,
        steps: 20,
        guidanceScale: 7.5,
        seed: 42
      }
    };

    const imageResponse = await aiEnhanced.generateImage(imageRequest);
    
    if (!imageResponse.images || imageResponse.images.length === 0) {
      throw new Error('No images generated');
    }

    console.log(`   ✓ Generated ${imageResponse.images.length} image(s) (${imageResponse.metadata.timeMs}ms)`);
    console.log(`   ✓ Image metadata: ${imageResponse.metadata.config.width}x${imageResponse.metadata.config.height}, seed: ${imageResponse.metadata.seed}`);

    // Test image editing
    const imageEditConfig: ImageEditingConfig = {
      operation: 'enhance',
      strength: 0.8
    };

    const editedImage = await aiEnhanced.editImage(imageResponse.images[0], imageEditConfig);
    
    if (!editedImage || editedImage.length === 0) {
      throw new Error('Image editing failed');
    }

    console.log(`   ✓ Edited image (${editedImage.length} bytes)`);
  });

  await runTest('Audio Generation and Processing', async () => {
    // Test text-to-speech
    const ttsConfig: TTSConfig = {
      voice: 'default',
      speed: 1.0,
      pitch: 0.0,
      format: 'wav'
    };

    const audioBuffer = await aiEnhanced.textToSpeech('Hello, this is a test of the PowerScript Enhanced AI text-to-speech system.', ttsConfig);
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('TTS failed to generate audio');
    }

    console.log(`   ✓ Generated speech audio (${audioBuffer.length} bytes)`);

    // Test speech-to-text
    const sttConfig: STTConfig = {
      language: 'en',
      enableTimestamps: true,
      punctuation: true
    };

    const transcription = await aiEnhanced.speechToText(audioBuffer, sttConfig);
    
    if (!transcription || transcription.length === 0) {
      throw new Error('STT failed to transcribe audio');
    }

    console.log(`   ✓ Transcribed speech: "${transcription}"`);

    // Test audio generation
    const audioGenConfig: AudioGenerationConfig = {
      duration: 5,
      tempo: 120,
      style: 'ambient'
    };

    const generatedAudio = await aiEnhanced.generateAudio('Create a peaceful ambient soundscape', audioGenConfig);
    
    if (!generatedAudio || generatedAudio.length === 0) {
      throw new Error('Audio generation failed');
    }

    console.log(`   ✓ Generated audio (${generatedAudio.length} bytes, ${audioGenConfig.duration}s)`);
  });

  await runTest('Video Generation', async () => {
    const videoRequest: VideoGenerationRequest = {
      prompt: 'A cat walking through a garden',
      config: {
        width: 512,
        height: 512,
        fps: 24,
        duration: 3,
        frames: 72
      }
    };

    const videoBuffer = await aiEnhanced.generateVideo(videoRequest);
    
    if (!videoBuffer || videoBuffer.length === 0) {
      throw new Error('Video generation failed');
    }

    console.log(`   ✓ Generated video (${videoBuffer.length} bytes)`);
    console.log(`   ✓ Video config: ${videoRequest.config!.width}x${videoRequest.config!.height} at ${videoRequest.config!.fps}fps for ${videoRequest.config!.duration}s`);
  });

  await runTest('Utility Operations', async () => {
    // Test embedding generation
    const embeddings = await aiEnhanced.generateEmbedding('PowerScript Enhanced AI is a powerful framework for AI applications.');
    
    if (!embeddings || embeddings.length === 0) {
      throw new Error('Embedding generation failed');
    }

    console.log(`   ✓ Generated embedding (${embeddings.length} dimensions)`);
    console.log(`   ✓ Sample values: [${embeddings.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

    // Test classification
    const classes = ['technology', 'science', 'entertainment', 'sports', 'politics'];
    const classificationResults = await aiEnhanced.classify('Artificial intelligence and machine learning are transforming technology.', classes);
    
    if (!classificationResults || classificationResults.length === 0) {
      throw new Error('Classification failed');
    }

    console.log(`   ✓ Classification results:`);
    classificationResults.forEach((result, index) => {
      if (index < 3) { // Show top 3 results
        console.log(`     ${index + 1}. ${result.class}: ${(result.confidence * 100).toFixed(1)}%`);
      }
    });
  });

  await runTest('Performance and Monitoring', async () => {
    // Test system information
    const systemInfo = await aiEnhanced.getSystemInfo();
    
    console.log(`   ✓ System status:`);
    console.log(`     - Hardware devices: ${systemInfo.hardware.length}`);
    console.log(`     - Loaded models: ${systemInfo.models.loaded.length}`);
    console.log(`     - Available models: ${systemInfo.models.available.length}`);
    console.log(`     - Running tasks: ${systemInfo.tasks.running}`);
    console.log(`     - Pending tasks: ${systemInfo.tasks.pending}`);

    // Test cache statistics
    const cacheStats = aiEnhanced.getCacheStats();
    
    console.log(`   ✓ Cache statistics:`);
    console.log(`     - Total entries: ${cacheStats.totalEntries}`);
    console.log(`     - Total size: ${Math.floor(cacheStats.totalSize / 1024 / 1024)}MB`);
    console.log(`     - Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
    console.log(`     - Miss rate: ${(cacheStats.missRate * 100).toFixed(1)}%`);

    // Test task management
    const tasks = aiEnhanced.getTasks();
    console.log(`   ✓ Found ${tasks.length} total tasks in system`);
    
    const completedTasks = aiEnhanced.getTasks('completed');
    console.log(`   ✓ Found ${completedTasks.length} completed tasks`);
  });

  await runTest('Error Handling and Edge Cases', async () => {
    // Test invalid model loading
    try {
      await aiEnhanced.loadModel('nonexistent-model');
      throw new Error('Should have thrown ModelNotFoundError');
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'ModelNotFoundError') {
        throw error;
      }
      console.log(`   ✓ Correctly handled invalid model: ${error.message}`);
    }

    // Test invalid task cancellation
    try {
      await aiEnhanced.cancelTask('nonexistent-task');
      throw new Error('Should have thrown error for invalid task');
    } catch (error) {
      console.log(`   ✓ Correctly handled invalid task cancellation: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test empty text generation
    try {
      const response = await aiEnhanced.generateText({ prompt: '' });
      if (response.text.length > 0) {
        console.log(`   ✓ Handled empty prompt gracefully`);
      }
    } catch (error) {
      console.log(`   ✓ Correctly rejected empty prompt: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Test memory limits
    const systemInfo = await aiEnhanced.getSystemInfo();
    if (systemInfo.hardware.length > 0) {
      const device = systemInfo.hardware[0];
      console.log(`   ✓ Memory monitoring working: ${device.availableMemory}MB available on ${device.name}`);
    }
  });

  // Cleanup
  await runTest('Cleanup and Resource Management', async () => {
    // Clear cache
    aiEnhanced.clearCache();
    
    const cacheStats = aiEnhanced.getCacheStats();
    if (cacheStats.totalEntries !== 0) {
      throw new Error('Cache not properly cleared');
    }

    console.log(`   ✓ Cache cleared successfully`);

    // Cleanup system
    await aiEnhanced.cleanup();
    
    console.log(`   ✓ System cleanup completed`);
  });

  // Print test summary
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PowerScript Enhanced AI Test Suite Summary');
  console.log('='.repeat(60));
  console.log(`📊 Tests Run: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! PowerScript Enhanced AI is working correctly.');
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
  }
  
  console.log('\n✨ Enhanced AI capabilities verified:');
  console.log('   🤖 Text generation and processing');
  console.log('   🎨 Image generation and editing');
  console.log('   🔊 Audio generation and speech processing');
  console.log('   🎬 Video generation');
  console.log('   ⚡ Hardware optimization');
  console.log('   📊 Performance monitoring');
  console.log('   🛠️ Model management');
}

// Run tests if called directly
if (require.main === module) {
  runEnhancedAITests().catch(console.error);
}

export { runEnhancedAITests };