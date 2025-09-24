/**
 * PowerScript Sprite - A display object container with graphics drawing capabilities
 * 
 * Sprite is the most commonly used display object container. It inherits all the functionality
 * of DisplayObjectContainer and adds the ability to draw vector graphics using the Graphics class.
 */

import { DisplayObjectContainer } from './DisplayObjectContainer';
import { Graphics } from '../Graphics';
import { Rectangle } from '../geom/Rectangle';
import { Point } from '../geom/Point';

export class Sprite extends DisplayObjectContainer {
    private _graphics: Graphics;
    private _buttonMode: boolean = false;
    private _useHandCursor: boolean = true;
    private _dropTarget: Sprite | null = null;

    constructor() {
        super();
        this._graphics = new Graphics();
        this._graphics.setParent(this);
    }

    /**
     * Gets the Graphics object for this sprite
     */
    public get graphics(): Graphics {
        return this._graphics;
    }

    /**
     * Gets or sets whether this sprite acts like a button
     */
    public get buttonMode(): boolean {
        return this._buttonMode;
    }

    public set buttonMode(value: boolean) {
        this._buttonMode = value;
    }

    /**
     * Gets or sets whether to show hand cursor when hovering over this sprite
     */
    public get useHandCursor(): boolean {
        return this._useHandCursor;
    }

    public set useHandCursor(value: boolean) {
        this._useHandCursor = value;
    }

    /**
     * Gets the drop target during drag operations
     */
    public get dropTarget(): Sprite | null {
        return this._dropTarget;
    }

    /**
     * Starts dragging this sprite
     */
    public startDrag(lockCenter: boolean = false, bounds: Rectangle | null = null): void {
        // TODO: Implement drag functionality
        // This would integrate with the stage's mouse handling system
        console.warn('Sprite.startDrag not yet implemented');
    }

    /**
     * Stops dragging this sprite
     */
    public stopDrag(): void {
        // TODO: Implement drag functionality
        console.warn('Sprite.stopDrag not yet implemented');
    }

    /**
     * Creates a bitmap representation of this sprite
     */
    public getBounds(targetCoordinateSpace?: DisplayObjectContainer): Rectangle {
        // Start with graphics bounds
        let bounds = this._graphics.getBounds();
        
        // Include children bounds
        const childBounds = super.getBounds(targetCoordinateSpace);
        if (childBounds.width > 0 || childBounds.height > 0) {
            if (bounds.width === 0 && bounds.height === 0) {
                bounds = childBounds;
            } else {
                bounds = bounds.union(childBounds);
            }
        }

        // Transform to target coordinate space if provided
        if (targetCoordinateSpace && targetCoordinateSpace !== this) {
            const matrix = this.transform.getMatrixRelativeTo(targetCoordinateSpace);
            bounds = matrix.transformRectangle(bounds);
        }

        return bounds;
    }

    /**
     * Hit test including graphics content
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
     * Renders this sprite
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

        // Render graphics first
        this._graphics.render(renderer);

        // Render children
        super.render(renderer);

        // Restore renderer state
        renderer.restore();
    }

    /**
     * Invalidates the display object, marking it for re-rendering
     */
    public invalidate(): void {
        super.invalidate();
        this._graphics.invalidate();
    }

    /**
     * Clones this sprite (shallow copy)
     */
    public clone(): Sprite {
        const sprite = new Sprite();
        
        // Copy basic properties
        sprite.x = this.x;
        sprite.y = this.y;
        sprite.scaleX = this.scaleX;
        sprite.scaleY = this.scaleY;
        sprite.rotation = this.rotation;
        sprite.alpha = this.alpha;
        sprite.visible = this.visible;
        sprite.name = this.name;
        sprite.buttonMode = this.buttonMode;
        sprite.useHandCursor = this.useHandCursor;
        
        // Copy graphics (this creates a new Graphics instance with same drawing commands)
        sprite.graphics.copyFrom(this._graphics);
        
        return sprite;
    }

    /**
     * Creates a duplicate of this sprite including all children (deep copy)
     */
    public duplicate(): Sprite {
        const sprite = this.clone();
        
        // Copy all children recursively
        for (let i = 0; i < this.numChildren; i++) {
            const child = this.getChildAt(i);
            if (child instanceof Sprite) {
                sprite.addChild(child.duplicate());
            } else {
                // For other display objects, just clone
                sprite.addChild((child as any).clone());
            }
        }
        
        return sprite;
    }

    /**
     * Calculates the bounds of this sprite including graphics and children
     */
    protected calculateBounds(): Rectangle {
        // Start with graphics bounds
        let bounds = this._graphics.getBounds();
        
        // Include children bounds by calling parent's calculateBounds
        const childBounds = super.calculateBounds();
        if (childBounds.width > 0 || childBounds.height > 0) {
            if (bounds.width === 0 && bounds.height === 0) {
                bounds = childBounds;
            } else {
                bounds = bounds.union(childBounds);
            }
        }

        return bounds;
    }

    /**
     * Disposes of this sprite and its resources
     */
    public dispose(): void {
        // Clear graphics
        this._graphics.dispose();
        
        // Remove all children
        this.removeChildren();
        
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        // Clear references
        this._dropTarget = null;
    }
}