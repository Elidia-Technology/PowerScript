"use strict";
/**
 * PowerScript Stage - The root display object container
 *
 * Stage represents the main drawing area and is the root of the display list.
 * It provides access to stage properties like dimensions, frame rate, and quality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stage = void 0;
const DisplayObjectContainer_1 = require("./DisplayObjectContainer");
const Rectangle_1 = require("../geom/Rectangle");
const Point_1 = require("../geom/Point");
class Stage extends DisplayObjectContainer_1.DisplayObjectContainer {
    constructor(width = 800, height = 600) {
        super();
        this._stageWidth = 800;
        this._stageHeight = 600;
        this._backgroundColor = 0xFFFFFF;
        this._frameRate = 60;
        this._quality = 'high';
        this._scaleMode = 'showAll';
        this._align = 'center';
        this._focus = null;
        this._invalidateNextFrame = false;
        this._stageWidth = width;
        this._stageHeight = height;
        this.name = 'stage';
        // Stage is always the root
        this._stage = this;
        this._root = this;
    }
    /**
     * Gets the stage width
     */
    get stageWidth() {
        return this._stageWidth;
    }
    set stageWidth(value) {
        if (this._stageWidth !== value) {
            this._stageWidth = value;
            this.invalidate();
        }
    }
    /**
     * Gets the stage height
     */
    get stageHeight() {
        return this._stageHeight;
    }
    set stageHeight(value) {
        if (this._stageHeight !== value) {
            this._stageHeight = value;
            this.invalidate();
        }
    }
    /**
     * Gets or sets the background color
     */
    get backgroundColor() {
        return this._backgroundColor;
    }
    set backgroundColor(value) {
        this._backgroundColor = value;
        this.invalidate();
    }
    /**
     * Gets or sets the frame rate
     */
    get frameRate() {
        return this._frameRate;
    }
    set frameRate(value) {
        this._frameRate = Math.max(1, Math.min(120, value));
    }
    /**
     * Gets or sets the rendering quality
     */
    get quality() {
        return this._quality;
    }
    set quality(value) {
        this._quality = value;
    }
    /**
     * Gets or sets the scale mode
     */
    get scaleMode() {
        return this._scaleMode;
    }
    set scaleMode(value) {
        this._scaleMode = value;
    }
    /**
     * Gets or sets the stage alignment
     */
    get align() {
        return this._align;
    }
    set align(value) {
        this._align = value;
    }
    /**
     * Gets or sets the focus object
     */
    get focus() {
        return this._focus;
    }
    set focus(value) {
        this._focus = value;
    }
    /**
     * Gets the stage bounds
     */
    getBounds(targetCoordinateSpace) {
        return new Rectangle_1.Rectangle(0, 0, this._stageWidth, this._stageHeight);
    }
    /**
     * Calculates bounds for stage (always the stage dimensions)
     */
    calculateBounds() {
        return new Rectangle_1.Rectangle(0, 0, this._stageWidth, this._stageHeight);
    }
    /**
     * Stage cannot have a parent
     */
    get parent() {
        return null;
    }
    /**
     * Stage is always the stage
     */
    get stage() {
        return this;
    }
    /**
     * Stage is always the root
     */
    get root() {
        return this;
    }
    /**
     * Invalidates the entire stage for next frame
     */
    invalidate() {
        this._invalidateNextFrame = true;
        super.invalidate();
    }
    /**
     * Renders the entire stage
     */
    render(renderer) {
        // Clear the background
        this.renderBackground(renderer);
        // Render all children
        super.render(renderer);
        // Reset invalidation flag
        this._invalidateNextFrame = false;
    }
    /**
     * Renders the stage background
     */
    renderBackground(renderer) {
        renderer.save();
        // Fill with background color
        renderer.fillStyle = this.colorToString(this._backgroundColor);
        renderer.fillRect(0, 0, this._stageWidth, this._stageHeight);
        renderer.restore();
    }
    /**
     * Converts a color number to CSS color string
     */
    colorToString(color) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
    }
    /**
     * Updates the stage size
     */
    resize(width, height) {
        this._stageWidth = width;
        this._stageHeight = height;
        this.invalidate();
    }
    /**
     * Gets mouse position relative to stage
     */
    getMousePosition() {
        // TODO: Implement mouse tracking
        // This would be connected to the actual mouse input system
        return new Point_1.Point(0, 0);
    }
    /**
     * Updates the display list and prepares for rendering
     */
    updateDisplayList() {
        // Update all transforms in the display tree
        this.updateGlobalTransform();
        // TODO: Perform culling for off-screen objects
        // TODO: Sort by depth for proper z-ordering
    }
    /**
     * Performs hit testing from stage coordinates
     */
    getObjectUnderPoint(point) {
        return this.hitTestPoint(point.x, point.y) ? this : null;
    }
    /**
     * Stage transform is always identity
     */
    updateGlobalTransform() {
        // Stage transform is always identity matrix
        this._globalTransform.matrix.identity();
        this._globalTransformDirty = false;
        // Update children transforms
        for (const child of this._children) {
            child.updateGlobalTransform();
        }
    }
}
exports.Stage = Stage;
