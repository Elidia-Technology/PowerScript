/**
 * PowerScript Analytics - Chart Generation Example
 * Demonstrates various chart types and visualization options
 */

import { PowerScriptAnalytics } from '../src/analytics/PowerScriptAnalytics';

export async function chartExample() {
    console.log('📈 Chart Generation Example\n');

    const analytics = PowerScriptAnalytics.getInstance();
    await analytics.initialize();

    // Sample data for demonstrations
    const monthlyData = [
        { month: 'Jan', sales: 15000, expenses: 12000, profit: 3000 },
        { month: 'Feb', sales: 18500, expenses: 13500, profit: 5000 },
        { month: 'Mar', sales: 22000, expenses: 15000, profit: 7000 },
        { month: 'Apr', sales: 19500, expenses: 14000, profit: 5500 },
        { month: 'May', sales: 25000, expenses: 16000, profit: 9000 },
        { month: 'Jun', sales: 28000, expenses: 17500, profit: 10500 }
    ];

    // 1. Line Chart - Sales Trend
    console.log('1. Creating Line Chart (Sales Trend)...');
    const lineChart = await analytics.createChart({
        type: 'line',
        series: [{
            name: 'Monthly Sales',
            data: monthlyData.map((item, index) => ({
                x: index,
                y: item.sales,
                label: item.month
            }))
        }],
        options: {
            title: 'Sales Trend Over Time',
            width: 800,
            height: 400,
            showLegend: true,
            colors: ['#2196F3']
        }
    });
    console.log(`✅ Line chart generated (${lineChart.length} characters)\n`);

    // 2. Bar Chart - Monthly Comparison
    console.log('2. Creating Bar Chart (Monthly Comparison)...');
    const barChart = await analytics.createChart({
        type: 'bar',
        series: [
            {
                name: 'Sales',
                data: monthlyData.map((item, index) => ({
                    x: index,
                    y: item.sales,
                    label: item.month
                }))
            },
            {
                name: 'Expenses',
                data: monthlyData.map((item, index) => ({
                    x: index,
                    y: item.expenses,
                    label: item.month
                }))
            }
        ],
        options: {
            title: 'Sales vs Expenses',
            width: 800,
            height: 500,
            showLegend: true,
            colors: ['#4CAF50', '#FF5722']
        }
    });
    console.log(`✅ Bar chart generated (${barChart.length} characters)\n`);

    // 3. Pie Chart - Market Share
    console.log('3. Creating Pie Chart (Market Share)...');
    const pieChart = await analytics.createChart({
        type: 'pie',
        series: [{
            name: 'Market Share',
            data: [
                { x: 0, y: 35, label: 'Product A' },
                { x: 1, y: 28, label: 'Product B' },
                { x: 2, y: 22, label: 'Product C' },
                { x: 3, y: 15, label: 'Others' }
            ]
        }],
        options: {
            title: 'Product Market Share',
            width: 600,
            height: 600,
            showLegend: true,
            colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }
    });
    console.log(`✅ Pie chart generated (${pieChart.length} characters)\n`);

    // 4. Area Chart - Cumulative Growth
    console.log('4. Creating Area Chart (Cumulative Growth)...');
    const areaChart = await analytics.createChart({
        type: 'area',
        series: [{
            name: 'Cumulative Profit',
            data: monthlyData.map((item, index) => {
                const cumulative = monthlyData
                    .slice(0, index + 1)
                    .reduce((sum, month) => sum + month.profit, 0);
                return {
                    x: index,
                    y: cumulative,
                    label: item.month
                };
            })
        }],
        options: {
            title: 'Cumulative Profit Growth',
            width: 800,
            height: 400,
            showLegend: true,
            colors: ['#9C27B0']
        }
    });
    console.log(`✅ Area chart generated (${areaChart.length} characters)\n`);

    // 5. Multi-Series Chart - Complex Analysis
    console.log('5. Creating Multi-Series Chart...');
    const multiChart = await analytics.createChart({
        type: 'line',
        series: [
            {
                name: 'Sales',
                data: monthlyData.map((item, index) => ({
                    x: index,
                    y: item.sales,
                    label: item.month
                }))
            },
            {
                name: 'Profit',
                data: monthlyData.map((item, index) => ({
                    x: index,
                    y: item.profit,
                    label: item.month
                }))
            }
        ],
        options: {
            title: 'Business Performance Overview',
            width: 1000,
            height: 500,
            showLegend: true,
            colors: ['#2196F3', '#4CAF50']
        }
    });
    console.log(`✅ Multi-series chart generated (${multiChart.length} characters)\n`);

    console.log('🎯 Chart Statistics:');
    console.log(`- Total charts created: 5`);
    console.log(`- Chart types: line, bar, pie, area, multi-series`);
    console.log(`- Average size: ${Math.round((lineChart.length + barChart.length + pieChart.length + areaChart.length + multiChart.length) / 5)} characters`);

    console.log('\n🎉 Chart generation example completed!');
}

