"use strict";
/**
 * PowerScript Analytics - Chart Builder
 * Chart creation and visualization capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartBuilder = void 0;
const Logger_1 = require("../../core/Logger");
/**
 * Chart builder for PowerScript Analytics visualization
 */
class ChartBuilder {
    constructor() {
        this.initialized = false;
        this.canvasSupported = false;
        this.logger = new Logger_1.Logger();
        this.checkCanvasSupport();
    }
    /**
     * Initialize the chart builder
     */
    async initialize() {
        if (this.initialized)
            return;
        this.logger.info('Initializing Chart Builder...');
        this.initialized = true;
        this.logger.info('Chart Builder initialized successfully');
    }
    /**
     * Create a chart from configuration
     */
    async createChart(config) {
        this.validateConfig(config);
        const svg = this.generateSVGChart(config);
        this.logger.info(`Created ${config.type} chart with ${config.series.length} series`);
        return svg;
    }
    /**
     * Create multiple charts
     */
    async createMultiChart(configs) {
        const results = [];
        for (const config of configs) {
            const chart = await this.createChart(config);
            results.push(chart);
        }
        return results;
    }
    /**
     * Export chart to different formats
     */
    async exportChart(config, format) {
        const svg = await this.createChart(config);
        switch (format) {
            case 'svg':
                return Buffer.from(svg, 'utf-8');
            case 'html':
                const html = this.wrapInHTML(svg, config);
                return Buffer.from(html, 'utf-8');
            case 'json':
                const json = JSON.stringify(config, null, 2);
                return Buffer.from(json, 'utf-8');
            default:
                throw new Error(`Export format '${format}' not supported for charts`);
        }
    }
    /**
     * Get supported chart types
     */
    getSupportedChartTypes() {
        return ['line', 'bar', 'scatter', 'pie', 'histogram', 'area'];
    }
    /**
     * Reset the chart builder
     */
    async reset() {
        this.logger.info('Resetting Chart Builder...');
        this.initialized = false;
    }
    // === Private Methods ===
    checkCanvasSupport() {
        // Check if we're in a Node.js environment that supports canvas
        try {
            // In a real implementation, you'd check for node-canvas or similar
            this.canvasSupported = typeof window !== 'undefined' || process.versions?.node !== undefined;
        }
        catch {
            this.canvasSupported = false;
        }
    }
    validateConfig(config) {
        if (!config || !config.type || !config.series) {
            throw new Error('Invalid chart configuration');
        }
        if (config.series.length === 0) {
            throw new Error('Chart must have at least one series');
        }
        const supportedTypes = this.getSupportedChartTypes();
        if (!supportedTypes.includes(config.type)) {
            throw new Error(`Chart type '${config.type}' not supported`);
        }
    }
    generateSVGChart(config) {
        const width = config.options?.width || 800;
        const height = config.options?.height || 600;
        const margin = { top: 50, right: 50, bottom: 100, left: 100 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        // Add background
        if (config.options?.backgroundColor) {
            svg += `<rect width="100%" height="100%" fill="${config.options.backgroundColor}"/>`;
        }
        // Add title
        if (config.options?.title) {
            svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold">${config.options.title}</text>`;
        }
        // Create chart group
        svg += `<g transform="translate(${margin.left},${margin.top})">`;
        // Add grid if enabled
        if (config.options?.showGrid !== false) {
            svg += this.generateGrid(chartWidth, chartHeight);
        }
        // Generate chart based on type
        switch (config.type) {
            case 'line':
                svg += this.generateLineChart(config.series, chartWidth, chartHeight);
                break;
            case 'bar':
                svg += this.generateBarChart(config.series, chartWidth, chartHeight);
                break;
            case 'scatter':
                svg += this.generateScatterChart(config.series, chartWidth, chartHeight);
                break;
            case 'pie':
                svg += this.generatePieChart(config.series, chartWidth, chartHeight);
                break;
            case 'area':
                svg += this.generateAreaChart(config.series, chartWidth, chartHeight);
                break;
            case 'histogram':
                svg += this.generateHistogram(config.series, chartWidth, chartHeight);
                break;
            default:
                throw new Error(`Chart type '${config.type}' not implemented`);
        }
        // Add axes
        svg += this.generateAxes(config, chartWidth, chartHeight);
        // Add legend if enabled
        if (config.options?.showLegend !== false && config.series.length > 1) {
            svg += this.generateLegend(config.series, width, height, margin);
        }
        svg += '</g>';
        svg += '</svg>';
        return svg;
    }
    generateGrid(width, height) {
        let grid = '';
        const gridColor = '#e0e0e0';
        const gridStrokeWidth = 0.5;
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = (width * i) / 10;
            grid += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${gridColor}" stroke-width="${gridStrokeWidth}"/>`;
        }
        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = (height * i) / 10;
            grid += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${gridColor}" stroke-width="${gridStrokeWidth}"/>`;
        }
        return grid;
    }
    generateLineChart(series, width, height) {
        let chart = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        series.forEach((s, seriesIndex) => {
            if (s.data.length === 0)
                return;
            const color = s.color || colors[seriesIndex % colors.length];
            const strokeWidth = s.lineWidth || 2;
            // Calculate scales
            const xValues = s.data.map(d => Number(d.x));
            const yValues = s.data.map(d => Number(d.y));
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const yMin = Math.min(...yValues);
            const yMax = Math.max(...yValues);
            // Generate path
            let path = 'M';
            s.data.forEach((point, index) => {
                const x = ((Number(point.x) - xMin) / (xMax - xMin)) * width;
                const y = height - ((Number(point.y) - yMin) / (yMax - yMin)) * height;
                path += index === 0 ? `${x},${y}` : ` L${x},${y}`;
            });
            chart += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
            // Add markers if specified
            const markerSize = s.markerSize || 3;
            if (markerSize > 0) {
                s.data.forEach(point => {
                    const x = ((Number(point.x) - xMin) / (xMax - xMin)) * width;
                    const y = height - ((Number(point.y) - yMin) / (yMax - yMin)) * height;
                    chart += `<circle cx="${x}" cy="${y}" r="${markerSize}" fill="${color}"/>`;
                });
            }
        });
        return chart;
    }
    generateBarChart(series, width, height) {
        let chart = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        if (series.length === 0)
            return chart;
        const firstSeries = series[0];
        const barCount = firstSeries.data.length;
        const seriesCount = series.length;
        const barGroupWidth = width / barCount;
        const barWidth = barGroupWidth / seriesCount * 0.8;
        const barSpacing = barGroupWidth * 0.1;
        // Calculate y scale
        const allYValues = series.flatMap(s => s.data.map(d => Number(d.y)));
        const yMin = Math.min(0, ...allYValues);
        const yMax = Math.max(...allYValues);
        series.forEach((s, seriesIndex) => {
            const color = s.color || colors[seriesIndex % colors.length];
            s.data.forEach((point, dataIndex) => {
                const barHeight = Math.abs(Number(point.y) - yMin) / (yMax - yMin) * height;
                const x = dataIndex * barGroupWidth + seriesIndex * barWidth + barSpacing;
                const y = height - barHeight;
                chart += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
            });
        });
        return chart;
    }
    generateScatterChart(series, width, height) {
        let chart = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        series.forEach((s, seriesIndex) => {
            if (s.data.length === 0)
                return;
            const color = s.color || colors[seriesIndex % colors.length];
            const markerSize = s.markerSize || 4;
            // Calculate scales
            const xValues = s.data.map(d => Number(d.x));
            const yValues = s.data.map(d => Number(d.y));
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const yMin = Math.min(...yValues);
            const yMax = Math.max(...yValues);
            s.data.forEach(point => {
                const x = ((Number(point.x) - xMin) / (xMax - xMin)) * width;
                const y = height - ((Number(point.y) - yMin) / (yMax - yMin)) * height;
                chart += `<circle cx="${x}" cy="${y}" r="${markerSize}" fill="${color}" opacity="0.7"/>`;
            });
        });
        return chart;
    }
    generatePieChart(series, width, height) {
        let chart = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        if (series.length === 0)
            return chart;
        const data = series[0].data;
        const total = data.reduce((sum, point) => sum + Number(point.y), 0);
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 * 0.8;
        let currentAngle = 0;
        data.forEach((point, index) => {
            const value = Number(point.y);
            const sliceAngle = (value / total) * 2 * Math.PI;
            const color = colors[index % colors.length];
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + sliceAngle);
            const y2 = centerY + radius * Math.sin(currentAngle + sliceAngle);
            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
            const path = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            chart += `<path d="${path}" fill="${color}" stroke="white" stroke-width="2"/>`;
            currentAngle += sliceAngle;
        });
        return chart;
    }
    generateAreaChart(series, width, height) {
        let chart = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        series.forEach((s, seriesIndex) => {
            if (s.data.length === 0)
                return;
            const color = s.color || colors[seriesIndex % colors.length];
            // Calculate scales
            const xValues = s.data.map(d => Number(d.x));
            const yValues = s.data.map(d => Number(d.y));
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const yMin = Math.min(0, ...yValues);
            const yMax = Math.max(...yValues);
            // Generate area path
            let path = 'M';
            s.data.forEach((point, index) => {
                const x = ((Number(point.x) - xMin) / (xMax - xMin)) * width;
                const y = height - ((Number(point.y) - yMin) / (yMax - yMin)) * height;
                path += index === 0 ? `${x},${y}` : ` L${x},${y}`;
            });
            // Close the area to the bottom
            const lastX = ((Number(s.data[s.data.length - 1].x) - xMin) / (xMax - xMin)) * width;
            const firstX = ((Number(s.data[0].x) - xMin) / (xMax - xMin)) * width;
            path += ` L${lastX},${height} L${firstX},${height} Z`;
            chart += `<path d="${path}" fill="${color}" opacity="0.6" stroke="${color}" stroke-width="2"/>`;
        });
        return chart;
    }
    generateHistogram(series, width, height) {
        // Simplified histogram implementation
        return this.generateBarChart(series, width, height);
    }
    generateAxes(config, width, height) {
        let axes = '';
        // X-axis
        axes += `<line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="black" stroke-width="2"/>`;
        // Y-axis
        axes += `<line x1="0" y1="0" x2="0" y2="${height}" stroke="black" stroke-width="2"/>`;
        // X-axis labels
        if (config.xAxis?.label) {
            axes += `<text x="${width / 2}" y="${height + 40}" text-anchor="middle" font-size="14">${config.xAxis.label}</text>`;
        }
        // Y-axis labels
        if (config.yAxis?.label) {
            axes += `<text x="-40" y="${height / 2}" text-anchor="middle" font-size="14" transform="rotate(-90, -40, ${height / 2})">${config.yAxis.label}</text>`;
        }
        return axes;
    }
    generateLegend(series, width, height, margin) {
        let legend = '';
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const legendX = width - margin.right + 20;
        const legendY = margin.top;
        series.forEach((s, index) => {
            const color = s.color || colors[index % colors.length];
            const y = legendY + index * 25;
            legend += `<rect x="${legendX}" y="${y}" width="15" height="15" fill="${color}"/>`;
            legend += `<text x="${legendX + 20}" y="${y + 12}" font-size="12">${s.name}</text>`;
        });
        return legend;
    }
    wrapInHTML(svg, config) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${config.options?.title || 'PowerScript Chart'}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .chart-container { 
            background-color: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        ${svg}
    </div>
    <script>
        console.log('PowerScript Chart generated at:', new Date().toISOString());
    </script>
</body>
</html>`;
    }
}
exports.ChartBuilder = ChartBuilder;
