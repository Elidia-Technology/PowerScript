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

// Export all type definitions
export * from './types';

// ============================================================================
// CORE CLIENT-SIDE MODULES
// ============================================================================

/**
 * Canvas Helper for Framework Integration
 */
export class CanvasManager {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  constructor(canvas?: HTMLCanvasElement) {
    if (canvas) {
      this.setCanvas(canvas);
    }
  }
  
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
  }
  
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  
  getContext(): CanvasRenderingContext2D | null {
    return this.context;
  }
  
  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  clear(): void {
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  setPixelRatio(ratio: number = window.devicePixelRatio || 1): void {
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

/**
 * Media Manager for Audio/Video
 */
export class MediaManager {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 1.0;
  
  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
  }
  
  createAudioPlayer(src: string): any {
    const audio = typeof Audio !== 'undefined' ? new Audio(src) : { 
      src, 
      play: () => Promise.resolve(), 
      pause: () => {}, 
      currentTime: 0, 
      duration: 0, 
      volume: 1,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    return {
      element: audio,
      play: () => audio.play(),
      pause: () => audio.pause(),
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
      },
      setVolume: (volume: number) => {
        audio.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
      },
      getCurrentTime: () => audio.currentTime,
      getDuration: () => audio.duration,
      setCurrentTime: (time: number) => {
        audio.currentTime = time;
      },
      addEventListener: (event: string, callback: EventListener) => {
        audio.addEventListener(event, callback);
      },
      removeEventListener: (event: string, callback: EventListener) => {
        audio.removeEventListener(event, callback);
      }
    };
  }
  
  createVideoPlayer(src: string): any {
    const video = typeof document !== 'undefined' ? document.createElement('video') : {
      src,
      play: () => Promise.resolve(),
      pause: () => {},
      currentTime: 0,
      duration: 0,
      volume: 1,
      width: 320,
      height: 240,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    if (typeof document !== 'undefined') {
      video.src = src;
    }
    return {
      element: video,
      play: () => video.play(),
      pause: () => video.pause(),
      stop: () => {
        video.pause();
        video.currentTime = 0;
      },
      setVolume: (volume: number) => {
        video.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
      },
      getCurrentTime: () => video.currentTime,
      getDuration: () => video.duration,
      setCurrentTime: (time: number) => {
        video.currentTime = time;
      },
      setSize: (width: number, height: number) => {
        video.width = width;
        video.height = height;
      },
      addEventListener: (event: string, callback: EventListener) => {
        video.addEventListener(event, callback);
      },
      removeEventListener: (event: string, callback: EventListener) => {
        video.removeEventListener(event, callback);
      }
    };
  }
  
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  getMasterVolume(): number {
    return this.masterVolume;
  }
}

/**
 * Game Manager for Game Loop and Input
 */
export class GameManager {
  private running: boolean = false;
  private paused: boolean = false;
  private frameRate: number = 60;
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private animationId: number | null = null;
  
  private keyboard: { [key: string]: boolean } = {};
  private mouse: { x: number; y: number; buttons: number } = { x: 0, y: 0, buttons: 0 };
  
  private updateCallbacks: Array<(deltaTime: number) => void> = [];
  private renderCallbacks: Array<(ctx: CanvasRenderingContext2D) => void> = [];
  
  constructor(private canvas?: HTMLCanvasElement) {
    this.setupInputHandlers();
  }
  
  private setupInputHandlers(): void {
    if (typeof window === 'undefined') return;
    
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
        const rect = this.canvas!.getBoundingClientRect();
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
  
  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.gameLoop();
  }
  
  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.animationId) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationId);
      } else {
        clearTimeout(this.animationId);
      }
      this.animationId = null;
    }
  }
  
  pause(): void {
    this.paused = true;
  }
  
  resume(): void {
    this.paused = false;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
  
  private gameLoop = (): void => {
    if (!this.running) return;
    
    const currentTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
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
    
    this.animationId = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(this.gameLoop) : setTimeout(this.gameLoop, 16) as any;
  };
  
  onUpdate(callback: (deltaTime: number) => void): void {
    this.updateCallbacks.push(callback);
  }
  
  onRender(callback: (ctx: CanvasRenderingContext2D) => void): void {
    this.renderCallbacks.push(callback);
  }
  
  getKeyboard(): { [key: string]: boolean } {
    return { ...this.keyboard };
  }
  
  getMouse(): { x: number; y: number; buttons: number } {
    return { ...this.mouse };
  }
  
  isKeyPressed(key: string): boolean {
    return !!this.keyboard[key];
  }
  
  isMouseButtonPressed(button: number): boolean {
    return !!(this.mouse.buttons & (1 << button));
  }
  
  setFrameRate(fps: number): void {
    this.frameRate = fps;
  }
  
  getDeltaTime(): number {
    return this.deltaTime;
  }
  
  isRunning(): boolean {
    return this.running;
  }
  
  isPaused(): boolean {
    return this.paused;
  }
}

// ============================================================================
// AS3-STYLE DISPLAY OBJECTS
// ============================================================================

/**
 * Create a simple AS3-style sprite
 */
