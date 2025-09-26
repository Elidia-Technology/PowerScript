"use strict";
/**
 * PowerScript Advanced AI Systems - Document Chunker
 *
 * Intelligent document chunking and preprocessing for RAG systems
 * Supports various chunking strategies and document formats
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChunker = void 0;
/**
 * Document chunker for intelligent document preprocessing
 */
class DocumentChunker {
    constructor() {
        this.stats = {
            totalDocuments: 0,
            totalChunks: 0,
            averageChunkSize: 0,
            minChunkSize: 0,
            maxChunkSize: 0,
            processingTime: 0
        };
    }
    /**
     * Chunk a single document
     */
    async chunkDocument(document, options) {
        const startTime = Date.now();
        // Preprocess the document
        let processedText = this._preprocessText(document.text, options.preprocessing);
        // Apply chunking strategy
        let chunks = await this._applyChunkingStrategy(processedText, document, options.strategy);
        // Postprocess chunks
        chunks = this._postprocessChunks(chunks, options.postprocessing);
        // Update statistics
        this._updateStats([document], chunks, Date.now() - startTime);
        return chunks;
    }
    /**
     * Chunk multiple documents in batch
     */
    async chunkDocuments(documents, options) {
        const startTime = Date.now();
        const allChunks = [];
        for (const document of documents) {
            const documentChunks = await this.chunkDocument(document, options);
            allChunks.push(...documentChunks);
        }
        // Update batch statistics
        this._updateStats(documents, allChunks, Date.now() - startTime);
        return allChunks;
    }
    /**
     * Preprocess text before chunking
     */
    _preprocessText(text, preprocessing) {
        if (!preprocessing)
            return text;
        let processed = text;
        if (preprocessing.removeEmptyLines) {
            processed = processed.replace(/^\s*[\r\n]/gm, '');
        }
        if (preprocessing.normalizeWhitespace) {
            processed = processed.replace(/\s+/g, ' ').trim();
        }
        if (preprocessing.removeSpecialChars) {
            // Remove special characters but preserve basic punctuation
            processed = processed.replace(/[^\w\s.,!?;:()-]/g, '');
        }
        if (!preprocessing.preserveFormatting) {
            // Remove extra whitespace and normalize line breaks
            processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        }
        return processed;
    }
    /**
     * Apply chunking strategy to text
     */
    async _applyChunkingStrategy(text, document, strategy) {
        switch (strategy.type) {
            case 'fixed':
                return this._fixedSizeChunking(text, document, strategy);
            case 'paragraph':
                return this._paragraphChunking(text, document, strategy);
            case 'sentence':
                return this._sentenceChunking(text, document, strategy);
            case 'semantic':
                return this._semanticChunking(text, document, strategy);
            case 'sliding':
                return this._slidingWindowChunking(text, document, strategy);
            default:
                throw new Error(`Unsupported chunking strategy: ${strategy.type}`);
        }
    }
    /**
     * Fixed-size chunking
     */
    _fixedSizeChunking(text, document, strategy) {
        const chunks = [];
        const chunkSize = strategy.chunkSize;
        const overlap = strategy.overlap || 0;
        let startOffset = 0;
        let chunkIndex = 0;
        while (startOffset < text.length) {
            const endOffset = Math.min(startOffset + chunkSize, text.length);
            const chunkText = text.slice(startOffset, endOffset);
            if (chunkText.length >= (strategy.minChunkSize || 10)) {
                chunks.push({
                    id: `${document.id}_chunk_${chunkIndex}`,
                    text: chunkText.trim(),
                    metadata: {
                        ...document.metadata,
                        source: document.id,
                        chunkIndex,
                        totalChunks: 0, // Will be updated later
                        startOffset,
                        endOffset,
                        type: 'fixed'
                    }
                });
                chunkIndex++;
            }
            startOffset = endOffset - overlap;
        }
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * Paragraph-based chunking
     */
    _paragraphChunking(text, document, strategy) {
        const chunks = [];
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        let chunkIndex = 0;
        let currentOffset = 0;
        for (const paragraph of paragraphs) {
            const trimmedParagraph = paragraph.trim();
            if (trimmedParagraph.length >= (strategy.minChunkSize || 10) &&
                trimmedParagraph.length <= (strategy.maxChunkSize || 10000)) {
                chunks.push({
                    id: `${document.id}_para_${chunkIndex}`,
                    text: trimmedParagraph,
                    metadata: {
                        ...document.metadata,
                        source: document.id,
                        chunkIndex,
                        totalChunks: 0,
                        startOffset: currentOffset,
                        endOffset: currentOffset + trimmedParagraph.length,
                        type: 'paragraph'
                    }
                });
                chunkIndex++;
            }
            currentOffset += paragraph.length + 2; // +2 for paragraph separators
        }
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * Sentence-based chunking
     */
    _sentenceChunking(text, document, strategy) {
        const chunks = [];
        // Simple sentence splitting (could be improved with NLP libraries)
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        let currentChunk = '';
        let chunkIndex = 0;
        let startOffset = 0;
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
            if (potentialChunk.length <= strategy.chunkSize) {
                currentChunk = potentialChunk;
            }
            else {
                // Save current chunk if it's not empty
                if (currentChunk) {
                    chunks.push({
                        id: `${document.id}_sent_${chunkIndex}`,
                        text: currentChunk + '.',
                        metadata: {
                            ...document.metadata,
                            source: document.id,
                            chunkIndex,
                            totalChunks: 0,
                            startOffset,
                            endOffset: startOffset + currentChunk.length + 1,
                            type: 'sentence'
                        }
                    });
                    chunkIndex++;
                    startOffset += currentChunk.length + 1;
                }
                // Start new chunk with current sentence
                currentChunk = sentence;
            }
        }
        // Add final chunk
        if (currentChunk) {
            chunks.push({
                id: `${document.id}_sent_${chunkIndex}`,
                text: currentChunk + '.',
                metadata: {
                    ...document.metadata,
                    source: document.id,
                    chunkIndex,
                    totalChunks: 0,
                    startOffset,
                    endOffset: startOffset + currentChunk.length + 1,
                    type: 'sentence'
                }
            });
        }
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * Semantic chunking (placeholder - would use ML models)
     */
    _semanticChunking(text, document, strategy) {
        // This would use semantic analysis to identify topic boundaries
        // For now, fall back to paragraph chunking
        return this._paragraphChunking(text, document, strategy);
    }
    /**
     * Sliding window chunking
     */
    _slidingWindowChunking(text, document, strategy) {
        const chunks = [];
        const chunkSize = strategy.chunkSize;
        const overlap = strategy.overlap || Math.floor(chunkSize * 0.2); // Default 20% overlap
        const stepSize = chunkSize - overlap;
        let chunkIndex = 0;
        for (let i = 0; i < text.length; i += stepSize) {
            const endOffset = Math.min(i + chunkSize, text.length);
            const chunkText = text.slice(i, endOffset);
            if (chunkText.length >= (strategy.minChunkSize || 10)) {
                chunks.push({
                    id: `${document.id}_slide_${chunkIndex}`,
                    text: chunkText.trim(),
                    metadata: {
                        ...document.metadata,
                        source: document.id,
                        chunkIndex,
                        totalChunks: 0,
                        startOffset: i,
                        endOffset,
                        type: 'semantic'
                    }
                });
                chunkIndex++;
            }
            if (endOffset >= text.length)
                break;
        }
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.metadata.totalChunks = chunks.length;
        });
        return chunks;
    }
    /**
     * Postprocess chunks
     */
    _postprocessChunks(chunks, postprocessing) {
        if (!postprocessing)
            return chunks;
        let processed = chunks;
        if (postprocessing.filterShortChunks) {
            processed = processed.filter(chunk => chunk.text.length >= 20);
        }
        if (postprocessing.deduplicateChunks) {
            const seen = new Set();
            processed = processed.filter(chunk => {
                const normalized = chunk.text.toLowerCase().trim();
                if (seen.has(normalized))
                    return false;
                seen.add(normalized);
                return true;
            });
        }
        if (postprocessing.addContextualInfo) {
            processed = processed.map((chunk, index) => ({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    previousChunk: index > 0 ? processed[index - 1].id : null,
                    nextChunk: index < processed.length - 1 ? processed[index + 1].id : null
                }
            }));
        }
        return processed;
    }
    /**
     * Update statistics
     */
    _updateStats(documents, chunks, processingTime) {
        this.stats.totalDocuments += documents.length;
        this.stats.totalChunks += chunks.length;
        this.stats.processingTime += processingTime;
        if (chunks.length > 0) {
            const chunkSizes = chunks.map(chunk => chunk.text.length);
            this.stats.averageChunkSize = chunkSizes.reduce((sum, size) => sum + size, 0) / chunkSizes.length;
            this.stats.minChunkSize = Math.min(...chunkSizes);
            this.stats.maxChunkSize = Math.max(...chunkSizes);
        }
    }
    /**
     * Get chunking statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            totalDocuments: 0,
            totalChunks: 0,
            averageChunkSize: 0,
            minChunkSize: 0,
            maxChunkSize: 0,
            processingTime: 0
        };
    }
    /**
     * Create default chunking options
     */
    static createDefaultOptions(chunkSize = 1000, overlap = 200) {
        return {
            strategy: {
                type: 'fixed',
                chunkSize,
                overlap,
                minChunkSize: 50,
                maxChunkSize: chunkSize * 2
            },
            preprocessing: {
                removeEmptyLines: true,
                normalizeWhitespace: true,
                removeSpecialChars: false,
                preserveFormatting: false
            },
            postprocessing: {
                filterShortChunks: true,
                deduplicateChunks: true,
                addContextualInfo: true
            }
        };
    }
}
exports.DocumentChunker = DocumentChunker;
