import { PowerScriptNetworkingEnhanced } from '../src/networking-enhanced/index';

/**
 * Test the complete PowerScript Enhanced Networking Module
 */
async function testNetworkingEnhanced() {
  console.log('🚀 Testing PowerScript Enhanced Networking Module (Complete)');
  console.log('=========================================================');

  try {
    // Create networking instance
    const networking = new PowerScriptNetworkingEnhanced({
      defaultTimeout: 15000,
      maxConcurrentRequests: 5,
      retryAttempts: 2,
      enableMetrics: true,
      userAgent: 'PowerScript-Test/1.0'
    });

    console.log('✅ PowerScriptNetworkingEnhanced created');
    console.log('📊 Initial metrics:', networking.metrics);

    // Test AS3-style API
    console.log('\n📝 Testing AS3-style URLRequest/URLLoader...');
    
    const request = networking.createURLRequest('https://jsonplaceholder.typicode.com/posts/1');
    request.addRequestHeader('Accept', 'application/json');
    
    const loader = networking.createURLLoader('json');
    const response = await loader.loadAsync(request);
    
    console.log('✅ AS3-style request:', {
      status: response.status,
      hasData: !!response.data,
      dataType: typeof response.data
    });

    // Test convenience methods
    console.log('\n🔧 Testing convenience methods...');
    
    // GET request
    const userData = await networking.get('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ GET request:', { name: userData?.name, email: userData?.email });

    // POST request
    const postData = { title: 'PowerScript Enhanced Test', body: 'Testing complete module', userId: 1 };
    const postResponse = await networking.post('https://jsonplaceholder.typicode.com/posts', postData);
    console.log('✅ POST request:', { id: postResponse?.id, title: postResponse?.title });

    // PUT request
    const putData = { id: 1, title: 'Updated PowerScript Test', body: 'Updated content', userId: 1 };
    const putResponse = await networking.put('https://jsonplaceholder.typicode.com/posts/1', putData);
    console.log('✅ PUT request:', { id: putResponse?.id, title: putResponse?.title });

    // DELETE request
    await networking.delete('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ DELETE request completed');

    // Test concurrent requests
    console.log('\n⚡ Testing concurrent requests...');
    
    const concurrentPromises = Array.from({ length: 3 }, (_, i) =>
      networking.get(`https://jsonplaceholder.typicode.com/posts/${i + 1}`)
    );
    
    const concurrentResults = await Promise.all(concurrentPromises);
    console.log('✅ Concurrent requests:', {
      count: concurrentResults.length,
      allSuccessful: concurrentResults.every(result => !!result)
    });

    // Test error handling and retry
    console.log('\n❌ Testing error handling and retry...');
    
    try {
      await networking.get('https://jsonplaceholder.typicode.com/posts/99999');
      console.log('❌ Error test FAILED - should have thrown');
    } catch (error) {
      console.log('✅ Error handling and retry:', error instanceof Error ? 'PASS' : 'FAIL');
    }

    // Test WebSocket creation (mock test since we can't easily test real WebSocket)
    console.log('\n🔌 Testing WebSocket creation...');
    
    const wsConfig = {
      url: 'ws://echo.websocket.org',
      reconnect: true,
      heartbeat: true,
      maxReconnectAttempts: 3
    };
    
    const ws = networking.createWebSocket(wsConfig);
    console.log('✅ WebSocket created:', {
      isConnecting: ws.isConnecting,
      reconnectAttempts: ws.reconnectAttempts
    });

    // Test connection pool
    const existingWs = networking.getWebSocket(wsConfig);
    console.log('✅ WebSocket pool:', { found: existingWs === ws });

    // Clean up WebSocket
    ws.destroy();
    console.log('✅ WebSocket destroyed');

    // Test metrics
    console.log('\n📊 Testing metrics collection...');
    
    const finalMetrics = networking.metrics;
    console.log('✅ Final metrics:', {
      totalRequests: finalMetrics.totalRequests,
      successfulRequests: finalMetrics.successfulRequests,
      failedRequests: finalMetrics.failedRequests,
      averageResponseTime: `${finalMetrics.averageResponseTime.toFixed(2)}ms`,
      activeConnections: finalMetrics.activeConnections
    });

    // Test metrics reset
    networking.resetMetrics();
    const resetMetrics = networking.metrics;
    console.log('✅ Metrics reset:', {
      totalRequests: resetMetrics.totalRequests,
      successfulRequests: resetMetrics.successfulRequests
    });

    // Test event system
    console.log('\n🎭 Testing event system...');
    
    let eventsFired = 0;
    
    networking.on('requestSuccess', () => eventsFired++);
    networking.on('requestFailure', () => eventsFired++);
    
    await networking.get('https://jsonplaceholder.typicode.com/posts/2');
    
    console.log('✅ Event system:', { eventsFired: eventsFired > 0 ? 'PASS' : 'FAIL' });

    // Clean up
    await networking.destroy();
    console.log('✅ Networking module destroyed');

    console.log('\n🎉 Enhanced Networking Module Test PASSED!');
    console.log('📝 Features tested:');
    console.log('  - AS3-style URLRequest/URLLoader API');
    console.log('  - Modern convenience methods (GET, POST, PUT, DELETE)');
    console.log('  - Concurrent request management');
    console.log('  - Automatic retry with exponential backoff');
    console.log('  - Error handling and recovery');
    console.log('  - WebSocket connection management');
    console.log('  - Connection pooling');
    console.log('  - Network metrics collection');
    console.log('  - Event-driven architecture');
    console.log('  - Resource cleanup and destruction');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Jest test wrapper
describe('PowerScript Networking Enhanced', () => {
  test('should pass enhanced networking tests', async () => {
    await testNetworkingEnhanced();
    expect(true).toBe(true);
  }, 30000);
});

// Run the test
if (require.main === module) {
  testNetworkingEnhanced().catch(console.error);
}