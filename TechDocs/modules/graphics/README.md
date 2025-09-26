/**
 * # Graphics Module Documentation
 * 
 * ## Overview
 * 
 * **Module Name:** PowerScript Graphics  
 * **Package:** eips  
 * **Phase:** 5  
 * **Description:** Comprehensive 2D/3D graphics rendering system with ActionScript 3-style vector drawing API and modern Canvas/WebGL backend support.
 *
 * ## Purpose
 * 
 * The Graphics module provides:
 * - Vector drawing capabilities with fills, strokes, and shapes
 * - ActionScript 3-style display object hierarchy (Stage, DisplayObject, Sprite, etc.)
 * - Canvas and WebGL rendering backends
 * - Advanced graphics features (gradients, bitmap fills, transformations)
 * - Animation and motion graphics support
 * - Image processing and manipulation
 * - Text rendering and typography
 * - 3D graphics support with matrices and transformations
 *
 * ## Dependencies
 * 
 * ### Core Dependencies
 * - PowerScript Core module
 * - Node.js >= 18.0.0
 * - Canvas API (browser) or node-canvas (Node.js)
 * 
 * ### Optional Dependencies
 * - `canvas` - For server-side rendering in Node.js
 * - `gl` - For WebGL support in Node.js
 * - `sharp` - For advanced image processing
 * - `node-webgl` - For 3D graphics in Node.js
 *
 * ## Main Classes
 */

/**
 * ## Graphics Class
 * 
 * Vector drawing API for display objects that provides ActionScript 3-style
 * drawing capabilities with modern backend support.
 * 
 * ### Constructor
 * ```typescript
 * const graphics = new Graphics();
 * ```
 * 
 * ### Drawing Commands
 */

/**
 * Clear all graphics commands and reset drawing state
 * 
 * @return {void}
 * 
 * Example:
 * <pre>
 * import { Graphics } from "eips";
 * 
 * const graphics = new Graphics();
 * graphics.beginFill(0xFF0000);
 * graphics.drawRect(0, 0, 100, 100);
 * graphics.clear(); // Removes all drawing commands
 * </pre>
 */
clear(): void

/**
 * Begin a solid color fill
 * 
 * @param {Number} color - Fill color in hexadecimal (default: 0x000000)
 * @param {Number} alpha - Fill alpha transparency (default: 1.0)
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0xFF0000, 0.8); // Red with 80% opacity
 * graphics.drawRect(10, 10, 50, 50);
 * graphics.endFill();
 * </pre>
 */
beginFill(color?: number, alpha?: number): void

/**
 * Begin a gradient fill
 * 
 * @param {String} type - Gradient type: 'linear' or 'radial'
 * @param {Number[]} colors - Array of gradient colors
 * @param {Number[]} alphas - Array of alpha values for each color
 * @param {Number[]} ratios - Array of color stop ratios (0-255)
 * @param {Matrix} matrix - Optional transformation matrix
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginGradientFill(
 *   'linear',
 *   [0xFF0000, 0x00FF00, 0x0000FF],  // red, green, blue
 *   [1.0, 1.0, 1.0],                 // full opacity
 *   [0, 128, 255]                    // color stops
 * );
 * graphics.drawRect(0, 0, 200, 100);
 * graphics.endFill();
 * </pre>
 */
beginGradientFill(
  type: 'linear' | 'radial',
  colors: number[],
  alphas: number[],
  ratios: number[],
  matrix?: Matrix
): void

/**
 * Begin bitmap fill using an image
 * 
 * @param {Object} bitmap - Image data or HTMLImageElement
 * @param {Matrix} matrix - Optional transformation matrix
 * @param {Boolean} repeat - Whether to repeat the bitmap (default: true)
 * @param {Boolean} smooth - Whether to smooth the bitmap (default: false)
 * @return {void}
 * 
 * Example:
 * <pre>
 * const image = new Image();
 * image.src = 'texture.png';
 * 
 * image.onload = () => {
 *   graphics.beginBitmapFill(image, null, true, true);
 *   graphics.drawRect(0, 0, 300, 200);
 *   graphics.endFill();
 * };
 * </pre>
 */
