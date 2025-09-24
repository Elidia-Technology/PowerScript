/**
 * PowerScript CanvasRenderer - Canvas 2D API rendering implementation
 * 
 * Provides hardware-accelerated 2D rendering using the HTML5 Canvas API.
 * Optimized for vector graphics and display list rendering.
 */

import { IRenderer, IRenderContext, IRenderStats, IRendererConfig } from './IRenderer';
import { DisplayObject } from '../display/DisplayObject';
import { DisplayObjectContainer } from '../display/DisplayObjectContainer';
import { Sprite } from '../display/Sprite';
import { Shape } from '../display/Shape';
import { Stage } from '../display/Stage';
import { Graphics } from '../Graphics';
import { Matrix } from '../geom/Matrix';

export class CanvasRenderer implements IRenderer {
    private _canvas: HTMLCanvasElement | null = null;
    private _context: CanvasRenderingContext2D | null = null;
    private _width: number = 0;
    private _height: number = 0;
    private _pixelRatio: number = 1;
    private _isInitialized: boolean = false;
    
    // Render statistics
    private _stats: IRenderStats = {
        drawCalls: 0,
        triangles: 0,
        textureBinds: 0,
        renderTime: 0,
        frameRate: 0
    };
    
    // Performance tracking
    private _frameStartTime: number = 0;
    private _frameCount: number = 0;
    private _lastFpsUpdate: number = 0;
    
    // Transform stack for hierarchical rendering
    private _transformStack: Matrix[] = [];
    private _alphaStack: number[] = [];
    
    constructor(private _config: IRendererConfig = {}) {
        // Set default configuration
        this._config = {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
            ...this._config
        };
    }

    /**
     * Initialize the renderer with a canvas context
     */
    public async initialize(renderContext: IRenderContext): Promise<void> {
        this._canvas = renderContext.canvas;
        this._width = renderContext.width;
        this._height = renderContext.height;
        this._pixelRatio = renderContext.pixelRatio || window.devicePixelRatio || 1;

        // Get 2D context with configuration
        const contextOptions: CanvasRenderingContext2DSettings = {
            alpha: this._config.alpha !== false,
            desynchronized: true, // Allow optimizations
        };

        this._context = this._canvas.getContext('2d', contextOptions);
        
        if (!this._context) {
            throw new Error('Failed to get Canvas 2D rendering context');
        }

        // Configure canvas for high DPI displays
        this._canvas.width = this._width * this._pixelRatio;
        this._canvas.height = this._height * this._pixelRatio;
        
        // Set up high DPI display support (only in browser environment)
        if (this._canvas.style) {
            this._canvas.style.width = `${this._width}px`;
            this._canvas.style.height = `${this._height}px`;
        }

        // Scale context to match pixel ratio
        this._context.scale(this._pixelRatio, this._pixelRatio);

        // Set initial context state
        this._context.imageSmoothingEnabled = this._config.antialias !== false;
        this._context.textAlign = 'left';
        this._context.textBaseline = 'top';

        this._isInitialized = true;
    }

    /**
     * Render a display object hierarchy
     */
    public render(displayObject: DisplayObject): void {
        if (!this._isInitialized || !this._context) {
            throw new Error('Renderer not initialized');
        }

        this._frameStartTime = performance.now();
        this.resetStats();

        // Save initial context state
        this._context.save();
        
        // Clear transform and alpha stacks
        this._transformStack.length = 0;
        this._alphaStack.length = 0;
        this._alphaStack.push(1.0);

        try {
            // Render the display object tree
            this.renderDisplayObject(displayObject);
        } finally {
            // Restore initial context state
            this._context.restore();
        }

        // Update performance statistics
        this._stats.renderTime = performance.now() - this._frameStartTime;
        this.updateFrameRate();
    }

    /**
     * Clear the render target
     */
    public clear(color: number = 0xFFFFFF, alpha: number = 1): void {
        if (!this._context) return;

        if (alpha < 1 || this._config.alpha) {
            // Clear with transparency
            this._context.clearRect(0, 0, this._width, this._height);
        }

        if (alpha > 0) {
            // Fill with background color
            this._context.save();
            this._context.globalAlpha = alpha;
            this._context.fillStyle = this.colorToString(color);
            this._context.fillRect(0, 0, this._width, this._height);
            this._context.restore();
        }
    }

