"use strict";
/**
 * PowerScript Advanced AI Systems - Semantic Search
 *
 * Advanced search capabilities for RAG systems with query processing,
 * semantic similarity, and search result optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticSearch = void 0;
const events_1 = require("events");
/**
 * Advanced semantic search system
 */
class SemanticSearch extends events_1.EventEmitter {
    constructor(embeddingService, vectorDatabase) {
        super();
        this.queryCache = new Map();
        this.expansionCache = new Map();
        this.embeddingService = embeddingService;
        this.vectorDatabase = vectorDatabase;
    }
    /**
     * Perform semantic search
     */
    async search(query) {
        const startTime = Date.now();
        try {
            this.emit('search:start', query);
            // Check cache first
            const cacheKey = this._getCacheKey(query);
            if (this.queryCache.has(cacheKey)) {
                this.emit('search:cache_hit', query);
                return this.queryCache.get(cacheKey);
            }
            // Process query
            const processedQuery = await this._processQuery(query.text, query.options);
            // Generate embeddings
            const queryEmbedding = await this._generateQueryEmbedding(processedQuery);
            // Search vector database
            const vectorResults = await this._performVectorSearch(queryEmbedding, query);
            // Apply post-processing
            const processedResults = await this._postProcessResults(vectorResults, query);
            // Create response
            const response = {
                results: processedResults,
                totalResults: processedResults.length,
                queryTime: Date.now() - startTime,
                metadata: {
                    originalQuery: query.text,
                    expandedQuery: processedQuery !== query.text ? processedQuery : undefined,
                    searchStrategy: this._getSearchStrategy(query.options),
                    filtersApplied: !!query.filters && Object.keys(query.filters).length > 0,
                    rerankingApplied: query.options?.rerankingEnabled || false
                }
            };
            // Cache result
            this.queryCache.set(cacheKey, response);
            this.emit('search:complete', response);
            return response;
        }
        catch (error) {
            this.emit('search:error', error);
            throw error;
        }
    }
    /**
     * Process and expand query if needed
     */
    async _processQuery(query, options) {
        if (!options?.semanticExpansion) {
            return query;
        }
        // Check expansion cache
        if (this.expansionCache.has(query)) {
            const expansion = this.expansionCache.get(query);
            return this._buildExpandedQuery(query, expansion);
        }
        // Perform query expansion
        const expansion = await this._expandQuery(query);
        this.expansionCache.set(query, expansion);
        return this._buildExpandedQuery(query, expansion);
    }
    /**
     * Expand query with synonyms and related terms
     */
    async _expandQuery(query) {
        // Simple implementation - in practice would use NLP libraries or models
        const originalTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        // For now, return basic expansion
        return {
            originalTerms,
            expandedTerms: [],
            synonyms: {},
            conceptualTerms: []
        };
    }
    /**
     * Build expanded query string
     */
    _buildExpandedQuery(originalQuery, expansion) {
        let expandedQuery = originalQuery;
        // Add synonyms and expanded terms
        const additionalTerms = [
            ...expansion.expandedTerms,
            ...expansion.conceptualTerms,
            ...Object.values(expansion.synonyms).flat()
        ];
        if (additionalTerms.length > 0) {
            expandedQuery += ' ' + additionalTerms.join(' ');
        }
        return expandedQuery;
    }
    /**
     * Generate embedding for query
     */
    async _generateQueryEmbedding(query) {
        const response = await this.embeddingService.embed({ text: query });
        return response.embedding;
    }
    /**
     * Perform vector database search
     */
    async _performVectorSearch(queryEmbedding, query) {
        const options = {
            topK: query.options?.topK || 10,
            scoreThreshold: query.options?.minSimilarity || 0.7,
            filter: query.filters,
            includeMetadata: true,
            includeValues: query.options?.diversityThreshold !== undefined
        };
        return await this.vectorDatabase.search(queryEmbedding, options);
    }
    /**
     * Post-process search results
     */
    async _postProcessResults(vectorResults, query) {
        let results = vectorResults.map(result => this._convertToSearchResult(result));
        // Apply diversity filtering
        if (query.options?.diversityThreshold) {
            results = this._applyDiversityFiltering(results, query.options.diversityThreshold);
        }
        // Apply reranking
        if (query.options?.rerankingEnabled) {
            results = await this._rerankResults(results, query);
        }
        // Apply boost factors
        if (query.options?.boostFactors) {
            results = this._applyBoostFactors(results, query.options.boostFactors);
        }
        // Generate highlights
        results = this._generateHighlights(results, query.text);
        // Limit results
        const maxResults = query.options?.maxResults || query.options?.topK || 10;
        return results.slice(0, maxResults);
    }
    /**
     * Convert vector search result to search result
     */
    _convertToSearchResult(vectorResult) {
        return {
            id: vectorResult.id,
            text: vectorResult.metadata.text || '',
            score: vectorResult.score,
            relevanceScore: vectorResult.score,
            metadata: vectorResult.metadata,
            highlights: [],
            explanation: `Similarity score: ${vectorResult.score.toFixed(3)}`
        };
    }
    /**
     * Apply diversity filtering to avoid similar results
     */
    _applyDiversityFiltering(results, threshold) {
        if (results.length <= 1)
            return results;
        const filtered = [results[0]];
        for (let i = 1; i < results.length; i++) {
            const candidate = results[i];
            let shouldInclude = true;
            for (const selected of filtered) {
                const textSimilarity = this._calculateTextSimilarity(candidate.text, selected.text);
                if (textSimilarity > threshold) {
                    shouldInclude = false;
                    break;
                }
            }
            if (shouldInclude) {
                filtered.push(candidate);
            }
        }
        return filtered;
    }
    /**
     * Calculate text similarity using simple Jaccard similarity
     */
    _calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set(Array.from(words1).filter(word => words2.has(word)));
        const union = new Set([...Array.from(words1), ...Array.from(words2)]);
        return intersection.size / union.size;
    }
    /**
     * Rerank results using advanced scoring
     */
    async _rerankResults(results, query) {
        // Placeholder for advanced reranking logic
        // In practice, would use a reranking model or additional scoring factors
        return results.map(result => ({
            ...result,
            relevanceScore: this._calculateRelevanceScore(result, query.text)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Calculate enhanced relevance score
     */
    _calculateRelevanceScore(result, query) {
        // Combine vector similarity with text-based relevance
        const vectorScore = result.score;
        const textScore = this._calculateTextRelevance(result.text, query);
        const metadataScore = this._calculateMetadataRelevance(result.metadata, query);
        // Weighted combination
        return (vectorScore * 0.6) + (textScore * 0.3) + (metadataScore * 0.1);
    }
    /**
     * Calculate text-based relevance
     */
    _calculateTextRelevance(text, query) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const textLower = text.toLowerCase();
        let score = 0;
        for (const term of queryTerms) {
            if (textLower.includes(term)) {
                // Boost for exact matches
                const exactMatches = (textLower.match(new RegExp(term, 'g')) || []).length;
                score += exactMatches * 0.1;
            }
        }
        return Math.min(score, 1.0);
    }
    /**
     * Calculate metadata-based relevance
     */
    _calculateMetadataRelevance(metadata, query) {
        // Simple metadata relevance based on tags and source
        let score = 0;
        if (metadata.tags && Array.isArray(metadata.tags)) {
            const queryLower = query.toLowerCase();
            for (const tag of metadata.tags) {
                if (queryLower.includes(tag.toLowerCase())) {
                    score += 0.2;
                }
            }
        }
        return Math.min(score, 1.0);
    }
    /**
     * Apply boost factors to results
     */
    _applyBoostFactors(results, boostFactors) {
        return results.map(result => {
            let boost = 1.0;
            for (const [field, factor] of Object.entries(boostFactors)) {
                if (result.metadata[field]) {
                    boost *= factor;
                }
            }
            return {
                ...result,
                relevanceScore: result.relevanceScore * boost
            };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Generate text highlights
     */
    _generateHighlights(results, query) {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        return results.map(result => {
            const highlights = [];
            const text = result.text;
            for (const term of queryTerms) {
                const regex = new RegExp(`(\\S*${term}\\S*)`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    highlights.push(...matches.slice(0, 3)); // Limit to 3 highlights per term
                }
            }
            return {
                ...result,
                highlights: Array.from(new Set(highlights)).slice(0, 5) // Limit total highlights
            };
        });
    }
    /**
     * Get search strategy description
     */
    _getSearchStrategy(options) {
        const strategies = ['vector_similarity'];
        if (options?.semanticExpansion)
            strategies.push('query_expansion');
        if (options?.rerankingEnabled)
            strategies.push('reranking');
        if (options?.diversityThreshold)
            strategies.push('diversity_filtering');
        if (options?.boostFactors)
            strategies.push('boost_factors');
        return strategies.join('+');
    }
    /**
     * Generate cache key for query
     */
    _getCacheKey(query) {
        return JSON.stringify({
            text: query.text,
            filters: query.filters,
            options: query.options
        });
    }
    /**
     * Clear search cache
     */
    clearCache() {
        this.queryCache.clear();
        this.expansionCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            queryCache: this.queryCache.size,
            expansionCache: this.expansionCache.size
        };
    }
    /**
     * Suggest similar queries based on search history
     */
    getSuggestedQueries(partialQuery, limit = 5) {
        const suggestions = [];
        const partialLower = partialQuery.toLowerCase();
        for (const [cacheKey] of Array.from(this.queryCache)) {
            try {
                const cached = JSON.parse(cacheKey);
                if (cached.text.toLowerCase().includes(partialLower)) {
                    suggestions.push(cached.text);
                }
            }
            catch {
                // Ignore malformed cache keys
            }
        }
        return suggestions.slice(0, limit);
    }
    /**
     * Perform similarity search between documents
     */
    async findSimilarDocuments(documentId, options) {
        // Get the document
        const document = await this.vectorDatabase.get(documentId);
        if (!document) {
            throw new Error(`Document ${documentId} not found`);
        }
        // Search for similar documents
        const searchOptions = {
            topK: options?.topK || 10,
            scoreThreshold: options?.threshold || 0.5,
            includeMetadata: true
        };
        const results = await this.vectorDatabase.search(document.values, searchOptions);
        // Filter out the original document and convert to SearchResult
        return results
            .filter(result => result.id !== documentId)
            .map(result => this._convertToSearchResult(result));
    }
}
exports.SemanticSearch = SemanticSearch;
