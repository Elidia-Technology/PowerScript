/**
 * PowerScript DisplayObject - Base class for all display objects
 * 
 * This is the foundation of the AS3-style display list architecture.
 * All visual objects inherit from DisplayObject and can be added to the display list.
 */

import { EventDispatcher } from '../../core/EventDispatcher';
import { Point } from '../geom/Point';
import { Rectangle } from '../geom/Rectangle';
import { Matrix } from '../geom/Matrix';
import { Transform } from '../geom/Transform';

export interface DisplayObjectProperties {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alpha?: number;
    visible?: boolean;
    name?: string;
}

/**
 * Base class for all objects that can be placed on the display list
 */
export abstract class DisplayObject extends EventDispatcher {
    // Position properties
    protected _x: number = 0;
    protected _y: number = 0;
    protected _z: number = 0;

    // Scale properties
    protected _scaleX: number = 1;
    protected _scaleY: number = 1;
    protected _scaleZ: number = 1;

    // Rotation properties (in degrees)
    protected _rotation: number = 0;
    protected _rotationX: number = 0;
    protected _rotationY: number = 0;
    protected _rotationZ: number = 0;

    // Size properties
    protected _width: number = 0;
    protected _height: number = 0;

    // Visual properties
    protected _alpha: number = 1;
    protected _visible: boolean = true;

    // Object properties
    protected _name: string = '';
    protected _displayParent: DisplayObjectContainer | null = null;
    protected _stage: Stage | null = null;
    protected _root: DisplayObject | null = null;

    // Transformation matrix
    protected _transform: Transform;
    protected _globalTransform: Transform;
    protected _transformDirty: boolean = true;
    protected _globalTransformDirty: boolean = true;

    // Mouse properties
    protected _mouseX: number = 0;
    protected _mouseY: number = 0;

    // Bounds caching
    protected _bounds: Rectangle | null = null;
    protected _boundsDirty: boolean = true;

    constructor(properties?: DisplayObjectProperties) {
        super();
        
        this._transform = new Transform();
        this._globalTransform = new Transform();
        
        if (properties) {
            this.applyProperties(properties);
        }
    }

    // Position getters/setters
    public get x(): number {
        return this._x;
    }

    public set x(value: number) {
        if (this._x !== value) {
            this._x = value;
            this.markTransformDirty();
        }
    }

    public get y(): number {
        return this._y;
    }

    public set y(value: number) {
        if (this._y !== value) {
            this._y = value;
            this.markTransformDirty();
        }
    }

    public get z(): number {
        return this._z;
    }

    public set z(value: number) {
        if (this._z !== value) {
            this._z = value;
            this.markTransformDirty();
        }
    }

    // Scale getters/setters
    public get scaleX(): number {
        return this._scaleX;
    }

    public set scaleX(value: number) {
        if (this._scaleX !== value) {
            this._scaleX = value;
            this.markTransformDirty();
        }
    }

    public get scaleY(): number {
        return this._scaleY;
    }

    public set scaleY(value: number) {
        if (this._scaleY !== value) {
            this._scaleY = value;
            this.markTransformDirty();
        }
    }

    public get scaleZ(): number {
        return this._scaleZ;
    }

    public set scaleZ(value: number) {
        if (this._scaleZ !== value) {
            this._scaleZ = value;
            this.markTransformDirty();
        }
    }

    // Rotation getters/setters
    public get rotation(): number {
        return this._rotation;
    }

    public set rotation(value: number) {
        if (this._rotation !== value) {
            this._rotation = value;
            this.markTransformDirty();
        }
    }

    public get rotationX(): number {
        return this._rotationX;
    }

    public set rotationX(value: number) {
        if (this._rotationX !== value) {
            this._rotationX = value;
            this.markTransformDirty();
        }
    }

    public get rotationY(): number {
        return this._rotationY;
    }

    public set rotationY(value: number) {
        if (this._rotationY !== value) {
            this._rotationY = value;
            this.markTransformDirty();
        }
    }

