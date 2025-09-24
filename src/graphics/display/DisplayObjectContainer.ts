/**
 * PowerScript DisplayObjectContainer - Container for display objects
 * 
 * AS3-compatible container that can hold child display objects.
 * Provides the display list functionality.
 */

import { DisplayObject } from './DisplayObject';
import { Rectangle } from '../geom/Rectangle';
import { Point } from '../geom/Point';

/**
 * Container class that can hold child display objects
 */
export class DisplayObjectContainer extends DisplayObject {
    protected _children: DisplayObject[] = [];
    protected _mouseChildren: boolean = true;
    protected _tabChildren: boolean = true;

    constructor() {
        super();
    }

    /**
     * Get the number of children
     */
    public get numChildren(): number {
        return this._children.length;
    }

    /**
     * Enable/disable mouse events for children
     */
    public get mouseChildren(): boolean {
        return this._mouseChildren;
    }

    public set mouseChildren(value: boolean) {
        this._mouseChildren = value;
    }

    /**
     * Enable/disable tab navigation for children
     */
    public get tabChildren(): boolean {
        return this._tabChildren;
    }

    public set tabChildren(value: boolean) {
        this._tabChildren = value;
    }

    /**
     * Add a child display object
     */
    public addChild(child: DisplayObject): DisplayObject {
        return this.addChildAt(child, this._children.length);
    }

    /**
     * Add a child display object at a specific index
     */
    public addChildAt(child: DisplayObject, index: number): DisplayObject {
        if (index < 0 || index > this._children.length) {
            throw new Error(`Index ${index} is out of bounds`);
        }

        // Remove from current parent if it has one
        if (child.parent) {
            child.parent.removeChild(child);
        }

        // Insert at specified index
        this._children.splice(index, 0, child);
        child.setParent(this);

        this.invalidate();
        return child;
    }

    /**
     * Remove a child display object
     */
    public removeChild(child: DisplayObject): DisplayObject {
        const index = this._children.indexOf(child);
        if (index === -1) {
            throw new Error('Child not found');
        }

        return this.removeChildAt(index);
    }

    /**
     * Remove a child display object at a specific index
     */
    public removeChildAt(index: number): DisplayObject {
        if (index < 0 || index >= this._children.length) {
            throw new Error(`Index ${index} is out of bounds`);
        }

        const child = this._children[index];
        this._children.splice(index, 1);
        child.setParent(null);

        this.invalidate();
        return child;
    }

    /**
     * Remove all children
     */
    public removeChildren(beginIndex: number = 0, endIndex: number = Number.MAX_SAFE_INTEGER): void {
        const actualEndIndex = Math.min(endIndex, this._children.length);
        
        for (let i = actualEndIndex - 1; i >= beginIndex; i--) {
            this.removeChildAt(i);
        }
    }

    /**
     * Get a child at a specific index
     */
    public getChildAt(index: number): DisplayObject {
        if (index < 0 || index >= this._children.length) {
            throw new Error(`Index ${index} is out of bounds`);
        }

        return this._children[index];
    }

    /**
     * Get a child by name
     */
    public getChildByName(name: string): DisplayObject | null {
        for (const child of this._children) {
            if (child.name === name) {
                return child;
            }
        }
        return null;
    }

    /**
     * Get the index of a child
     */
    public getChildIndex(child: DisplayObject): number {
        return this._children.indexOf(child);
    }

    /**
     * Set the index of a child
     */
    public setChildIndex(child: DisplayObject, index: number): void {
        const currentIndex = this.getChildIndex(child);
        if (currentIndex === -1) {
            throw new Error('Child not found');
        }

        if (index < 0 || index >= this._children.length) {
            throw new Error(`Index ${index} is out of bounds`);
        }

        // Remove from current position
        this._children.splice(currentIndex, 1);
        
        // Insert at new position
        this._children.splice(index, 0, child);

        this.invalidate();
    }

    /**
     * Swap two children
     */
    public swapChildren(child1: DisplayObject, child2: DisplayObject): void {
        const index1 = this.getChildIndex(child1);
        const index2 = this.getChildIndex(child2);

        if (index1 === -1 || index2 === -1) {
            throw new Error('One or both children not found');
        }

        this.swapChildrenAt(index1, index2);
    }

    /**
     * Swap children at two indices
     */
    public swapChildrenAt(index1: number, index2: number): void {
        if (index1 < 0 || index1 >= this._children.length ||
            index2 < 0 || index2 >= this._children.length) {
            throw new Error('Index out of bounds');
        }

        const temp = this._children[index1];
        this._children[index1] = this._children[index2];
        this._children[index2] = temp;

        this.invalidate();
    }

    /**
     * Check if this container contains a specific child
     */
    public contains(child: DisplayObject): boolean {
        return this._children.indexOf(child) !== -1;
    }

    /**
     * Sort children using a compare function
     */
    public sortChildren(compareFunction: (a: DisplayObject, b: DisplayObject) => number): void {
        this._children.sort(compareFunction);
        this.invalidate();
    }

    /**
     * Get all children as an array (copy)
     */
    public getChildren(): DisplayObject[] {
        return [...this._children];
    }

    /**
     * Check if a point hits any child (with mouse event support)
     */
    public override hitTestPoint(x: number, y: number, shapeFlag: boolean = false): boolean {
        if (!this._mouseChildren) {
            return super.hitTestPoint(x, y, shapeFlag);
        }

        // Test children in reverse order (top to bottom)
        for (let i = this._children.length - 1; i >= 0; i--) {
            const child = this._children[i];
            if (child.visible && child.hitTestPoint(x, y, shapeFlag)) {
                return true;
            }
        }

        return super.hitTestPoint(x, y, shapeFlag);
    }

    /**
     * Get the object under a point
     */
    public getObjectsUnderPoint(point: Point): DisplayObject[] {
        const objects: DisplayObject[] = [];

        for (let i = this._children.length - 1; i >= 0; i--) {
            const child = this._children[i];
            if (child.visible && child.hitTestPoint(point.x, point.y, true)) {
                objects.push(child);
                
                // If child is a container, get its children too
                if (child instanceof DisplayObjectContainer) {
                    objects.push(...child.getObjectsUnderPoint(point));
                }
            }
        }

        return objects;
    }

    /**
     * Calculate bounds including all children
     */
    protected override calculateBounds(): Rectangle {
        if (this._children.length === 0) {
            return new Rectangle(0, 0, 0, 0);
        }

        let bounds = this._children[0].getBounds(this);

        for (let i = 1; i < this._children.length; i++) {
            const childBounds = this._children[i].getBounds(this);
            bounds = bounds.union(childBounds);
        }

        return bounds;
    }

    /**
     * Render this container and all its children
     */
    public override render(renderer: any): void {
        if (!this._visible || this._alpha <= 0) {
            return;
        }

        // Render all visible children
        for (const child of this._children) {
            if (child.visible) {
                child.render(renderer);
            }
        }
    }

    /**
     * Update transform and propagate to children
     */
    protected override updateGlobalTransform(): void {
        super.updateGlobalTransform();

        // Update children's global transforms
        for (const child of this._children) {
            child['_globalTransformDirty'] = true;
        }
    }

    /**
     * Invalidate this container and all children
     */
    public override invalidate(): void {
        super.invalidate();

        // Invalidate all children
        for (const child of this._children) {
            child.invalidate();
        }
    }

    /**
     * Dispose of this container and all its children
     */
    public dispose(): void {
        // Remove all children
        this.removeChildren();
        
        // Clear references
        this._children.length = 0;
    }
}