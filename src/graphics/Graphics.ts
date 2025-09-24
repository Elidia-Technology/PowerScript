/**
 * PowerScript Graphics - Vector drawing API for display objects
 * 
 * Provides AS3-style vector drawing capabilities with modern Canvas/WebGL backend support.
 * Supports fills, strokes, shapes, paths, and bitmap fills.
 */

import { DisplayObject } from './display/DisplayObject';
import { Rectangle } from './geom/Rectangle';
import { Point } from './geom/Point';
import { Matrix } from './geom/Matrix';

export interface IFill {
    type: 'solid' | 'gradient' | 'bitmap';
    color?: number;
    alpha?: number;
    colors?: number[];
    alphas?: number[];
    ratios?: number[];
    matrix?: Matrix;
    bitmap?: any; // ImageData or HTMLImageElement
    smooth?: boolean;
    repeat?: boolean;
}

export interface IStroke {
    thickness: number;
    color: number;
    alpha: number;
    caps: 'none' | 'round' | 'square';
    joints: 'miter' | 'round' | 'bevel';
    miterLimit: number;
}

export interface IDrawCommand {
    type: string;
    data: any;
}

export class Graphics {
    private _parent: DisplayObject | null = null;
    private _commands: IDrawCommand[] = [];
    private _bounds: Rectangle = new Rectangle();
    private _boundsValid: boolean = false;
    private _currentFill: IFill | null = null;
    private _currentStroke: IStroke | null = null;
    private _currentPath: Point[] = [];
    private _pathClosed: boolean = false;

    constructor() {
        this.clear();
    }

    /**
     * Sets the parent display object
     */
    public setParent(parent: DisplayObject): void {
        this._parent = parent;
    }

    /**
     * Clears all graphics commands
     */
    public clear(): void {
        this._commands = [];
        this._currentPath = [];
        this._pathClosed = false;
        this._currentFill = null;
        this._currentStroke = null;
        this.invalidateBounds();
        this.invalidate();
    }

    /**
     * Begins a solid color fill
     */
    public beginFill(color: number = 0x000000, alpha: number = 1): void {
        this._currentFill = {
            type: 'solid',
            color: color,
            alpha: alpha
        };
        this.addCommand('beginFill', { fill: this._currentFill });
    }

    /**
     * Begins a gradient fill
     */
    public beginGradientFill(
        type: 'linear' | 'radial',
        colors: number[],
        alphas: number[],
        ratios: number[],
        matrix: Matrix | null = null
    ): void {
        this._currentFill = {
            type: 'gradient',
            colors: colors.slice(),
            alphas: alphas.slice(),
            ratios: ratios.slice(),
            matrix: matrix ? matrix.clone() : undefined
        };
        this.addCommand('beginGradientFill', { 
            gradientType: type,
            fill: this._currentFill 
        });
    }

    /**
     * Begins a bitmap fill
     */
    public beginBitmapFill(
        bitmap: any,
        matrix: Matrix | null = null,
        repeat: boolean = true,
        smooth: boolean = false
    ): void {
        this._currentFill = {
            type: 'bitmap',
            bitmap: bitmap,
            matrix: matrix ? matrix.clone() : undefined,
            repeat: repeat,
            smooth: smooth
        };
        this.addCommand('beginBitmapFill', { fill: this._currentFill });
    }

    /**
     * Ends the current fill
     */
    public endFill(): void {
        this._currentFill = null;
        this.addCommand('endFill', {});
    }

    /**
     * Sets line style for strokes
     */
    public lineStyle(
        thickness: number = NaN,
        color: number = 0x000000,
        alpha: number = 1,
        caps: 'none' | 'round' | 'square' = 'round',
        joints: 'miter' | 'round' | 'bevel' = 'round',
        miterLimit: number = 3
    ): void {
        if (isNaN(thickness) || thickness < 0) {
            this._currentStroke = null;
        } else {
            this._currentStroke = {
                thickness,
                color,
                alpha,
                caps,
                joints,
                miterLimit
            };
        }
        this.addCommand('lineStyle', { stroke: this._currentStroke });
    }