beginBitmapFill(
  bitmap: any,
  matrix?: Matrix,
  repeat?: boolean,
  smooth?: boolean
): void

/**
 * End the current fill
 * 
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0x00FF00);
 * graphics.drawCircle(50, 50, 25);
 * graphics.endFill(); // Required to complete the fill
 * </pre>
 */
endFill(): void

/**
 * Set line style for strokes
 * 
 * @param {Number} thickness - Line thickness (default: 1)
 * @param {Number} color - Line color (default: 0x000000)
 * @param {Number} alpha - Line alpha (default: 1.0)
 * @param {String} caps - Line caps: 'none', 'round', 'square' (default: 'round')
 * @param {String} joints - Line joints: 'miter', 'round', 'bevel' (default: 'round')
 * @param {Number} miterLimit - Miter limit for miter joints (default: 3)
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.lineStyle(3, 0xFF0000, 1.0, 'round', 'round');
 * graphics.moveTo(10, 10);
 * graphics.lineTo(100, 100);
 * </pre>
 */
lineStyle(
  thickness?: number,
  color?: number,
  alpha?: number,
  caps?: 'none' | 'round' | 'square',
  joints?: 'miter' | 'round' | 'bevel',
  miterLimit?: number
): void

/**
 * Move drawing cursor to specified position
 * 
 * @param {Number} x - X coordinate
 * @param {Number} y - Y coordinate
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.lineStyle(2, 0x000000);
 * graphics.moveTo(50, 50);
 * graphics.lineTo(150, 50);
 * graphics.lineTo(100, 150);
 * graphics.lineTo(50, 50); // Complete triangle
 * </pre>
 */
moveTo(x: number, y: number): void

/**
 * Draw line to specified position
 * 
 * @param {Number} x - X coordinate
 * @param {Number} y - Y coordinate
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.lineStyle(1, 0x0000FF);
 * graphics.moveTo(0, 0);
 * graphics.lineTo(100, 0);
 * graphics.lineTo(100, 100);
 * graphics.lineTo(0, 100);
 * graphics.lineTo(0, 0); // Draw a square outline
 * </pre>
 */
lineTo(x: number, y: number): void

/**
 * Draw quadratic curve to specified position
 * 
 * @param {Number} controlX - Control point X coordinate
 * @param {Number} controlY - Control point Y coordinate
 * @param {Number} anchorX - End point X coordinate
 * @param {Number} anchorY - End point Y coordinate
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.lineStyle(2, 0x00FF00);
 * graphics.moveTo(50, 100);
 * graphics.curveTo(100, 50, 150, 100); // Draw a curve
 * </pre>
 */
curveTo(controlX: number, controlY: number, anchorX: number, anchorY: number): void

/**
 * Draw cubic Bezier curve to specified position
 * 
 * @param {Number} control1X - First control point X coordinate
 * @param {Number} control1Y - First control point Y coordinate
 * @param {Number} control2X - Second control point X coordinate
 * @param {Number} control2Y - Second control point Y coordinate
 * @param {Number} anchorX - End point X coordinate
 * @param {Number} anchorY - End point Y coordinate
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.lineStyle(2, 0xFF00FF);
 * graphics.moveTo(50, 100);
 * graphics.cubicCurveTo(75, 50, 125, 50, 150, 100); // S-curve
 * </pre>
 */
cubicCurveTo(
  control1X: number, control1Y: number,
  control2X: number, control2Y: number,
  anchorX: number, anchorY: number
): void

/**
 * Draw a rectangle
 * 
 * @param {Number} x - X coordinate of top-left corner
 * @param {Number} y - Y coordinate of top-left corner
 * @param {Number} width - Rectangle width
 * @param {Number} height - Rectangle height
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0xFF0000);
 * graphics.drawRect(10, 10, 100, 50);
 * graphics.endFill();
 * </pre>
 */
drawRect(x: number, y: number, width: number, height: number): void

/**
 * Draw a rounded rectangle
 * 
 * @param {Number} x - X coordinate of top-left corner
 * @param {Number} y - Y coordinate of top-left corner
 * @param {Number} width - Rectangle width
 * @param {Number} height - Rectangle height
 * @param {Number} ellipseWidth - Corner radius width
 * @param {Number} ellipseHeight - Corner radius height (optional, defaults to ellipseWidth)
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0x00FF00);
 * graphics.drawRoundRect(20, 20, 100, 60, 10, 10);
 * graphics.endFill();
 * </pre>
 */
