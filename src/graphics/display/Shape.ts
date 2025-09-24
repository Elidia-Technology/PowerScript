/**
 * PowerScript Shape - A lightweight display object for vector graphics
 * 
 * Shape is the lightest display object for drawing vector graphics.
 * Unlike Sprite, it cannot have children and is optimized for performance.
 */

import { DisplayObject } from './DisplayObject';
import { Graphics } from '../Graphics';
import { Rectangle } from '../geom/Rectangle';
import { Point } from '../geom/Point';

export class Shape extends DisplayObject {
    private _graphics: Graphics;

    constructor() {
        super();
        this._graphics = new Graphics();
        this._graphics.setParent(this);
    }

    /**
     * Gets the Graphics object for this shape
     */
    public get graphics(): Graphics {
        return this._graphics;
    }

    /**
     * Gets the bounds of this shape
     */
    public getBounds(targetCoordinateSpace?: DisplayObject): Rectangle {
        let bounds = this._graphics.getBounds();

        // Transform to target coordinate space if provided
        if (targetCoordinateSpace && targetCoordinateSpace !== this) {
            const matrix = this.transform.getMatrixRelativeTo(targetCoordinateSpace as any);
            bounds = matrix.transformRectangle(bounds);
        }

        return bounds;
    }

    /**
     * Hit test against the shape's graphics
     */
    public hitTestPoint(x: number, y: number, shapeFlag: boolean = false): boolean {
        // Convert to local coordinates
        const localPoint = this.globalToLocal(new Point(x, y));
        
        if (shapeFlag) {
            // Test against actual graphics content
            return this._graphics.hitTestPoint(localPoint.x, localPoint.y);
        } else {
            // Test against bounding box
            const bounds = this.getBounds();
            return bounds.contains(localPoint.x, localPoint.y);
        }
    }

    /**
     * Renders this shape
     */
    public render(renderer: any): void {
        if (!this.visible) return;

        // Save renderer state
        renderer.save();

        // Apply transform
        const matrix = this.transform.matrix;
        renderer.setTransform(
            matrix.a, matrix.b, matrix.c, 
            matrix.d, matrix.tx, matrix.ty
        );

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
    public invalidate(): void {
        super.invalidate();
        this._graphics.invalidate();
    }

    /**
     * Clones this shape
     */
    public clone(): Shape {
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
    protected calculateBounds(): Rectangle {
        return this._graphics.getBounds();
    }

    /**
     * Disposes of this shape and its resources
     */
    public dispose(): void {
        // Clear graphics
        this._graphics.dispose();
        
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}