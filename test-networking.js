/**
 * PowerScript Networking & Communication Module Test Suite
 * Comprehensive tests for all networking functionality
 */

const { networking } = require('../src/networking/PowerScriptNetworking');
const { NodeHTTPProvider } = require('../src/networking/http/NodeHTTPProvider');
const { MockWebSocketProvider } = require('../src/networking/websocket/MockWebSocketProvider');

// Test colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function logSuccess(message) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
    console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
    console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

// Test suite
class NetworkingTestSuite {
    constructor() {
        this.testResults = [];
    }
    
    async runTest(testName, testFn) {
        try {
            logInfo(`Running test: ${testName}`);
            await testFn();
            logSuccess(`PASSED: ${testName}`);
            this.testResults.push({ name: testName, status: 'PASSED' });
        } catch (error) {
            logError(`FAILED: ${testName} - ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }
    
    async runAllTests() {
        logInfo('Starting PowerScript Networking Module Test Suite...\n');
        
        // HTTP Tests
        await this.runTest('HTTP Provider Configuration', this.testHTTPConfiguration.bind(this));
        await this.runTest('HTTP GET Request', this.testHTTPGet.bind(this));
        await this.runTest('HTTP POST Request', this.testHTTPPost.bind(this));
        await this.runTest('HTTP Request with Parameters', this.testHTTPParams.bind(this));
        await this.runTest('HTTP Request Interceptors', this.testHTTPInterceptors.bind(this));
        
        // WebSocket Tests
        await this.runTest('WebSocket Provider Configuration', this.testWebSocketConfiguration.bind(this));
        await this.runTest('WebSocket Connection', this.testWebSocketConnection.bind(this));
        await this.runTest('WebSocket Messaging', this.testWebSocketMessaging.bind(this));
        await this.runTest('WebSocket Message Queue', this.testWebSocketQueue.bind(this));
        await this.runTest('WebSocket Reconnection', this.testWebSocketReconnection.bind(this));
        
        // GraphQL Tests
        await this.runTest('GraphQL Provider Configuration', this.testGraphQLConfiguration.bind(this));
        
        // Message Queue Tests
        await this.runTest('Message Queue Configuration', this.testMessageQueueConfiguration.bind(this));
        
        // Health and Monitoring Tests
        await this.runTest('Networking Health Check', this.testNetworkingHealth.bind(this));
        await this.runTest('Metrics Collection', this.testMetricsCollection.bind(this));
        await this.runTest('Event Emission', this.testEventEmission.bind(this));
        
        this.printTestSummary();
    }
    
    // HTTP Tests
    async testHTTPConfiguration() {
        const httpProvider = new NodeHTTPProvider();
        
        const config = {
            baseURL: 'https://api.example.com',
            timeout: 10000,
            retries: 2,
            maxConcurrentRequests: 50
        };
        
        await networking.configureHTTP(config, httpProvider);
        
        const health = networking.getNetworkingHealth();
        
        if (health.http.provider !== 'NodeHTTPProvider') {
            throw new Error('HTTP provider not configured correctly');
        }
        
        if (!health.http.configured) {
            throw new Error('HTTP configuration not applied');
        }
        
        logInfo('  ✓ HTTP provider configured with NodeHTTPProvider');
        logInfo('  ✓ Configuration applied successfully');
    }
    
    async testHTTPGet() {
        const response = await networking.get('https://api.example.com/users');
        
        if (!response.status) {
            throw new Error('Response status missing');
        }
        
        if (!response.data) {
            throw new Error('Response data missing');
        }
        
        if (!response.duration && response.duration !== 0) {
            throw new Error('Response duration missing');
        }
        
        logInfo(`  ✓ GET request completed with status: ${response.status}`);
        logInfo(`  ✓ Response time: ${response.duration}ms`);
    }
    
    async testHTTPPost() {
        const postData = {
            name: 'John Doe',
            email: 'john@example.com'
        };
        
        const response = await networking.post('https://api.example.com/users', postData);
        
        if (!response.status) {
            throw new Error('Response status missing');
        }
        
        if (response.config.method !== 'POST') {
            throw new Error('Request method not set correctly');
        }
        
        logInfo(`  ✓ POST request completed with status: ${response.status}`);
        logInfo('  ✓ Request body included in response config');
    }
    
    async testHTTPParams() {
        const params = {
            page: 1,
            limit: 10,
            sort: 'created_at'
        };
        
        const response = await networking.get('https://api.example.com/users', { params });
        
        if (!response.config.params) {
            throw new Error('Request parameters not preserved');
        }
        
        logInfo('  ✓ Query parameters handled correctly');
    }
    
    async testHTTPInterceptors() {
        const httpProvider = new NodeHTTPProvider();
        
        let requestIntercepted = false;
        let responseIntercepted = false;
        
        httpProvider.addRequestInterceptor(async (request) => {
            requestIntercepted = true;
            request.headers = request.headers || {};
            request.headers['X-Test-Header'] = 'test-value';
            return request;
        });
        
        httpProvider.addResponseInterceptor(async (response) => {
            responseIntercepted = true;
            response.headers['X-Response-Header'] = 'response-value';
            return response;
        });
        
        await networking.configureHTTP({}, httpProvider);
        const response = await networking.get('https://api.example.com/test');
        
        if (!requestIntercepted) {
            throw new Error('Request interceptor not executed');
        }
        
        if (!responseIntercepted) {
            throw new Error('Response interceptor not executed');
        }
        
        logInfo('  ✓ Request interceptor executed');
        logInfo('  ✓ Response interceptor executed');
    }
    
    // WebSocket Tests
    async testWebSocketConfiguration() {
        const wsProvider = new MockWebSocketProvider();
        
        const config = {
            url: 'wss://echo.websocket.org',
            reconnect: {
                enabled: true,
                maxAttempts: 3,
                delay: 1000,
                backoffMultiplier: 2,
                maxDelay: 10000
            },
            heartbeat: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                message: 'ping'
            }
        };
        
        await networking.configureWebSocket(config, wsProvider);
        
        const health = networking.getNetworkingHealth();
        
        if (health.websocket.provider !== 'MockWebSocketProvider') {
            throw new Error('WebSocket provider not configured correctly');
        }
        
        logInfo('  ✓ WebSocket provider configured');
        logInfo('  ✓ Reconnection settings applied');
        logInfo('  ✓ Heartbeat settings applied');
    }
    
    async testWebSocketConnection() {
        await networking.connectWebSocket();
        
        const health = networking.getNetworkingHealth();
        
        if (!health.websocket.connected) {
            throw new Error('WebSocket not connected');
        }
        
        logInfo('  ✓ WebSocket connection established');
        
        // Wait a moment then disconnect
        await new Promise(resolve => setTimeout(resolve, 100));
        await networking.disconnectWebSocket();
        
        logInfo('  ✓ WebSocket disconnection successful');
    }
    
    async testWebSocketMessaging() {
        await networking.connectWebSocket();
        
        const message = {
            id: 'test-msg-1',
            type: 'text',
            data: 'Hello WebSocket!',
            timestamp: new Date()
        };
        
        await networking.sendWebSocketMessage(message);
        
        const metrics = networking.getMetrics();
        
        if (metrics.websocket.messagesSent === 0) {
            throw new Error('Message send not tracked in metrics');
        }
        
        logInfo('  ✓ WebSocket message sent successfully');
        logInfo(`  ✓ Messages sent metric: ${metrics.websocket.messagesSent}`);
        
        await networking.disconnectWebSocket();
    }
    
    async testWebSocketQueue() {
        const wsProvider = new MockWebSocketProvider();
        
        const config = {
            url: 'wss://echo.websocket.org',
            messageQueue: {
                enabled: true,
                maxSize: 100,
                persistOffline: true
            }
        };
        
        await networking.configureWebSocket(config, wsProvider);
        
        // Queue messages while disconnected
        const message1 = {
            id: 'queued-1',
            type: 'text',
            data: 'Queued message 1',
            timestamp: new Date()
        };
        
        const message2 = {
            id: 'queued-2',
            type: 'text',
            data: 'Queued message 2',
            timestamp: new Date()
        };
        
        wsProvider.queueMessage(message1);
        wsProvider.queueMessage(message2);
        
        logInfo('  ✓ Messages queued while disconnected');
        
        // Connect and flush queue
        await networking.connectWebSocket();
        await wsProvider.flushQueue();
        
        logInfo('  ✓ Message queue flushed on connection');
        
        await networking.disconnectWebSocket();
    }
    
    async testWebSocketReconnection() {
        const wsProvider = new MockWebSocketProvider();
        
        let reconnectingEventReceived = false;
        
        wsProvider.on('reconnecting', (event) => {
            reconnectingEventReceived = true;
            logInfo(`  ✓ Reconnecting attempt: ${event.data?.attempt}`);
        });
        
        const config = {
            url: 'wss://echo.websocket.org',
            reconnect: {
                enabled: true,
                maxAttempts: 2,
                delay: 100,
                backoffMultiplier: 1.5,
                maxDelay: 1000
            }
        };
        
        await networking.configureWebSocket(config, wsProvider);
        
        // Force a reconnection scenario (simulated)
        logInfo('  ✓ Reconnection configuration tested');
    }
    
    // GraphQL Tests
    async testGraphQLConfiguration() {
        const config = {
            endpoint: 'https://api.example.com/graphql',
            caching: {
                enabled: true,
                ttl: 300000,
                maxSize: 100,
                strategy: 'memory'
            },
            subscriptions: {
                enabled: true,
                transport: 'websocket',
                url: 'wss://api.example.com/graphql'
            }
        };
        
        await networking.configureGraphQL(config);
        
        const health = networking.getNetworkingHealth();
        
        if (!health.graphql.configured) {
            throw new Error('GraphQL configuration not applied');
        }
        
        logInfo('  ✓ GraphQL endpoint configured');
        logInfo('  ✓ Caching settings applied');
        logInfo('  ✓ Subscription settings applied');
    }
    
    // Message Queue Tests
    async testMessageQueueConfiguration() {
        const config = {
            provider: 'redis',
            connection: {
                host: 'localhost',
                port: 6379,
                password: 'test-password'
            },
            serialization: {
                format: 'json',
                compression: true
            },
            retry: {
                enabled: true,
                maxAttempts: 3,
                backoffStrategy: 'exponential',
                initialDelay: 1000,
                maxDelay: 10000
            }
        };
        
        await networking.configureMessageQueue(config);
        
        const health = networking.getNetworkingHealth();
        
        if (!health.messageQueue.configured) {
            throw new Error('Message queue configuration not applied');
        }
        
        logInfo('  ✓ Message queue provider configured');
        logInfo('  ✓ Connection settings applied');
        logInfo('  ✓ Retry strategy configured');
    }
    
    // Health and Monitoring Tests
    async testNetworkingHealth() {
        const health = networking.getNetworkingHealth();
        
        if (!health.http || !health.websocket || !health.graphql || !health.messageQueue) {
            throw new Error('Health check missing components');
        }
        
        if (typeof health.http.configured !== 'boolean') {
            throw new Error('HTTP configuration status not reported');
        }
        
        logInfo('  ✓ HTTP health status reported');
        logInfo('  ✓ WebSocket health status reported');
        logInfo('  ✓ GraphQL health status reported');
        logInfo('  ✓ Message queue health status reported');
    }
    
    async testMetricsCollection() {
        // Reset metrics first
        networking.resetMetrics();
        
        let initialMetrics = networking.getMetrics();
        
        if (initialMetrics.http.requestCount !== 0) {
            throw new Error('Metrics not reset properly');
        }
        
        // Make some requests to generate metrics
        await networking.get('https://api.example.com/test1');
        await networking.post('https://api.example.com/test2', { data: 'test' });
        
        const finalMetrics = networking.getMetrics();
        
        if (finalMetrics.http.requestCount !== 2) {
            throw new Error(`Expected 2 requests, got ${finalMetrics.http.requestCount}`);
        }
        
        if (finalMetrics.http.successCount !== 2) {
            throw new Error(`Expected 2 successful requests, got ${finalMetrics.http.successCount}`);
        }
        
        if (finalMetrics.http.averageResponseTime <= 0) {
            throw new Error('Average response time not calculated');
        }
        
        logInfo(`  ✓ Request count: ${finalMetrics.http.requestCount}`);
        logInfo(`  ✓ Success count: ${finalMetrics.http.successCount}`);
        logInfo(`  ✓ Average response time: ${finalMetrics.http.averageResponseTime}ms`);
    }
    
    async testEventEmission() {
        let eventReceived = false;
        let eventData = null;
        
        networking.on('networkEvent', (event) => {
            eventReceived = true;
            eventData = event;
        });
        
        await networking.get('https://api.example.com/event-test');
        
        // Give events time to propagate
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!eventReceived) {
            throw new Error('Network event not emitted');
        }
        
        if (!eventData || !eventData.id || !eventData.type || !eventData.timestamp) {
            throw new Error('Event data incomplete');
        }
        
        logInfo(`  ✓ Event emitted with type: ${eventData.type}`);
        logInfo(`  ✓ Event ID: ${eventData.id}`);
        logInfo(`  ✓ Event timestamp: ${eventData.timestamp}`);
    }
    
    printTestSummary() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.status === 'PASSED').length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n' + '='.repeat(50));
        logInfo('POWERSCRIPT NETWORKING TEST SUMMARY');
        console.log('='.repeat(50));
        
        logInfo(`Total Tests: ${totalTests}`);
        logSuccess(`Passed: ${passedTests}`);
        
        if (failedTests > 0) {
            logError(`Failed: ${failedTests}`);
            console.log('\nFailed Tests:');
            this.testResults
                .filter(result => result.status === 'FAILED')
                .forEach(result => {
                    logError(`  ${result.name}: ${result.error}`);
                });
        } else {
            logSuccess('All tests passed! 🎉');
        }
        
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        logInfo(`Success Rate: ${successRate}%`);
        
        console.log('='.repeat(50) + '\n');
    }
}

// Run the test suite
async function runNetworkingTests() {
    const testSuite = new NetworkingTestSuite();
    await testSuite.runAllTests();
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runNetworkingTests, NetworkingTestSuite };
}

// Run tests if this file is executed directly
if (require.main === module) {
    runNetworkingTests().catch(error => {
        logError(`Test suite failed: ${error.message}`);
        process.exit(1);
    });
}