drawRoundRect(
  x: number, y: number,
  width: number, height: number,
  ellipseWidth: number,
  ellipseHeight?: number
): void

/**
 * Draw a circle
 * 
 * @param {Number} x - Center X coordinate
 * @param {Number} y - Center Y coordinate
 * @param {Number} radius - Circle radius
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0x0000FF, 0.7);
 * graphics.drawCircle(100, 100, 50);
 * graphics.endFill();
 * </pre>
 */
drawCircle(x: number, y: number, radius: number): void

/**
 * Draw an ellipse
 * 
 * @param {Number} x - Center X coordinate
 * @param {Number} y - Center Y coordinate
 * @param {Number} width - Ellipse width
 * @param {Number} height - Ellipse height
 * @return {void}
 * 
 * Example:
 * <pre>
 * graphics.beginFill(0xFFFF00);
 * graphics.drawEllipse(150, 100, 80, 40);
 * graphics.endFill();
 * </pre>
 */
drawEllipse(x: number, y: number, width: number, height: number): void

/**
 * ## DisplayObject Class
 * 
 * Base class for all display objects in the graphics system.
 * 
 * ### Constructor
 * ```typescript
 * const displayObject = new DisplayObject();
 * ```
 * 
 * ### Properties
 * - `x: number` - X coordinate position
 * - `y: number` - Y coordinate position
 * - `width: number` - Object width
 * - `height: number` - Object height
 * - `scaleX: number` - Horizontal scale factor
 * - `scaleY: number` - Vertical scale factor
 * - `rotation: number` - Rotation in degrees
 * - `alpha: number` - Alpha transparency (0.0 to 1.0)
 * - `visible: boolean` - Visibility flag
 * - `parent: DisplayObjectContainer` - Parent container
 * 
 * ### Methods
 */

/**
 * Get object bounds
 * 
 * @param {DisplayObject} targetCoordinateSpace - Coordinate space for bounds
 * @return {Rectangle} Bounding rectangle
 * 
 * Example:
 * <pre>
 * const bounds = displayObject.getBounds(stage);
 * console.log('Object bounds:', bounds.width, bounds.height);
 * </pre>
 */
getBounds(targetCoordinateSpace?: DisplayObject): Rectangle

/**
 * Convert local point to global coordinates
 * 
 * @param {Point} point - Local point to convert
 * @return {Point} Global point
 * 
 * Example:
 * <pre>
 * const localPoint = new Point(50, 50);
 * const globalPoint = displayObject.localToGlobal(localPoint);
 * </pre>
 */
localToGlobal(point: Point): Point

/**
 * Convert global point to local coordinates
 * 
 * @param {Point} point - Global point to convert
 * @return {Point} Local point
 * 
 * Example:
 * <pre>
 * const globalPoint = new Point(200, 150);
 * const localPoint = displayObject.globalToLocal(globalPoint);
 * </pre>
 */
globalToLocal(point: Point): Point

/**
 * ## Sprite Class
 * 
 * Display object container that can contain graphics and other display objects.
 * 
 * ### Constructor
 * ```typescript
 * const sprite = new Sprite();
 * ```
 * 
 * ### Properties
 * - `graphics: Graphics` - Graphics object for vector drawing
 * - `numChildren: number` - Number of child display objects
 * 
 * ### Methods
 */

/**
 * Add child display object
 * 
 * @param {DisplayObject} child - Child to add
 * @return {DisplayObject} The added child
 * 
 * Example:
 * <pre>
 * const sprite = new Sprite();
 * const childSprite = new Sprite();
 * sprite.addChild(childSprite);
 * </pre>
 */
addChild(child: DisplayObject): DisplayObject

/**
 * Remove child display object
 * 
 * @param {DisplayObject} child - Child to remove
 * @return {DisplayObject} The removed child
 * 
 * Example:
 * <pre>
 * sprite.removeChild(childSprite);
 * </pre>
 */
removeChild(child: DisplayObject): DisplayObject

