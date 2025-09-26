"use strict";
/**
 * PowerScript Transform - Transformation container
 *
 * Contains transformation data for display objects.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transform = void 0;
const Matrix_1 = require("./Matrix");
class Transform {
    constructor() {
        this._colorTransform = null; // We'll implement ColorTransform later
        this._perspectiveProjection = null; // For 3D transformations
        this._matrix = new Matrix_1.Matrix();
    }
    /**
     * Get the transformation matrix
     */
    get matrix() {
        return this._matrix;
    }
    set matrix(value) {
        this._matrix = value.clone();
    }
    /**
     * Get the color transformation
     */
    get colorTransform() {
        return this._colorTransform;
    }
    set colorTransform(value) {
        this._colorTransform = value;
    }
    /**
     * Get the perspective projection
     */
    get perspectiveProjection() {
        return this._perspectiveProjection;
    }
    set perspectiveProjection(value) {
        this._perspectiveProjection = value;
    }
    /**
     * Create a copy of this transform
     */
    clone() {
        const transform = new Transform();
        transform._matrix = this._matrix.clone();
        transform._colorTransform = this._colorTransform; // TODO: Clone when implemented
        transform._perspectiveProjection = this._perspectiveProjection;
        return transform;
    }
    /**
     * Copy from another transform
     */
    copyFrom(sourceTransform) {
        this._matrix.copyFrom(sourceTransform._matrix);
        this._colorTransform = sourceTransform._colorTransform;
        this._perspectiveProjection = sourceTransform._perspectiveProjection;
    }
    /**
     * Gets a transformation matrix relative to another display object
     */
    getMatrixRelativeTo(target) {
        // This is a simplified implementation
        // In a full implementation, this would calculate the transformation
        // from this object's coordinate space to the target's coordinate space
        return this._matrix.clone();
    }
}
exports.Transform = Transform;
