import { PowerScriptAIEnhanced } from '../src/ai-enhanced/PowerScriptAIEnhanced';
import type {
  AIEnhancedConfig,
  TextGenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest
} from '../src/ai-enhanced/types';

console.log('🧪 PowerScript Enhanced AI/ML Module Test Suite');
console.log('================================================\n');

// Test configuration optimized for CPU-only environment
const testConfig: AIEnhancedConfig = {
  preferredDevice: 'cpu',
  enableGPU: false,
  maxConcurrentTasks: 2,
  memoryLimit: 1024,
  enableModelCache: true,
  maxCacheSize: 1024,
  defaultTextModel: 'llama-3.2-1b',
  defaultImageModel: 'stable-diffusion-v1.5',
  defaultVideoModel: 'stable-video-diffusion',
  defaultAudioModel: 'whisper-base',
  allowRemoteModels: false,
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
    
    console.log(`✅ Initialization complete (ready event: ${readyEmitted})`);

    // Test 2: System information
    console.log('\n📋 Test 2: System Information');
    const sysInfo = await aiEnhanced.getSystemInfo();
    console.log(`✅ System info retrieved:`);
    console.log(`   Hardware devices: ${sysInfo.hardware.length}`);
    console.log(`   Models loaded: ${sysInfo.models.loaded.length}`);
    console.log(`   Models available: ${sysInfo.models.available.length}`);
    console.log(`   Running tasks: ${sysInfo.tasks.running}`);

    // Test 3: Model management
    console.log('\n📋 Test 3: Model Management and Discovery');
    const models = await aiEnhanced.listModels();
    console.log(`✅ Available models: ${models.length}`);

    if (models.length > 0) {
      const textModels = models.filter(m => m.type.includes('text_generation'));
      console.log(`   Text models: ${textModels.length}`);
      
      if (textModels.length > 0) {
        const textModel = textModels[0];
        console.log(`   Sample model: ${textModel.name} (${textModel.provider})`);
        console.log(`   Local: ${textModel.local}, GPU required: ${textModel.requiresGPU || false}`);
      }
    }

    // Test 4: Text generation (CPU-friendly)
    console.log('\n📋 Test 4: Text Generation (CPU Optimized)');
    const textRequest: TextGenerationRequest = {
      prompt: 'Explain how PowerScript enhances web development',
      config: {
        maxTokens: 100,
        temperature: 0.7,
        model: 'llama-3.2-1b'
      }
    };

    const textResponse = await aiEnhanced.generateText(textRequest);
    console.log(`✅ Text generated: ${textResponse.text.length} characters`);
    
    if (textResponse.metadata) {
      console.log(`   Model: ${textResponse.metadata.model}`);
      console.log(`   Processing time: ${textResponse.metadata.timeMs}ms`);
    }

    // Test 5: Text summarization (CPU-friendly)
    console.log('\n📋 Test 5: Text Summarization');
    const longText = 'PowerScript is a comprehensive development framework that combines the power of ActionScript 3 with modern web technologies. It provides advanced AI capabilities, database integration, networking features, and much more. The framework is designed to be modular, extensible, and developer-friendly.';
    
    const summary = await aiEnhanced.summarizeText(longText, { maxLength: 50, focus: 'technical' });
    console.log(`✅ Text summarized: ${summary.length} characters`);
    console.log(`   Summary: "${summary}"`);

    // Test 6: Code generation (CPU-friendly)
    console.log('\n📋 Test 6: Code Generation');
    const code = await aiEnhanced.generateCode('Create a function to calculate fibonacci numbers', {
      language: 'typescript',
      style: 'clean'
    });
    console.log(`✅ Code generated: ${code.length} characters`);

    // Test 7: Image generation (CPU with warnings)
    console.log('\n📋 Test 7: Image Generation (CPU Mode)');
    const imageRequest: ImageGenerationRequest = {
      prompt: 'A simple geometric pattern',
      config: {
        width: 256,
        height: 256,
        steps: 10,
        guidanceScale: 7.5,
        model: 'stable-diffusion-v1.5'
      }
    };

    console.log('⚠️ Note: Image generation on CPU - expect slower performance');
    const imageResponse = await aiEnhanced.generateImage(imageRequest);
    console.log(`✅ Image generated: ${imageResponse.images.length} image(s)`);
    console.log(`   Size: ${imageRequest.config?.width}x${imageRequest.config?.height}`);
    
    if (imageResponse.metadata.device) {
      console.log(`   Device: ${imageResponse.metadata.device}`);
    }
    if (imageResponse.metadata.warning) {
      console.log(`   Warning: ${imageResponse.metadata.warning}`);
    }

    // Test 8: Audio processing (CPU-friendly)
    console.log('\n📋 Test 8: Audio Processing');
    const audioBuffer = await aiEnhanced.textToSpeech('Hello, PowerScript AI!', {
      voice: 'neutral',
      speed: 1.0,
      model: 'whisper-base'
    });
    console.log(`✅ Text-to-speech complete: ${audioBuffer.length} bytes`);

    const transcription = await aiEnhanced.speechToText(audioBuffer, {
      language: 'en',
      model: 'whisper-base'
    });
    console.log(`✅ Speech-to-text complete: "${transcription}"`);

    // Test 9: Audio generation
    console.log('\n📋 Test 9: Audio Generation');
    const generatedAudio = await aiEnhanced.generateAudio('Create a peaceful ambient soundscape', {
      duration: 5,
      style: 'ambient',
      model: 'whisper-base'
    });
    console.log(`✅ Audio generated: ${generatedAudio.length} bytes`);

    // Test 10: Video generation (CPU with warnings)  
    console.log('\n📋 Test 10: Video Generation (CPU Mode)');
    const videoRequest: VideoGenerationRequest = {
      prompt: 'A simple animation of geometric shapes',
      config: {
        width: 256,
        height: 256,
        duration: 2,
        fps: 12,
        model: 'stable-video-diffusion'
      }
    };

    console.log('⚠️ Note: Video generation on CPU - expect significantly slower performance');
    const videoBuffer = await aiEnhanced.generateVideo(videoRequest);
    console.log(`✅ Video generated: ${videoBuffer.length} bytes`);
    console.log(`   Duration: ${videoRequest.config?.duration}s @ ${videoRequest.config?.fps}fps`);

    // Test 11: Vector embeddings (CPU-friendly)
    console.log('\n📋 Test 11: Vector Embeddings');
    const embeddings = await aiEnhanced.generateEmbedding('PowerScript Enhanced AI is powerful.');
    console.log(`✅ Embeddings generated: ${embeddings.length} dimensions`);

    // Test 12: Text classification (CPU-friendly)
    console.log('\n📋 Test 12: Text Classification');
    const classes = ['technology', 'science', 'business', 'education'];
    const classificationResults = await aiEnhanced.classify('Artificial intelligence and machine learning are transforming technology.', classes);
    console.log(`✅ Classification complete: ${classificationResults.length} results`);

    // Test 13: Performance monitoring
    console.log('\n📋 Test 13: Performance Monitoring');
    const systemInfo = await aiEnhanced.getSystemInfo();
    console.log('✅ System information:');
    console.log(`   Hardware devices: ${systemInfo.hardware.length}`);
    console.log(`   Loaded models: ${systemInfo.models.loaded.length}`);
    console.log(`   Available models: ${systemInfo.models.available.length}`);

    const cacheStats = aiEnhanced.getCacheStats();
    console.log(`✅ Cache stats: ${cacheStats.totalEntries} entries`);
    console.log(`   Cache size: ${(cacheStats.totalSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`   Hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);

    const tasks = aiEnhanced.getTasks();
    console.log(`✅ Task monitoring: ${tasks.length} tasks tracked`);

    // Final summary
    console.log('\n🎉 All Enhanced AI Tests Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Hardware detection and system info');
    console.log('   ✅ Model management and discovery');
    console.log('   ✅ Text generation and processing (CPU optimized)');
    console.log('   ✅ Image generation (CPU mode with warnings)');
    console.log('   ✅ Audio processing and generation');
    console.log('   ✅ Video generation (CPU mode with performance notes)');
    console.log('   ✅ Vector embeddings and classification');
    console.log('   ✅ Performance monitoring and caching');
    
    console.log('\n💡 CPU Performance Notes:');
    console.log('   • Text generation: Fully CPU compatible');
    console.log('   • Audio processing: Good CPU performance');
    console.log('   • Image generation: Slower on CPU, reduced parameters used');
    console.log('   • Video generation: Significantly slower on CPU, short clips used');
    console.log('   • All operations include appropriate CPU fallbacks and warnings');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Export for use in other tests
export { runEnhancedAITests };

// Run tests if called directly
if (require.main === module) {
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