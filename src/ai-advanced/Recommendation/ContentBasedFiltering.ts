import { EventEmitter } from 'events';

export interface ItemFeature {
    name: string;
    value: string | number | boolean;
    weight?: number;
    category?: string;
}

export interface ItemProfile {
    itemId: string;
    features: ItemFeature[];
    categories?: string[];
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface UserProfile {
    userId: string;
    preferences: Map<string, number>; // feature -> preference score
    categories: Map<string, number>; // category -> preference score
    tags: Map<string, number>; // tag -> preference score
    demographics?: Record<string, any>;
    lastUpdated: Date;
}

export interface ContentBasedOptions {
    featureWeights?: Map<string, number>;
    categoryWeight?: number;
    tagWeight?: number;
    similarityThreshold?: number;
    decayFactor?: number; // For time-based preferences
    normalization?: 'l1' | 'l2' | 'none';
}

export interface ContentRecommendation {
    itemId: string;
    score: number;
    confidence: number;
    explanation: string;
    matchingFeatures: string[];
}

/**
 * PowerScript Content-Based Filtering Recommendation Engine
 * 
 * Implements content-based recommendation algorithms that suggest items
 * based on item features and user preference profiles built from past interactions.
 * 
 * Features:
 * - Feature-based item profiling with weighted attributes
 * - User preference learning from interaction history
 * - Multiple similarity calculations (cosine, TF-IDF, Jaccard)
 * - Category and tag-based recommendations
 * - Time-decay for evolving preferences
 * - Cold start handling for new users and items
 * - Explanation generation for recommendations
 * 
 * @example
 * ```typescript
 * const contentBased = new ContentBasedFiltering({
 *   featureWeights: new Map([['genre', 1.0], ['year', 0.5]]),
 *   categoryWeight: 0.8,
 *   tagWeight: 0.6,
 *   similarityThreshold: 0.1
 * });
 * 
 * // Add item profiles
 * await contentBased.addItemProfile({
 *   itemId: 'movie1',
 *   features: [
 *     { name: 'genre', value: 'Action', weight: 1.0 },
 *     { name: 'year', value: 2023, weight: 0.5 }
 *   ],
 *   categories: ['Movies', 'Action'],
 *   tags: ['blockbuster', 'superhero']
 * });
 * 
 * // Update user preferences
 * await contentBased.updateUserPreferences('user1', 'movie1', 4.5);
 * 
 * // Get recommendations
 * const recommendations = await contentBased.getRecommendations('user1', 10);
 * ```
 */
export class ContentBasedFiltering extends EventEmitter {
    private options: ContentBasedOptions;
    private itemProfiles: Map<string, ItemProfile>;
    private userProfiles: Map<string, UserProfile>;
    private featureIDF: Map<string, number>; // Inverse Document Frequency
    private categoryIDF: Map<string, number>;
    private tagIDF: Map<string, number>;
    private lastUpdated: Date;

    constructor(options: ContentBasedOptions = {}) {
        super();
        this.options = {
            categoryWeight: 0.8,
            tagWeight: 0.6,
            similarityThreshold: 0.1,
            decayFactor: 0.95,
            normalization: 'l2',
            ...options
        };
        this.itemProfiles = new Map();
        this.userProfiles = new Map();
        this.featureIDF = new Map();
        this.categoryIDF = new Map();
        this.tagIDF = new Map();
        this.lastUpdated = new Date();
    }

    /**
     * Add or update an item profile
     */
    async addItemProfile(profile: ItemProfile): Promise<void> {
        try {
            this.itemProfiles.set(profile.itemId, {
                ...profile,
                features: profile.features.map(f => ({
                    weight: 1.0,
                    category: 'general',
                    ...f
                }))
            });

            // Update IDF values
            await this.updateIDFValues();
            
            this.lastUpdated = new Date();
            this.emit('itemProfileAdded', { itemId: profile.itemId, timestamp: this.lastUpdated });
        } catch (error) {
            this.emit('error', { error, operation: 'addItemProfile', itemId: profile.itemId });
            throw error;
        }
    }