/**
 * Get child at index
 * 
 * @param {Number} index - Child index
 * @return {DisplayObject} Child at index
 * 
 * Example:
 * <pre>
 * const firstChild = sprite.getChildAt(0);
 * </pre>
 */
getChildAt(index: number): DisplayObject

/**
 * ## Stage Class
 * 
 * Root display object that represents the main display area.
 * 
 * ### Constructor
 * ```typescript
 * const stage = new Stage(canvas);
 * ```
 * 
 * ### Properties
 * - `stageWidth: number` - Stage width in pixels
 * - `stageHeight: number` - Stage height in pixels
 * - `frameRate: number` - Target frame rate for animations
 * - `quality: string` - Render quality setting
 * 
 * ### Methods
 */

/**
 * Render the stage and all its children
 * 
 * @return {void}
 * 
 * Example:
 * <pre>
 * const stage = new Stage(canvas);
 * 
 * // Add objects to stage
 * const sprite = new Sprite();
 * sprite.graphics.beginFill(0xFF0000);
 * sprite.graphics.drawCircle(0, 0, 50);
 * sprite.graphics.endFill();
 * stage.addChild(sprite);
 * 
 * // Render the stage
 * stage.render();
 * </pre>
 */
render(): void

/**
 * Start animation loop
 * 
 * @return {void}
 * 
 * Example:
 * <pre>
 * stage.startAnimation();
 * 
 * // Animation will run at specified frameRate
 * stage.addEventListener('enterFrame', (event) => {
 *   // Update animations here
 *   sprite.rotation += 5;
 * });
 * </pre>
 */
startAnimation(): void

/**
 * Stop animation loop
 * 
 * @return {void}
 * 
 * Example:
 * <pre>
 * stage.stopAnimation();
 * </pre>
 */
stopAnimation(): void

