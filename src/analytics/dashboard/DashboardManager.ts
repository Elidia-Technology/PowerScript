/**
 * PowerScript Analytics - Dashboard Manager
 * Dashboard creation and management capabilities
 */

import { Logger } from '../../core/Logger';
import {
    DashboardLayout,
    Widget,
    ChartConfig
} from '../types';

/**
 * Dashboard manager for PowerScript Analytics
 */
export class DashboardManager {
    private logger: Logger;
    private dashboards: Map<string, DashboardLayout>;
    private initialized: boolean = false;

    constructor() {
        this.logger = new Logger();
        this.dashboards = new Map();
    }

    /**
     * Initialize the dashboard manager
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.logger.info('Initializing Dashboard Manager...');
        this.initialized = true;
        this.logger.info('Dashboard Manager initialized successfully');
    }

    /**
     * Create a new dashboard
     */
    public async createDashboard(layout: DashboardLayout): Promise<string> {
        this.validateLayout(layout);

        // Ensure unique ID
        if (this.dashboards.has(layout.id)) {
            layout.id = this.generateUniqueId(layout.id);
        }

        this.dashboards.set(layout.id, { ...layout });
        
        this.logger.info(`Dashboard '${layout.id}' created with ${layout.widgets.length} widgets`);
        return layout.id;
    }

    /**
     * Update an existing dashboard
     */
    public async updateDashboard(dashboardId: string, updates: Partial<DashboardLayout>): Promise<void> {
        const existing = this.dashboards.get(dashboardId);
        if (!existing) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        const updated = { ...existing, ...updates };
        this.validateLayout(updated);
        
        this.dashboards.set(dashboardId, updated);
        this.logger.info(`Dashboard '${dashboardId}' updated`);
    }

    /**
     * Get dashboard by ID
     */
    public getDashboard(dashboardId: string): DashboardLayout | undefined {
        return this.dashboards.get(dashboardId);
    }

    /**
     * Delete a dashboard
     */
    public deleteDashboard(dashboardId: string): boolean {
        const success = this.dashboards.delete(dashboardId);
        if (success) {
            this.logger.info(`Dashboard '${dashboardId}' deleted`);
        }
        return success;
    }

    /**
     * List all dashboards
     */
    public listDashboards(): DashboardLayout[] {
        return Array.from(this.dashboards.values());
    }

    /**
     * Add widget to dashboard
     */
    public addWidget(dashboardId: string, widget: Widget): void {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        // Ensure unique widget ID
        if (dashboard.widgets.some(w => w.id === widget.id)) {
            widget.id = this.generateUniqueId(widget.id);
        }

        dashboard.widgets.push(widget);
        this.logger.info(`Widget '${widget.id}' added to dashboard '${dashboardId}'`);
    }

