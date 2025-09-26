/**
 * PowerScript Platformer Game - Pure AS3 Style
 * 
 * This demonstrates clean AS3-style development with EIPS.
 * No HTML boilerplate - just pure game logic using familiar AS3 classes.
 */

import { Stage, Sprite, Point, Rectangle, Graphics } from '../src/graphics';
import { EventDispatcher } from '../src/core/EventDispatcher';

// Game Configuration
interface GameConfig {
    width: number;
    height: number;
    fps: number;
    gravity: number;
    playerSpeed: number;
    jumpPower: number;
}

// Player Class - AS3 Style
class Player extends Sprite {
    private velocityX: number = 0;
    private velocityY: number = 0;
    private jumpPower: number = -15;
    private gravity: number = 0.8;
    private speed: number = 5;
    private onGround: boolean = false;
    private groundY: number = 0;
    
    constructor() {
        super();
        this.width = 40;
        this.height = 50;
        this.createSprite();
    }
    
    private createSprite(): void {
        // Player body (blue)
        this.graphics.beginFill(0x3498DB);
        this.graphics.drawRoundRect(5, 10, 30, 35, 5);
        this.graphics.endFill();
        
        // Player head (skin color)
        this.graphics.beginFill(0xFFDBB0);
        this.graphics.drawCircle(20, 15, 10);
        this.graphics.endFill();
        
        // Eyes
        this.graphics.beginFill(0x000000);
        this.graphics.drawCircle(17, 12, 2);
        this.graphics.drawCircle(23, 12, 2);
        this.graphics.endFill();
        
        // Legs
        this.graphics.beginFill(0x2980B9);
        this.graphics.drawRect(10, 45, 8, 15);
        this.graphics.drawRect(22, 45, 8, 15);
        this.graphics.endFill();
    }
    
    public setGroundY(groundY: number): void {
        this.groundY = groundY;
    }
    
    public update(): void {
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity;
        }
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Ground collision
        if (this.y + this.height >= this.groundY) {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Keep on screen
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > 1000) this.x = 1000 - this.width;
        
        // Apply friction
        this.velocityX *= 0.9;
    }
    
    public jump(): void {
        if (this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
        }
    }
    
    public moveLeft(): void {
        this.velocityX = -this.speed;
    }
    
    public moveRight(): void {
        this.velocityX = this.speed;
    }
}

// Obstacle Class - AS3 Style
class Obstacle extends Sprite {
    public speed: number = -3;
    
    constructor(x: number, y: number, width: number, height: number) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Draw obstacle
        this.graphics.beginFill(0xE74C3C);
        this.graphics.drawRect(0, 0, width, height);
        this.graphics.endFill();
        
        // Add detail
        this.graphics.beginFill(0xC0392B);
        this.graphics.drawRect(2, 2, width - 4, height - 4);
        this.graphics.endFill();
    }
    
    public update(): void {
        this.x += this.speed;
    }
    
    public isOffScreen(): boolean {
        return this.x + this.width < 0;
    }
}

// Collectible Class - AS3 Style
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
        
        // Draw golden gem
        this.graphics.beginFill(0xF1C40F);
        this.graphics.drawCircle(10, 10, 10);
        this.graphics.endFill();
        
        this.graphics.beginFill(0xF39C12);
        this.graphics.drawCircle(10, 10, 6);
        this.graphics.endFill();
    }
    
    public update(): void {
        this.x += this.speed;
        this.bob += 0.2;
        this.y = this.baseY + Math.sin(this.bob) * 5;
    }
    
    public isOffScreen(): boolean {
        return this.x + this.width < 0;
    }
}

// Main Game Class - AS3 Style
export class PlatformerGame extends EventDispatcher {
    private stage: Stage;
    private player: Player;
    private obstacles: Obstacle[] = [];
    private collectibles: Collectible[] = [];
    private score: number = 0;
    private gameSpeed: number = 1;
    private spawnTimer: number = 0;
    private isGameOver: boolean = false;
    private keys: { [key: string]: boolean } = {};
    private config: GameConfig;
    
