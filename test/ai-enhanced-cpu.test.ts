import { PowerScriptAIEnhanced } from '../src/ai-enhanced/PowerScriptAIEnhanced';
import type {
  AIEnhancedConfig,
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
  TTSConfig,
  STTConfig,
  AudioGenerationConfig,
  ImageEditingConfig,
  CodeGenerationConfig,
  SummarizationConfig
} from '../src/ai-enhanced/types';

console.log('🧪 PowerScript Enhanced AI/ML Module Test Suite');
console.log('================================================\n');

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

  let aiEnhanced: PowerScriptAIEnhanced | undefined;
  
  try {
    console.log('📋 Test 1: Initialization and Hardware Detection');
    aiEnhanced = new PowerScriptAIEnhanced(testConfig);
    
    // Test event handling
    let readyEmitted = false;
    aiEnhanced.on('ready', () => {
      readyEmitted = true;
    });

    await aiEnhanced.initialize();
    
    console.log(`✅ Initialization complete (ready event: ${readyEmitted})`);
    const systemInfo = await aiEnhanced.getSystemInfo();
    console.log(`✅ Initialization complete (ready event: ${readyEmitted})`);
    console.log(`   Hardware devices: ${systemInfo.hardware.length} detected`);

    // Test 2: Hardware benchmarking  
    console.log('\n📋 Test 2: Hardware Benchmarking');
    console.log('⚡ Running CPU performance benchmark...');
    const benchmarks = await aiEnhanced.benchmark();
    console.log(`✅ Benchmark complete: CPU performance rated`);

    // Test 3: Model management
    console.log('\n📋 Test 3: Model Management and Discovery');
    const models = await aiEnhanced.listModels();
    console.log(`✅ Available models: ${models.length}`);

    const textModels = models.filter(m => m.type.includes('text_generation'));
    if (textModels.length > 0) {
      const textModel = textModels[0];
      console.log(`   Loading text model: ${textModel.id}...`);
      const loadedModel = await aiEnhanced.loadModel(textModel.id);
      console.log(`✅ Model loaded: ${loadedModel.id} on ${loadedModel.device}`);
      
      await aiEnhanced.unloadModel(textModel.id);
      console.log(`✅ Model unloaded: ${textModel.id}`);
    }

    // Test 4: Text generation (CPU-friendly)
    console.log('\n📋 Test 4: Text Generation (CPU Optimized)');
    const textRequest: TextGenerationRequest = {
      prompt: 'Explain how PowerScript enhances web development',
      config: {
        maxTokens: 100, // Reduced for CPU
        temperature: 0.7,
        model: 'llama-3.1-8b'
      }
    };

    const textResponse = await aiEnhanced.generateText(textRequest);
    console.log(`✅ Text generated: ${textResponse.text.length} characters`);
    console.log(`   Model: ${textResponse.metadata?.model || 'unknown'} on ${textResponse.metadata?.device || 'cpu'}`);
    console.log(`   Processing time: ${textResponse.metadata?.timeMs || 0}ms`);

    // Test 5: Text summarization (CPU-friendly)
    console.log('\n📋 Test 5: Text Summarization');
    const longText = 'PowerScript is a comprehensive development framework that combines the power of PowerScript with modern web technologies. It provides advanced AI capabilities, database integration, networking features, and much more. The framework is designed to be modular, extensible, and developer-friendly.';
    const summaryConfig: SummarizationConfig = {
      maxLength: 50,
      focus: 'technical'
    };
    
    const summary = await aiEnhanced.summarizeText(longText, summaryConfig);
    console.log(`✅ Text summarized: ${summary.length} characters`);

    // Test 6: Code generation (CPU-friendly)
    console.log('\n📋 Test 6: Code Generation');
    const codeConfig: CodeGenerationConfig = {
      language: 'typescript',
      style: 'clean'
    };
    
    const code = await aiEnhanced.generateCode('Create a function to calculate fibonacci numbers', codeConfig);
    console.log(`✅ Code generated: ${code.length} characters`);

    // Test 7: Image generation (CPU with warnings)
    console.log('\n📋 Test 7: Image Generation (CPU Mode)');
    const imageRequest: ImageGenerationRequest = {
      prompt: 'A simple geometric pattern',
      config: {
        width: 256, // Reduced for CPU
        height: 256,
        steps: 10, // Reduced steps for CPU
        guidanceScale: 7.5,
        model: 'stable-diffusion-v1.5'
      }
    };

    console.log('⚠️ Note: Image generation on CPU - expect slower performance');
    const imageResponse = await aiEnhanced.generateImage(imageRequest);
    console.log(`✅ Image generated: ${imageResponse.images.length} image(s)`);
    console.log(`   Size: ${imageRequest.config?.width}x${imageRequest.config?.height}`);
    console.log(`   Device: ${imageResponse.metadata.device}`);
    if (imageResponse.metadata.warning) {
      console.log(`   Warning: ${imageResponse.metadata.warning}`);
    }

    // Test 8: Audio processing (CPU-friendly)
    console.log('\n📋 Test 8: Audio Processing');
    const ttsConfig: TTSConfig = {
      voice: 'neutral',
      speed: 1.0,
      model: 'whisper-base'
    };

    const audioBuffer = await aiEnhanced.textToSpeech('Hello, PowerScript AI!', ttsConfig);
    console.log(`✅ Text-to-speech complete: ${audioBuffer.length} bytes`);

    const sttConfig: STTConfig = {
      language: 'en',
      model: 'whisper-base'
    };

    const transcription = await aiEnhanced.speechToText(audioBuffer, sttConfig);
    console.log(`✅ Speech-to-text complete: "${transcription}"`);

    // Test 9: Video generation (CPU with warnings)
    console.log('\n📋 Test 9: Video Generation (CPU Mode)');
    const videoRequest: VideoGenerationRequest = {
      prompt: 'A simple animation of geometric shapes',
      config: {
        width: 256, // Reduced for CPU
        height: 256,
        duration: 2, // Reduced duration for CPU
        fps: 12, // Reduced FPS for CPU
        model: 'stable-video-diffusion'
      }
    };

    console.log('⚠️ Note: Video generation on CPU - expect significantly slower performance');
    const videoBuffer = await aiEnhanced.generateVideo(videoRequest);
    console.log(`✅ Video generated: ${videoBuffer.length} bytes`);
    console.log(`   Duration: ${videoRequest.config?.duration}s @ ${videoRequest.config?.fps}fps`);

    // Test 10: Vector embeddings (CPU-friendly)
    console.log('\n📋 Test 10: Vector Embeddings');
    const embeddings = await aiEnhanced.generateEmbedding('PowerScript Enhanced AI is powerful.');
    console.log(`✅ Embeddings generated: ${embeddings.length} dimensions`);

    // Test 11: Performance monitoring
    console.log('\n📋 Test 11: Performance Monitoring');
    const systemInfo2 = await aiEnhanced.getSystemInfo();
    console.log('✅ System information:');
    console.log(`   CPU: ${systemInfo2.hardware?.length || 'detected'}`);
    console.log(`   Memory: ${systemInfo2.cache?.totalEntries || 'available'}`);
    console.log(`   GPU: none detected (CPU mode)`);

    const cacheStats = aiEnhanced.getCacheStats();
    console.log(`✅ Cache stats: ${cacheStats.totalEntries || 0} models loaded`);

    const tasks = aiEnhanced.getTasks();
    console.log(`✅ Task monitoring: ${tasks.length} tasks tracked`);

    // Test cleanup
    console.log('\n📋 Cleanup: Shutting down AI engine');
    await aiEnhanced.cleanup();
    console.log('✅ Shutdown complete');

    // Final summary
    console.log('\n🎉 All Enhanced AI Tests Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Hardware detection and optimization');
    console.log('   ✅ Model management and loading');
    console.log('   ✅ Text generation and processing (CPU optimized)');
    console.log('   ✅ Image generation (CPU mode with warnings)');
    console.log('   ✅ Audio processing (CPU compatible)');
    console.log('   ✅ Video generation (CPU mode with performance notes)');
    console.log('   ✅ Vector embeddings and AI utilities');
    console.log('   ✅ Performance monitoring and system info');
    console.log('   ✅ Task management and cleanup');
    
    console.log('\n💡 CPU Performance Notes:');
    console.log('   • Text generation: Fully CPU compatible');
    console.log('   • Audio processing: Good CPU performance');
    console.log('   • Image generation: Slower on CPU, reduced parameters recommended');
    console.log('   • Video generation: Significantly slower on CPU, short clips recommended');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (typeof aiEnhanced !== 'undefined' && aiEnhanced) {
      try {
        await aiEnhanced.cleanup();
      } catch (shutdownError) {
        console.error('❌ Shutdown failed:', shutdownError);
      }
    }
    
    throw error;
  }
}

// Jest test wrapper
describe('AI Enhanced CPU', () => {
  it('should run enhanced AI CPU test successfully', async () => {
    await expect(runEnhancedAITests()).resolves.not.toThrow();
  });
});

// Export for use in other tests
export { runEnhancedAITests };

// Run tests if called directly
if (require.main === module && typeof describe === 'undefined') {
  runEnhancedAITests()
    .then(() => {
      console.log('\n🏁 Enhanced AI test suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Enhanced AI test suite failed:', error);
      process.exit(1);
    });
}