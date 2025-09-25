/**
 * PowerScript Analytics - Dashboard Example
 * Shows how to create interactive dashboards with widgets
 */

import { PowerScriptAnalytics } from '../src/analytics/PowerScriptAnalytics';
import { DashboardConfig, Widget } from '../src/analytics/types';

export async function dashboardExample() {
    console.log('📊 Dashboard Creation Example\n');

    const analytics = PowerScriptAnalytics.getInstance();
    await analytics.initialize();

    // Create a comprehensive business dashboard
    const businessDashboard: DashboardConfig = {
        id: 'exec-dashboard',
        name: 'Executive Dashboard',
        columns: 12,
        widgets: [
            // Revenue metrics (top row)
            {
                id: 'revenue-chart',
                type: 'chart',
                title: 'Monthly Revenue',
                position: { x: 0, y: 0, width: 6, height: 3 },
                config: { 
                    chartType: 'line',
                    dataSource: 'revenue-data',
                    refreshInterval: 300000 // 5 minutes
                }
            },
            {
                id: 'revenue-kpi',
                type: 'metric',
                title: 'Total Revenue',
                position: { x: 6, y: 0, width: 3, height: 1 },
                config: { 
                    value: '$1.2M',
                    label: 'This Quarter',
                    trend: '+12%'
                }
            },
            {
                id: 'growth-rate',
                type: 'metric',
                title: 'Growth Rate',
                position: { x: 9, y: 0, width: 3, height: 1 },
                config: { 
                    value: '15.3%',
                    label: 'YoY Growth',
                    trend: '+2.1%'
                }
            },

            // Performance metrics (second row)
            {
                id: 'conversion-funnel',
                type: 'chart',
                title: 'Conversion Funnel',
                position: { x: 0, y: 3, width: 4, height: 2 },
                config: { 
                    chartType: 'funnel',
                    stages: ['Visitors', 'Leads', 'Customers']
                }
            },
            {
                id: 'traffic-sources',
                type: 'chart',
                title: 'Traffic Sources',
                position: { x: 4, y: 3, width: 4, height: 2 },
                config: { 
                    chartType: 'pie',
                    showPercentages: true
                }
            },
            {
                id: 'active-users',
                type: 'metric',
                title: 'Active Users',
                position: { x: 8, y: 3, width: 2, height: 1 },
                config: { 
                    value: '2,847',
                    label: 'Online Now'
                }
            },
            {
                id: 'bounce-rate',
                type: 'metric',
                title: 'Bounce Rate',
                position: { x: 10, y: 3, width: 2, height: 1 },
                config: { 
                    value: '34.2%',
                    label: 'Last 7 Days',
                    trend: '-5.1%'
                }
            },

            // Operational metrics (third row)
            {
                id: 'response-time',
                type: 'chart',
                title: 'Response Time Trend',
                position: { x: 0, y: 5, width: 6, height: 2 },
                config: { 
                    chartType: 'area',
                    yAxisLabel: 'Response Time (ms)'
                }
            },
            {
                id: 'error-rate',
                type: 'metric',
                title: 'Error Rate',
                position: { x: 6, y: 5, width: 3, height: 1 },
                config: { 
                    value: '0.12%',
                    label: '24h Average',
                    trend: '-0.03%'
                }
            },
            {
                id: 'uptime',
                type: 'metric',
                title: 'System Uptime',
                position: { x: 9, y: 5, width: 3, height: 1 },
                config: { 
                    value: '99.97%',
                    label: 'This Month'
                }
            }
        ]
    };

    console.log('Creating executive dashboard...');
    const dashboard = await analytics.createDashboard(businessDashboard);
    console.log(`✅ Dashboard created: ${dashboard}\n`);

    // Create a technical monitoring dashboard
    const techDashboard: DashboardConfig = {
        id: 'tech-dashboard',
        name: 'Technical Monitoring',
        columns: 12,
        widgets: [
            {
                id: 'cpu-usage',
                type: 'chart',
                title: 'CPU Usage',
                position: { x: 0, y: 0, width: 4, height: 2 },
                config: { chartType: 'line', realTime: true }
            },
            {
                id: 'memory-usage',
                type: 'chart',
                title: 'Memory Usage',
                position: { x: 4, y: 0, width: 4, height: 2 },
                config: { chartType: 'line', realTime: true }
            },
            {
                id: 'disk-usage',
                type: 'metric',
                title: 'Disk Usage',
                position: { x: 8, y: 0, width: 4, height: 1 },
                config: { value: '67%', label: 'Storage Used' }
            }
        ]
    };

    console.log('Creating technical dashboard...');
    const techBoard = await analytics.createDashboard(techDashboard);
    console.log(`✅ Technical dashboard created: ${techBoard}\n`);

    // List all dashboards
    const dashboards = analytics.listDashboards();
    console.log(`Total dashboards: ${dashboards.length}`);
    dashboards.forEach((db, index) => {
        console.log(`${index + 1}. ${db}`);
    });

    console.log('\n🎉 Dashboard example completed!');
}

export async function widgetCustomizationExample() {
    console.log('\n🔧 Widget Customization Example\n');

    const analytics = PowerScriptAnalytics.getInstance();

    // Custom widget configurations
    const customWidgets: Widget[] = [
        // Advanced chart widget with multiple series
        {
            id: 'multi-series-chart',
            type: 'chart',
            title: 'Sales vs Marketing Spend',
            position: { x: 0, y: 0, width: 8, height: 3 },
            config: {
                chartType: 'line',
                series: [
                    { name: 'Sales Revenue', color: '#4CAF50' },
                    { name: 'Marketing Spend', color: '#FF5722' }
                ],
                yAxes: [
                    { position: 'left', label: 'Revenue ($)' },
                    { position: 'right', label: 'Spend ($)' }
                ]
            }
        },

        // Gauge metric with thresholds
        {
            id: 'performance-gauge',
            type: 'metric',
            title: 'Performance Score',
            position: { x: 8, y: 0, width: 4, height: 2 },
            config: {
                displayType: 'gauge',
                value: '87',
                unit: '/100',
                thresholds: [
                    { min: 0, max: 50, color: '#F44336' },   // Red
                    { min: 50, max: 80, color: '#FF9800' },  // Orange
                    { min: 80, max: 100, color: '#4CAF50' }  // Green
                ]
            }
        },

        // Table widget with custom formatting
        {
            id: 'top-products-table',
            type: 'table',
            title: 'Top Products',
            position: { x: 0, y: 3, width: 6, height: 3 },
            config: {
                columns: [
                    { key: 'product', label: 'Product', sortable: true },
                    { key: 'sales', label: 'Sales', format: 'currency' },
                    { key: 'growth', label: 'Growth', format: 'percentage' }
                ],
                pageSize: 10,
                sortBy: 'sales',
                sortOrder: 'desc'
            }
        },

        // Real-time alert widget
        {
            id: 'system-alerts',
            type: 'alerts',
            title: 'System Alerts',
            position: { x: 6, y: 3, width: 6, height: 2 },
            config: {
                maxAlerts: 5,
                autoRefresh: true,
                filters: ['critical', 'warning'],
                showTimestamp: true
            }
        }
    ];

    console.log('Custom widget configurations created:');
    customWidgets.forEach(widget => {
        console.log(`- ${widget.id}: ${widget.title} (${widget.type})`);
    });

    console.log('\n✅ Widget customization example completed!');
}

// Run examples
if (require.main === module) {
    dashboardExample()
        .then(() => widgetCustomizationExample())
        .catch(console.error);
}