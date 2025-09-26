"use strict";
/**
 * PowerScript DisplayObject - Base class for all display objects
 *
 * This is the foundation of the AS3-style display list architecture.
 * All visual objects inherit from DisplayObject and can be added to the display list.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayObject = void 0;
const EventDispatcher_1 = require("../../core/EventDispatcher");
const Point_1 = require("../geom/Point");
const Rectangle_1 = require("../geom/Rectangle");
const Transform_1 = require("../geom/Transform");
/**
 * Base class for all objects that can be placed on the display list
 */
class DisplayObject extends EventDispatcher_1.EventDispatcher {
    constructor(properties) {
        super();
        // Position properties
        this._x = 0;
        this._y = 0;
        this._z = 0;
        // Scale properties
        this._scaleX = 1;
        this._scaleY = 1;
        this._scaleZ = 1;
        // Rotation properties (in degrees)
        this._rotation = 0;
        this._rotationX = 0;
        this._rotationY = 0;
        this._rotationZ = 0;
        // Size properties
        this._width = 0;
        this._height = 0;
        // Visual properties
        this._alpha = 1;
        this._visible = true;
        // Object properties
        this._name = '';
        this._displayParent = null;
        this._stage = null;
        this._root = null;
        this._transformDirty = true;
        this._globalTransformDirty = true;
        // Mouse properties
        this._mouseX = 0;
        this._mouseY = 0;
        // Bounds caching
        this._bounds = null;
        this._boundsDirty = true;
        this._transform = new Transform_1.Transform();
        this._globalTransform = new Transform_1.Transform();
        if (properties) {
            this.applyProperties(properties);
        }
    }
    // Position getters/setters
    get x() {
        return this._x;
    }
    set x(value) {
        if (this._x !== value) {
            this._x = value;
            this.markTransformDirty();
        }
    }
    get y() {
        return this._y;
    }
    set y(value) {
        if (this._y !== value) {
            this._y = value;
            this.markTransformDirty();
        }
    }
    get z() {
        return this._z;
    }
    set z(value) {
        if (this._z !== value) {
            this._z = value;
            this.markTransformDirty();
        }
    }
    // Scale getters/setters
    get scaleX() {
        return this._scaleX;
    }
    set scaleX(value) {
        if (this._scaleX !== value) {
            this._scaleX = value;
            this.markTransformDirty();
        }
    }
    get scaleY() {
        return this._scaleY;
    }
    set scaleY(value) {
        if (this._scaleY !== value) {
            this._scaleY = value;
            this.markTransformDirty();
        }
    }
    get scaleZ() {
        return this._scaleZ;
    }
    set scaleZ(value) {
        if (this._scaleZ !== value) {
            this._scaleZ = value;
            this.markTransformDirty();
        }
    }
    // Rotation getters/setters
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        if (this._rotation !== value) {
            this._rotation = value;
            this.markTransformDirty();
        }
    }
    get rotationX() {
        return this._rotationX;
    }
    set rotationX(value) {
        if (this._rotationX !== value) {
            this._rotationX = value;
            this.markTransformDirty();
        }
    }
    get rotationY() {
        return this._rotationY;
    }
    set rotationY(value) {
        if (this._rotationY !== value) {
            this._rotationY = value;
            this.markTransformDirty();
        }
    }
    get rotationZ() {
        return this._rotationZ;
    }
    set rotationZ(value) {
        if (this._rotationZ !== value) {
            this._rotationZ = value;
            this.markTransformDirty();
        }
    }
    // Size getters/setters
    get width() {
        return this._width;
    }
    set width(value) {
        if (this._width !== value) {
            this._width = value;
            this.markBoundsDirty();
        }
    }
    get height() {
        return this._height;
    }
    set height(value) {
        if (this._height !== value) {
            this._height = value;
            this.markBoundsDirty();
        }
    }
    // Visual property getters/setters
    get alpha() {
        return this._alpha;
    }
    set alpha(value) {
        this._alpha = Math.max(0, Math.min(1, value));
    }
    get visible() {
        return this._visible;
    }
    set visible(value) {
        this._visible = value;
    }
    // Object property getters/setters
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    get parent() {
        return this._displayParent;
    }
    get stage() {
        return this._stage;
    }
    get root() {
        return this._root || this;
    }
    // Mouse properties
    get mouseX() {
        return this._mouseX;
    }
    get mouseY() {
        return this._mouseY;
    }
    // Transform properties
    get transform() {
        this.updateTransform();
        return this._transform;
    }
    get globalTransform() {
        this.updateGlobalTransform();
        return this._globalTransform;
    }
    /**
     * Get the bounds of this display object in its local coordinate system
     */
    getBounds(targetSpace) {
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
    getRect(targetSpace) {
        return this.getBounds(targetSpace);
    }
    /**
     * Convert a point from the global coordinate system to this object's local coordinates
     */
    globalToLocal(globalPoint) {
        const localPoint = globalPoint.clone();
        const globalTransform = this.globalTransform;
        // Apply inverse transformation
        globalTransform.matrix.invert().transformPoint(localPoint);
        return localPoint;
    }
    /**
     * Convert a point from this object's local coordinates to the global coordinate system
     */
    localToGlobal(localPoint) {
        const globalPoint = localPoint.clone();
        const globalTransform = this.globalTransform;
        // Apply transformation
        globalTransform.matrix.transformPoint(globalPoint);
        return globalPoint;
    }
    /**
     * Check if a point is within this display object
     */
    hitTestPoint(x, y, shapeFlag = false) {
        const bounds = this.getBounds();
        const localPoint = this.globalToLocal(new Point_1.Point(x, y));
        if (shapeFlag) {
            // Precise hit testing - subclasses should override
            return this.hitTestShape(localPoint.x, localPoint.y);
        }
        else {
            // Bounding box hit testing
            return bounds.contains(localPoint.x, localPoint.y);
        }
    }
    /**
     * Check if this display object intersects with another
     */
    hitTestObject(obj) {
        const thisBounds = this.getBounds();
        const objBounds = obj.getBounds();
        return thisBounds.intersects(objBounds);
    }
    /**
     * Mark this object as needing to be redrawn
     */
    invalidate() {
        this.markBoundsDirty();
        this.markTransformDirty();
        // Don't propagate to parent to avoid circular calls
        // Each object manages its own invalidation
    }
    // Internal methods
    /**
     * Apply properties from an object
     */
    applyProperties(properties) {
        if (properties.x !== undefined)
            this.x = properties.x;
        if (properties.y !== undefined)
            this.y = properties.y;
        if (properties.width !== undefined)
            this.width = properties.width;
        if (properties.height !== undefined)
            this.height = properties.height;
        if (properties.scaleX !== undefined)
            this.scaleX = properties.scaleX;
        if (properties.scaleY !== undefined)
            this.scaleY = properties.scaleY;
        if (properties.rotation !== undefined)
            this.rotation = properties.rotation;
        if (properties.alpha !== undefined)
            this.alpha = properties.alpha;
        if (properties.visible !== undefined)
            this.visible = properties.visible;
        if (properties.name !== undefined)
            this.name = properties.name;
    }
    /**
     * Mark transformation as dirty
     */
    markTransformDirty() {
        this._transformDirty = true;
        this._globalTransformDirty = true;
        this.markBoundsDirty();
    }
    /**
     * Mark bounds as dirty
     */
    markBoundsDirty() {
        this._boundsDirty = true;
    }
    /**
     * Update the local transformation matrix
     */
    updateTransform() {
        if (!this._transformDirty)
            return;
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
    updateGlobalTransform() {
        if (!this._globalTransformDirty)
            return;
        this.updateTransform();
        if (this._displayParent) {
            // Assume parent transform is already updated
            // Don't recursively call parent to avoid circular calls
            this._globalTransform.matrix.copyFrom(this._displayParent._globalTransform.matrix);
            this._globalTransform.matrix.concat(this._transform.matrix);
        }
        else {
            // No parent, global transform is same as local transform
            this._globalTransform.matrix.copyFrom(this._transform.matrix);
        }
        this._globalTransformDirty = false;
    }
    /**
     * Perform precise shape-based hit testing (to be implemented by subclasses)
     */
    hitTestShape(x, y) {
        // Default implementation uses bounding box
        const bounds = this.getBounds();
        return bounds.contains(x, y);
    }
    /**
     * Transform bounds to target coordinate space
     */
    transformBounds(bounds, targetSpace) {
        // Transform each corner of the bounds rectangle
        const corners = [
            new Point_1.Point(bounds.x, bounds.y),
            new Point_1.Point(bounds.x + bounds.width, bounds.y),
            new Point_1.Point(bounds.x + bounds.width, bounds.y + bounds.height),
            new Point_1.Point(bounds.x, bounds.y + bounds.height)
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
        return new Rectangle_1.Rectangle(minX, minY, maxX - minX, maxY - minY);
    }
    /**
     * Set parent reference (called by DisplayObjectContainer)
     */
    setParent(parent) {
        this._displayParent = parent;
        this._stage = parent ? parent.stage : null;
        this._root = parent ? parent.root : this;
        this.markTransformDirty();
    }
}
exports.DisplayObject = DisplayObject;
