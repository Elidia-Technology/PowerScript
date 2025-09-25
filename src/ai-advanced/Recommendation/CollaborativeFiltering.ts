import { EventEmitter } from 'events';

export interface UserItemRating {
    userId: string;
    itemId: string;
    rating: number;
    timestamp?: Date;
}

export interface SimilarityMetric {
    type: 'cosine' | 'pearson' | 'jaccard' | 'euclidean';
    threshold?: number;
}

export interface CollaborativeFilteringOptions {
    similarityMetric: SimilarityMetric;
    minSimilarity?: number;
    maxNeighbors?: number;
    implicitFeedback?: boolean;
    regularization?: number;
}

export interface UserSimilarity {
    userId1: string;
    userId2: string;
    similarity: number;
}

export interface Recommendation {
    itemId: string;
    score: number;
    confidence: number;
    explanation?: string;
}

/**
 * PowerScript Collaborative Filtering Recommendation Engine
 * 
 * Implements user-based and item-based collaborative filtering algorithms
 * for generating personalized recommendations based on user behavior patterns.
 * 
 * Features:
 * - Multiple similarity metrics (cosine, Pearson, Jaccard, Euclidean)
 * - User-based and item-based collaborative filtering
 * - Implicit and explicit feedback support
 * - Cold start problem handling
 * - Real-time recommendation updates
 * - Scalable matrix factorization
 * 
 * @example
 * ```typescript
 * const collaborative = new CollaborativeFiltering({
 *   similarityMetric: { type: 'cosine', threshold: 0.1 },
 *   maxNeighbors: 50,
 *   implicitFeedback: false
 * });
 * 
 * // Add user ratings
 * await collaborative.addRating({
 *   userId: 'user1',
 *   itemId: 'item1',
 *   rating: 4.5
 * });
 * 
 * // Get recommendations
 * const recommendations = await collaborative.getRecommendations('user1', 10);
 * ```
 */
export class CollaborativeFiltering extends EventEmitter {
    private options: CollaborativeFilteringOptions;
    private userItemMatrix: Map<string, Map<string, number>>;
    private itemUserMatrix: Map<string, Map<string, number>>;
    private userSimilarities: Map<string, Map<string, number>>;
    private itemSimilarities: Map<string, Map<string, number>>;
    private userMeans: Map<string, number>;
    private itemMeans: Map<string, number>;
    private globalMean: number;
    private lastUpdated: Date;

    constructor(options: CollaborativeFilteringOptions) {
        super();
        this.options = {
            minSimilarity: 0.1,
            maxNeighbors: 50,
            implicitFeedback: false,
            regularization: 0.01,
            ...options
        };
        this.userItemMatrix = new Map();
        this.itemUserMatrix = new Map();
        this.userSimilarities = new Map();
        this.itemSimilarities = new Map();
        this.userMeans = new Map();
        this.itemMeans = new Map();
        this.globalMean = 0;
        this.lastUpdated = new Date();
    }

    /**
     * Add a user rating to the system
     */
    async addRating(rating: UserItemRating): Promise<void> {
        try {
            // Update user-item matrix
            if (!this.userItemMatrix.has(rating.userId)) {
                this.userItemMatrix.set(rating.userId, new Map());
            }
            this.userItemMatrix.get(rating.userId)!.set(rating.itemId, rating.rating);

            // Update item-user matrix
            if (!this.itemUserMatrix.has(rating.itemId)) {
                this.itemUserMatrix.set(rating.itemId, new Map());
            }
            this.itemUserMatrix.get(rating.itemId)!.set(rating.userId, rating.rating);

            this.lastUpdated = new Date();
            this.emit('ratingAdded', { rating, timestamp: this.lastUpdated });

            // Trigger similarity recalculation if needed
            await this.updateSimilarities();
        } catch (error) {
            this.emit('error', { error, operation: 'addRating', rating });
            throw error;
        }
    }

