/**
 * PowerScript Platformer Game - Production Ready
 * 
 * Clean AS3-style code using EIPS framework.
 * This file will be compiled to optimized JavaScript + HTML.
 */

// Simple AS3-style classes for demo (in production, these would be imported from EIPS)
class Point {
    constructor(public x: number = 0, public y: number = 0) {}
    
    distance(other: Point): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Rectangle {
    constructor(
        public x: number = 0,
        public y: number = 0,
        public width: number = 0,
        public height: number = 0
    ) {}
    
    intersects(other: Rectangle): boolean {
        return !(other.x > this.x + this.width || 
                other.x + other.width < this.x || 
                other.y > this.y + this.height ||
                other.y + other.height < this.y);
    }
}

// AS3-Style Event System
class EventDispatcher {
    private _listeners: Map<string, Function[]> = new Map();
    
    addEventListener(type: string, listener: Function): void {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type)!.push(listener);
    }
    
    dispatchEvent(event: { type: string; [key: string]: any }): void {
        if (this._listeners.has(event.type)) {
            this._listeners.get(event.type)!.forEach(listener => {
                listener(event);
            });
        }
    }
}

// AS3-Style Graphics
class Graphics {
    private commands: Array<{
        type: string;
        [key: string]: any;
    }> = [];
    
    private currentFill: { color: number; alpha: number } | null = null;
    
    beginFill(color: number, alpha: number = 1): Graphics {
        this.currentFill = { color, alpha };
        return this;
    }
    
    endFill(): Graphics {
        this.currentFill = null;
        return this;
    }
    
    drawRect(x: number, y: number, width: number, height: number): Graphics {
        this.commands.push({
            type: 'rect',
            x, y, width, height,
            fill: this.currentFill
        });
        return this;
    }
    
    drawCircle(x: number, y: number, radius: number): Graphics {
        this.commands.push({
            type: 'circle',
            x, y, radius,
            fill: this.currentFill
        });
        return this;
    }
    
    drawRoundRect(x: number, y: number, width: number, height: number, radius: number): Graphics {
        this.commands.push({
            type: 'roundRect',
            x, y, width, height, radius,
            fill: this.currentFill
        });
        return this;
    }
    
    clear(): Graphics {
        this.commands = [];
        this.currentFill = null;
        return this;
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        this.commands.forEach(cmd => {
            ctx.beginPath();
            
            switch (cmd.type) {
                case 'rect':
                    ctx.rect(cmd.x, cmd.y, cmd.width, cmd.height);
                    break;
                case 'circle':
                    ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
                    break;
                case 'roundRect':
                    this.drawRoundedRect(ctx, cmd.x, cmd.y, cmd.width, cmd.height, cmd.radius);
                    break;
            }
            
            if (cmd.fill) {
                ctx.fillStyle = this.colorToString(cmd.fill.color);
                ctx.globalAlpha = cmd.fill.alpha;
                ctx.fill();
            }
        });
    }
    
    private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    private colorToString(color: number): string {
        return '#' + color.toString(16).padStart(6, '0');
    }
}

// AS3-Style Display Objects
abstract class DisplayObject extends EventDispatcher {
    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;
    public alpha: number = 1;
    public visible: boolean = true;
    public name: string = '';
    
    getBounds(): Rectangle {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        if (!this.visible || this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        
        this.draw(ctx);
        
        ctx.restore();
    }
    
    protected abstract draw(ctx: CanvasRenderingContext2D): void;
}

class DisplayObjectContainer extends DisplayObject {
    protected children: DisplayObject[] = [];
    
    addChild(child: DisplayObject): DisplayObject {
        this.children.push(child);
        return child;
    }
    
    removeChild(child: DisplayObject): DisplayObject {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
        return child;
    }
    
    get numChildren(): number {
        return this.children.length;
    }
    
    render(ctx: CanvasRenderingContext2D): void {
        if (!this.visible || this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        
        this.draw(ctx);
        
        // Render children
        this.children.forEach(child => {
            child.render(ctx);
        });
        
        ctx.restore();
    }
    
    protected draw(ctx: CanvasRenderingContext2D): void {
        // Override in subclasses
    }
}

class Sprite extends DisplayObjectContainer {
    public graphics: Graphics;
    
