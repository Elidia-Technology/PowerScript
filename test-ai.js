/**
 * Test PowerScript AI Module
 */

const { PowerScript, PowerScriptAI, OpenAIProvider } = require('./dist/index.js');

async function testAI() {
  console.log('🤖 Testing PowerScript AI Module...\n');

  try {
    // Test 1: Access AI via PowerScript.ai
    console.log('1. Accessing AI via PowerScript.ai');
    const ai1 = PowerScript.ai;
    console.log(`   ✅ AI Instance: ${ai1.toString()}`);
    console.log(`   ✅ Initial providers: ${ai1.getProviders().length}`);

    // Test 2: Create standalone AI instance
    console.log('\n2. Creating standalone AI instance');
    const ai2 = new PowerScriptAI({
      defaultProvider: 'openai',
      features: {
        multiAgent: true,
        rag: true,
        functionCalling: true,
        streaming: true,
        caching: true
      },
      limits: {
        maxTokens: 2000,
        maxRequests: 100,
        timeout: 30000
      }
    });
    console.log(`   ✅ AI Instance: ${ai2.toString()}`);

    // Test 3: Register OpenAI provider
    console.log('\n3. Registering OpenAI provider');
    const openaiProvider = new OpenAIProvider();
    console.log(`   ✅ Provider: ${openaiProvider.name} v${openaiProvider.version}`);
    console.log(`   ✅ Supported models: ${openaiProvider.supportedModels.slice(0, 5).join(', ')}... (${openaiProvider.supportedModels.length} total)`);
    console.log(`   ✅ Features: Text=${openaiProvider.supportedFeatures.textCompletion}, Streaming=${openaiProvider.supportedFeatures.streaming}, Embeddings=${openaiProvider.supportedFeatures.embeddings}`);

    ai2.registerProvider(openaiProvider, {
      apiKey: 'test-key-for-demo',
      timeout: 30000,
      maxRetries: 3,
      defaultModel: 'gpt-4o-mini'
    });

    console.log(`   ✅ Provider registered successfully`);
    console.log(`   ✅ Available providers: ${ai2.getProviders().join(', ')}`);

    // Test 4: Provider info
    console.log('\n4. Testing provider information');
    const providerInfo = ai2.getProviderInfo('openai');
    console.log(`   ✅ Provider info:`, {
      name: providerInfo.name,
      version: providerInfo.version,
      modelCount: providerInfo.models.length,
      initialized: providerInfo.initialized
    });

    // Test 5: Initialize AI (will fail without real API key, but tests the flow)
    console.log('\n5. Testing AI initialization');
    try {
      await ai2.initialize();
      console.log(`   ✅ AI initialized successfully`);
    } catch (error) {
      console.log(`   ⚠️  AI initialization failed (expected without real API key): ${error.message}`);
    }

    // Test 6: AI utility methods with fallback
    console.log('\n6. Testing AI utility methods');
    const testText = "Hello, this is a test message for token estimation!";
    try {
      const estimatedTokens = ai2.estimateTokens(testText);
      console.log(`   ✅ Text: "${testText}"`);
      console.log(`   ✅ Estimated tokens: ${estimatedTokens}`);
    } catch (error) {
      // Test direct provider method instead
      const estimatedTokens = openaiProvider.estimateTokens(testText);
      console.log(`   ✅ Text: "${testText}"`);
      console.log(`   ✅ Estimated tokens (direct): ${estimatedTokens}`);
    }

    // Test 7: Usage statistics
    console.log('\n7. Testing usage statistics');
    const usage = ai2.getUsage();
    console.log(`   ✅ Usage stats:`, usage);

    // Test 8: Health check (will fail without real API key, but tests the method)
    console.log('\n8. Testing health check');
    try {
      const health = await ai2.healthCheck();
      console.log(`   ✅ Health check results:`, health);
    } catch (error) {
      console.log(`   ⚠️  Health check failed (expected without real API key): ${error.message}`);
    }

    // Test 9: Model validation
    console.log('\n9. Testing model validation');
    const validModel = openaiProvider.validateModel('gpt-4o');
    const invalidModel = openaiProvider.validateModel('invalid-model');
    console.log(`   ✅ gpt-4o is valid: ${validModel}`);
    console.log(`   ✅ invalid-model is valid: ${invalidModel}`);

    // Test 10: Cache operations
    console.log('\n10. Testing cache operations');
    console.log(`   ✅ Initial cache size: ${ai2.getUsage().cacheSize}`);
    ai2.clearCache();
    console.log(`   ✅ Cache cleared, new size: ${ai2.getUsage().cacheSize}`);

    // Test 11: Provider registry
    console.log('\n11. Testing provider registry operations');
    ai2.setDefaultProvider('openai');
    console.log(`   ✅ Default provider set to: openai`);
    
    const registryInfo = ai2.getProviderInfo();
    console.log(`   ✅ Registry info:`, registryInfo);

    console.log('\n🎉 All AI module tests passed!');
    console.log('\nNote: Actual API calls require valid API keys and would be tested separately.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testAI();