    /**
     * Moves the drawing cursor to a point
     */
    public moveTo(x: number, y: number): void {
        this._currentPath = [new Point(x, y)];
        this._pathClosed = false;
        this.addCommand('moveTo', { x, y });
        this.expandBounds(x, y);
    }

    /**
     * Draws a line to a point
     */
    public lineTo(x: number, y: number): void {
        this._currentPath.push(new Point(x, y));
        this.addCommand('lineTo', { x, y });
        this.expandBounds(x, y);
    }

    /**
     * Draws a curve to a point
     */
    public curveTo(controlX: number, controlY: number, anchorX: number, anchorY: number): void {
        this._currentPath.push(new Point(anchorX, anchorY));
        this.addCommand('curveTo', { controlX, controlY, anchorX, anchorY });
        this.expandBounds(controlX, controlY);
        this.expandBounds(anchorX, anchorY);
    }

    /**
     * Draws a rectangle
     */
    public drawRect(x: number, y: number, width: number, height: number): void {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.lineTo(x, y);
        this.addCommand('drawRect', { x, y, width, height });
    }

    /**
     * Draws a rounded rectangle
     */
    public drawRoundRect(
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        ellipseWidth: number, 
        ellipseHeight: number = NaN
    ): void {
        if (isNaN(ellipseHeight)) {
            ellipseHeight = ellipseWidth;
        }
        
        const radiusX = ellipseWidth / 2;
        const radiusY = ellipseHeight / 2;
        
        this.addCommand('drawRoundRect', { 
            x, y, width, height, 
            radiusX, radiusY 
        });
        this.expandBounds(x, y);
        this.expandBounds(x + width, y + height);
    }

    /**
     * Draws a circle
     */
    public drawCircle(x: number, y: number, radius: number): void {
        this.addCommand('drawCircle', { x, y, radius });
        this.expandBounds(x - radius, y - radius);
        this.expandBounds(x + radius, y + radius);
    }

    /**
     * Draws an ellipse
     */
    public drawEllipse(x: number, y: number, width: number, height: number): void {
        this.addCommand('drawEllipse', { x, y, width, height });
        this.expandBounds(x, y);
        this.expandBounds(x + width, y + height);
    }

    /**
     * Gets the bounds of all drawn graphics
     */
    public getBounds(): Rectangle {
        if (!this._boundsValid) {
            this.calculateBounds();
        }
        return this._bounds.clone();
    }

    /**
     * Tests if a point hits the drawn graphics
     */
    public hitTestPoint(x: number, y: number): boolean {
        // Simple bounds test first
        if (!this.getBounds().contains(x, y)) {
            return false;
        }

        // TODO: Implement precise hit testing based on actual drawn shapes
        // For now, just use bounds
        return true;
    }

    /**
     * Copies drawing commands from another Graphics object
     */
    public copyFrom(source: Graphics): void {
        this.clear();
        this._commands = source._commands.map(cmd => ({
            type: cmd.type,
            data: { ...cmd.data }
        }));
        this.invalidateBounds();
        this.invalidate();
    }

    /**
     * Renders the graphics using the provided renderer
     */
    public render(renderer: any): void {
        if (this._commands.length === 0) return;

        renderer.save();
        
        for (const command of this._commands) {
            this.executeCommand(renderer, command);
        }
        
        renderer.restore();
    }

    /**
     * Invalidates the graphics, marking for re-render
     */
    public invalidate(): void {
        // Don't call parent invalidate to avoid circular calls
        // The parent display object will handle invalidation appropriately
    }

    /**
     * Disposes of graphics resources
     */
    public dispose(): void {
        this.clear();
        this._parent = null;
    }

    // Private methods

    private addCommand(type: string, data: any): void {
        this._commands.push({ type, data });
        this.invalidateBounds();
        this.invalidate();
    }

    private invalidateBounds(): void {
        this._boundsValid = false;
    }