    /**
     * Add multiple item profiles in batch
     */
    async addItemProfiles(profiles: ItemProfile[]): Promise<void> {
        try {
            for (const profile of profiles) {
                await this.addItemProfile(profile);
            }
            this.emit('batchItemProfilesAdded', { count: profiles.length, timestamp: this.lastUpdated });
        } catch (error) {
            this.emit('error', { error, operation: 'addItemProfiles', profilesCount: profiles.length });
            throw error;
        }
    }

    /**
     * Update user preferences based on item interaction
     */
    async updateUserPreferences(userId: string, itemId: string, rating: number, timestamp?: Date): Promise<void> {
        try {
            const itemProfile = this.itemProfiles.get(itemId);
            if (!itemProfile) {
                throw new Error(`Item profile not found: ${itemId}`);
            }

            // Get or create user profile
            let userProfile = this.userProfiles.get(userId);
            if (!userProfile) {
                userProfile = {
                    userId,
                    preferences: new Map(),
                    categories: new Map(),
                    tags: new Map(),
                    lastUpdated: new Date()
                };
                this.userProfiles.set(userId, userProfile);
            }

            // Apply time decay to existing preferences
            const timeDiff = timestamp ? 
                (timestamp.getTime() - userProfile.lastUpdated.getTime()) / (1000 * 60 * 60 * 24) : 0;
            const decayMultiplier = Math.pow(this.options.decayFactor || 0.95, timeDiff);

            // Update feature preferences
            for (const feature of itemProfile.features) {
                const currentPref = userProfile.preferences.get(feature.name) || 0;
                const featureWeight = this.options.featureWeights?.get(feature.name) || feature.weight || 1.0;
                const newPref = (currentPref * decayMultiplier) + (rating * featureWeight);
                userProfile.preferences.set(feature.name, newPref);
            }

            // Update category preferences
            if (itemProfile.categories) {
                for (const category of itemProfile.categories) {
                    const currentPref = userProfile.categories.get(category) || 0;
                    const newPref = (currentPref * decayMultiplier) + (rating * (this.options.categoryWeight || 0.8));
                    userProfile.categories.set(category, newPref);
                }
            }

            // Update tag preferences
            if (itemProfile.tags) {
                for (const tag of itemProfile.tags) {
                    const currentPref = userProfile.tags.get(tag) || 0;
                    const newPref = (currentPref * decayMultiplier) + (rating * (this.options.tagWeight || 0.6));
                    userProfile.tags.set(tag, newPref);
                }
            }

            userProfile.lastUpdated = timestamp || new Date();
            this.lastUpdated = new Date();

            this.emit('userPreferencesUpdated', {
                userId,
                itemId,
                rating,
                timestamp: this.lastUpdated
            });
        } catch (error) {
            this.emit('error', { error, operation: 'updateUserPreferences', userId, itemId });
            throw error;
        }
    }

    /**
     * Get content-based recommendations for a user
     */
    async getRecommendations(userId: string, count: number = 10): Promise<ContentRecommendation[]> {
        try {
            const userProfile = this.userProfiles.get(userId);
            if (!userProfile || userProfile.preferences.size === 0) {
                // Cold start - return diverse popular items
                return await this.getDiverseItems(count);
            }

            const recommendations: ContentRecommendation[] = [];

            // Calculate scores for all items
            for (const [itemId, itemProfile] of this.itemProfiles) {
                const score = this.calculateItemScore(userProfile, itemProfile);
                if (score > (this.options.similarityThreshold || 0.1)) {
                    const { confidence, explanation, matchingFeatures } = 
                        this.generateExplanation(userProfile, itemProfile, score);
                    
                    recommendations.push({
                        itemId,
                        score,
                        confidence,
                        explanation,
                        matchingFeatures
                    });
                }
            }

            // Sort by score and return top recommendations
            const sortedRecommendations = recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, count);

            this.emit('recommendationsGenerated', {
                userId,
                count: sortedRecommendations.length,
                requestedCount: count,
                timestamp: new Date()
            });

            return sortedRecommendations;
        } catch (error) {
            this.emit('error', { error, operation: 'getRecommendations', userId, count });
            throw error;
        }
    }