export async function createSprite(): Promise<any> {
  const graphicsObj: any = {
    commands: [] as any[],
    currentFill: null as any,
    currentStroke: null as any,
    beginFill: function(color: number, alpha: number = 1) {
      this.currentFill = { color, alpha };
      return this;
    },
    endFill: function() {
      this.currentFill = null;
      return this;
    },
    lineStyle: function(thickness: number = 1, color: number = 0x000000, alpha: number = 1) {
      this.currentStroke = { thickness, color, alpha };
      return this;
    },
    drawRect: function(x: number, y: number, width: number, height: number) {
      this.commands.push({
        type: 'rect',
        x, y, width, height,
        fill: this.currentFill,
        stroke: this.currentStroke
      });
      return this;
    },
    drawCircle: function(x: number, y: number, radius: number) {
      this.commands.push({
        type: 'circle',
        x, y, radius,
        fill: this.currentFill,
        stroke: this.currentStroke
      });
      return this;
    },
    moveTo: function(x: number, y: number) {
      this.commands.push({ type: 'moveTo', x, y });
      return this;
    },
    lineTo: function(x: number, y: number) {
      this.commands.push({ 
        type: 'lineTo', 
        x, y, 
        stroke: this.currentStroke 
      });
      return this;
    },
    clear: function() {
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
    
    render: function(ctx: CanvasRenderingContext2D) {
      if (!ctx || !this.visible || this.alpha <= 0) return;
      
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);
      
      // Render graphics commands
      if (this.graphics && this.graphics.commands) {
        this.graphics.commands.forEach((cmd: any) => {
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
    
    getBounds: function() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    },
    
    hitTestPoint: function(x: number, y: number): boolean {
      const bounds = this.getBounds();
      return x >= bounds.x && x <= bounds.x + bounds.width &&
             y >= bounds.y && y <= bounds.y + bounds.height;
    },
    
    localToGlobal: function(point: { x: number; y: number }) {
      return { x: point.x + this.x, y: point.y + this.y };
    },
    
    globalToLocal: function(point: { x: number; y: number }) {
      return { x: point.x - this.x, y: point.y - this.y };
    }
  };
}

/**
 * Create a simple AS3-style shape
 */
export async function createShape(): Promise<any> {
  return createSprite(); // Shape is similar to Sprite in client-side usage
}

/**
 * Create an AS3-style stage/display container
 */
export async function createStage(canvas?: HTMLCanvasElement): Promise<any> {
  const children: any[] = [];
  
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
    
    addChild: function(child: any) {
      children.push(child);
      child.parent = this;
      this.numChildren = children.length;
      return child;
    },
    
    addChildAt: function(child: any, index: number) {
      children.splice(index, 0, child);
      child.parent = this;
      this.numChildren = children.length;
      return child;
    },
    
    removeChild: function(child: any) {
      const index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
        child.parent = null;
        this.numChildren = children.length;
      }
      return child;
    },
    
    removeChildAt: function(index: number) {
      const child = children[index];
      if (child) {
        children.splice(index, 1);
        child.parent = null;
        this.numChildren = children.length;
      }
      return child;
    },
    
    getChildAt: function(index: number) {
      return children[index] || null;
    },
    
    getChildByName: function(name: string) {
      return children.find(child => child.name === name) || null;
    },
    
    contains: function(child: any): boolean {
      return children.includes(child);
    },
    
    swapChildren: function(child1: any, child2: any) {
      const index1 = children.indexOf(child1);
      const index2 = children.indexOf(child2);
      if (index1 !== -1 && index2 !== -1) {
        children[index1] = child2;
        children[index2] = child1;
      }
    },
    
    swapChildrenAt: function(index1: number, index2: number) {
      if (children[index1] && children[index2]) {
        const temp = children[index1];
        children[index1] = children[index2];
        children[index2] = temp;
      }
    },
    
    render: function(ctx?: CanvasRenderingContext2D) {
      const context = ctx || this.context;
      if (!context) return;
      
      // Clear the stage
      context.clearRect(0, 0, this.width, this.height);
      
      // Render all children
      children.forEach(child => {
        if (child.render) {
          child.render(context);
        }
      });
    },
    
    update: function() {
      this.render();
    },
    
    invalidate: function() {
      // Mark for re-render on next frame
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this.update());
      } else {
        setTimeout(() => this.update(), 16);
      }
    },
    
    addEventListener: function(type: string, listener: EventListener) {
      if (this.canvas) {
        this.canvas.addEventListener(type, listener);
      }
    },
    
    removeEventListener: function(type: string, listener: EventListener) {
      if (this.canvas) {
        this.canvas.removeEventListener(type, listener);
      }
    },
    
    dispatchEvent: function(event: Event): boolean {
      if (this.canvas) {
        return this.canvas.dispatchEvent(event);
      }
      return false;
    },
    
    getBounds: function() {
      return { x: this.x, y: this.y, width: this.width, height: this.height };
    },
    
    hitTestPoint: function(x: number, y: number): boolean {
      return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
    },
    
    localToGlobal: function(point: { x: number; y: number }) {
      return { x: point.x, y: point.y }; // Stage is the global coordinate system
    },
    
    globalToLocal: function(point: { x: number; y: number }) {
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
export const EIPS = {
  // Core managers
  CanvasManager,
  MediaManager,
  GameManager,
  
  // Factory functions
  createSprite,
  createShape,
  createStage,
  
  // Utility functions
  init: function(canvas?: HTMLCanvasElement) {
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
export default EIPS;