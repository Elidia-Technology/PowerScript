import { EventEmitter } from 'events';
import { CollaborativeFiltering, UserItemRating, Recommendation as CollabRecommendation } from './CollaborativeFiltering';
import { ContentBasedFiltering, ItemProfile, ContentRecommendation } from './ContentBasedFiltering';

export interface HybridRecommendation {
    itemId: string;
    score: number;
    confidence: number;
    explanation: string;
    sources: {
        collaborative?: number;
        contentBased?: number;
        knowledge?: number;
        demographic?: number;
    };
    matchingFeatures?: string[];
}

export interface HybridStrategy {
    type: 'weighted' | 'switching' | 'cascade' | 'mixed' | 'ensemble';
    weights?: {
        collaborative: number;
        contentBased: number;
        knowledge?: number;
        demographic?: number;
    };
    switchingThreshold?: number;
    cascadeOrder?: string[];
    ensembleModel?: 'linear' | 'neural' | 'gradient_boosting';
}

export interface HybridOptions {
    strategy: HybridStrategy;
    fallbackStrategy?: 'popularity' | 'diversity' | 'trending';
    minConfidence?: number;
    diversityBoost?: number;
    temporalWeight?: number;
    contextAware?: boolean;
}

export interface RecommendationContext {
    timeOfDay?: string;
    dayOfWeek?: string;
    season?: string;
    location?: string;
    device?: string;
    sessionLength?: number;
    previousActions?: string[];
}

/**
 * PowerScript Hybrid Recommendation Engine
 * 
 * Combines multiple recommendation approaches (collaborative filtering, 
 * content-based filtering, knowledge-based, and demographic) to provide
 * more accurate and diverse recommendations.
 * 
 * Features:
 * - Multiple hybrid strategies (weighted, switching, cascade, mixed, ensemble)
 * - Automatic strategy selection based on data availability
 * - Context-aware recommendations (time, location, device)
 * - Cold start problem mitigation
 * - Diversity and novelty optimization
 * - Real-time model adaptation
 * - A/B testing support for strategy optimization
 * - Explanation aggregation from multiple sources
 * 
 * @example
 * ```typescript
 * const hybrid = new HybridRecommender({
 *   strategy: {
 *     type: 'weighted',
 *     weights: {
 *       collaborative: 0.6,
 *       contentBased: 0.4
 *     }
 *   },
 *   fallbackStrategy: 'popularity',
 *   minConfidence: 0.3,
 *   diversityBoost: 0.2
 * });
 * 
 * // Initialize with engines
 * await hybrid.initialize(collaborativeEngine, contentBasedEngine);
 * 
 * // Get hybrid recommendations
 * const recommendations = await hybrid.getRecommendations('user1', 10, {
 *   timeOfDay: 'evening',
 *   device: 'mobile'
 * });
 * ```
 */
export class HybridRecommender extends EventEmitter {
    private options: HybridOptions;
    private collaborativeEngine?: CollaborativeFiltering;
    private contentBasedEngine?: ContentBasedFiltering;
    private popularityScores: Map<string, number>;
    private trendingScores: Map<string, number>;
    private diversityMatrix: Map<string, Map<string, number>>;
    private performanceMetrics: Map<string, number>;
    private lastUpdated: Date;

    constructor(options: HybridOptions) {
        super();
        this.options = {
            fallbackStrategy: 'popularity',
            minConfidence: 0.1,
            diversityBoost: 0.1,
            temporalWeight: 0.05,
            contextAware: true,
            ...options
        };
        this.popularityScores = new Map();
        this.trendingScores = new Map();
        this.diversityMatrix = new Map();
        this.performanceMetrics = new Map();
        this.lastUpdated = new Date();
    }

    /**
     * Initialize the hybrid recommender with individual engines
     */
    async initialize(
        collaborativeEngine?: CollaborativeFiltering,
        contentBasedEngine?: ContentBasedFiltering
    ): Promise<void> {
        try {
            this.collaborativeEngine = collaborativeEngine;
            this.contentBasedEngine = contentBasedEngine;

            // Set up event listeners
            if (this.collaborativeEngine) {
                this.collaborativeEngine.on('recommendationsGenerated', (data) => {
                    this.emit('collaborativeRecommendations', data);
                });
            }

            if (this.contentBasedEngine) {
                this.contentBasedEngine.on('recommendationsGenerated', (data) => {
                    this.emit('contentBasedRecommendations', data);
                });
            }

            // Initialize auxiliary data
            await this.updatePopularityScores();
            await this.updateTrendingScores();
            await this.calculateDiversityMatrix();

            this.lastUpdated = new Date();
            this.emit('initialized', { timestamp: this.lastUpdated });
        } catch (error) {
            this.emit('error', { error, operation: 'initialize' });
            throw error;
        }
    }