    /**
     * Resize the render target
     */
    public resize(width: number, height: number): void {
        if (!this._canvas || !this._context) return;

        this._width = width;
        this._height = height;

        // Update canvas size
        this._canvas.width = width * this._pixelRatio;
        this._canvas.height = height * this._pixelRatio;
        
        // Update CSS size (only in browser environment)
        if (this._canvas.style) {
            this._canvas.style.width = `${width}px`;
            this._canvas.style.height = `${height}px`;
        }

        // Rescale context
        this._context.scale(this._pixelRatio, this._pixelRatio);
    }

    /**
     * Set the viewport for rendering
     */
    public setViewport(x: number, y: number, width: number, height: number): void {
        if (!this._context) return;

        // Canvas 2D doesn't have explicit viewport, use clipping
        this._context.save();
        this._context.beginPath();
        this._context.rect(x, y, width, height);
        this._context.clip();
    }

    /**
     * Get current render statistics
     */
    public getStats(): IRenderStats {
        return { ...this._stats };
    }

    /**
     * Reset render statistics
     */
    public resetStats(): void {
        this._stats.drawCalls = 0;
        this._stats.triangles = 0;
        this._stats.textureBinds = 0;
    }

    /**
     * Dispose of renderer resources
     */
    public dispose(): void {
        this._canvas = null;
        this._context = null;
        this._isInitialized = false;
        this._transformStack.length = 0;
        this._alphaStack.length = 0;
    }

    /**
     * Check if renderer is initialized
     */
    public get isInitialized(): boolean {
        return this._isInitialized;
    }

    /**
     * Get the renderer type
     */
    public get type(): 'canvas2d' | 'webgl' | 'webgl2' {
        return 'canvas2d';
    }

    /**
     * Get the rendering context
     */
    public get context(): CanvasRenderingContext2D | null {
        return this._context;
    }

    // Private rendering methods

    /**
     * Render a display object recursively
     */
    private renderDisplayObject(displayObject: DisplayObject): void {
        if (!displayObject.visible || displayObject.alpha <= 0) {
            return;
        }

        this._context!.save();

        // Apply transform
        const transform = displayObject.transform.matrix;
        this._context!.transform(
            transform.a, transform.b, transform.c,
            transform.d, transform.tx, transform.ty
        );

        // Apply alpha
        if (displayObject.alpha !== 1) {
            this._context!.globalAlpha *= displayObject.alpha;
        }

        // Render based on display object type
        if (displayObject instanceof Stage) {
            this.renderStage(displayObject);
        } else if (displayObject instanceof Sprite) {
            this.renderSprite(displayObject);
        } else if (displayObject instanceof Shape) {
            this.renderShape(displayObject);
        }

        // Render children for containers
        if (displayObject instanceof DisplayObjectContainer) {
            this.renderContainer(displayObject);
        }

        this._context!.restore();
    }

    /**
     * Render a Stage object
     */
    private renderStage(stage: Stage): void {
        // Stage background is rendered by clear() method
        // Just render children
    }

    /**
     * Render a Sprite object
     */
    private renderSprite(sprite: Sprite): void {
        // Render graphics
        this.renderGraphics(sprite.graphics);
    }

    /**
     * Render a Shape object
     */
    private renderShape(shape: Shape): void {
        // Render graphics
        this.renderGraphics(shape.graphics);
    }

    /**
     * Render children of a container
     */
    private renderContainer(container: DisplayObjectContainer): void {
        for (let i = 0; i < container.numChildren; i++) {
            const child = container.getChildAt(i);
            this.renderDisplayObject(child);
        }
    }

