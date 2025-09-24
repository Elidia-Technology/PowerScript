/**
 * PowerScript Transform - Transformation container
 * 
 * Contains transformation data for display objects.
 */

import { Matrix } from './Matrix';
import { Point } from './Point';

export class Transform {
    private _matrix: Matrix;
    private _colorTransform: any = null; // We'll implement ColorTransform later
    private _perspectiveProjection: any = null; // For 3D transformations

    constructor() {
        this._matrix = new Matrix();
    }

    /**
     * Get the transformation matrix
     */
    public get matrix(): Matrix {
        return this._matrix;
    }

    public set matrix(value: Matrix) {
        this._matrix = value.clone();
    }

    /**
     * Get the color transformation
     */
    public get colorTransform(): any {
        return this._colorTransform;
    }

    public set colorTransform(value: any) {
        this._colorTransform = value;
    }

    /**
     * Get the perspective projection
     */
    public get perspectiveProjection(): any {
        return this._perspectiveProjection;
    }

    public set perspectiveProjection(value: any) {
        this._perspectiveProjection = value;
    }

    /**
     * Create a copy of this transform
     */
    public clone(): Transform {
        const transform = new Transform();
        transform._matrix = this._matrix.clone();
        transform._colorTransform = this._colorTransform; // TODO: Clone when implemented
        transform._perspectiveProjection = this._perspectiveProjection;
        return transform;
    }

    /**
     * Copy from another transform
     */
    public copyFrom(sourceTransform: Transform): void {
        this._matrix.copyFrom(sourceTransform._matrix);
        this._colorTransform = sourceTransform._colorTransform;
        this._perspectiveProjection = sourceTransform._perspectiveProjection;
    }

    /**
     * Gets a transformation matrix relative to another display object
     */
    public getMatrixRelativeTo(target: any): Matrix {
        // This is a simplified implementation
        // In a full implementation, this would calculate the transformation
        // from this object's coordinate space to the target's coordinate space
        return this._matrix.clone();
    }
}