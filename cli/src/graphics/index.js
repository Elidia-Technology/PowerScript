"use strict";
/**
 * PowerScript Graphics Module - Advanced Graphics & Rendering System
 *
 * This module provides AS3-style display list architecture with modern rendering backends.
 * Supports Canvas 2D and WebGL rendering with a familiar PowerScript display hierarchy.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transform = exports.Matrix = exports.Rectangle = exports.Point = exports.Graphics = exports.Stage = exports.Shape = exports.Sprite = exports.DisplayObjectContainer = exports.DisplayObject = void 0;
// Core display objects (implemented)
var DisplayObject_1 = require("./display/DisplayObject");
Object.defineProperty(exports, "DisplayObject", { enumerable: true, get: function () { return DisplayObject_1.DisplayObject; } });
var DisplayObjectContainer_1 = require("./display/DisplayObjectContainer");
Object.defineProperty(exports, "DisplayObjectContainer", { enumerable: true, get: function () { return DisplayObjectContainer_1.DisplayObjectContainer; } });
var Sprite_1 = require("./display/Sprite");
Object.defineProperty(exports, "Sprite", { enumerable: true, get: function () { return Sprite_1.Sprite; } });
var Shape_1 = require("./display/Shape");
Object.defineProperty(exports, "Shape", { enumerable: true, get: function () { return Shape_1.Shape; } });
var Stage_1 = require("./display/Stage");
Object.defineProperty(exports, "Stage", { enumerable: true, get: function () { return Stage_1.Stage; } });
// Graphics and drawing (implemented)
var Graphics_1 = require("./Graphics");
Object.defineProperty(exports, "Graphics", { enumerable: true, get: function () { return Graphics_1.Graphics; } });
// Geometry classes (implemented)
var Point_1 = require("./geom/Point");
Object.defineProperty(exports, "Point", { enumerable: true, get: function () { return Point_1.Point; } });
var Rectangle_1 = require("./geom/Rectangle");
Object.defineProperty(exports, "Rectangle", { enumerable: true, get: function () { return Rectangle_1.Rectangle; } });
var Matrix_1 = require("./geom/Matrix");
Object.defineProperty(exports, "Matrix", { enumerable: true, get: function () { return Matrix_1.Matrix; } });
var Transform_1 = require("./geom/Transform");
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return Transform_1.Transform; } });
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
