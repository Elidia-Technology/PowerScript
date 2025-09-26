"use strict";
/**
 * PowerScript Shape - A lightweight display object for vector graphics
 *
 * Shape is the lightest display object for drawing vector graphics.
 * Unlike Sprite, it cannot have children and is optimized for performance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shape = void 0;
const DisplayObject_1 = require("./DisplayObject");
const Graphics_1 = require("../Graphics");
const Point_1 = require("../geom/Point");
class Shape extends DisplayObject_1.DisplayObject {
    constructor() {
        super();
        this._graphics = new Graphics_1.Graphics();
        this._graphics.setParent(this);
    }
    /**
     * Gets the Graphics object for this shape
     */
    get graphics() {
        return this._graphics;
    }
    /**
     * Gets the bounds of this shape
     */
    getBounds(targetCoordinateSpace) {
        let bounds = this._graphics.getBounds();
        // Transform to target coordinate space if provided
        if (targetCoordinateSpace && targetCoordinateSpace !== this) {
            const matrix = this.transform.getMatrixRelativeTo(targetCoordinateSpace);
            bounds = matrix.transformRectangle(bounds);
        }
        return bounds;
    }
    /**
     * Hit test against the shape's graphics
     */
    hitTestPoint(x, y, shapeFlag = false) {
        // Convert to local coordinates
        const localPoint = this.globalToLocal(new Point_1.Point(x, y));
        if (shapeFlag) {
            // Test against actual graphics content
            return this._graphics.hitTestPoint(localPoint.x, localPoint.y);
        }
        else {
            // Test against bounding box
            const bounds = this.getBounds();
            return bounds.contains(localPoint.x, localPoint.y);
        }
    }
    /**
     * Renders this shape
     */
    render(renderer) {
        if (!this.visible)
            return;
        // Save renderer state
        renderer.save();
        // Apply transform
        const matrix = this.transform.matrix;
        renderer.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        // Apply alpha
        if (this.alpha !== 1) {
            renderer.globalAlpha *= this.alpha;
        }
        // Render graphics
        this._graphics.render(renderer);
        // Restore renderer state
        renderer.restore();
    }
    /**
     * Invalidates the shape, marking it for re-rendering
     */
    invalidate() {
        super.invalidate();
        this._graphics.invalidate();
    }
    /**
     * Clones this shape
     */
    clone() {
        const shape = new Shape();
        // Copy basic properties
        shape.x = this.x;
        shape.y = this.y;
        shape.scaleX = this.scaleX;
        shape.scaleY = this.scaleY;
        shape.rotation = this.rotation;
        shape.alpha = this.alpha;
        shape.visible = this.visible;
        shape.name = this.name;
        // Copy graphics
        shape.graphics.copyFrom(this._graphics);
        return shape;
    }
    /**
     * Calculates the bounds of this shape
     */
    calculateBounds() {
        return this._graphics.getBounds();
    }
    /**
     * Disposes of this shape and its resources
     */
    dispose() {
        // Clear graphics
        this._graphics.dispose();
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}
exports.Shape = Shape;