    /**
     * Update widget in dashboard
     */
    public updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): void {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex === -1) {
            throw new Error(`Widget '${widgetId}' not found in dashboard '${dashboardId}'`);
        }

        dashboard.widgets[widgetIndex] = { ...dashboard.widgets[widgetIndex], ...updates };
        this.logger.info(`Widget '${widgetId}' updated in dashboard '${dashboardId}'`);
    }

    /**
     * Remove widget from dashboard
     */
    public removeWidget(dashboardId: string, widgetId: string): void {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex === -1) {
            throw new Error(`Widget '${widgetId}' not found in dashboard '${dashboardId}'`);
        }

        dashboard.widgets.splice(widgetIndex, 1);
        this.logger.info(`Widget '${widgetId}' removed from dashboard '${dashboardId}'`);
    }

    /**
     * Generate dashboard HTML
     */
    public generateDashboardHTML(dashboardId: string): string {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        return this.renderDashboardHTML(dashboard);
    }

    /**
     * Get dashboard statistics
     */
    public getDashboardStats(dashboardId: string): any {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        const widgetTypes = dashboard.widgets.reduce((acc, widget) => {
            acc[widget.type] = (acc[widget.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            id: dashboard.id,
            name: dashboard.name,
            widgetCount: dashboard.widgets.length,
            widgetTypes,
            columns: dashboard.columns,
            theme: dashboard.theme || 'light'
        };
    }

    /**
     * Clone dashboard
     */
    public cloneDashboard(dashboardId: string, newName?: string): string {
        const original = this.dashboards.get(dashboardId);
        if (!original) {
            throw new Error(`Dashboard '${dashboardId}' not found`);
        }

        const cloned: DashboardLayout = {
            ...original,
            id: this.generateUniqueId(original.id),
            name: newName || `${original.name} (Copy)`,
            widgets: original.widgets.map(widget => ({
                ...widget,
                id: this.generateUniqueId(widget.id)
            }))
        };

        this.dashboards.set(cloned.id, cloned);
        this.logger.info(`Dashboard '${dashboardId}' cloned as '${cloned.id}'`);
        
        return cloned.id;
    }

    /**
     * Create dashboard template
     */
    public createTemplate(name: string, type: 'analytics' | 'monitoring' | 'business' | 'custom'): DashboardLayout {
        const template: DashboardLayout = {
            id: this.generateUniqueId(`${type}-dashboard`),
            name,
            description: `${type.charAt(0).toUpperCase() + type.slice(1)} dashboard template`,
            columns: 12,
            rowHeight: 100,
            margin: 10,
            theme: 'light',
            widgets: []
        };

        switch (type) {
            case 'analytics':
                template.widgets = this.createAnalyticsWidgets();
                break;
            case 'monitoring':
                template.widgets = this.createMonitoringWidgets();
                break;
            case 'business':
                template.widgets = this.createBusinessWidgets();
                break;
            default:
                // Empty template for custom dashboards
                break;
        }

        return template;
    }

    /**
     * Reset the dashboard manager
     */
    public async reset(): Promise<void> {
        this.logger.info('Resetting Dashboard Manager...');
        this.dashboards.clear();
        this.initialized = false;
    }

    // === Private Methods ===

    private validateLayout(layout: DashboardLayout): void {
        if (!layout.id || !layout.name) {
            throw new Error('Dashboard must have an ID and name');
        }

        if (!layout.columns || layout.columns <= 0) {
            throw new Error('Dashboard must have a positive number of columns');
        }

        if (!layout.widgets) {
            layout.widgets = [];
        }

        // Validate widgets
        layout.widgets.forEach(widget => this.validateWidget(widget));
    }

    private validateWidget(widget: Widget): void {
        if (!widget.id || !widget.type) {
            throw new Error('Widget must have an ID and type');
        }

        if (!widget.position || 
            widget.position.x < 0 || 
            widget.position.y < 0 || 
            widget.position.width <= 0 || 
            widget.position.height <= 0) {
            throw new Error('Widget must have a valid position');
        }
    }

    private generateUniqueId(baseId: string): string {
        let counter = 1;
        let uniqueId = baseId;

        while (this.dashboards.has(uniqueId)) {
            uniqueId = `${baseId}-${counter}`;
            counter++;
        }

        return uniqueId;
    }

    private renderDashboardHTML(dashboard: DashboardLayout): string {
        const theme = dashboard.theme || 'light';
        const styles = this.getDashboardStyles(theme);
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${dashboard.name} - PowerScript Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${styles}</style>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1>${dashboard.name}</h1>
            ${dashboard.description ? `<p class="description">${dashboard.description}</p>` : ''}
        </header>
        
        <main class="dashboard-grid" style="
            display: grid;
            grid-template-columns: repeat(${dashboard.columns}, 1fr);
            gap: ${dashboard.margin || 10}px;
            padding: 20px;
        ">
            ${dashboard.widgets.map(widget => this.renderWidget(widget)).join('')}
        </main>
    </div>
    
    <script>
        ${this.getDashboardScript()}
    </script>
</body>
</html>`;
    }

    private renderWidget(widget: Widget): string {
        const style = `
            grid-column: span ${widget.position.width};
            grid-row: span ${widget.position.height};
        `;

        let content = '';
        switch (widget.type) {
            case 'chart':
                content = this.renderChartWidget(widget);
                break;
            case 'metric':
                content = this.renderMetricWidget(widget);
                break;
            case 'table':
                content = this.renderTableWidget(widget);
                break;
            case 'text':
                content = this.renderTextWidget(widget);
                break;
            default:
                content = `<p>Unknown widget type: ${widget.type}</p>`;
        }

        return `
            <div class="widget" style="${style}" data-widget-id="${widget.id}">
                ${widget.title ? `<div class="widget-header">${widget.title}</div>` : ''}
                <div class="widget-content">
                    ${content}
                </div>
            </div>
        `;
    }

    private renderChartWidget(widget: Widget): string {
        // This would integrate with the ChartBuilder
        return `<div class="chart-placeholder">Chart: ${widget.title || 'Unnamed'}</div>`;
    }

    private renderMetricWidget(widget: Widget): string {
        const config = widget.config || {};
        return `
            <div class="metric-widget">
                <div class="metric-value">${config.value || '0'}</div>
                <div class="metric-label">${config.label || 'Metric'}</div>
                <div class="metric-unit">${config.unit || ''}</div>
            </div>
        `;
    }

    private renderTableWidget(widget: Widget): string {
        const config = widget.config || {};
        const data = config.data || [];
        const columns = config.columns || [];

        if (data.length === 0) {
            return '<p>No data available</p>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map((col: any) => `<th>${col.title || col.key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(0, 10).map((row: any) => `
                        <tr>
                            ${columns.map((col: any) => `<td>${row[col.key] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    private renderTextWidget(widget: Widget): string {
        const config = widget.config || {};
        return `<div class="text-content">${config.content || 'Text widget'}</div>`;
    }

    private getDashboardStyles(theme: string): string {
        const isDark = theme === 'dark';
        
        return `
            * { box-sizing: border-box; }
            
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: ${isDark ? '#1a1a1a' : '#f5f5f5'};
                color: ${isDark ? '#ffffff' : '#333333'};
            }
            
            .dashboard-container {
                min-height: 100vh;
            }
            
            .dashboard-header {
                background: ${isDark ? '#2d2d2d' : '#ffffff'};
                padding: 20px;
                border-bottom: 1px solid ${isDark ? '#404040' : '#e0e0e0'};
            }
            
            .dashboard-header h1 {
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 600;
            }
            
            .description {
                margin: 0;
                color: ${isDark ? '#b0b0b0' : '#666666'};
            }
            
            .widget {
                background: ${isDark ? '#2d2d2d' : '#ffffff'};
                border: 1px solid ${isDark ? '#404040' : '#e0e0e0'};
                border-radius: 8px;
                overflow: hidden;
                transition: box-shadow 0.2s ease;
            }
            
            .widget:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, ${isDark ? '0.3' : '0.1'});
            }
            
            .widget-header {
                padding: 15px 20px 10px;
                font-weight: 600;
                font-size: 16px;
                border-bottom: 1px solid ${isDark ? '#404040' : '#f0f0f0'};
            }
            
            .widget-content {
                padding: 20px;
            }
            
            .metric-widget {
                text-align: center;
            }
            
            .metric-value {
                font-size: 36px;
                font-weight: bold;
                color: ${isDark ? '#4fc3f7' : '#2196f3'};
                margin-bottom: 10px;
            }
            
            .metric-label {
                font-size: 14px;
                color: ${isDark ? '#b0b0b0' : '#666666'};
                margin-bottom: 5px;
            }
            
            .metric-unit {
                font-size: 12px;
                color: ${isDark ? '#888888' : '#999999'};
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .data-table th,
            .data-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid ${isDark ? '#404040' : '#e0e0e0'};
            }
            
            .data-table th {
                font-weight: 600;
                background-color: ${isDark ? '#3a3a3a' : '#f8f9fa'};
            }
            
            .chart-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                background-color: ${isDark ? '#1a1a1a' : '#f8f9fa'};
                border: 2px dashed ${isDark ? '#404040' : '#d0d0d0'};
                border-radius: 4px;
                color: ${isDark ? '#888888' : '#666666'};
            }
            
            .text-content {
                line-height: 1.6;
            }
        `;
    }

    private getDashboardScript(): string {
        return `
            console.log('PowerScript Dashboard loaded at:', new Date().toISOString());
            
            // Auto-refresh functionality
            function refreshDashboard() {
                console.log('Dashboard refresh triggered');
                // In a real implementation, this would update widget data
            }
            
            // Set up auto-refresh if specified
            const refreshInterval = 30000; // 30 seconds
            if (refreshInterval > 0) {
                setInterval(refreshDashboard, refreshInterval);
            }
        `;
    }

    private createAnalyticsWidgets(): Widget[] {
        return [
            {
                id: 'total-records',
                type: 'metric',
                title: 'Total Records',
                position: { x: 0, y: 0, width: 3, height: 1 },
                config: { value: '1,234', label: 'Total Records', unit: 'records' }
            },
            {
                id: 'avg-value',
                type: 'metric',
                title: 'Average Value',
                position: { x: 3, y: 0, width: 3, height: 1 },
                config: { value: '85.6', label: 'Average Value', unit: '%' }
            },
            {
                id: 'trend-chart',
                type: 'chart',
                title: 'Trend Analysis',
                position: { x: 0, y: 1, width: 8, height: 2 },
                config: { chartType: 'line' }
            }
        ];
    }

    private createMonitoringWidgets(): Widget[] {
        return [
            {
                id: 'cpu-usage',
                type: 'metric',
                title: 'CPU Usage',
                position: { x: 0, y: 0, width: 3, height: 1 },
                config: { value: '45', label: 'CPU Usage', unit: '%' }
            },
            {
                id: 'memory-usage',
                type: 'metric',
                title: 'Memory Usage',
                position: { x: 3, y: 0, width: 3, height: 1 },
                config: { value: '68', label: 'Memory Usage', unit: '%' }
            },
            {
                id: 'performance-chart',
                type: 'chart',
                title: 'Performance Metrics',
                position: { x: 0, y: 1, width: 8, height: 2 },
                config: { chartType: 'area' }
            }
        ];
    }

    private createBusinessWidgets(): Widget[] {
        return [
            {
                id: 'revenue',
                type: 'metric',
                title: 'Revenue',
                position: { x: 0, y: 0, width: 3, height: 1 },
                config: { value: '$125K', label: 'Monthly Revenue', unit: 'USD' }
            },
            {
                id: 'growth',
                type: 'metric',
                title: 'Growth Rate',
                position: { x: 3, y: 0, width: 3, height: 1 },
                config: { value: '+12.5', label: 'Growth Rate', unit: '%' }
            },
            {
                id: 'sales-chart',
                type: 'chart',
                title: 'Sales Performance',
                position: { x: 0, y: 1, width: 8, height: 2 },
                config: { chartType: 'bar' }
            }
        ];
    }
}