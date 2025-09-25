/**
 * PowerScript Analytics - Metrics Collection Example
 * Shows how to collect, monitor and analyze system metrics
 */

export async function metricsExample() {
    console.log('📊 Metrics Collection Example\n');

    // Mock analytics for standalone example
    const analytics = {
        recordMetric: (metric: any) => {
            console.log(`📈 Recorded metric: ${metric.name} = ${metric.value}${metric.unit || ''}`);
            return true;
        },
        getMetricHistory: (name: string) => ({
            values: Array.from({ length: 10 }, (_, i) => ({
                timestamp: new Date(Date.now() - (9-i) * 60000),
                value: Math.random() * 100
            }))
        }),
        getSystemStatus: () => ({
            uptime: 86400.5,
            memory: { heapUsed: 45 * 1024 * 1024, heapTotal: 128 * 1024 * 1024 },
            cpu: { usage: 23.5 },
            activeMetrics: 15
        })
    };

    // 1. Application Performance Metrics
    console.log('=== Application Performance Metrics ===');
    
    // Response time tracking
    analytics.recordMetric({
        name: 'http_response_time',
        value: 142,
        unit: 'ms',
        timestamp: new Date(),
        type: 'gauge',
        tags: { endpoint: '/api/users', method: 'GET' }
    });

    // Throughput monitoring
    analytics.recordMetric({
        name: 'requests_per_second',
        value: 245,
        unit: 'req/s',
        timestamp: new Date(),
        type: 'counter',
        tags: { service: 'api-gateway' }
    });

    // Error rate tracking
    analytics.recordMetric({
        name: 'error_rate',
        value: 0.8,
        unit: 'percent',
        timestamp: new Date(),
        type: 'gauge',
        tags: { severity: 'warning' }
    });

    console.log('✅ Performance metrics recorded\n');

    // 2. Business Metrics
    console.log('=== Business Metrics ===');

    // Revenue tracking
    analytics.recordMetric({
        name: 'daily_revenue',
        value: 15847.50,
        unit: 'USD',
        timestamp: new Date(),
        type: 'counter',
        tags: { currency: 'USD', region: 'US' }
    });

    // User engagement
    analytics.recordMetric({
        name: 'active_users',
        value: 1247,
        unit: 'count',
        timestamp: new Date(),
        type: 'gauge',
        tags: { timeframe: '24h' }
    });

    // Conversion rates
    analytics.recordMetric({
        name: 'conversion_rate',
        value: 3.2,
        unit: 'percent',
        timestamp: new Date(),
        type: 'gauge',
        tags: { funnel_step: 'checkout' }
    });

    console.log('✅ Business metrics recorded\n');

    // 3. System Resource Metrics
    console.log('=== System Resource Metrics ===');

    // CPU usage
    analytics.recordMetric({
        name: 'cpu_usage',
        value: 67.3,
        unit: 'percent',
        timestamp: new Date(),
        type: 'gauge',
        tags: { host: 'web-server-01' }
    });

    // Memory usage
    analytics.recordMetric({
        name: 'memory_usage',
        value: 2.1,
        unit: 'GB',
        timestamp: new Date(),
        type: 'gauge',
        tags: { type: 'heap', host: 'web-server-01' }
    });

    // Disk I/O
    analytics.recordMetric({
        name: 'disk_io_rate',
        value: 125,
        unit: 'MB/s',
        timestamp: new Date(),
        type: 'gauge',
        tags: { operation: 'read', device: '/dev/sda1' }
    });

    console.log('✅ System metrics recorded\n');

    // 4. Custom Application Metrics
    console.log('=== Custom Application Metrics ===');

    // Feature usage tracking
    analytics.recordMetric({
        name: 'feature_usage',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        type: 'counter',
        tags: { feature: 'export_data', user_id: '12345' }
    });

    // Cache performance
    analytics.recordMetric({
        name: 'cache_hit_rate',
        value: 89.5,
        unit: 'percent',
        timestamp: new Date(),
        type: 'gauge',
        tags: { cache_type: 'redis', region: 'user_sessions' }
    });

    // Queue metrics
    analytics.recordMetric({
        name: 'queue_depth',
        value: 42,
        unit: 'messages',
        timestamp: new Date(),
        type: 'gauge',
        tags: { queue_name: 'email_notifications' }
    });

    console.log('✅ Custom metrics recorded\n');

    // 5. Metrics Analysis
    console.log('=== Metrics Analysis ===');

    const responseTimeHistory = analytics.getMetricHistory('http_response_time');
    console.log(`Response time history: ${responseTimeHistory.values.length} data points`);
    
    const avgResponseTime = responseTimeHistory.values.reduce((sum, point) => sum + point.value, 0) / responseTimeHistory.values.length;
    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);

    const systemStatus = analytics.getSystemStatus();
    console.log(`System uptime: ${(systemStatus.uptime / 3600).toFixed(2)} hours`);
    console.log(`Memory usage: ${(systemStatus.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Active metrics: ${systemStatus.activeMetrics}`);

    console.log('\n🎉 Metrics collection example completed!');
}