    constructor() {
        super();
        this.graphics = new Graphics();
    }
    
    protected draw(ctx: CanvasRenderingContext2D): void {
        this.graphics.render(ctx);
    }
}

class Stage extends DisplayObjectContainer {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    public stageWidth: number;
    public stageHeight: number;
    public frameRate: number = 60;
    private isRunning: boolean = false;
    
    constructor(width: number = 800, height: number = 600) {
        super();
        this.stageWidth = width;
        this.stageHeight = height;
    }
    
    setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = this.stageWidth;
        this.canvas.height = this.stageHeight;
    }
    
    render(): void {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);
        super.render(this.ctx);
    }
    
    startAnimation(): void {
        if (this.isRunning || !this.ctx) return;
        this.isRunning = true;
        this.animate();
    }
    
    private animate(): void {
        if (!this.isRunning) return;
        
        this.dispatchEvent({ type: 'enterFrame' });
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }
    
    protected draw(ctx: CanvasRenderingContext2D): void {
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.stageHeight * 0.875);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.stageWidth, this.stageHeight * 0.875);
        
        // Draw ground
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.stageHeight * 0.875, this.stageWidth, this.stageHeight * 0.125);
        
        // Draw grass
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, this.stageHeight * 0.875, this.stageWidth, 10);
    }
}

// Game Classes
class Player extends Sprite {
    private velocityX: number = 0;
    private velocityY: number = 0;
    private gravity: number = 0.8;
    private speed: number = 5;
    private jumpPower: number = -15;
    private onGround: boolean = false;
    private groundY: number = 0;
    
    constructor() {
        super();
        this.width = 40;
        this.height = 50;
        this.createPlayer();
    }
    
    private createPlayer(): void {
        // Player body
        this.graphics.beginFill(0x3498DB);
        this.graphics.drawRoundRect(5, 10, 30, 35, 5);
        this.graphics.endFill();
        
        // Player head
        this.graphics.beginFill(0xFFDBB0);
        this.graphics.drawCircle(20, 15, 10);
        this.graphics.endFill();
        
        // Eyes
        this.graphics.beginFill(0x000000);
        this.graphics.drawCircle(17, 12, 2);
        this.graphics.drawCircle(23, 12, 2);
        this.graphics.endFill();
    }
    
    setGroundY(y: number): void {
        this.groundY = y;
    }
    
    update(): void {
        if (!this.onGround) {
            this.velocityY += this.gravity;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        if (this.y + this.height >= this.groundY) {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 1000) this.x = 1000 - this.width;
        
        this.velocityX *= 0.9;
    }
    
    jump(): void {
        if (this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
        }
    }
    
    moveLeft(): void {
        this.velocityX = -this.speed;
    }
    
    moveRight(): void {
        this.velocityX = this.speed;
    }
}

class Obstacle extends Sprite {
    public speed: number = -3;
    
    constructor(x: number, y: number, width: number, height: number) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.graphics.beginFill(0xE74C3C);
        this.graphics.drawRect(0, 0, width, height);
        this.graphics.endFill();
    }
    
    update(): void {
        this.x += this.speed;
    }
    
    isOffScreen(): boolean {
        return this.x + this.width < 0;
    }
}

class Collectible extends Sprite {
    public speed: number = -3;
    private bob: number = 0;
    private baseY: number;
    
    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.baseY = y;
        
        this.graphics.beginFill(0xF1C40F);
        this.graphics.drawCircle(10, 10, 10);
        this.graphics.endFill();
    }
    
    update(): void {
        this.x += this.speed;
        this.bob += 0.2;
        this.y = this.baseY + Math.sin(this.bob) * 5;
    }
    
    isOffScreen(): boolean {
        return this.x + this.width < 0;
    }
}

// Main Game Class
class PlatformerGame extends EventDispatcher {
    private stage: Stage;
    private player: Player;
    private obstacles: Obstacle[] = [];
    private collectibles: Collectible[] = [];
    private score: number = 0;
    private gameSpeed: number = 1;
    private spawnTimer: number = 0;
    private isGameOver: boolean = false;
    private keys: { [key: string]: boolean } = {};
    
