/**
 * EIPS Client-Side Type Definitions
 * AS3-style types for modern web development
 */

export interface IFillStyle {
  color: number;
  alpha: number;
}

export interface IGraphicsCommand {
  type: 'rect' | 'circle' | 'line' | 'moveTo' | 'lineTo';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: IFillStyle | null;
  stroke?: IFillStyle | null;
}

export interface IGraphics {
  commands: IGraphicsCommand[];
  currentFill: IFillStyle | null;
  currentStroke: IFillStyle | null;
  
  beginFill(color: number, alpha?: number): IGraphics;
  endFill(): IGraphics;
  lineStyle(thickness?: number, color?: number, alpha?: number): IGraphics;
  drawRect(x: number, y: number, width: number, height: number): IGraphics;
  drawCircle(x: number, y: number, radius: number): IGraphics;
  drawRoundRect(x: number, y: number, width: number, height: number, radius: number): IGraphics;
  moveTo(x: number, y: number): IGraphics;
  lineTo(x: number, y: number): IGraphics;
  clear(): IGraphics;
}

export interface IBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IDisplayObject {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  visible: boolean;
  name?: string;
  parent?: IDisplayObjectContainer | null;
  
  getBounds(): IBounds;
  hitTestPoint(x: number, y: number): boolean;
  localToGlobal(point: { x: number; y: number }): { x: number; y: number };
  globalToLocal(point: { x: number; y: number }): { x: number; y: number };
  render(ctx: CanvasRenderingContext2D): void;
}

export interface ISprite extends IDisplayObject {
  graphics: IGraphics;
}

export interface IDisplayObjectContainer extends IDisplayObject {
  children: IDisplayObject[];
  numChildren: number;
  
  addChild(child: IDisplayObject): IDisplayObject;
  addChildAt(child: IDisplayObject, index: number): IDisplayObject;
  removeChild(child: IDisplayObject): IDisplayObject;
  removeChildAt(index: number): IDisplayObject;
  getChildAt(index: number): IDisplayObject;
  getChildByName(name: string): IDisplayObject | null;
  contains(child: IDisplayObject): boolean;
  swapChildren(child1: IDisplayObject, child2: IDisplayObject): void;
  swapChildrenAt(index1: number, index2: number): void;
}

export interface IStage extends IDisplayObjectContainer {
  canvas?: HTMLCanvasElement;
  context?: CanvasRenderingContext2D;
  frameRate: number;
  quality: string;
  scaleMode: string;
  align: string;
  showDefaultContextMenu: boolean;
  
  update(): void;
  invalidate(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: Event): boolean;
}

export interface IMediaPlayer {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  paused: boolean;
  ended: boolean;
  loop: boolean;
  autoplay: boolean;
  
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  load(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface IAudioPlayer extends IMediaPlayer {
  playbackRate: number;
}

export interface IVideoPlayer extends IMediaPlayer {
  width: number;
  height: number;
  poster: string;
  controls: boolean;
  fullscreen: boolean;
  
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
}

export interface IKeyboardState {
  [key: string]: boolean;
}

export interface IMouseState {
  x: number;
  y: number;
  buttons: number;
  wheelDelta: number;
}

export interface IGameManager {
  running: boolean;
  paused: boolean;
  frameRate: number;
  deltaTime: number;
  keyboard: IKeyboardState;
  mouse: IMouseState;
  
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  setFrameRate(fps: number): void;
  onUpdate(callback: (deltaTime: number) => void): void;
  onRender(callback: (ctx: CanvasRenderingContext2D) => void): void;
}

export interface ICanvasManager {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
  
  resize(width: number, height: number): void;
  clear(): void;
  setPixelRatio(ratio: number): void;
  toDataURL(type?: string, quality?: number): string;
  toBlob(callback: BlobCallback, type?: string, quality?: number): void;
}

export interface IMediaManager {
  audioContext?: AudioContext;
  
  createAudioPlayer(src: string): IAudioPlayer;
  createVideoPlayer(src: string): IVideoPlayer;
  preloadAudio(urls: string[]): Promise<void>;
  preloadVideo(urls: string[]): Promise<void>;
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
}

// Event types
export interface IDisplayEvent {
  type: string;
  target: IDisplayObject;
  currentTarget: IDisplayObject;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  
  stopPropagation(): void;
  preventDefault(): void;
}

export interface IMouseEvent extends IDisplayEvent {
  localX: number;
  localY: number;
  stageX: number;
  stageY: number;
  buttonDown: boolean;
  delta: number;
}

export interface IKeyboardEvent extends IDisplayEvent {
  charCode: number;
  keyCode: number;
  keyLocation: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}

// React Hook Types
export interface IStageHook {
  stage: IStage;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
}

export interface ISpriteHook {
  sprite: ISprite;
  graphics: IGraphics;
}

export interface IGameHook {
  game: IGameManager;
  running: boolean;
  paused: boolean;
  deltaTime: number;
  keyboard: IKeyboardState;
  mouse: IMouseState;
}

export interface IAudioHook {
  player: IAudioPlayer | null;
  loading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

export interface IVideoHook {
  player: IVideoPlayer | null;
  loading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}