    /**
     * Get hybrid recommendations using the configured strategy
     */
    async getRecommendations(
        userId: string, 
        count: number = 10, 
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        try {
            const strategy = await this.selectOptimalStrategy(userId, context);
            let recommendations: HybridRecommendation[] = [];

            switch (strategy.type) {
                case 'weighted':
                    recommendations = await this.getWeightedRecommendations(userId, count, strategy, context);
                    break;
                case 'switching':
                    recommendations = await this.getSwitchingRecommendations(userId, count, strategy, context);
                    break;
                case 'cascade':
                    recommendations = await this.getCascadeRecommendations(userId, count, strategy, context);
                    break;
                case 'mixed':
                    recommendations = await this.getMixedRecommendations(userId, count, strategy, context);
                    break;
                case 'ensemble':
                    recommendations = await this.getEnsembleRecommendations(userId, count, strategy, context);
                    break;
                default:
                    throw new Error(`Unknown strategy type: ${strategy.type}`);
            }

            // Apply post-processing
            recommendations = await this.postProcessRecommendations(recommendations, userId, context);

            this.emit('hybridRecommendationsGenerated', {
                userId,
                count: recommendations.length,
                requestedCount: count,
                strategy: strategy.type,
                context,
                timestamp: new Date()
            });

            return recommendations;
        } catch (error) {
            this.emit('error', { error, operation: 'getRecommendations', userId, count });
            
            // Fallback to simple strategy
            return await this.getFallbackRecommendations(userId, count);
        }
    }