    constructor() {
        super();
        this.stage = new Stage(1000, 600);
        this.player = new Player();
        this.init();
    }
    
    private init(): void {
        // Find or create canvas
        let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'gameCanvas';
            document.body.appendChild(canvas);
        }
        
        this.stage.setCanvas(canvas);
        
        // Set up player
        const groundY = this.stage.stageHeight * 0.875;
        this.player.setGroundY(groundY);
        this.player.x = 100;
        this.player.y = groundY - this.player.height;
        
        this.stage.addChild(this.player);
        
        // Set up input
        this.setupInput();
        
        // Start game loop
        this.stage.addEventListener('enterFrame', () => this.update());
        this.stage.startAnimation();
        
        console.log('🎮 PowerScript Platformer Started!');
    }
    
    private setupInput(): void {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                e.preventDefault();
                this.player.jump();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    private update(): void {
        if (this.isGameOver) return;
        
        // Handle input
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.moveLeft();
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.moveRight();
        }
        
        // Update player
        this.player.update();
        
        // Spawn objects
        this.spawnTimer++;
        if (this.spawnTimer > 120 / this.gameSpeed) {
            this.spawnObjects();
            this.spawnTimer = 0;
        }
        
        // Update obstacles
        this.obstacles.forEach((obstacle, index) => {
            obstacle.update();
            
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
            
            if (obstacle.isOffScreen()) {
                this.stage.removeChild(obstacle);
                this.obstacles.splice(index, 1);
            }
        });
        
        // Update collectibles
        this.collectibles.forEach((collectible, index) => {
            collectible.update();
            
            if (this.checkCollision(this.player, collectible)) {
                this.score += 10;
                this.dispatchEvent({ type: 'scoreUpdate', score: this.score });
                this.stage.removeChild(collectible);
                this.collectibles.splice(index, 1);
            }
            
            if (collectible.isOffScreen()) {
                this.stage.removeChild(collectible);
                this.collectibles.splice(index, 1);
            }
        });
        
        // Increase difficulty
        this.gameSpeed += 0.001;
        this.score += 1;
        this.dispatchEvent({ type: 'scoreUpdate', score: this.score });
    }
    
    private spawnObjects(): void {
        const rand = Math.random();
        const x = this.stage.stageWidth + 50;
        
        if (rand < 0.7) {
            const height = 40 + Math.random() * 60;
            const obstacle = new Obstacle(x, this.stage.stageHeight * 0.875 - height, 30, height);
            obstacle.speed *= this.gameSpeed;
            this.obstacles.push(obstacle);
            this.stage.addChild(obstacle);
        } else {
            const y = 200 + Math.random() * 100;
            const collectible = new Collectible(x, y);
            collectible.speed *= this.gameSpeed;
            this.collectibles.push(collectible);
            this.stage.addChild(collectible);
        }
    }
    
    private checkCollision(obj1: DisplayObject, obj2: DisplayObject): boolean {
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        return bounds1.intersects(bounds2);
    }
    
    private gameOver(): void {
        this.isGameOver = true;
        this.dispatchEvent({ type: 'gameOver', score: this.score });
    }
    
    public restart(): void {
        this.isGameOver = false;
        this.score = 0;
        this.gameSpeed = 1;
        this.spawnTimer = 0;
        
        this.obstacles.forEach(obj => this.stage.removeChild(obj));
        this.collectibles.forEach(obj => this.stage.removeChild(obj));
        this.obstacles = [];
        this.collectibles = [];
        
        this.player.x = 100;
        this.player.y = this.stage.stageHeight * 0.875 - this.player.height;
        (this.player as any).velocityX = 0;
        (this.player as any).velocityY = 0;
        
        this.dispatchEvent({ type: 'scoreUpdate', score: this.score });
    }
    
    public getScore(): number {
        return this.score;
    }
}

// Auto-initialize the game
declare global {
    interface Window {
        game: PlatformerGame;
    }
}

const game = new PlatformerGame();
window.game = game;

// Export for module systems
export { PlatformerGame };
export default game;