/**
 * ## Usage Examples
 * 
 * ### Basic Drawing
 * ```typescript
 * import { Sprite, Stage } from "eips";
 * 
 * // Create stage and sprite
 * const canvas = document.getElementById('myCanvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Draw a red circle
 * sprite.graphics.beginFill(0xFF0000);
 * sprite.graphics.drawCircle(50, 50, 25);
 * sprite.graphics.endFill();
 * 
 * // Add to stage and render
 * stage.addChild(sprite);
 * stage.render();
 * ```
 * 
 * ### Complex Graphics
 * ```typescript
 * import { Sprite, Stage, Matrix } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Create gradient fill
 * sprite.graphics.beginGradientFill(
 *   'linear',
 *   [0xFF0000, 0x00FF00, 0x0000FF],
 *   [1.0, 1.0, 1.0],
 *   [0, 128, 255]
 * );
 * sprite.graphics.drawRect(0, 0, 200, 100);
 * sprite.graphics.endFill();
 * 
 * // Add outline
 * sprite.graphics.lineStyle(3, 0x000000);
 * sprite.graphics.drawRect(0, 0, 200, 100);
 * 
 * stage.addChild(sprite);
 * stage.render();
 * ```
 * 
 * ### Animation
 * ```typescript
 * import { Sprite, Stage } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Create animated shape
 * sprite.graphics.beginFill(0x00FF00);
 * sprite.graphics.drawCircle(0, 0, 30);
 * sprite.graphics.endFill();
 * 
 * sprite.x = 100;
 * sprite.y = 100;
 * 
 * stage.addChild(sprite);
 * 
 * // Animation loop
 * let angle = 0;
 * stage.startAnimation();
 * 
 * stage.addEventListener('enterFrame', () => {
 *   angle += 0.1;
 *   sprite.x = 200 + Math.cos(angle) * 100;
 *   sprite.y = 150 + Math.sin(angle) * 50;
 *   sprite.rotation += 2;
 * });
 * ```
 * 
 * ### Interactive Graphics
 * ```typescript
 * import { Sprite, Stage, Rectangle } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * 
 * // Create interactive button
 * const button = new Sprite();
 * button.graphics.beginFill(0x3366CC);
 * button.graphics.drawRoundRect(0, 0, 120, 40, 8);
 * button.graphics.endFill();
 * 
 * button.x = 50;
 * button.y = 50;
 * 
 * // Add mouse events
 * button.addEventListener('mouseOver', () => {
 *   button.graphics.clear();
 *   button.graphics.beginFill(0x4477DD);
 *   button.graphics.drawRoundRect(0, 0, 120, 40, 8);
 *   button.graphics.endFill();
 *   stage.render();
 * });
 * 
 * button.addEventListener('mouseOut', () => {
 *   button.graphics.clear();
 *   button.graphics.beginFill(0x3366CC);
 *   button.graphics.drawRoundRect(0, 0, 120, 40, 8);
 *   button.graphics.endFill();
 *   stage.render();
 * });
 * 
 * button.addEventListener('click', () => {
 *   console.log('Button clicked!');
 * });
 * 
 * stage.addChild(button);
 * stage.render();
 * ```
 * 
 * ### Custom Shapes
 * ```typescript
 * import { Sprite, Stage, Point } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Draw custom star shape
 * function drawStar(graphics, centerX, centerY, points, innerRadius, outerRadius) {
 *   const angle = Math.PI / points;
 *   
 *   graphics.moveTo(
 *     centerX + Math.cos(0) * outerRadius,
 *     centerY + Math.sin(0) * outerRadius
 *   );
 *   
 *   for (let i = 0; i < points * 2; i++) {
 *     const radius = (i % 2 === 0) ? outerRadius : innerRadius;
 *     const x = centerX + Math.cos(i * angle) * radius;
 *     const y = centerY + Math.sin(i * angle) * radius;
 *     graphics.lineTo(x, y);
 *   }
 * }
 * 
 * sprite.graphics.beginFill(0xFFD700);
 * sprite.graphics.lineStyle(2, 0xFF6600);
 * drawStar(sprite.graphics, 100, 100, 5, 30, 60);
 * sprite.graphics.endFill();
 * 
 * stage.addChild(sprite);
 * stage.render();
 * ```
 * 
 * ### Bitmap Graphics
 * ```typescript
 * import { Sprite, Stage } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Load and use bitmap fill
 * const image = new Image();
 * image.src = 'texture.jpg';
 * 
 * image.onload = () => {
 *   sprite.graphics.beginBitmapFill(image, null, true, true);
 *   sprite.graphics.drawRect(0, 0, 200, 150);
 *   sprite.graphics.endFill();
 *   
 *   stage.addChild(sprite);
 *   stage.render();
 * };
 * ```
 * 
 * ### 3D Transformations
 * ```typescript
 * import { Sprite, Stage, Matrix } from "eips";
 * 
 * const canvas = document.getElementById('canvas');
 * const stage = new Stage(canvas);
 * const sprite = new Sprite();
 * 
 * // Create 3D-like transformation
 * sprite.graphics.beginFill(0x6699FF);
 * sprite.graphics.drawRect(-50, -25, 100, 50);
 * sprite.graphics.endFill();
 * 
 * sprite.x = 200;
 * sprite.y = 150;
 * 
 * // Apply perspective transformation
 * const matrix = new Matrix();
 * matrix.scale(1, 0.5); // Flatten vertically
 * matrix.rotate(Math.PI / 6); // Rotate 30 degrees
 * sprite.transform.matrix = matrix;
 * 
 * stage.addChild(sprite);
 * stage.render();
 * ```
 * 
 * ## Performance Tips
 * 
 * 1. **Minimize Graphics Updates**: Only redraw when necessary
 * 2. **Use Object Pooling**: Reuse display objects instead of creating new ones
 * 3. **Batch Operations**: Group multiple drawing commands together
 * 4. **Optimize Complex Shapes**: Use simpler shapes when possible
 * 5. **Cache Complex Graphics**: Use cacheAsBitmap for static content
 * 
 * ```typescript
 * // Enable bitmap caching for better performance
 * sprite.cacheAsBitmap = true;
 * 
 * // Use bounds checking for hit detection
 * if (sprite.getBounds().contains(mouseX, mouseY)) {
 *   // Handle interaction
 * }
 * 
 * // Optimize rendering by reducing calls
 * const needsRedraw = sprite.hasChanged();
 * if (needsRedraw) {
 *   stage.render();
 * }
 * ```
 */