    public get rotationZ(): number {
        return this._rotationZ;
    }

    public set rotationZ(value: number) {
        if (this._rotationZ !== value) {
            this._rotationZ = value;
            this.markTransformDirty();
        }
    }

    // Size getters/setters
    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this.markBoundsDirty();
        }
    }

    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this.markBoundsDirty();
        }
    }

    // Visual property getters/setters
    public get alpha(): number {
        return this._alpha;
    }

    public set alpha(value: number) {
        this._alpha = Math.max(0, Math.min(1, value));
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(value: boolean) {
        this._visible = value;
    }

    // Object property getters/setters
    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get parent(): DisplayObjectContainer | null {
        return this._displayParent;
    }

    public get stage(): Stage | null {
        return this._stage;
    }

    public get root(): DisplayObject | null {
        return this._root || this;
    }

    // Mouse properties
    public get mouseX(): number {
        return this._mouseX;
    }

    public get mouseY(): number {
        return this._mouseY;
    }

    // Transform properties
    public get transform(): Transform {
        this.updateTransform();
        return this._transform;
    }

    public get globalTransform(): Transform {
        this.updateGlobalTransform();
        return this._globalTransform;
    }

    /**
     * Get the bounds of this display object in its local coordinate system
     */
    public getBounds(targetSpace?: DisplayObject): Rectangle {
        if (this._boundsDirty || !this._bounds) {
            this._bounds = this.calculateBounds();
            this._boundsDirty = false;
        }

        if (!targetSpace || targetSpace === this) {
            return this._bounds.clone();
        }

        // Transform bounds to target space
        return this.transformBounds(this._bounds, targetSpace);
    }

    /**
     * Get the bounds of this display object including all children
     */
    public getRect(targetSpace?: DisplayObject): Rectangle {
        return this.getBounds(targetSpace);
    }

    /**
     * Convert a point from the global coordinate system to this object's local coordinates
     */
    public globalToLocal(globalPoint: Point): Point {
        const localPoint = globalPoint.clone();
        const globalTransform = this.globalTransform;
        
        // Apply inverse transformation
        globalTransform.matrix.invert().transformPoint(localPoint);
        
        return localPoint;
    }

    /**
     * Convert a point from this object's local coordinates to the global coordinate system
     */
    public localToGlobal(localPoint: Point): Point {
        const globalPoint = localPoint.clone();
        const globalTransform = this.globalTransform;
        
        // Apply transformation
        globalTransform.matrix.transformPoint(globalPoint);
        
        return globalPoint;
    }

    /**
     * Check if a point is within this display object
     */
    public hitTestPoint(x: number, y: number, shapeFlag: boolean = false): boolean {
        const bounds = this.getBounds();
        const localPoint = this.globalToLocal(new Point(x, y));
        
        if (shapeFlag) {
            // Precise hit testing - subclasses should override
            return this.hitTestShape(localPoint.x, localPoint.y);
        } else {
            // Bounding box hit testing
            return bounds.contains(localPoint.x, localPoint.y);
        }
    }

    /**
     * Check if this display object intersects with another
     */
    public hitTestObject(obj: DisplayObject): boolean {
        const thisBounds = this.getBounds();
        const objBounds = obj.getBounds();
        
        return thisBounds.intersects(objBounds);
    }

    /**
     * Mark this object as needing to be redrawn
     */
    public invalidate(): void {
        this.markBoundsDirty();
        this.markTransformDirty();
        
        // Don't propagate to parent to avoid circular calls
        // Each object manages its own invalidation
    }

    // Internal methods

    /**
     * Apply properties from an object
     */
    protected applyProperties(properties: DisplayObjectProperties): void {
        if (properties.x !== undefined) this.x = properties.x;
        if (properties.y !== undefined) this.y = properties.y;
        if (properties.width !== undefined) this.width = properties.width;
        if (properties.height !== undefined) this.height = properties.height;
        if (properties.scaleX !== undefined) this.scaleX = properties.scaleX;
        if (properties.scaleY !== undefined) this.scaleY = properties.scaleY;
        if (properties.rotation !== undefined) this.rotation = properties.rotation;
        if (properties.alpha !== undefined) this.alpha = properties.alpha;
        if (properties.visible !== undefined) this.visible = properties.visible;
        if (properties.name !== undefined) this.name = properties.name;
    }

    /**
     * Mark transformation as dirty
     */
    protected markTransformDirty(): void {
        this._transformDirty = true;
        this._globalTransformDirty = true;
        this.markBoundsDirty();
    }

    /**
     * Mark bounds as dirty
     */
    protected markBoundsDirty(): void {
        this._boundsDirty = true;
    }

    /**
     * Update the local transformation matrix
     */
    protected updateTransform(): void {
        if (!this._transformDirty) return;

        const matrix = this._transform.matrix;
        matrix.identity();

        // Apply transformations in order: translate, rotate, scale
        matrix.translate(this._x, this._y);
        
        if (this._rotation !== 0) {
            matrix.rotate(this._rotation * Math.PI / 180); // Convert to radians
        }
        
        if (this._scaleX !== 1 || this._scaleY !== 1) {
            matrix.scale(this._scaleX, this._scaleY);
        }

        this._transformDirty = false;
    }

    /**
     * Update the global transformation matrix
     */
    protected updateGlobalTransform(): void {
        if (!this._globalTransformDirty) return;

        this.updateTransform();

        if (this._displayParent) {
            // Assume parent transform is already updated
            // Don't recursively call parent to avoid circular calls
            this._globalTransform.matrix.copyFrom((this._displayParent as any)._globalTransform.matrix);
            this._globalTransform.matrix.concat(this._transform.matrix);
        } else {
            // No parent, global transform is same as local transform
            this._globalTransform.matrix.copyFrom(this._transform.matrix);
        }

        this._globalTransformDirty = false;
    }

    /**
     * Calculate the bounds of this display object (to be implemented by subclasses)
     */
    protected abstract calculateBounds(): Rectangle;

    /**
     * Perform precise shape-based hit testing (to be implemented by subclasses)
     */
    protected hitTestShape(x: number, y: number): boolean {
        // Default implementation uses bounding box
        const bounds = this.getBounds();
        return bounds.contains(x, y);
    }

    /**
     * Transform bounds to target coordinate space
     */
    protected transformBounds(bounds: Rectangle, targetSpace: DisplayObject): Rectangle {
        // Transform each corner of the bounds rectangle
        const corners = [
            new Point(bounds.x, bounds.y),
            new Point(bounds.x + bounds.width, bounds.y),
            new Point(bounds.x + bounds.width, bounds.y + bounds.height),
            new Point(bounds.x, bounds.y + bounds.height)
        ];

        // Transform corners to global space
        const globalCorners = corners.map(corner => this.localToGlobal(corner));
        
        // Transform from global space to target space
        const targetCorners = globalCorners.map(corner => targetSpace.globalToLocal(corner));
        
        // Find bounding box of transformed corners
        let minX = targetCorners[0].x;
        let minY = targetCorners[0].y;
        let maxX = targetCorners[0].x;
        let maxY = targetCorners[0].y;
        
        for (let i = 1; i < targetCorners.length; i++) {
            const corner = targetCorners[i];
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
        }
        
        return new Rectangle(minX, minY, maxX - minX, maxY - minY);
    }

    /**
     * Set parent reference (called by DisplayObjectContainer)
     */
    public setParent(parent: DisplayObjectContainer | null): void {
        this._displayParent = parent;
        this._stage = parent ? parent.stage : null;
        this._root = parent ? parent.root : this;
        this.markTransformDirty();
    }

    /**
     * Render this display object (to be implemented by subclasses)
     */
    public abstract render(renderer: any): void;
}

// Import types that will be defined in other files
import type { DisplayObjectContainer } from './DisplayObjectContainer';
import type { Stage } from './Stage';