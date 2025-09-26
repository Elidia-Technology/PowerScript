"use strict";
/**
 * PowerScript DisplayObjectContainer - Container for display objects
 *
 * AS3-compatible container that can hold child display objects.
 * Provides the display list functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisplayObjectContainer = void 0;
const DisplayObject_1 = require("./DisplayObject");
const Rectangle_1 = require("../geom/Rectangle");
/**
 * Container class that can hold child display objects
 */
class DisplayObjectContainer extends DisplayObject_1.DisplayObject {
    constructor() {
        super();
        this._children = [];
        this._mouseChildren = true;
        this._tabChildren = true;
    }
    /**
     * Get the number of children
     */
    get numChildren() {
        return this._children.length;
    }
    /**
     * Enable/disable mouse events for children
     */
    get mouseChildren() {
        return this._mouseChildren;
    }
    set mouseChildren(value) {
        this._mouseChildren = value;
    }
    /**
     * Enable/disable tab navigation for children
     */
    get tabChildren() {
        return this._tabChildren;
    }
    set tabChildren(value) {
        this._tabChildren = value;
    }
    /**
     * Add a child display object
     */
    addChild(child) {
        return this.addChildAt(child, this._children.length);
    }
    /**
     * Add a child display object at a specific index
     */
    addChildAt(child, index) {
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
    removeChild(child) {
        const index = this._children.indexOf(child);
        if (index === -1) {
            throw new Error('Child not found');
        }
        return this.removeChildAt(index);
    }
    /**
     * Remove a child display object at a specific index
     */
    removeChildAt(index) {
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
    removeChildren(beginIndex = 0, endIndex = Number.MAX_SAFE_INTEGER) {
        const actualEndIndex = Math.min(endIndex, this._children.length);
        for (let i = actualEndIndex - 1; i >= beginIndex; i--) {
            this.removeChildAt(i);
        }
    }
    /**
     * Get a child at a specific index
     */
    getChildAt(index) {
        if (index < 0 || index >= this._children.length) {
            throw new Error(`Index ${index} is out of bounds`);
        }
        return this._children[index];
    }
    /**
     * Get a child by name
     */
    getChildByName(name) {
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
    getChildIndex(child) {
        return this._children.indexOf(child);
    }
    /**
     * Set the index of a child
     */
    setChildIndex(child, index) {
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
    swapChildren(child1, child2) {
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
    swapChildrenAt(index1, index2) {
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
    contains(child) {
        return this._children.indexOf(child) !== -1;
    }
    /**
     * Sort children using a compare function
     */
    sortChildren(compareFunction) {
        this._children.sort(compareFunction);
        this.invalidate();
    }
    /**
     * Get all children as an array (copy)
     */
    getChildren() {
        return [...this._children];
    }
    /**
     * Check if a point hits any child (with mouse event support)
     */
    hitTestPoint(x, y, shapeFlag = false) {
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
    getObjectsUnderPoint(point) {
        const objects = [];
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
    calculateBounds() {
        if (this._children.length === 0) {
            return new Rectangle_1.Rectangle(0, 0, 0, 0);
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
    render(renderer) {
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
    updateGlobalTransform() {
        super.updateGlobalTransform();
        // Update children's global transforms
        for (const child of this._children) {
            child['_globalTransformDirty'] = true;
        }
    }
    /**
     * Invalidate this container and all children
     */
    invalidate() {
        super.invalidate();
        // Invalidate all children
        for (const child of this._children) {
            child.invalidate();
        }
    }
    /**
     * Dispose of this container and all its children
     */
    dispose() {
        // Remove all children
        this.removeChildren();
        // Clear references
        this._children.length = 0;
    }
}
exports.DisplayObjectContainer = DisplayObjectContainer;