    /**
     * Render Graphics drawing commands
     */
    private renderGraphics(graphics: Graphics): void {
        if (!this._context) return;

        const commands = (graphics as any)._commands;
        if (!commands || commands.length === 0) return;

        this._context.beginPath();
        let hasFill = false;
        let hasStroke = false;

        for (const command of commands) {
            switch (command.type) {
                case 'beginFill':
                    hasFill = true;
                    this.applyFill(command.data.fill);
                    break;
                    
                case 'endFill':
                    if (hasFill) {
                        this._context.fill();
                        hasFill = false;
                    }
                    break;
                    
                case 'lineStyle':
                    hasStroke = command.data.stroke !== null;
                    this.applyStroke(command.data.stroke);
                    break;
                    
                case 'moveTo':
                    this._context.moveTo(command.data.x, command.data.y);
                    break;
                    
                case 'lineTo':
                    this._context.lineTo(command.data.x, command.data.y);
                    break;
                    
                case 'curveTo':
                    this._context.quadraticCurveTo(
                        command.data.controlX, command.data.controlY,
                        command.data.anchorX, command.data.anchorY
                    );
                    break;
                    
                case 'drawRect':
                    this._context.rect(
                        command.data.x, command.data.y,
                        command.data.width, command.data.height
                    );
                    break;
                    
                case 'drawRoundRect':
                    this.drawRoundRect(
                        command.data.x, command.data.y,
                        command.data.width, command.data.height,
                        command.data.radiusX, command.data.radiusY
                    );
                    break;
                    
                case 'drawCircle':
                    this._context.arc(
                        command.data.x, command.data.y, command.data.radius,
                        0, Math.PI * 2
                    );
                    break;
                    
                case 'drawEllipse':
                    this._context.ellipse(
                        command.data.x + command.data.width / 2,
                        command.data.y + command.data.height / 2,
                        command.data.width / 2, command.data.height / 2,
                        0, 0, Math.PI * 2
                    );
                    break;
            }
        }

        // Final render
        if (hasFill) {
            this._context.fill();
        }
        if (hasStroke) {
            this._context.stroke();
        }

        this._stats.drawCalls++;
    }

    /**
     * Apply fill style from graphics command
     */
    private applyFill(fill: any): void {
        if (!fill || !this._context) return;

        switch (fill.type) {
            case 'solid':
                this._context.fillStyle = this.colorToString(fill.color, fill.alpha);
                break;
            case 'gradient':
                // TODO: Implement gradient fills
                console.warn('Gradient fills not yet implemented in Canvas renderer');
                break;
            case 'bitmap':
                // TODO: Implement bitmap fills
                console.warn('Bitmap fills not yet implemented in Canvas renderer');
                break;
        }
    }

    /**
     * Apply stroke style from graphics command
     */
    private applyStroke(stroke: any): void {
        if (!stroke || !this._context) {
            this._context!.strokeStyle = 'transparent';
            this._context!.lineWidth = 0;
            return;
        }

        this._context.strokeStyle = this.colorToString(stroke.color, stroke.alpha);
        this._context.lineWidth = stroke.thickness;
        this._context.lineCap = stroke.caps;
        this._context.lineJoin = stroke.joints;
        this._context.miterLimit = stroke.miterLimit;
    }

    /**
     * Draw rounded rectangle using Canvas API
     */
    private drawRoundRect(
        x: number, y: number, width: number, height: number,
        radiusX: number, radiusY: number
    ): void {
        if (!this._context) return;

        const ctx = this._context;
        ctx.beginPath();
        ctx.moveTo(x + radiusX, y);
        ctx.lineTo(x + width - radiusX, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radiusY);
        ctx.lineTo(x + width, y + height - radiusY);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radiusX, y + height);
        ctx.lineTo(x + radiusX, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radiusY);
        ctx.lineTo(x, y + radiusY);
        ctx.quadraticCurveTo(x, y, x + radiusX, y);
        ctx.closePath();
    }

    /**
     * Convert color number to CSS color string
     */
    private colorToString(color: number, alpha: number = 1): string {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Update frame rate statistics
     */
    private updateFrameRate(): void {
        this._frameCount++;
        const now = performance.now();
        
        if (now - this._lastFpsUpdate >= 1000) {
            this._stats.frameRate = this._frameCount;
            this._frameCount = 0;
            this._lastFpsUpdate = now;
        }
    }
}