export async function alertingExample() {
    console.log('\n🚨 Metrics Alerting Example\n');

    // Alerting configuration examples
    const alertRules = [
        {
            name: 'high_response_time',
            metric: 'http_response_time',
            condition: 'greater_than',
            threshold: 500, // 500ms
            severity: 'warning',
            cooldown: 300, // 5 minutes
            actions: ['email', 'slack']
        },
        {
            name: 'critical_error_rate',
            metric: 'error_rate',
            condition: 'greater_than',
            threshold: 5, // 5%
            severity: 'critical',
            cooldown: 60, // 1 minute
            actions: ['email', 'slack', 'pagerduty']
        },
        {
            name: 'low_conversion_rate',
            metric: 'conversion_rate',
            condition: 'less_than',
            threshold: 2.0, // 2%
            severity: 'info',
            cooldown: 3600, // 1 hour
            actions: ['email']
        }
    ];

    console.log('Alert Rules Configuration:');
    alertRules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.name}:`);
        console.log(`   - Metric: ${rule.metric}`);
        console.log(`   - Condition: ${rule.condition} ${rule.threshold}`);
        console.log(`   - Severity: ${rule.severity}`);
        console.log(`   - Actions: ${rule.actions.join(', ')}`);
    });

    // Simulate alert triggers
    console.log('\n🔥 Simulating Alert Scenarios:');

    console.log('\n1. Response Time Alert:');
    console.log('   Current: 750ms (threshold: 500ms)');
    console.log('   Status: ⚠️  WARNING - High response time detected');
    console.log('   Action: Email notification sent to ops team');

    console.log('\n2. Error Rate Alert:');
    console.log('   Current: 7.2% (threshold: 5%)');
    console.log('   Status: 🚨 CRITICAL - Error rate exceeded threshold');
    console.log('   Action: Slack notification + PagerDuty incident created');

    console.log('\n3. Conversion Rate Alert:');
    console.log('   Current: 1.8% (threshold: 2%)');
    console.log('   Status: ℹ️  INFO - Conversion rate below target');
    console.log('   Action: Email report sent to marketing team');

    console.log('\n📊 Alert Dashboard:');
    console.log('- Active alerts: 3');
    console.log('- Critical alerts: 1');
    console.log('- Warning alerts: 1');
    console.log('- Info alerts: 1');
    console.log('- Resolved today: 12');

    console.log('\n🚨 Alerting example completed!');
}

export function metricsIntegrationGuide() {
    console.log('\n🔧 Metrics Integration Guide\n');

    console.log('Integration Patterns:');
    console.log('\n1. Middleware Integration:');
    console.log('```javascript');
    console.log('app.use((req, res, next) => {');
    console.log('  const start = Date.now();');
    console.log('  res.on("finish", () => {');
    console.log('    analytics.recordMetric({');
    console.log('      name: "http_request_duration",');
    console.log('      value: Date.now() - start,');
    console.log('      tags: { method: req.method, route: req.route.path }');
    console.log('    });');
    console.log('  });');
    console.log('  next();');
    console.log('});');
    console.log('```\n');

    console.log('2. Database Integration:');
    console.log('```javascript');
    console.log('db.on("query", (query) => {');
    console.log('  analytics.recordMetric({');
    console.log('    name: "db_query_count",');
    console.log('    value: 1,');
    console.log('    type: "counter",');
    console.log('    tags: { table: query.table }');
    console.log('  });');
    console.log('});');
    console.log('```\n');

    console.log('3. Custom Business Logic:');
    console.log('```javascript');
    console.log('function processOrder(order) {');
    console.log('  // Process order...');
    console.log('  analytics.recordMetric({');
    console.log('    name: "orders_processed",');
    console.log('    value: 1,');
    console.log('    tags: { product: order.product, region: order.region }');
    console.log('  });');
    console.log('}');
    console.log('```\n');

    console.log('📈 Metric Types:');
    console.log('- Counter: Cumulative values (orders, requests)');
    console.log('- Gauge: Point-in-time values (CPU, memory)');
    console.log('- Histogram: Distribution of values (response times)');
    console.log('- Summary: Quantiles and counts');

    console.log('\n🏷️  Tagging Strategy:');
    console.log('- Use consistent tag naming');
    console.log('- Include relevant dimensions');
    console.log('- Avoid high-cardinality tags');
    console.log('- Group related metrics with common tags');

    console.log('\n⚡ Best Practices:');
    console.log('- Collect metrics at appropriate intervals');
    console.log('- Use batching for high-volume metrics');
    console.log('- Implement circuit breakers for reliability');
    console.log('- Monitor metric collection overhead');
    console.log('- Set up proper retention policies');

    console.log('\n🔧 Integration guide completed!');
}

// Run examples
if (require.main === module) {
    metricsExample()
        .then(() => alertingExample())
        .then(() => metricsIntegrationGuide())
        .catch(console.error);
}