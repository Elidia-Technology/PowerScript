"use strict";
/**
 * EIPS Client-Side Framework
 *
 * Client-side PowerScript modules for modern web frameworks
 * Compatible with React, Vue, Angular, Svelte, and vanilla HTML5
 *
 * Modules included:
 * - Graphics & Animation (AS3-style display lists)
 * - Multimedia (Audio/Video players)
 * - Game Development (Physics, Collision detection)
 * - UI Components (Responsive, Framework-agnostic)
 *
 * Usage:
 * import { EIPS, CanvasManager, MediaManager } from 'powerscript/client';
 * import { useStage, useSprite } from 'powerscript/client/react';
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIPS = exports.GameManager = exports.MediaManager = exports.CanvasManager = void 0;
exports.createSprite = createSprite;
exports.createShape = createShape;
exports.createStage = createStage;
// Export all type definitions
__exportStar(require("./types"), exports);
// ============================================================================
// CORE CLIENT-SIDE MODULES
// ============================================================================
/**
 * Canvas Helper for Framework Integration
 */
class CanvasManager {
    constructor(canvas) {
        this.canvas = null;
        this.context = null;
        if (canvas) {
            this.setCanvas(canvas);
        }
    }
    setCanvas(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }
    getCanvas() {
        return this.canvas;
    }
    getContext() {
        return this.context;
    }
    resize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
    clear() {
        if (this.context && this.canvas) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    setPixelRatio(ratio = window.devicePixelRatio || 1) {
        if (this.canvas && this.context) {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * ratio;
            this.canvas.height = rect.height * ratio;
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            this.context.scale(ratio, ratio);
        }
    }
}
exports.CanvasManager = CanvasManager;
/**
 * Media Manager for Audio/Video
 */
class MediaManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 1.0;
        if (typeof window !== 'undefined' && window.AudioContext) {
            this.audioContext = new AudioContext();
        }
    }
    createAudioPlayer(src) {
        const audio = new Audio(src);
        return {
            element: audio,
            play: () => audio.play(),
            pause: () => audio.pause(),
            stop: () => {
                audio.pause();
                audio.currentTime = 0;
            },
            setVolume: (volume) => {
                audio.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
            },
            getCurrentTime: () => audio.currentTime,
            getDuration: () => audio.duration,
            setCurrentTime: (time) => {
                audio.currentTime = time;
            },
            addEventListener: (event, callback) => {
                audio.addEventListener(event, callback);
            },
            removeEventListener: (event, callback) => {
                audio.removeEventListener(event, callback);
            }
        };
    }
    createVideoPlayer(src) {
        const video = document.createElement('video');
        video.src = src;
        return {
            element: video,
            play: () => video.play(),
            pause: () => video.pause(),
            stop: () => {
                video.pause();
                video.currentTime = 0;
            },
            setVolume: (volume) => {
                video.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
            },
            getCurrentTime: () => video.currentTime,
            getDuration: () => video.duration,
            setCurrentTime: (time) => {
                video.currentTime = time;
            },
            setSize: (width, height) => {
                video.width = width;
                video.height = height;
            },
            addEventListener: (event, callback) => {
                video.addEventListener(event, callback);
            },
            removeEventListener: (event, callback) => {
                video.removeEventListener(event, callback);
            }
        };
    }
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
    getMasterVolume() {
        return this.masterVolume;
    }
}
exports.MediaManager = MediaManager;
/**
 * Game Manager for Game Loop and Input
 */
class GameManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.running = false;
        this.paused = false;
        this.frameRate = 60;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationId = null;
        this.keyboard = {};
        this.mouse = { x: 0, y: 0, buttons: 0 };
        this.updateCallbacks = [];
        this.renderCallbacks = [];
        this.gameLoop = () => {
            if (!this.running)
                return;
            const currentTime = performance.now();
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            if (!this.paused) {
                // Update
                this.updateCallbacks.forEach(callback => callback(this.deltaTime));
                // Render
                if (this.canvas) {
                    const ctx = this.canvas.getContext('2d');
                    if (ctx) {
                        this.renderCallbacks.forEach(callback => callback(ctx));
                    }
                }
            }
            this.animationId = requestAnimationFrame(this.gameLoop);
        };
        this.setupInputHandlers();
    }
    setupInputHandlers() {
        if (typeof window === 'undefined')
            return;
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keyboard[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keyboard[e.code] = false;
        });
        // Mouse events
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });
            this.canvas.addEventListener('mousedown', (e) => {
                this.mouse.buttons |= (1 << e.button);
            });
            this.canvas.addEventListener('mouseup', (e) => {
                this.mouse.buttons &= ~(1 << e.button);
            });
        }
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    stop() {
        this.running = false;
        this.paused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
        this.lastTime = performance.now();
    }
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
    onRender(callback) {
        this.renderCallbacks.push(callback);
    }
    getKeyboard() {
        return { ...this.keyboard };
    }
    getMouse() {
        return { ...this.mouse };
    }
    isKeyPressed(key) {
        return !!this.keyboard[key];
    }
    isMouseButtonPressed(button) {
        return !!(this.mouse.buttons & (1 << button));
    }
    setFrameRate(fps) {
        this.frameRate = fps;
    }
    getDeltaTime() {
        return this.deltaTime;
    }
    isRunning() {
        return this.running;
    }
    isPaused() {
        return this.paused;
    }
}
exports.GameManager = GameManager;
// ============================================================================
// AS3-STYLE DISPLAY OBJECTS
// ============================================================================
/**
 * Create a simple AS3-style sprite
 */
async function createSprite() {
    const graphicsObj = {
        commands: [],
        currentFill: null,
        currentStroke: null,
        beginFill: function (color, alpha = 1) {
            this.currentFill = { color, alpha };
            return this;
        },
        endFill: function () {
            this.currentFill = null;
            return this;
        },
        lineStyle: function (thickness = 1, color = 0x000000, alpha = 1) {
            this.currentStroke = { thickness, color, alpha };
            return this;
        },
        drawRect: function (x, y, width, height) {
            this.commands.push({
                type: 'rect',
                x, y, width, height,
                fill: this.currentFill,
                stroke: this.currentStroke
            });
            return this;
        },
        drawCircle: function (x, y, radius) {
            this.commands.push({
                type: 'circle',
                x, y, radius,
                fill: this.currentFill,
                stroke: this.currentStroke
            });
            return this;
        },
        moveTo: function (x, y) {
            this.commands.push({ type: 'moveTo', x, y });
            return this;
        },
        lineTo: function (x, y) {
            this.commands.push({
                type: 'lineTo',
                x, y,
                stroke: this.currentStroke
            });
            return this;
        },
        clear: function () {
            this.commands = [];
            return this;
        }
    };
    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 1,
        visible: true,
        name: '',
        parent: null,
        graphics: graphicsObj,
        render: function (ctx) {
            if (!this.visible || this.alpha <= 0)
                return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.scale(this.scaleX, this.scaleY);
            // Render graphics commands
            if (this.graphics && this.graphics.commands) {
                this.graphics.commands.forEach((cmd) => {
                    ctx.beginPath();
                    switch (cmd.type) {
                        case 'rect':
                            ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
                            break;
                        case 'circle':
                            ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
                            break;
                        case 'moveTo':
                            ctx.moveTo(cmd.x, cmd.y);
                            break;
                        case 'lineTo':
                            ctx.lineTo(cmd.x, cmd.y);
                            break;
                    }
                    if (cmd.fill) {
                        ctx.fillStyle = '#' + cmd.fill.color.toString(16).padStart(6, '0');
                        ctx.globalAlpha = cmd.fill.alpha;
                        ctx.fill();
                    }
                    if (cmd.stroke && cmd.stroke.thickness > 0) {
                        ctx.strokeStyle = '#' + cmd.stroke.color.toString(16).padStart(6, '0');
                        ctx.lineWidth = cmd.stroke.thickness;
                        ctx.globalAlpha = cmd.stroke.alpha;
                        ctx.stroke();
                    }
                });
            }
            ctx.restore();
        },
        getBounds: function () {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },
        hitTestPoint: function (x, y) {
            const bounds = this.getBounds();
            return x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height;
        },
        localToGlobal: function (point) {
            return { x: point.x + this.x, y: point.y + this.y };
        },
        globalToLocal: function (point) {
            return { x: point.x - this.x, y: point.y - this.y };
        }
    };
}
/**
 * Create a simple AS3-style shape
 */
