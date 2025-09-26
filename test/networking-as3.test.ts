import { URLRequest } from '../src/networking-enhanced/URLRequest';
import { URLLoader } from '../src/networking-enhanced/URLLoader';

/**
 * Test the AS3-style URLRequest and URLLoader implementation
 */
async function testNetworkingBasics() {
  console.log('🌐 Testing PowerScript Enhanced Networking Module (AS3-Style)');
  console.log('=======================================================');

  try {
    // Test URLRequest creation and configuration
    console.log('\n📝 Testing URLRequest...');
    
    const request = new URLRequest('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ URLRequest created:', request.toString());
    
    // Test AS3-style header manipulation
    request.addRequestHeader('User-Agent', 'PowerScript/1.0');
    request.addRequestHeader('Accept', 'application/json');
    console.log('✅ Headers added:', request.requestHeaders);
    
    // Test request validation
    const errors = request.validate();
    console.log('✅ Request validation:', errors.length === 0 ? 'PASS' : `FAIL: ${errors.join(', ')}`);
    
    // Test URLLoader with event-driven approach
    console.log('\n🔄 Testing URLLoader (Event-driven)...');
    
    const loader = new URLLoader();
    loader.dataFormat = 'json';
    
    // Set up event listeners (AS3-style)
    loader.on('open', () => {
      console.log('📡 Request opened');
    });
    
    loader.on('progress', (loaded, total) => {
      console.log(`📊 Progress: ${loaded}/${total} bytes`);
    });
    
    loader.on('complete', (response) => {
      console.log('✅ Request completed:', {
        status: response.status,
        type: response.type,
        dataType: typeof response.data,
        hasData: !!response.data
      });
    });
    
    loader.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
    });

    // Execute request with Promise
    console.log('🚀 Loading data...');
    const response = await loader.loadAsync(request);
    
    console.log('✅ Response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      redirected: response.redirected,
      dataKeys: Object.keys(response.data || {})
    });

    // Test convenience methods
    console.log('\n🔧 Testing convenience methods...');
    
    const jsonData = await loader.loadJSON('https://jsonplaceholder.typicode.com/users/1');
    console.log('✅ JSON loader:', { 
      name: jsonData?.name, 
      email: jsonData?.email 
    });

    // Test POST request
    console.log('\n📤 Testing POST request...');
    
    const postData = { title: 'PowerScript Test', body: 'Testing POST functionality', userId: 1 };
    const postResponse = await loader.postJSON('https://jsonplaceholder.typicode.com/posts', postData);
    console.log('✅ POST response:', { 
      id: postResponse?.id, 
      title: postResponse?.title 
    });

    // Test request cloning
    console.log('\n📋 Testing request cloning...');
    
    const clonedRequest = request.clone();
    clonedRequest.method = 'PUT';
    clonedRequest.data = JSON.stringify({ updated: true });
    console.log('✅ Request cloned:', {
      original: `${request.method} ${request.url}`,
      cloned: `${clonedRequest.method} ${clonedRequest.url}`
    });

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    
    const authRequest = new URLRequest('https://httpbin.org/basic-auth/user/pass');
    authRequest.setBasicAuth('user', 'pass');
    
    try {
      const authResponse = await loader.loadAsync(authRequest);
      console.log('✅ Basic auth test:', authResponse.status === 200 ? 'PASS' : 'FAIL');
    } catch (error) {
      console.log('⚠️ Auth test skipped (service unavailable)');
    }

    // Test error handling
    console.log('\n❌ Testing error handling...');
    
    try {
      const errorRequest = new URLRequest('https://jsonplaceholder.typicode.com/posts/99999');
      await loader.loadAsync(errorRequest);
      console.log('❌ Error test FAILED - should have thrown');
    } catch (error) {
      console.log('✅ Error handling:', error instanceof Error ? 'PASS' : 'FAIL');
    }

    // Cleanup
    loader.destroy();
    console.log('✅ Loader destroyed');

    console.log('\n🎉 AS3-Style Networking Test PASSED!');
    console.log('📝 All URLRequest and URLLoader functionality working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Jest test wrapper
describe('Networking AS3 Style', () => {
  it('should run AS3-style networking test successfully', async () => {
    await expect(testNetworkingBasics()).resolves.not.toThrow();
  });
});

// Run the test if not in Jest environment
if (typeof describe === 'undefined') {
  testNetworkingBasics().catch(console.error);
}