    private expandBounds(x: number, y: number): void {
        if (this._bounds.width === 0 && this._bounds.height === 0) {
            this._bounds.x = x;
            this._bounds.y = y;
            this._bounds.width = 0;
            this._bounds.height = 0;
        } else {
            const minX = Math.min(this._bounds.x, x);
            const minY = Math.min(this._bounds.y, y);
            const maxX = Math.max(this._bounds.x + this._bounds.width, x);
            const maxY = Math.max(this._bounds.y + this._bounds.height, y);
            
            this._bounds.x = minX;
            this._bounds.y = minY;
            this._bounds.width = maxX - minX;
            this._bounds.height = maxY - minY;
        }
    }

    private calculateBounds(): void {
        this._bounds = new Rectangle();
        
        // Iterate through commands and calculate bounds
        // This is a simplified version - a full implementation would
        // need to account for stroke thickness, line caps, etc.
        
        for (const command of this._commands) {
            switch (command.type) {
                case 'moveTo':
                case 'lineTo':
                    this.expandBounds(command.data.x, command.data.y);
                    break;
                case 'curveTo':
                    this.expandBounds(command.data.controlX, command.data.controlY);
                    this.expandBounds(command.data.anchorX, command.data.anchorY);
                    break;
                case 'drawRect':
                    this.expandBounds(command.data.x, command.data.y);
                    this.expandBounds(
                        command.data.x + command.data.width,
                        command.data.y + command.data.height
                    );
                    break;
                case 'drawCircle':
                    this.expandBounds(
                        command.data.x - command.data.radius,
                        command.data.y - command.data.radius
                    );
                    this.expandBounds(
                        command.data.x + command.data.radius,
                        command.data.y + command.data.radius
                    );
                    break;
                case 'drawEllipse':
                    this.expandBounds(command.data.x, command.data.y);
                    this.expandBounds(
                        command.data.x + command.data.width,
                        command.data.y + command.data.height
                    );
                    break;
            }
        }
        
        this._boundsValid = true;
    }

    private executeCommand(renderer: any, command: IDrawCommand): void {
        switch (command.type) {
            case 'beginFill':
                this.applyFill(renderer, command.data.fill);
                break;
            case 'lineStyle':
                this.applyStroke(renderer, command.data.stroke);
                break;
            case 'moveTo':
                renderer.moveTo(command.data.x, command.data.y);
                break;
            case 'lineTo':
                renderer.lineTo(command.data.x, command.data.y);
                break;
            case 'curveTo':
                renderer.quadraticCurveTo(
                    command.data.controlX, command.data.controlY,
                    command.data.anchorX, command.data.anchorY
                );
                break;
            case 'drawRect':
                renderer.rect(
                    command.data.x, command.data.y,
                    command.data.width, command.data.height
                );
                break;
            case 'drawCircle':
                renderer.arc(
                    command.data.x, command.data.y, command.data.radius,
                    0, Math.PI * 2
                );
                break;
            case 'endFill':
                renderer.fill();
                break;
        }
    }

    private applyFill(renderer: any, fill: IFill): void {
        if (!fill) return;
        
        switch (fill.type) {
            case 'solid':
                renderer.fillStyle = this.colorToString(fill.color!, fill.alpha!);
                break;
            case 'gradient':
                // TODO: Implement gradient fills
                console.warn('Gradient fills not yet implemented');
                break;
            case 'bitmap':
                // TODO: Implement bitmap fills
                console.warn('Bitmap fills not yet implemented');
                break;
        }
    }

    private applyStroke(renderer: any, stroke: IStroke | null): void {
        if (!stroke) {
            renderer.strokeStyle = 'transparent';
            renderer.lineWidth = 0;
            return;
        }
        
        renderer.strokeStyle = this.colorToString(stroke.color, stroke.alpha);
        renderer.lineWidth = stroke.thickness;
        renderer.lineCap = stroke.caps;
        renderer.lineJoin = stroke.joints;
        renderer.miterLimit = stroke.miterLimit;
    }

    private colorToString(color: number, alpha: number = 1): string {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}