export async function realTimeChartsExample() {
    console.log('\n⚡ Real-Time Charts Example\n');

    const analytics = PowerScriptAnalytics.getInstance();

    // Simulate real-time data updates
    console.log('Simulating real-time data streams...');

    const realtimeData = {
        timestamp: Date.now(),
        metrics: {
            activeUsers: Math.floor(Math.random() * 1000) + 500,
            responseTime: Math.floor(Math.random() * 200) + 50,
            throughput: Math.floor(Math.random() * 1000) + 100,
            errorRate: Math.random() * 2
        }
    };

    console.log('Real-time metrics:');
    console.log(`- Active Users: ${realtimeData.metrics.activeUsers}`);
    console.log(`- Response Time: ${realtimeData.metrics.responseTime}ms`);
    console.log(`- Throughput: ${realtimeData.metrics.throughput} req/s`);
    console.log(`- Error Rate: ${realtimeData.metrics.errorRate.toFixed(2)}%`);

    // Create streaming chart configuration
    const streamingChart = {
        type: 'line' as const,
        series: [{
            name: 'Live Metrics',
            data: Array.from({ length: 20 }, (_, i) => ({
                x: i,
                y: Math.floor(Math.random() * 100) + 50,
                label: `T-${20-i}min`
            }))
        }],
        options: {
            title: 'Real-Time System Monitoring',
            width: 800,
            height: 300,
            showLegend: false,
            realTime: true,
            updateInterval: 5000 // 5 seconds
        }
    };

    console.log('\n✅ Real-time chart configuration ready');
    console.log('Chart would update every 5 seconds with live data');

    console.log('\n🔄 Real-time features available:');
    console.log('- Live data streaming');
    console.log('- Auto-refresh capabilities');
    console.log('- Dynamic scaling');
    console.log('- Performance monitoring');
    console.log('- Alert thresholds');

    console.log('\n⚡ Real-time charts example completed!');
}

// Advanced chart customization
export function chartCustomizationGuide() {
    console.log('\n🎨 Chart Customization Guide\n');

    console.log('Available Chart Types:');
    console.log('- line: Time series and trend analysis');
    console.log('- bar: Categorical comparisons');  
    console.log('- pie: Proportion and percentage data');
    console.log('- area: Cumulative values over time');
    console.log('- scatter: Correlation analysis');

    console.log('\nChart Options:');
    console.log('- title: Chart title');
    console.log('- width/height: Dimensions in pixels');
    console.log('- colors: Custom color palette');
    console.log('- showLegend: Enable/disable legend');
    console.log('- gridLines: Show/hide grid');
    console.log('- animations: Enable smooth transitions');

    console.log('\nSeries Configuration:');
    console.log('- name: Series identifier');
    console.log('- data: Array of {x, y, label} points');
    console.log('- color: Custom series color');
    console.log('- lineWidth: Line thickness (line charts)');
    console.log('- fillOpacity: Area opacity (area charts)');

    console.log('\n✨ Best Practices:');
    console.log('- Use appropriate chart types for data');
    console.log('- Maintain consistent color schemes');
    console.log('- Include clear titles and labels');
    console.log('- Optimize for target screen sizes');
    console.log('- Consider accessibility requirements');

    console.log('\n🎨 Customization guide completed!');
}

// Run examples
if (require.main === module) {
    chartExample()
        .then(() => realTimeChartsExample())
        .then(() => chartCustomizationGuide())
        .catch(console.error);
}