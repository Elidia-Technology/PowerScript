"use strict";
/**
 * PowerScript Analytics - Analysis Engine
 * Statistical analysis and data processing capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisEngine = void 0;
const Logger_1 = require("../../core/Logger");
/**
 * Statistical analysis engine for PowerScript Analytics
 */
class AnalysisEngine {
    constructor(config) {
        this.initialized = false;
        this.logger = new Logger_1.Logger();
        this.config = this.mergeConfig(config);
    }
    /**
     * Initialize the analysis engine
     */
    async initialize() {
        if (this.initialized)
            return;
        this.logger.info('Initializing Analysis Engine...');
        this.initialized = true;
        this.logger.info('Analysis Engine initialized successfully');
    }
    /**
     * Calculate comprehensive statistics for a dataset
     */
    async calculateStatistics(dataset) {
        this.validateDataset(dataset);
        const values = dataset.data.map(point => point.value);
        const sortedValues = [...values].sort((a, b) => a - b);
        const n = values.length;
        if (n === 0) {
            throw new Error('Cannot calculate statistics for empty dataset');
        }
        // Basic statistics
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / n;
        const min = sortedValues[0];
        const max = sortedValues[n - 1];
        const range = max - min;
        // Median calculation
        const median = n % 2 === 0
            ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
            : sortedValues[Math.floor(n / 2)];
        // Mode calculation (most frequent values)
        const frequency = new Map();
        values.forEach(val => {
            frequency.set(val, (frequency.get(val) || 0) + 1);
        });
        const maxFreq = Math.max(...frequency.values());
        const mode = Array.from(frequency.entries())
            .filter(([_, freq]) => freq === maxFreq)
            .map(([val, _]) => val);
        // Variance and standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
        const standardDeviation = Math.sqrt(variance);
        // Percentiles
        const percentiles = {};
        [5, 10, 25, 50, 75, 90, 95, 99].forEach(p => {
            percentiles[p] = this.calculatePercentile(sortedValues, p);
        });
        const summary = {
            count: n,
            sum,
            mean,
            median,
            mode,
            min,
            max,
            range,
            variance,
            standardDeviation,
            percentiles
        };
        this.logger.info(`Statistics calculated for dataset with ${n} points`);
        return summary;
    }
    /**
     * Calculate correlation between two datasets
     */
    async calculateCorrelation(dataset1, dataset2, method = 'pearson') {
        this.validateDataset(dataset1);
        this.validateDataset(dataset2);
        const values1 = dataset1.data.map(point => point.value);
        const values2 = dataset2.data.map(point => point.value);
        if (values1.length !== values2.length) {
            throw new Error('Datasets must have the same length for correlation calculation');
        }
        if (method === 'pearson') {
            return this.calculatePearsonCorrelation(values1, values2);
        }
        else {
            return this.calculateSpearmanCorrelation(values1, values2);
        }
    }
    /**
     * Calculate correlation matrix for multiple datasets
     */
    async calculateCorrelationMatrix(datasets, method = 'pearson') {
        if (datasets.length < 2) {
            throw new Error('At least 2 datasets required for correlation matrix');
        }
        const variables = datasets.map(ds => ds.name);
        const n = datasets.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        // Calculate correlation for each pair
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0; // Perfect correlation with itself
                }
                else if (i < j) {
                    const correlation = await this.calculateCorrelation(datasets[i], datasets[j], method);
                    matrix[i][j] = correlation;
                    matrix[j][i] = correlation; // Symmetric matrix
                }
            }
        }
        return {
            variables,
            matrix,
            method
        };
    }
    /**
     * Perform linear regression analysis
     */
    async performRegression(xDataset, yDataset) {
        this.validateDataset(xDataset);
        this.validateDataset(yDataset);
        const xValues = xDataset.data.map(point => point.value);
        const yValues = yDataset.data.map(point => point.value);
        if (xValues.length !== yValues.length) {
            throw new Error('Datasets must have the same length for regression');
        }
        const n = xValues.length;
        if (n < 2) {
            throw new Error('At least 2 data points required for regression');
        }
        // Calculate means
        const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
        const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
        // Calculate slope and intercept
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            const xDiff = xValues[i] - xMean;
            const yDiff = yValues[i] - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }
        if (denominator === 0) {
            throw new Error('Cannot perform regression: x values have no variance');
        }
        const slope = numerator / denominator;
        const intercept = yMean - slope * xMean;
        // Calculate R-squared
        let totalSumSquares = 0;
        let residualSumSquares = 0;
        for (let i = 0; i < n; i++) {
            const predicted = slope * xValues[i] + intercept;
            const yDiff = yValues[i] - yMean;
            const residual = yValues[i] - predicted;
            totalSumSquares += yDiff * yDiff;
            residualSumSquares += residual * residual;
        }
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);
        // Generate predictions
        const predictions = xValues.map(x => slope * x + intercept);
        // Calculate standard errors (simplified)
        const mse = residualSumSquares / (n - 2);
        const sxx = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
        const slopeStandardError = Math.sqrt(mse / sxx);
        const interceptStandardError = Math.sqrt(mse * (1 / n + (xMean * xMean) / sxx));
        // Calculate p-values (simplified t-test)
        const df = n - 2;
        const tSlope = slope / slopeStandardError;
        const tIntercept = intercept / interceptStandardError;
        const result = {
            coefficients: [slope],
            intercept,
            rSquared,
            adjustedRSquared,
            pValues: [this.calculatePValue(Math.abs(tSlope), df), this.calculatePValue(Math.abs(tIntercept), df)],
            standardErrors: [slopeStandardError, interceptStandardError],
            predictions
        };
        this.logger.info(`Regression analysis completed: R² = ${rSquared.toFixed(4)}`);
        return result;
    }
    /**
     * Perform time series analysis
     */
    async analyzeTimeSeries(dataset) {
        this.validateDataset(dataset);
        const data = dataset.data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const values = data.map(point => point.value);
        const n = values.length;
        if (n < 4) {
            throw new Error('At least 4 data points required for time series analysis');
        }
        // Calculate trend using linear regression on time
        const timeValues = data.map((point, index) => index);
        const timeDataset = {
            name: 'time',
            data: timeValues.map(t => ({ timestamp: new Date(), value: t })),
            type: 'numerical'
        };
        const trendResult = await this.performRegression(timeDataset, dataset);
        // Simple seasonality detection (simplified)
        const seasonality = this.detectSeasonality(values);
        // Calculate moving average
        const windowSize = Math.min(Math.floor(n / 4), 12);
        const movingAverage = this.calculateMovingAverage(values, windowSize);
        // Forecast next values (simple linear extrapolation)
        const forecastHorizon = Math.min(Math.floor(n * 0.2), 10);
        const forecast = [];
        for (let i = 0; i < forecastHorizon; i++) {
            const nextTime = n + i;
            const predicted = trendResult.coefficients[0] * nextTime + trendResult.intercept;
            forecast.push(predicted);
        }
        return {
            trend: {
                slope: trendResult.coefficients[0],
                rSquared: trendResult.rSquared,
                direction: trendResult.coefficients[0] > 0 ? 'increasing' : 'decreasing'
            },
            seasonality,
            movingAverage,
            forecast,
            statistics: await this.calculateStatistics(dataset)
        };
    }
    /**
     * Detect outliers using IQR method
     */
    detectOutliers(dataset) {
        this.validateDataset(dataset);
        const values = dataset.data.map(point => point.value);
        const sortedValues = [...values].sort((a, b) => a - b);
        const n = sortedValues.length;
        const q1 = this.calculatePercentile(sortedValues, 25);
        const q3 = this.calculatePercentile(sortedValues, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = dataset.data.filter(point => point.value < lowerBound || point.value > upperBound);
        this.logger.info(`Detected ${outliers.length} outliers out of ${n} data points`);
        return outliers;
    }
    /**
     * Normalize dataset values
     */
    normalizeDataset(dataset, method = 'minmax') {
        this.validateDataset(dataset);
        const values = dataset.data.map(point => point.value);
        let normalizedValues;
        if (method === 'minmax') {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            if (range === 0) {
                normalizedValues = values.map(() => 0);
            }
            else {
                normalizedValues = values.map(val => (val - min) / range);
            }
        }
        else { // zscore
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            if (stdDev === 0) {
                normalizedValues = values.map(() => 0);
            }
            else {
                normalizedValues = values.map(val => (val - mean) / stdDev);
            }
        }
        const normalizedDataset = {
            ...dataset,
            name: `${dataset.name}_normalized_${method}`,
            data: dataset.data.map((point, index) => ({
                ...point,
                value: normalizedValues[index]
            }))
        };
        return normalizedDataset;
    }
    /**
     * Reset the analysis engine
     */
    async reset() {
        this.logger.info('Resetting Analysis Engine...');
        this.initialized = false;
    }
    // === Private Helper Methods ===
    mergeConfig(userConfig) {
        const defaultConfig = {
            samplingRate: 1.0,
            windowSize: 100,
            aggregationInterval: '1m',
            retentionPeriod: '30d',
            enableRealTime: true,
            enableHistorical: true
        };
        return { ...defaultConfig, ...userConfig };
    }
    validateDataset(dataset) {
        if (!dataset || !dataset.data || dataset.data.length === 0) {
            throw new Error('Dataset is empty or invalid');
        }
        // Check for valid numeric values
        const hasInvalidValues = dataset.data.some(point => point.value === null || point.value === undefined || isNaN(point.value));
        if (hasInvalidValues) {
            throw new Error('Dataset contains invalid numeric values');
        }
    }
    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        if (lower === upper) {
            return sortedValues[lower];
        }
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    calculateSpearmanCorrelation(x, y) {
        // Convert to ranks
        const xRanks = this.getRanks(x);
        const yRanks = this.getRanks(y);
        // Calculate Pearson correlation on ranks
        return this.calculatePearsonCorrelation(xRanks, yRanks);
    }
    getRanks(values) {
        const indexed = values.map((val, index) => ({ value: val, index }));
        indexed.sort((a, b) => a.value - b.value);
        const ranks = new Array(values.length);
        for (let i = 0; i < indexed.length; i++) {
            ranks[indexed[i].index] = i + 1;
        }
        return ranks;
    }
    calculatePValue(tStat, df) {
        // Simplified p-value calculation (approximation)
        // In production, would use a proper statistical library
        if (df <= 0)
            return 1;
        if (Math.abs(tStat) > 4)
            return 0.0001;
        if (Math.abs(tStat) > 3)
            return 0.001;
        if (Math.abs(tStat) > 2)
            return 0.05;
        return 0.1;
    }
    detectSeasonality(values) {
        // Simplified seasonality detection
        const n = values.length;
        if (n < 12)
            return { detected: false };
        // Check for common seasonal patterns
        const periods = [7, 12, 24, 30]; // weekly, monthly, daily (hourly), monthly (daily)
        let bestPeriod = 0;
        let bestCorrelation = 0;
        for (const period of periods) {
            if (n > 2 * period) {
                const correlation = this.calculateSeasonalCorrelation(values, period);
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestPeriod = period;
                }
            }
        }
        return {
            detected: bestCorrelation > 0.3,
            period: bestPeriod,
            strength: bestCorrelation
        };
    }
    calculateSeasonalCorrelation(values, period) {
        const n = values.length;
        if (n < 2 * period)
            return 0;
        let correlation = 0;
        let count = 0;
        for (let i = period; i < n; i++) {
            const current = values[i];
            const seasonal = values[i - period];
            correlation += current * seasonal;
            count++;
        }
        return count > 0 ? correlation / count : 0;
    }
    calculateMovingAverage(values, windowSize) {
        const result = [];
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
            const window = values.slice(start, end);
            const average = window.reduce((sum, val) => sum + val, 0) / window.length;
            result.push(average);
        }
        return result;
    }
}
exports.AnalysisEngine = AnalysisEngine;