    /**
     * Calculate similarity score between user preferences and item features
     */
    private calculateItemScore(userProfile: UserProfile, itemProfile: ItemProfile): number {
        let totalScore = 0;
        let totalWeight = 0;

        // Feature-based scoring
        for (const feature of itemProfile.features) {
            const userPref = userProfile.preferences.get(feature.name) || 0;
            const featureWeight = this.options.featureWeights?.get(feature.name) || feature.weight || 1.0;
            const idf = this.featureIDF.get(feature.name) || 1.0;
            
            let featureScore = userPref * featureWeight * idf;
            
            // Handle different feature types
            if (typeof feature.value === 'string') {
                // For categorical features, use exact match or similarity
                featureScore *= this.calculateStringsimilarity(feature.value, userProfile.preferences);
            } else if (typeof feature.value === 'number') {
                // For numerical features, apply normalization
                featureScore *= this.normalizeNumericalFeature(feature.value);
            }

            totalScore += featureScore;
            totalWeight += featureWeight;
        }

        // Category-based scoring
        if (itemProfile.categories) {
            for (const category of itemProfile.categories) {
                const userPref = userProfile.categories.get(category) || 0;
                const idf = this.categoryIDF.get(category) || 1.0;
                totalScore += userPref * (this.options.categoryWeight || 0.8) * idf;
                totalWeight += this.options.categoryWeight || 0.8;
            }
        }

        // Tag-based scoring
        if (itemProfile.tags) {
            for (const tag of itemProfile.tags) {
                const userPref = userProfile.tags.get(tag) || 0;
                const idf = this.tagIDF.get(tag) || 1.0;
                totalScore += userPref * (this.options.tagWeight || 0.6) * idf;
                totalWeight += this.options.tagWeight || 0.6;
            }
        }

        // Normalize score
        const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        // Apply normalization strategy
        return this.applyNormalization(normalizedScore);
    }

