"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingError = exports.StreamingError = exports.MediaPlayerError = exports.MultimediaError = void 0;
// ============================================================================
// ERROR INTERFACES
// ============================================================================
class MultimediaError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MultimediaError';
    }
}
exports.MultimediaError = MultimediaError;
class MediaPlayerError extends MultimediaError {
    constructor(message, code, details) {
        super(message, code, details);
        this.name = 'MediaPlayerError';
    }
}
exports.MediaPlayerError = MediaPlayerError;
class StreamingError extends MultimediaError {
    constructor(message, code, details) {
        super(message, code, details);
        this.name = 'StreamingError';
    }
}
exports.StreamingError = StreamingError;
class ProcessingError extends MultimediaError {
    constructor(message, code, details) {
        super(message, code, details);
        this.name = 'ProcessingError';
    }
}
exports.ProcessingError = ProcessingError;
