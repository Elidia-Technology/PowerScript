/**
 * PowerScript Analytics Module - Usage Example
 * Demonstrates how to use the analytics system for data analysis
 */

import { PowerScriptAnalytics } from '../src/analytics/PowerScriptAnalytics';
import { Dataset, ChartConfig, Metric } from '../src/analytics/types';

async function analyticsExample() {
    console.log('📊 PowerScript Analytics Example\n');

    // Initialize Analytics System
    const analytics = new PowerScriptAnalytics({
        dataRetentionDays: 30,
        enableRealTimeAnalysis: true,
        samplingRate: 1.0
    });

    await analytics.initialize();
    console.log('✅ Analytics system initialized\n');

    // 1. Create and analyze datasets
    console.log('=== Data Analysis Example ===');
    
    const salesData: Dataset = {
        name: 'monthly-sales',
        type: 'timeseries',
        data: [
            { timestamp: new Date('2024-01-01'), value: 15000, label: 'January' },
            { timestamp: new Date('2024-02-01'), value: 18500, label: 'February' },
            { timestamp: new Date('2024-03-01'), value: 22000, label: 'March' },
            { timestamp: new Date('2024-04-01'), value: 19500, label: 'April' },
            { timestamp: new Date('2024-05-01'), value: 25000, label: 'May' },
        ]
    };

    analytics.addDataset('sales', salesData);
    const stats = await analytics.analyzeDataset('sales');
    
    console.log('Sales Statistics:');
    console.log(`- Total Records: ${stats.count}`);
    console.log(`- Average Sales: $${stats.mean.toFixed(2)}`);
    console.log(`- Min/Max: $${stats.min} / $${stats.max}`);
    console.log(`- Standard Deviation: ${stats.standardDeviation.toFixed(2)}\n`);

    // 2. Create visualizations
    console.log('=== Visualization Example ===');
    
    const chartConfig: ChartConfig = {
        type: 'line',
        series: [{
            name: 'Monthly Sales',
            data: salesData.data.map((point, index) => ({
                x: index,
                y: point.value,
                label: point.label
            }))
        }],
        options: {
            title: 'Sales Growth Trend',
            width: 800,
            height: 400,
            showLegend: true
        }
    };

    const chart = await analytics.createChart(chartConfig);
    console.log(`✅ Created chart (${chart.length} chars)`);
    console.log('Chart contains SVG visualization\n');

    // 3. Metrics monitoring
    console.log('=== Metrics Example ===');
    
    const metrics: Metric[] = [
        { name: 'conversion_rate', value: 3.2, unit: 'percent', timestamp: new Date(), type: 'gauge' },
        { name: 'page_views', value: 1250, unit: 'count', timestamp: new Date(), type: 'counter' },
        { name: 'response_time', value: 145, unit: 'ms', timestamp: new Date(), type: 'gauge' }
    ];

    metrics.forEach(metric => analytics.recordMetric(metric));
    
    const conversionHistory = analytics.getMetricHistory('conversion_rate');
    console.log(`✅ Recorded ${metrics.length} metrics`);
    console.log(`Conversion rate history: ${conversionHistory?.values.length} entries\n`);

    // 4. Dashboard creation
    console.log('=== Dashboard Example ===');
    
    const dashboard = await analytics.createDashboard({
        id: 'business-dashboard',
        name: 'Business Analytics Dashboard',
        columns: 12,
        widgets: [
            {
                id: 'sales-chart',
                type: 'chart',
                title: 'Sales Trend',
                position: { x: 0, y: 0, width: 8, height: 2 },
                config: { chartType: 'line' }
            },
            {
                id: 'conversion-metric',
                type: 'metric',
                title: 'Conversion Rate',
                position: { x: 8, y: 0, width: 4, height: 1 },
                config: { value: '3.2%', label: 'Conversion' }
            }
        ]
    });

    console.log(`✅ Created dashboard: ${dashboard}`);
    const dashboards = analytics.listDashboards();
    console.log(`Total dashboards: ${dashboards.length}\n`);

    // 5. Data export
    console.log('=== Export Example ===');
    
    const exportResult = await analytics.exportDataset('sales', {
        format: 'json',
        includeMetadata: true
    });

    console.log(`✅ Export completed: ${exportResult.filename}`);
    console.log(`Export size: ${exportResult.size} bytes`);
    console.log(`Format: ${exportResult.format}\n`);

    // 6. System status
    console.log('=== System Status ===');
    
    const status = analytics.getSystemStatus();
    console.log(`Datasets: ${status.datasets}`);
    console.log(`Uptime: ${status.uptime.toFixed(2)}s`);
    console.log(`Memory used: ${(status.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 Analytics example completed successfully!');
    
    // Cleanup
    await analytics.dispose();
}

// Real-world usage scenarios
async function realWorldScenarios() {
    console.log('\n📈 Real-World Analytics Scenarios\n');

    const analytics = PowerScriptAnalytics.getInstance();
    await analytics.initialize();

    // Scenario 1: E-commerce Analytics
    console.log('1. E-commerce Performance Analysis:');
    console.log('   - Track conversion rates, cart abandonment');
    console.log('   - Monitor product performance metrics');
    console.log('   - Analyze customer behavior patterns\n');

    // Scenario 2: Application Performance Monitoring
    console.log('2. Application Performance Monitoring:');
    console.log('   - Real-time response time tracking');
    console.log('   - Error rate monitoring and alerting');
    console.log('   - Resource usage optimization\n');

    // Scenario 3: Business Intelligence
    console.log('3. Business Intelligence Dashboards:');
    console.log('   - Executive summary dashboards');
    console.log('   - Revenue and growth analytics');
    console.log('   - Operational efficiency metrics\n');

    // Scenario 4: Data Science Workflows
    console.log('4. Data Science Integration:');
    console.log('   - Statistical analysis and modeling');
    console.log('   - Data preprocessing and cleaning');
    console.log('   - Visualization for insights discovery\n');
}

// Run examples
if (require.main === module) {
    analyticsExample()
        .then(() => realWorldScenarios())
        .catch(console.error);
}

export { analyticsExample, realWorldScenarios };