    /**
     * Calculate string similarity for categorical features
     */
    private calculateStringsimilarity(value: string, preferences: Map<string, number>): number {
        // Exact match gets full score
        if (preferences.has(value)) {
            return 1.0;
        }

        // Partial similarity based on string matching
        let maxSimilarity = 0;
        for (const [prefKey] of preferences) {
            const similarity = this.stringJaccardSimilarity(value.toLowerCase(), prefKey.toLowerCase());
            maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        return maxSimilarity;
    }

    /**
     * Jaccard similarity for strings
     */
    private stringJaccardSimilarity(str1: string, str2: string): number {
        const set1 = new Set(str1.split(''));
        const set2 = new Set(str2.split(''));
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Normalize numerical features
     */
    private normalizeNumericalFeature(value: number): number {
        // Simple min-max normalization (could be enhanced with actual min/max values)
        return Math.max(0, Math.min(1, value / 100));
    }

    /**
     * Apply normalization strategy to final score
     */
    private applyNormalization(score: number): number {
        switch (this.options.normalization) {
            case 'l1':
                return Math.abs(score);
            case 'l2':
                return score * score;
            case 'none':
            default:
                return score;
        }
    }

    /**
     * Generate explanation for recommendation
     */
    private generateExplanation(userProfile: UserProfile, itemProfile: ItemProfile, score: number): {
        confidence: number;
        explanation: string;
        matchingFeatures: string[];
    } {
        const matchingFeatures: string[] = [];
        const explanationParts: string[] = [];

        // Find matching features
        for (const feature of itemProfile.features) {
            if (userProfile.preferences.has(feature.name) && userProfile.preferences.get(feature.name)! > 0) {
                matchingFeatures.push(feature.name);
                explanationParts.push(`${feature.name}: ${feature.value}`);
            }
        }

        // Find matching categories
        if (itemProfile.categories) {
            for (const category of itemProfile.categories) {
                if (userProfile.categories.has(category) && userProfile.categories.get(category)! > 0) {
                    explanationParts.push(`category: ${category}`);
                }
            }
        }

        // Find matching tags
        if (itemProfile.tags) {
            for (const tag of itemProfile.tags) {
                if (userProfile.tags.has(tag) && userProfile.tags.get(tag)! > 0) {
                    explanationParts.push(`tag: ${tag}`);
                }
            }
        }

        const confidence = Math.min(matchingFeatures.length / 5, 1.0);
        const explanation = explanationParts.length > 0 
            ? `Matches your preferences: ${explanationParts.slice(0, 3).join(', ')}`
            : 'Based on content similarity';

        return { confidence, explanation, matchingFeatures };
    }

    /**
     * Update IDF (Inverse Document Frequency) values
     */
    private async updateIDFValues(): Promise<void> {
        const totalItems = this.itemProfiles.size;
        if (totalItems === 0) return;

        // Calculate feature IDF
        const featureCounts = new Map<string, number>();
        const categoryCounts = new Map<string, number>();
        const tagCounts = new Map<string, number>();

        for (const profile of this.itemProfiles.values()) {
            // Count features
            const uniqueFeatures = new Set(profile.features.map(f => f.name));
            for (const feature of uniqueFeatures) {
                featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
            }

            // Count categories
            if (profile.categories) {
                const uniqueCategories = new Set(profile.categories);
                for (const category of uniqueCategories) {
                    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
                }
            }

            // Count tags
            if (profile.tags) {
                const uniqueTags = new Set(profile.tags);
                for (const tag of uniqueTags) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            }
        }

        // Calculate IDF values
        for (const [feature, count] of featureCounts) {
            this.featureIDF.set(feature, Math.log(totalItems / count));
        }

        for (const [category, count] of categoryCounts) {
            this.categoryIDF.set(category, Math.log(totalItems / count));
        }

        for (const [tag, count] of tagCounts) {
            this.tagIDF.set(tag, Math.log(totalItems / count));
        }
    }

    /**
     * Get diverse items for cold start users
     */
    private async getDiverseItems(count: number): Promise<ContentRecommendation[]> {
        const itemScores = new Map<string, number>();
        
        // Score items based on diversity and popularity
        for (const [itemId, profile] of this.itemProfiles) {
            let diversityScore = 0;
            
            // Favor items with unique features
            for (const feature of profile.features) {
                const idf = this.featureIDF.get(feature.name) || 1.0;
                diversityScore += idf;
            }
            
            // Add category diversity
            if (profile.categories) {
                for (const category of profile.categories) {
                    const idf = this.categoryIDF.get(category) || 1.0;
                    diversityScore += idf * 0.5;
                }
            }

            itemScores.set(itemId, diversityScore);
        }

        return Array.from(itemScores.entries())
            .map(([itemId, score]) => ({
                itemId,
                score,
                confidence: 0.5,
                explanation: 'Diverse content for new user',
                matchingFeatures: []
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    /**
     * Get user profile summary
     */
    getUserProfile(userId: string): UserProfile | null {
        return this.userProfiles.get(userId) || null;
    }

    /**
     * Get item profile
     */
    getItemProfile(itemId: string): ItemProfile | null {
        return this.itemProfiles.get(itemId) || null;
    }

    /**
     * Get system statistics
     */
    getStatistics() {
        const totalPreferences = Array.from(this.userProfiles.values())
            .reduce((sum, profile) => sum + profile.preferences.size, 0);
        
        const totalFeatures = Array.from(this.itemProfiles.values())
            .reduce((sum, profile) => sum + profile.features.length, 0);

        return {
            users: this.userProfiles.size,
            items: this.itemProfiles.size,
            totalPreferences,
            totalFeatures,
            uniqueFeatures: this.featureIDF.size,
            uniqueCategories: this.categoryIDF.size,
            uniqueTags: this.tagIDF.size,
            lastUpdated: this.lastUpdated
        };
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.itemProfiles.clear();
        this.userProfiles.clear();
        this.featureIDF.clear();
        this.categoryIDF.clear();
        this.tagIDF.clear();
        this.removeAllListeners();
    }
}