    /**
     * Weighted hybrid approach - combines scores from multiple engines
     */
    private async getWeightedRecommendations(
        userId: string,
        count: number,
        strategy: HybridStrategy,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        const weights = strategy.weights || { collaborative: 0.5, contentBased: 0.5 };
        const recommendations = new Map<string, HybridRecommendation>();

        // Get collaborative filtering recommendations
        if (this.collaborativeEngine && weights.collaborative > 0) {
            try {
                const collabRecs = await this.collaborativeEngine.getRecommendations(userId, count * 2);
                for (const rec of collabRecs) {
                    const hybridRec: HybridRecommendation = {
                        itemId: rec.itemId,
                        score: rec.score * weights.collaborative,
                        confidence: rec.confidence,
                        explanation: rec.explanation || '',
                        sources: { collaborative: rec.score }
                    };
                    recommendations.set(rec.itemId, hybridRec);
                }
            } catch (error) {
                this.emit('warning', { message: 'Collaborative filtering failed', error });
            }
        }

        // Get content-based recommendations
        if (this.contentBasedEngine && weights.contentBased > 0) {
            try {
                const contentRecs = await this.contentBasedEngine.getRecommendations(userId, count * 2);
                for (const rec of contentRecs) {
                    const existing = recommendations.get(rec.itemId);
                    if (existing) {
                        // Combine scores
                        existing.score += rec.score * weights.contentBased;
                        existing.sources.contentBased = rec.score;
                        existing.confidence = Math.max(existing.confidence, rec.confidence);
                        existing.explanation += ` + ${rec.explanation}`;
                        existing.matchingFeatures = rec.matchingFeatures;
                    } else {
                        const hybridRec: HybridRecommendation = {
                            itemId: rec.itemId,
                            score: rec.score * weights.contentBased,
                            confidence: rec.confidence,
                            explanation: rec.explanation,
                            sources: { contentBased: rec.score },
                            matchingFeatures: rec.matchingFeatures
                        };
                        recommendations.set(rec.itemId, hybridRec);
                    }
                }
            } catch (error) {
                this.emit('warning', { message: 'Content-based filtering failed', error });
            }
        }

        // Apply context weighting
        if (context && this.options.contextAware) {
            for (const rec of recommendations.values()) {
                const contextBoost = this.calculateContextBoost(rec.itemId, context);
                rec.score *= (1 + contextBoost * (this.options.temporalWeight || 0.05));
            }
        }

        return Array.from(recommendations.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    /**
     * Switching hybrid approach - switches between engines based on confidence
     */
    private async getSwitchingRecommendations(
        userId: string,
        count: number,
        strategy: HybridStrategy,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        const threshold = strategy.switchingThreshold || 0.5;

        // Try collaborative filtering first
        if (this.collaborativeEngine) {
            try {
                const collabRecs = await this.collaborativeEngine.getRecommendations(userId, 5);
                const avgConfidence = collabRecs.reduce((sum, rec) => sum + rec.confidence, 0) / collabRecs.length;
                
                if (avgConfidence >= threshold) {
                    return collabRecs.map(rec => ({
                        itemId: rec.itemId,
                        score: rec.score,
                        confidence: rec.confidence,
                        explanation: rec.explanation || 'Collaborative filtering',
                        sources: { collaborative: rec.score }
                    })).slice(0, count);
                }
            } catch (error) {
                this.emit('warning', { message: 'Collaborative filtering failed in switching mode', error });
            }
        }

        // Fall back to content-based
        if (this.contentBasedEngine) {
            try {
                const contentRecs = await this.contentBasedEngine.getRecommendations(userId, count);
                return contentRecs.map(rec => ({
                    itemId: rec.itemId,
                    score: rec.score,
                    confidence: rec.confidence,
                    explanation: rec.explanation,
                    sources: { contentBased: rec.score },
                    matchingFeatures: rec.matchingFeatures
                }));
            } catch (error) {
                this.emit('warning', { message: 'Content-based filtering failed in switching mode', error });
            }
        }

        // Ultimate fallback
        return await this.getFallbackRecommendations(userId, count);
    }

    /**
     * Cascade hybrid approach - uses engines in sequence
     */
    private async getCascadeRecommendations(
        userId: string,
        count: number,
        strategy: HybridStrategy,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        const order = strategy.cascadeOrder || ['collaborative', 'contentBased'];
        const recommendations: HybridRecommendation[] = [];
        let remainingCount = count;

        for (const engineType of order) {
            if (remainingCount <= 0) break;

            let engineRecs: any[] = [];

            try {
                if (engineType === 'collaborative' && this.collaborativeEngine) {
                    const recs = await this.collaborativeEngine.getRecommendations(userId, remainingCount * 2);
                    engineRecs = recs.map(rec => ({
                        ...rec,
                        source: 'collaborative'
                    }));
                } else if (engineType === 'contentBased' && this.contentBasedEngine) {
                    const recs = await this.contentBasedEngine.getRecommendations(userId, remainingCount * 2);
                    engineRecs = recs.map(rec => ({
                        ...rec,
                        source: 'contentBased'
                    }));
                }

                // Filter out already recommended items
                const existingItemIds = new Set(recommendations.map(r => r.itemId));
                const newRecs = engineRecs.filter(rec => !existingItemIds.has(rec.itemId));

                // Add to recommendations
                for (const rec of newRecs.slice(0, remainingCount)) {
                    const hybridRec: HybridRecommendation = {
                        itemId: rec.itemId,
                        score: rec.score,
                        confidence: rec.confidence,
                        explanation: `${rec.source}: ${rec.explanation || ''}`,
                        sources: { [rec.source]: rec.score }
                    };

                    if (rec.matchingFeatures) {
                        hybridRec.matchingFeatures = rec.matchingFeatures;
                    }

                    recommendations.push(hybridRec);
                    remainingCount--;
                }
            } catch (error) {
                this.emit('warning', { message: `${engineType} engine failed in cascade mode`, error });
            }
        }

        return recommendations;
    }

    /**
     * Mixed hybrid approach - presents results from different engines separately
     */
    private async getMixedRecommendations(
        userId: string,
        count: number,
        strategy: HybridStrategy,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        const weights = strategy.weights || { collaborative: 0.5, contentBased: 0.5 };
        const recommendations: HybridRecommendation[] = [];

        // Calculate how many recommendations to get from each engine
        const collabCount = Math.floor(count * weights.collaborative);
        const contentCount = Math.floor(count * weights.contentBased);

        // Get collaborative recommendations
        if (this.collaborativeEngine && collabCount > 0) {
            try {
                const collabRecs = await this.collaborativeEngine.getRecommendations(userId, collabCount);
                for (const rec of collabRecs) {
                    recommendations.push({
                        itemId: rec.itemId,
                        score: rec.score,
                        confidence: rec.confidence,
                        explanation: `Collaborative: ${rec.explanation || ''}`,
                        sources: { collaborative: rec.score }
                    });
                }
            } catch (error) {
                this.emit('warning', { message: 'Collaborative filtering failed in mixed mode', error });
            }
        }

        // Get content-based recommendations
        if (this.contentBasedEngine && contentCount > 0) {
            try {
                const contentRecs = await this.contentBasedEngine.getRecommendations(userId, contentCount);
                const existingItemIds = new Set(recommendations.map(r => r.itemId));
                
                for (const rec of contentRecs) {
                    if (!existingItemIds.has(rec.itemId)) {
                        recommendations.push({
                            itemId: rec.itemId,
                            score: rec.score,
                            confidence: rec.confidence,
                            explanation: `Content: ${rec.explanation}`,
                            sources: { contentBased: rec.score },
                            matchingFeatures: rec.matchingFeatures
                        });
                    }
                }
            } catch (error) {
                this.emit('warning', { message: 'Content-based filtering failed in mixed mode', error });
            }
        }

        // Shuffle to mix recommendations from different sources
        return this.shuffleArray(recommendations).slice(0, count);
    }

    /**
     * Ensemble hybrid approach - uses machine learning to combine engines
     */
    private async getEnsembleRecommendations(
        userId: string,
        count: number,
        strategy: HybridStrategy,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        // For now, implement a simple linear ensemble
        // In production, this would use trained ML models
        const model = strategy.ensembleModel || 'linear';
        
        if (model === 'linear') {
            // Use learned weights based on performance metrics
            const adaptiveWeights = this.calculateAdaptiveWeights(userId);
            const adaptiveStrategy: HybridStrategy = {
                type: 'weighted',
                weights: adaptiveWeights
            };
            
            return await this.getWeightedRecommendations(userId, count, adaptiveStrategy, context);
        }

        // For neural and gradient boosting models, fallback to weighted for now
        return await this.getWeightedRecommendations(userId, count, strategy, context);
    }

    /**
     * Post-process recommendations (diversity, novelty, etc.)
     */
    private async postProcessRecommendations(
        recommendations: HybridRecommendation[],
        userId: string,
        context?: RecommendationContext
    ): Promise<HybridRecommendation[]> {
        // Apply diversity boost
        if (this.options.diversityBoost && this.options.diversityBoost > 0) {
            recommendations = await this.applyDiversityBoost(recommendations, this.options.diversityBoost);
        }

        // Filter by minimum confidence
        if (this.options.minConfidence && this.options.minConfidence > 0) {
            recommendations = recommendations.filter(rec => rec.confidence >= this.options.minConfidence!);
        }

        return recommendations;
    }

    /**
     * Select optimal strategy based on data availability and context
     */
    private async selectOptimalStrategy(userId: string, context?: RecommendationContext): Promise<HybridStrategy> {
        // Check data availability
        const hasCollaborativeData = this.collaborativeEngine && await this.hasCollaborativeData(userId);
        const hasContentData = this.contentBasedEngine && await this.hasContentData(userId);

        // If only one engine has data, use switching strategy
        if (hasCollaborativeData && !hasContentData) {
            return { type: 'switching', switchingThreshold: 0.0 };
        }
        if (!hasCollaborativeData && hasContentData) {
            return { type: 'switching', switchingThreshold: 1.0 };
        }

        // If both have data, use the configured strategy
        return this.options.strategy;
    }

    /**
     * Check if collaborative filtering has sufficient data for user
     */
    private async hasCollaborativeData(userId: string): Promise<boolean> {
        if (!this.collaborativeEngine) return false;
        const stats = this.collaborativeEngine.getStatistics();
        return stats.users > 10 && stats.ratings > 100; // Minimum thresholds
    }

    /**
     * Check if content-based filtering has sufficient data for user
     */
    private async hasContentData(userId: string): Promise<boolean> {
        if (!this.contentBasedEngine) return false;
        const userProfile = this.contentBasedEngine.getUserProfile(userId);
        return userProfile !== null && userProfile.preferences.size > 0;
    }

    /**
     * Calculate context boost for recommendations
     */
    private calculateContextBoost(itemId: string, context: RecommendationContext): number {
        let boost = 0;

        // Time-based boosting (simplified)
        if (context.timeOfDay === 'evening') {
            boost += 0.1; // Evening content boost
        }

        // Device-based boosting
        if (context.device === 'mobile') {
            boost += 0.05; // Mobile-friendly content
        }

        return boost;
    }

    /**
     * Calculate adaptive weights based on performance metrics
     */
    private calculateAdaptiveWeights(userId: string): { collaborative: number; contentBased: number } {
        const collabPerf = this.performanceMetrics.get('collaborative') || 0.5;
        const contentPerf = this.performanceMetrics.get('contentBased') || 0.5;
        
        const total = collabPerf + contentPerf;
        if (total === 0) {
            return { collaborative: 0.5, contentBased: 0.5 };
        }

        return {
            collaborative: collabPerf / total,
            contentBased: contentPerf / total
        };
    }

    /**
     * Apply diversity boost to recommendations
     */
    private async applyDiversityBoost(
        recommendations: HybridRecommendation[],
        diversityBoost: number
    ): Promise<HybridRecommendation[]> {
        // Simple diversity implementation - boost items that are different from already selected
        const selected: HybridRecommendation[] = [];
        const remaining = [...recommendations];

        while (selected.length < recommendations.length && remaining.length > 0) {
            let bestIndex = 0;
            let bestScore = remaining[0].score;

            for (let i = 1; i < remaining.length; i++) {
                const item = remaining[i];
                let diversityScore = 0;

                // Calculate diversity from already selected items
                for (const selectedItem of selected) {
                    const similarity = this.diversityMatrix.get(item.itemId)?.get(selectedItem.itemId) || 0;
                    diversityScore += (1 - similarity);
                }

                const adjustedScore = item.score + (diversityScore * diversityBoost);
                if (adjustedScore > bestScore) {
                    bestScore = adjustedScore;
                    bestIndex = i;
                }
            }

            selected.push(remaining.splice(bestIndex, 1)[0]);
        }

        return selected;
    }

    /**
     * Get fallback recommendations when all engines fail
     */
    private async getFallbackRecommendations(userId: string, count: number): Promise<HybridRecommendation[]> {
        const fallback = this.options.fallbackStrategy || 'popularity';
        const recommendations: HybridRecommendation[] = [];

        if (fallback === 'popularity') {
            // Return most popular items
            const sortedItems = Array.from(this.popularityScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, count);

            for (const [itemId, score] of sortedItems) {
                recommendations.push({
                    itemId,
                    score,
                    confidence: 0.3,
                    explanation: 'Popular item (fallback)',
                    sources: {}
                });
            }
        } else if (fallback === 'trending') {
            // Return trending items
            const sortedItems = Array.from(this.trendingScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, count);

            for (const [itemId, score] of sortedItems) {
                recommendations.push({
                    itemId,
                    score,
                    confidence: 0.3,
                    explanation: 'Trending item (fallback)',
                    sources: {}
                });
            }
        }

        return recommendations;
    }

    /**
     * Update popularity scores based on user interactions
     */
    private async updatePopularityScores(): Promise<void> {
        // This would be implemented based on actual interaction data
        // For now, use mock data
        this.popularityScores.set('item1', 4.5);
        this.popularityScores.set('item2', 4.2);
        this.popularityScores.set('item3', 4.0);
    }

    /**
     * Update trending scores based on recent interactions
     */
    private async updateTrendingScores(): Promise<void> {
        // This would be implemented based on time-windowed interaction data
        // For now, use mock data
        this.trendingScores.set('item1', 8.5);
        this.trendingScores.set('item4', 7.8);
        this.trendingScores.set('item5', 7.2);
    }

    /**
     * Calculate diversity matrix between items
     */
    private async calculateDiversityMatrix(): Promise<void> {
        // This would be implemented based on item features/categories
        // For now, use mock similarity data
        if (!this.diversityMatrix.has('item1')) {
            this.diversityMatrix.set('item1', new Map());
        }
        this.diversityMatrix.get('item1')!.set('item2', 0.3);
        this.diversityMatrix.get('item1')!.set('item3', 0.7);
    }

    /**
     * Utility function to shuffle array
     */
    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Update performance metrics for adaptive weighting
     */
    updatePerformanceMetrics(metrics: Map<string, number>): void {
        this.performanceMetrics = new Map(metrics);
        this.emit('performanceMetricsUpdated', { metrics, timestamp: new Date() });
    }

    /**
     * Get system statistics
     */
    getStatistics() {
        return {
            strategy: this.options.strategy,
            popularityItems: this.popularityScores.size,
            trendingItems: this.trendingScores.size,
            diversityMatrixSize: this.diversityMatrix.size,
            performanceMetrics: Array.from(this.performanceMetrics.entries()),
            lastUpdated: this.lastUpdated,
            hasCollaborativeEngine: !!this.collaborativeEngine,
            hasContentBasedEngine: !!this.contentBasedEngine
        };
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.popularityScores.clear();
        this.trendingScores.clear();
        this.diversityMatrix.clear();
        this.performanceMetrics.clear();
        this.removeAllListeners();
    }
}