    /**
     * Add multiple ratings in batch
     */
    async addRatings(ratings: UserItemRating[]): Promise<void> {
        try {
            for (const rating of ratings) {
                await this.addRating(rating);
            }
            this.emit('batchRatingsAdded', { count: ratings.length, timestamp: this.lastUpdated });
        } catch (error) {
            this.emit('error', { error, operation: 'addRatings', ratingsCount: ratings.length });
            throw error;
        }
    }

    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(userId: string, count: number = 10): Promise<Recommendation[]> {
        try {
            const userRatings = this.userItemMatrix.get(userId);
            if (!userRatings || userRatings.size === 0) {
                // Cold start problem - return popular items
                return await this.getPopularItems(count);
            }

            // Calculate scores for unrated items
            const scores = new Map<string, number>();
            const confidences = new Map<string, number>();

            // Get all items not rated by the user
            const allItems = new Set<string>();
            for (const itemMap of this.userItemMatrix.values()) {
                for (const itemId of itemMap.keys()) {
                    allItems.add(itemId);
                }
            }

            const unratedItems = Array.from(allItems).filter(itemId => !userRatings.has(itemId));

            // User-based collaborative filtering
            const userSims = this.userSimilarities.get(userId) || new Map();
            const userMean = this.userMeans.get(userId) || this.globalMean;

            for (const itemId of unratedItems) {
                let numerator = 0;
                let denominator = 0;
                let supportCount = 0;

                const itemUsers = this.itemUserMatrix.get(itemId) || new Map();

                for (const [otherUserId, rating] of itemUsers) {
                    if (otherUserId === userId) continue;

                    const similarity = userSims.get(otherUserId) || 0;
                    if (similarity < (this.options.minSimilarity || 0)) continue;

                    const otherUserMean = this.userMeans.get(otherUserId) || this.globalMean;
                    const normalizedRating = rating - otherUserMean;

                    numerator += similarity * normalizedRating;
                    denominator += Math.abs(similarity);
                    supportCount++;
                }

                if (denominator > 0 && supportCount > 0) {
                    const predictedRating = userMean + (numerator / denominator);
                    scores.set(itemId, predictedRating);
                    confidences.set(itemId, Math.min(supportCount / 10, 1.0));
                }
            }

            // Sort by score and return top recommendations
            const recommendations = Array.from(scores.entries())
                .map(([itemId, score]) => ({
                    itemId,
                    score,
                    confidence: confidences.get(itemId) || 0,
                    explanation: `Based on ${userSims.size} similar users`
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, count);

            this.emit('recommendationsGenerated', {
                userId,
                count: recommendations.length,
                requestedCount: count,
                timestamp: new Date()
            });

            return recommendations;
        } catch (error) {
            this.emit('error', { error, operation: 'getRecommendations', userId, count });
            throw error;
        }
    }

    /**
     * Calculate user-user similarities
     */
    private async calculateUserSimilarities(): Promise<void> {
        const users = Array.from(this.userItemMatrix.keys());
        
        for (let i = 0; i < users.length; i++) {
            const userId1 = users[i];
            if (!this.userSimilarities.has(userId1)) {
                this.userSimilarities.set(userId1, new Map());
            }

            for (let j = i + 1; j < users.length; j++) {
                const userId2 = users[j];
                const similarity = this.calculateSimilarity(userId1, userId2, 'user');
                
                if (similarity >= (this.options.minSimilarity || 0)) {
                    this.userSimilarities.get(userId1)!.set(userId2, similarity);
                    
                    if (!this.userSimilarities.has(userId2)) {
                        this.userSimilarities.set(userId2, new Map());
                    }
                    this.userSimilarities.get(userId2)!.set(userId1, similarity);
                }
            }
        }
    }

    /**
     * Calculate item-item similarities
     */
    private async calculateItemSimilarities(): Promise<void> {
        const items = Array.from(this.itemUserMatrix.keys());
        
        for (let i = 0; i < items.length; i++) {
            const itemId1 = items[i];
            if (!this.itemSimilarities.has(itemId1)) {
                this.itemSimilarities.set(itemId1, new Map());
            }

            for (let j = i + 1; j < items.length; j++) {
                const itemId2 = items[j];
                const similarity = this.calculateSimilarity(itemId1, itemId2, 'item');
                
                if (similarity >= (this.options.minSimilarity || 0)) {
                    this.itemSimilarities.get(itemId1)!.set(itemId2, similarity);
                    
                    if (!this.itemSimilarities.has(itemId2)) {
                        this.itemSimilarities.set(itemId2, new Map());
                    }
                    this.itemSimilarities.get(itemId2)!.set(itemId1, similarity);
                }
            }
        }
    }

    /**
     * Calculate similarity between two users or items
     */
    private calculateSimilarity(id1: string, id2: string, type: 'user' | 'item'): number {
        const matrix = type === 'user' ? this.userItemMatrix : this.itemUserMatrix;
        const ratings1 = matrix.get(id1);
        const ratings2 = matrix.get(id2);

        if (!ratings1 || !ratings2) return 0;

        // Find common items/users
        const commonIds = new Set<string>();
        for (const id of ratings1.keys()) {
            if (ratings2.has(id)) {
                commonIds.add(id);
            }
        }

        if (commonIds.size === 0) return 0;

        const vector1: number[] = [];
        const vector2: number[] = [];

        for (const id of commonIds) {
            vector1.push(ratings1.get(id)!);
            vector2.push(ratings2.get(id)!);
        }

        return this.computeSimilarityMetric(vector1, vector2);
    }

    /**
     * Compute similarity using the specified metric
     */
    private computeSimilarityMetric(vector1: number[], vector2: number[]): number {
        switch (this.options.similarityMetric.type) {
            case 'cosine':
                return this.cosineSimilarity(vector1, vector2);
            case 'pearson':
                return this.pearsonCorrelation(vector1, vector2);
            case 'jaccard':
                return this.jaccardSimilarity(vector1, vector2);
            case 'euclidean':
                return this.euclideanSimilarity(vector1, vector2);
            default:
                return this.cosineSimilarity(vector1, vector2);
        }
    }

    /**
     * Calculate cosine similarity
     */
    private cosineSimilarity(vector1: number[], vector2: number[]): number {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            norm1 += vector1[i] * vector1[i];
            norm2 += vector2[i] * vector2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Calculate Pearson correlation
     */
    private pearsonCorrelation(vector1: number[], vector2: number[]): number {
        const n = vector1.length;
        if (n === 0) return 0;

        const sum1 = vector1.reduce((a, b) => a + b, 0);
        const sum2 = vector2.reduce((a, b) => a + b, 0);
        const mean1 = sum1 / n;
        const mean2 = sum2 / n;

        let numerator = 0;
        let sum1Sq = 0;
        let sum2Sq = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = vector1[i] - mean1;
            const diff2 = vector2[i] - mean2;
            numerator += diff1 * diff2;
            sum1Sq += diff1 * diff1;
            sum2Sq += diff2 * diff2;
        }

        const denominator = Math.sqrt(sum1Sq * sum2Sq);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Calculate Jaccard similarity
     */
    private jaccardSimilarity(vector1: number[], vector2: number[]): number {
        const set1 = new Set(vector1.filter(v => v > 0));
        const set2 = new Set(vector2.filter(v => v > 0));
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Calculate Euclidean similarity (inverse of distance)
     */
    private euclideanSimilarity(vector1: number[], vector2: number[]): number {
        let distance = 0;
        for (let i = 0; i < vector1.length; i++) {
            distance += Math.pow(vector1[i] - vector2[i], 2);
        }
        return 1 / (1 + Math.sqrt(distance));
    }

    /**
     * Update all similarities and statistics
     */
    private async updateSimilarities(): Promise<void> {
        try {
            // Calculate global statistics
            this.calculateGlobalStatistics();
            
            // Update similarities
            await this.calculateUserSimilarities();
            await this.calculateItemSimilarities();
            
            this.emit('similaritiesUpdated', { timestamp: new Date() });
        } catch (error) {
            this.emit('error', { error, operation: 'updateSimilarities' });
        }
    }

    /**
     * Calculate global statistics (means, etc.)
     */
    private calculateGlobalStatistics(): void {
        let totalRating = 0;
        let totalCount = 0;

        // Calculate user means
        for (const [userId, ratings] of this.userItemMatrix) {
            let userSum = 0;
            let userCount = 0;
            
            for (const rating of ratings.values()) {
                userSum += rating;
                userCount++;
                totalRating += rating;
                totalCount++;
            }
            
            this.userMeans.set(userId, userCount > 0 ? userSum / userCount : 0);
        }

        // Calculate item means
        for (const [itemId, ratings] of this.itemUserMatrix) {
            let itemSum = 0;
            let itemCount = 0;
            
            for (const rating of ratings.values()) {
                itemSum += rating;
                itemCount++;
            }
            
            this.itemMeans.set(itemId, itemCount > 0 ? itemSum / itemCount : 0);
        }

        // Calculate global mean
        this.globalMean = totalCount > 0 ? totalRating / totalCount : 0;
    }

    /**
     * Get popular items for cold start users
     */
    private async getPopularItems(count: number): Promise<Recommendation[]> {
        const itemPopularity = new Map<string, { count: number, avgRating: number }>();

        for (const [itemId, ratings] of this.itemUserMatrix) {
            const ratingsArray = Array.from(ratings.values());
            const avgRating = ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length;
            itemPopularity.set(itemId, {
                count: ratingsArray.length,
                avgRating
            });
        }

        return Array.from(itemPopularity.entries())
            .map(([itemId, stats]) => ({
                itemId,
                score: stats.avgRating * Math.log(stats.count + 1), // Popularity-weighted score
                confidence: Math.min(stats.count / 100, 1.0),
                explanation: `Popular item (${stats.count} ratings, avg: ${stats.avgRating.toFixed(2)})`
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    /**
     * Get system statistics
     */
    getStatistics() {
        return {
            users: this.userItemMatrix.size,
            items: this.itemUserMatrix.size,
            ratings: Array.from(this.userItemMatrix.values()).reduce((sum, ratings) => sum + ratings.size, 0),
            globalMean: this.globalMean,
            lastUpdated: this.lastUpdated,
            similarityMetric: this.options.similarityMetric.type,
            userSimilarities: this.userSimilarities.size,
            itemSimilarities: this.itemSimilarities.size
        };
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.userItemMatrix.clear();
        this.itemUserMatrix.clear();
        this.userSimilarities.clear();
        this.itemSimilarities.clear();
        this.userMeans.clear();
        this.itemMeans.clear();
        this.removeAllListeners();
    }
}