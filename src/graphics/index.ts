/**
 * PowerScript Graphics Module - Advanced Graphics & Rendering System
 * 
 * This module provides AS3-style display list architecture with modern rendering backends.
 * Supports Canvas 2D and WebGL rendering with a familiar PowerScript display hierarchy.
 */

// Core display objects (implemented)
export { DisplayObject } from './display/DisplayObject';
export { DisplayObjectContainer } from './display/DisplayObjectContainer';
export { Sprite } from './display/Sprite';
export { Shape } from './display/Shape';
export { Stage } from './display/Stage';

// Graphics and drawing (implemented)
export { Graphics } from './Graphics';
export type { IFill, IStroke, IDrawCommand } from './Graphics';

// Geometry classes (implemented)
export { Point } from './geom/Point';
export { Rectangle } from './geom/Rectangle';
export { Matrix } from './geom/Matrix';
export { Transform } from './geom/Transform';

// TODO: Future implementations
// Core display objects
// export { MovieClip } from './display/MovieClip';
// export { Bitmap } from './display/Bitmap';

// Animation and tweening
// export { Tween } from './animation/Tween';
// export { Timeline } from './animation/Timeline';
// export { Easing } from './animation/Easing';

// Event handling
// export { DisplayEvent } from './events/DisplayEvent';
// export { MouseEvent } from './events/MouseEvent';
// export { KeyboardEvent } from './events/KeyboardEvent';
// export { TouchEvent } from './events/TouchEvent';

// Rendering backends
// export { CanvasRenderer } from './renderers/CanvasRenderer';
// export { WebGLRenderer } from './renderers/WebGLRenderer';
// export { RenderTarget } from './renderers/RenderTarget';

// Additional geometry
// export { ColorTransform } from './geom/ColorTransform';