async function createShape() {
    return createSprite(); // Shape is similar to Sprite in client-side usage
}
/**
 * Create an AS3-style stage/display container
 */
async function createStage(canvas) {
    const children = [];
    return {
        x: 0,
        y: 0,
        width: canvas?.width || 800,
        height: canvas?.height || 600,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 1,
        visible: true,
        canvas,
        context: canvas?.getContext('2d'),
        frameRate: 60,
        quality: 'high',
        scaleMode: 'showAll',
        align: 'center',
        showDefaultContextMenu: true,
        children,
        numChildren: children.length,
        addChild: function (child) {
            children.push(child);
            child.parent = this;
            this.numChildren = children.length;
            return child;
        },
        addChildAt: function (child, index) {
            children.splice(index, 0, child);
            child.parent = this;
            this.numChildren = children.length;
            return child;
        },
        removeChild: function (child) {
            const index = children.indexOf(child);
            if (index !== -1) {
                children.splice(index, 1);
                child.parent = null;
                this.numChildren = children.length;
            }
            return child;
        },
        removeChildAt: function (index) {
            const child = children[index];
            if (child) {
                children.splice(index, 1);
                child.parent = null;
                this.numChildren = children.length;
            }
            return child;
        },
        getChildAt: function (index) {
            return children[index] || null;
        },
        getChildByName: function (name) {
            return children.find(child => child.name === name) || null;
        },
        contains: function (child) {
            return children.includes(child);
        },
        swapChildren: function (child1, child2) {
            const index1 = children.indexOf(child1);
            const index2 = children.indexOf(child2);
            if (index1 !== -1 && index2 !== -1) {
                children[index1] = child2;
                children[index2] = child1;
            }
        },
        swapChildrenAt: function (index1, index2) {
            if (children[index1] && children[index2]) {
                const temp = children[index1];
                children[index1] = children[index2];
                children[index2] = temp;
            }
        },
        render: function (ctx) {
            const context = ctx || this.context;
            if (!context)
                return;
            // Clear the stage
            context.clearRect(0, 0, this.width, this.height);
            // Render all children
            children.forEach(child => {
                if (child.render) {
                    child.render(context);
                }
            });
        },
        update: function () {
            this.render();
        },
        invalidate: function () {
            // Mark for re-render on next frame
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.update());
            }
        },
        addEventListener: function (type, listener) {
            if (this.canvas) {
                this.canvas.addEventListener(type, listener);
            }
        },
        removeEventListener: function (type, listener) {
            if (this.canvas) {
                this.canvas.removeEventListener(type, listener);
            }
        },
        dispatchEvent: function (event) {
            if (this.canvas) {
                return this.canvas.dispatchEvent(event);
            }
            return false;
        },
        getBounds: function () {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },
        hitTestPoint: function (x, y) {
            return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
        },
        localToGlobal: function (point) {
            return { x: point.x, y: point.y }; // Stage is the global coordinate system
        },
        globalToLocal: function (point) {
            return { x: point.x, y: point.y }; // Stage is the global coordinate system
        }
    };
}
// ============================================================================
// UNIFIED EIPS FRAMEWORK
// ============================================================================
/**
 * Main EIPS Client Framework
 * Provides a unified interface for AS3-style development in modern web applications
 */
exports.EIPS = {
    // Core managers
    CanvasManager,
    MediaManager,
    GameManager,
    // Factory functions
    createSprite,
    createShape,
    createStage,
    // Utility functions
    init: function (canvas) {
        return {
            canvas: new CanvasManager(canvas),
            media: new MediaManager(),
            game: new GameManager(canvas)
        };
    },
    // Framework info
    version: '1.0.0',
    name: 'EIPS Client Framework'
};
// Default export
exports.default = exports.EIPS;