    constructor(config: GameConfig) {
        super();
        this.config = config;
        this.stage = new Stage(config.width, config.height);
        this.stage.frameRate = config.fps;
        this.player = new Player();
        
        this.init();
    }
    
    private init(): void {
        // Set up ground
        const groundY = this.config.height * 0.875;
        this.player.setGroundY(groundY);
        this.player.x = 100;
        this.player.y = groundY - this.player.height;
        
        // Add player to stage
        this.stage.addChild(this.player);
        
        // Set up input
        this.setupInput();
        
        // Start game loop
        this.stage.addEventListener('enterFrame', () => this.update());
        this.stage.startAnimation();
        
        // Draw background
        this.createBackground();
        
        console.log('🎮 PowerScript Platformer Started!');
    }
    
    private createBackground(): void {
        const bg = new Sprite();
        
        // Sky gradient
        const skyGradient = bg.graphics.createLinearGradient(0, 0, 0, this.config.height * 0.875);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#98FB98');
        bg.graphics.beginFill(skyGradient);
        bg.graphics.drawRect(0, 0, this.config.width, this.config.height * 0.875);
        bg.graphics.endFill();
        
        // Ground
        bg.graphics.beginFill(0x8B4513);
        bg.graphics.drawRect(0, this.config.height * 0.875, this.config.width, this.config.height * 0.125);
        bg.graphics.endFill();
        
        // Grass
        bg.graphics.beginFill(0x228B22);
        bg.graphics.drawRect(0, this.config.height * 0.875, this.config.width, 10);
        bg.graphics.endFill();
        
        this.stage.addChildAt(bg, 0);
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
            
            // Check collision
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
            
            // Remove off-screen
            if (obstacle.isOffScreen()) {
                this.stage.removeChild(obstacle);
                this.obstacles.splice(index, 1);
            }
        });
        
        // Update collectibles
        this.collectibles.forEach((collectible, index) => {
            collectible.update();
            
            // Check collection
            if (this.checkCollision(this.player, collectible)) {
                this.score += 10;
                this.dispatchEvent({ type: 'scoreUpdate', score: this.score });
                this.stage.removeChild(collectible);
                this.collectibles.splice(index, 1);
            }
            
            // Remove off-screen
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
        const x = this.config.width + 50;
        
        if (rand < 0.7) {
            // Spawn obstacle
            const height = 40 + Math.random() * 60;
            const obstacle = new Obstacle(x, this.config.height * 0.875 - height, 30, height);
            obstacle.speed *= this.gameSpeed;
            this.obstacles.push(obstacle);
            this.stage.addChild(obstacle);
        } else {
            // Spawn collectible
            const y = 200 + Math.random() * 100;
            const collectible = new Collectible(x, y);
            collectible.speed *= this.gameSpeed;
            this.collectibles.push(collectible);
            this.stage.addChild(collectible);
        }
    }
    
    private checkCollision(obj1: Sprite, obj2: Sprite): boolean {
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
        
        // Clear objects
        this.obstacles.forEach(obj => this.stage.removeChild(obj));
        this.collectibles.forEach(obj => this.stage.removeChild(obj));
        this.obstacles = [];
        this.collectibles = [];
        
        // Reset player
        this.player.x = 100;
        this.player.y = this.config.height * 0.875 - this.player.height;
        this.player['velocityX'] = 0;
        this.player['velocityY'] = 0;
        
        this.dispatchEvent({ type: 'scoreUpdate', score: this.score });
    }
    
    public getScore(): number {
        return this.score;
    }
    
    public getStage(): Stage {
        return this.stage;
    }
}

// Auto-initialize when loaded
const gameConfig: GameConfig = {
    width: 1000,
    height: 600,
    fps: 60,
    gravity: 0.8,
    playerSpeed: 5,
    jumpPower: -15
};

// Create game instance
const game = new PlatformerGame(gameConfig);

// Export for external access
export { game };
export default PlatformerGame;