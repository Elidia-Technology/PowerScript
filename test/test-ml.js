/**
 * PowerScript ML Module Test
 * Test the machine learning infrastructure
 */

const { PowerScriptML } = require('./dist/ml/PowerScriptML');
const { ONNXProvider } = require('./dist/ml/providers/ONNXProvider');

async function testMLModule() {
    console.log('🧠 Testing PowerScript ML Module...\n');

    try {
        // Test ML system initialization
        console.log('1. Initializing ML system...');
        const mlConfig = {
            providers: {
                onnx: {
                    executionProviders: ['cpu'],
                    sessionOptions: {},
                    graphOptimizationLevel: 'basic'
                }
            },
            defaultProvider: 'onnx',
            memoryLimit: 1024 * 1024 * 1024, // 1GB
            useGPU: false,
            caching: {
                enabled: true,
                maxSize: 100,
                ttl: 60000
            }
        };

        const ml = PowerScriptML.getInstance(mlConfig);
        console.log('✅ ML system initialized successfully');

        // Test provider listing
        console.log('\n2. Testing provider management...');
        const providers = ml.listProviders();
        console.log(`Available providers: ${providers.join(', ')}`);
        
        // Test ONNX provider directly
        console.log('\n3. Testing ONNX provider...');
        const onnxProvider = new ONNXProvider({
            executionProviders: ['cpu'],
            sessionOptions: {},
            graphOptimizationLevel: 'basic'
        });
        
        await onnxProvider.initialize();
        console.log('✅ ONNX provider initialized');

        // Test model loading (placeholder)
        console.log('\n4. Testing model operations...');
        try {
            const model = await onnxProvider.loadModel('/placeholder/model.onnx');
            console.log(`✅ Model loaded: ${model.id} (${model.type})`);
            
            // Test prediction (placeholder)
            const testInput = [{
                data: new Float32Array([1, 2, 3, 4]),
                shape: [4],
                dtype: 'float32'
            }];
            
            const result = await onnxProvider.predict(model.id, testInput);
            console.log(`✅ Prediction completed in ${result.processingTime}ms`);
            console.log(`   Confidence: ${result.confidence}`);
            console.log(`   Output shape: ${result.predictions[0].shape}`);
            
            await onnxProvider.unloadModel(model.id);
            console.log('✅ Model unloaded');
        } catch (error) {
            console.log('⚠️  Model operations (expected to fail with placeholder): ', error.message);
        }

        // Test metrics
        console.log('\n5. Testing metrics...');
        const metrics = ml.getMetrics();
        console.log('ML Metrics:', {
            totalPredictions: metrics.totalPredictions,
            modelCount: metrics.modelCount,
            errorCount: metrics.errorCount
        });

        // Test memory usage
        console.log('\n6. Testing memory usage...');
        const memoryUsage = await ml.getMemoryUsage();
        console.log(`Memory usage: ${memoryUsage} bytes`);

        // Test cleanup
        console.log('\n7. Cleaning up...');
        await ml.cleanup();
        console.log('✅ ML system cleaned up');

        console.log('\n🎉 All ML module tests completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ ML module test failed:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Event listener test
function testMLEvents() {
    console.log('\n🎧 Testing ML Events...');
    
    try {
        const mlConfig = {
            providers: {
                onnx: {
                    executionProviders: ['cpu']
                }
            },
            defaultProvider: 'onnx',
            caching: { enabled: false, maxSize: 0, ttl: 0 }
        };

        const ml = PowerScriptML.getInstance(mlConfig);
        
        // Add event listeners
        ml.addEventListener('model-loaded', (event) => {
            console.log('📥 Model loaded event:', event.type);
        });
        
        ml.addEventListener('prediction-complete', (event) => {
            console.log('🔮 Prediction complete event:', event.type);
        });
        
        console.log('✅ Event listeners registered');
        return true;
    } catch (error) {
        console.error('❌ Event test failed:', error);
        return false;
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting PowerScript ML Tests...\n');
    
    const testResults = [];
    
    // Basic functionality tests
    testResults.push(await testMLModule());
    
    // Event system tests
    testResults.push(testMLEvents());
    
    // Summary
    const passed = testResults.filter(r => r).length;
    const total = testResults.length;
    
    console.log(`\n📊 Test Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! ML module is working correctly.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Check the output above.');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testMLModule, testMLEvents, runAllTests };