/**
 * PowerScript Stage - The root display object container
 * 
 * Stage represents the main drawing area and is the root of the display list.
 * It provides access to stage properties like dimensions, frame rate, and quality.
 */

import { DisplayObjectContainer } from './DisplayObjectContainer';
import { Rectangle } from '../geom/Rectangle';
import { Point } from '../geom/Point';

export class Stage extends DisplayObjectContainer {
    private _stageWidth: number = 800;
    private _stageHeight: number = 600;
    private _backgroundColor: number = 0xFFFFFF;
    private _frameRate: number = 60;
    private _quality: string = 'high';
    private _scaleMode: string = 'showAll';
    private _align: string = 'center';
    private _focus: any = null;
    private _invalidateNextFrame: boolean = false;

    constructor(width: number = 800, height: number = 600) {
        super();
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
    public get stageWidth(): number {
        return this._stageWidth;
    }

    public set stageWidth(value: number) {
        if (this._stageWidth !== value) {
            this._stageWidth = value;
            this.invalidate();
        }
    }

    /**
     * Gets the stage height
     */
    public get stageHeight(): number {
        return this._stageHeight;
    }

    public set stageHeight(value: number) {
        if (this._stageHeight !== value) {
            this._stageHeight = value;
            this.invalidate();
        }
    }

    /**
     * Gets or sets the background color
     */
    public get backgroundColor(): number {
        return this._backgroundColor;
    }

    public set backgroundColor(value: number) {
        this._backgroundColor = value;
        this.invalidate();
    }

    /**
     * Gets or sets the frame rate
     */
    public get frameRate(): number {
        return this._frameRate;
    }

    public set frameRate(value: number) {
        this._frameRate = Math.max(1, Math.min(120, value));
    }

    /**
     * Gets or sets the rendering quality
     */
    public get quality(): string {
        return this._quality;
    }

    public set quality(value: string) {
        this._quality = value;
    }

    /**
     * Gets or sets the scale mode
     */
    public get scaleMode(): string {
        return this._scaleMode;
    }

    public set scaleMode(value: string) {
        this._scaleMode = value;
    }

    /**
     * Gets or sets the stage alignment
     */
    public get align(): string {
        return this._align;
    }

    public set align(value: string) {
        this._align = value;
    }

    /**
     * Gets or sets the focus object
     */
    public get focus(): any {
        return this._focus;
    }

    public set focus(value: any) {
        this._focus = value;
    }

    /**
     * Gets the stage bounds
     */
    public getBounds(targetCoordinateSpace?: DisplayObjectContainer): Rectangle {
        return new Rectangle(0, 0, this._stageWidth, this._stageHeight);
    }

    /**
     * Calculates bounds for stage (always the stage dimensions)
     */
    protected calculateBounds(): Rectangle {
        return new Rectangle(0, 0, this._stageWidth, this._stageHeight);
    }

    /**
     * Stage cannot have a parent
     */
    public get parent(): DisplayObjectContainer | null {
        return null;
    }

    /**
     * Stage is always the stage
     */
    public get stage(): Stage {
        return this;
    }

    /**
     * Stage is always the root
     */
    public get root(): Stage {
        return this;
    }

    /**
     * Invalidates the entire stage for next frame
     */
    public invalidate(): void {
        this._invalidateNextFrame = true;
        super.invalidate();
    }

    /**
     * Renders the entire stage
     */
    public render(renderer: any): void {
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
    private renderBackground(renderer: any): void {
        renderer.save();
        
        // Fill with background color
        renderer.fillStyle = this.colorToString(this._backgroundColor);
        renderer.fillRect(0, 0, this._stageWidth, this._stageHeight);
        
        renderer.restore();
    }

    /**
     * Converts a color number to CSS color string
     */
    private colorToString(color: number): string {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Updates the stage size
     */
    public resize(width: number, height: number): void {
        this._stageWidth = width;
        this._stageHeight = height;
        this.invalidate();
    }

    /**
     * Gets mouse position relative to stage
     */
    public getMousePosition(): Point {
        // TODO: Implement mouse tracking
        // This would be connected to the actual mouse input system
        return new Point(0, 0);
    }

    /**
     * Updates the display list and prepares for rendering
     */
    public updateDisplayList(): void {
        // Update all transforms in the display tree
        this.updateGlobalTransform();
        
        // TODO: Perform culling for off-screen objects
        // TODO: Sort by depth for proper z-ordering
    }

    /**
     * Performs hit testing from stage coordinates
     */
    public getObjectUnderPoint(point: Point): DisplayObjectContainer | null {
        return this.hitTestPoint(point.x, point.y) ? this : null;
    }

    /**
     * Stage transform is always identity
     */
    protected updateGlobalTransform(): void {
        // Stage transform is always identity matrix
        this._globalTransform.matrix.identity();
        this._globalTransformDirty = false;
        
        // Update children transforms
        for (const child of this._children) {
            (child as any).updateGlobalTransform();
        }
    }
}