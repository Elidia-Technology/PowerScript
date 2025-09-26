/**
 * Angular EIPS Game Component
 * 
 * Simple platformer game using PowerScript EIPS client framework
 * with Angular services and RxJS observables
 */

import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CanvasService, MediaService, GameService, GraphicsService, AnimationService } from '../client/angular';

interface Player {
  sprite: any;
  velocityX: number;
  velocityY: number;
  onGround: boolean;
}

@Component({
  selector: 'app-eips-game',
  template: `
    <div class="game-container">
      <h1>Angular EIPS Platformer Game</h1>
      
      <!-- Game Canvas -->
      <div class="canvas-wrapper">
        <canvas 
          #gameCanvas
          [width]="gameWidth" 
          [height]="gameHeight"
          class="game-canvas"
        ></canvas>
      </div>
      
      <!-- Game Controls -->
      <div class="controls">
        <button 
          (click)="startGame()" 
          [disabled]="!gameReady || (gameState$ | async)?.isRunning"
          class="btn btn-primary"
        >
          Start Game
        </button>
        <button 
          (click)="stopGame()" 
          [disabled]="!(gameState$ | async)?.isRunning"
          class="btn btn-secondary"
        >
          Stop Game
        </button>
        <button 
          (click)="addPlatform()"
          class="btn btn-success"
        >
          Add Platform
        </button>
        <button 
          (click)="playSound()"
          class="btn btn-info"
        >
          Play Sound
        </button>
      </div>
      
      <!-- Game Status -->
      <div class="status">
        <p>Game Ready: {{ gameReady }}</p>
        <p>Game Running: {{ (gameState$ | async)?.isRunning }}</p>
        <p>FPS: {{ (gameState$ | async)?.frameRate }}</p>
        <p>Objects: {{ (gameState$ | async)?.gameObjects?.length || 0 }}</p>
        <p>Active Animations: {{ activeAnimations$ | async }}</p>
      </div>
      
      <!-- Input Status -->
      <div class="input-status">
        <h3>Input Status:</h3>
        <p>Mouse: ({{ (mouseState$ | async)?.x }}, {{ (mouseState$ | async)?.y }})</p>
        <p>Mouse Down: {{ (mouseState$ | async)?.isDown }}</p>
        <p>Keys Pressed: {{ getPressedKeys() }}</p>
      </div>
      
      <!-- Audio Status -->
      <div class="audio-status" *ngIf="(audioState$ | async)?.['background'] as audio">
        <h3>Audio Status:</h3>
        <p>Loading: {{ audio.isLoading }}</p>
        <p>Playing: {{ audio.isPlaying }}</p>
        <p>Time: {{ audio.currentTime | number:'1.1-1' }}s / {{ audio.duration | number:'1.1-1' }}s</p>
        <div class="audio-controls">
          <button (click)="playAudio()" [disabled]="audio.isPlaying">Play</button>
          <button (click)="pauseAudio()" [disabled]="!audio.isPlaying">Pause</button>
          <button (click)="stopAudio()">Stop</button>
        </div>
      </div>
      
      <!-- Instructions -->
      <div class="instructions">
        <h3>Controls:</h3>
        <p>Arrow Keys or WASD: Move player</p>
        <p>Space or Up Arrow: Jump</p>
        <p>Mouse Click: Add platforms at cursor position</p>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .canvas-wrapper {
      border: 2px solid #333;
      margin: 20px 0;
      display: inline-block;
    }

    .game-canvas {
      display: block;
      background: #87CEEB;
      cursor: crosshair;
    }

    .controls {
      margin: 20px 0;
    }

    .btn {
      margin: 0 10px;
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .btn:disabled {
      background: #cccccc !important;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #4CAF50;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-secondary {
      background: #f44336;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #da190b;
    }

    .btn-success {
      background: #2196F3;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #1976D2;
    }

    .btn-info {
      background: #FF9800;
      color: white;
    }

    .btn-info:hover:not(:disabled) {
      background: #F57C00;
    }

    .status, .input-status, .audio-status {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }

    .status p, .input-status p, .audio-status p {
      margin: 5px 0;
      font-family: monospace;
    }

    .audio-controls {
      margin-top: 10px;
    }

    .audio-controls button {
      margin: 0 5px;
      padding: 5px 10px;
      font-size: 12px;
    }

    .instructions {
      background: #e8f4fd;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #2196F3;
    }

    .instructions h3 {
      margin-top: 0;
      color: #1976D2;
    }

    .instructions p {
      margin: 5px 0;
    }

    h3 {
      color: #333;
      margin-bottom: 10px;
    }
  `]
})
export class EipsGameComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  // Game configuration
  gameWidth = 800;
  gameHeight = 600;
  
  // Game state
  gameReady = false;
  player: Player | null = null;
  platforms: any[] = [];
  
  // Observables
  gameState$ = this.gameService.gameState$;
  keyboardState$ = this.gameService.keyboardState$;
  mouseState$ = this.gameService.mouseState$;
  audioState$ = this.mediaService.audioState$;
  activeAnimations$ = this.animationService.activeAnimations$;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  // Game loop
  private gameLoopId: number | null = null;
  
  constructor(
    private canvasService: CanvasService,
    private mediaService: MediaService,
    private gameService: GameService,
    private graphicsService: GraphicsService,
    private animationService: AnimationService
  ) {}
  
  ngOnInit() {
    this.initializeGame();
    this.setupAudio();
    this.setupInputHandlers();
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
    }
  }
  
  async initializeGame() {
    // Initialize game services
    this.gameService.initializeGame(this.canvasElement.nativeElement);
    this.canvasService.initializeCanvas(this.canvasElement.nativeElement, this.gameWidth, this.gameHeight);
    
    // Wait for services to be ready
    const readySub = this.canvasService.isReady$.subscribe(async (ready) => {
      if (ready) {
        this.gameReady = true;
        await this.setupGameObjects();
      }
    });
    
    this.subscriptions.push(readySub);
  }
  
  async setupGameObjects() {
    try {
      // Create player sprite
      const playerSprite = await this.canvasService.createSprite();
      
      if (playerSprite) {
        // Setup player properties
        playerSprite.x = 100;
        playerSprite.y = 400;
        playerSprite.width = 32;
        playerSprite.height = 32;
        
        // Draw player (red rectangle)
        this.graphicsService.drawRect(playerSprite.graphics, 0, 0, 32, 32, 0xFF0000);
        
        // Create player object
        this.player = {
          sprite: playerSprite,
          velocityX: 0,
          velocityY: 0,
          onGround: false
        };
        
        this.canvasService.addToStage(playerSprite);
        this.gameService.addGameObject(playerSprite);
        
        // Create initial platforms
        await this.createPlatform(0, this.gameHeight - 40, this.gameWidth, 40); // Ground
        await this.createPlatform(200, 450, 150, 20); // Platform 1
        await this.createPlatform(450, 350, 150, 20); // Platform 2
      }
      
    } catch (error) {
      console.error('Failed to setup game objects:', error);
    }
  }
  
  async setupAudio() {
    try {
      await this.mediaService.createAudioPlayer('background');
      // Note: In a real app, you would load an actual audio file
      // await this.mediaService.loadAudio('background', '/assets/audio/background.mp3');
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  }
  
  setupInputHandlers() {
    // Handle mouse clicks for platform creation
    this.canvasElement.nativeElement.addEventListener('click', (e) => {
      const rect = this.canvasElement.nativeElement.getBoundingClientRect();
      const x = e.clientX - rect.left - 75; // Center platform on click
      const y = e.clientY - rect.top - 10;
      
      if (x >= 0 && x <= this.gameWidth - 150 && y >= 0 && y <= this.gameHeight - 20) {
        this.createPlatform(x, y, 150, 20);
      }
    });
  }
  
  async createPlatform(x: number, y: number, width: number, height: number) {
    try {
      const platform = await this.canvasService.createSprite();
      
      if (platform) {
        platform.x = x;
        platform.y = y;
        platform.width = width;
        platform.height = height;
        
        // Draw platform (green rectangle)
        this.graphicsService.drawRect(platform.graphics, 0, 0, width, height, 0x00FF00);
        
        this.platforms.push(platform);
        this.canvasService.addToStage(platform);
        this.gameService.addGameObject(platform);
      }
    } catch (error) {
      console.error('Failed to create platform:', error);
    }
  }
  
  startGame() {
    this.gameService.startGame();
    this.startGameLoop();
  }
  
  stopGame() {
    this.gameService.stopGame();
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
  
  startGameLoop() {
    const gameLoop = () => {
      this.updateGame();
      
      if (this.gameService.gameState$.value.isRunning) {
        this.gameLoopId = requestAnimationFrame(gameLoop);
      }
    };
    
    this.gameLoopId = requestAnimationFrame(gameLoop);
  }
  
  updateGame() {
    if (!this.player) return;
    
    // Player input
    const moveSpeed = 5;
    const jumpPower = 15;
    const gravity = 0.8;
    
    // Horizontal movement
    if (this.gameService.isKeyPressed('ArrowLeft') || this.gameService.isKeyPressed('KeyA')) {
      this.player.velocityX = -moveSpeed;
    } else if (this.gameService.isKeyPressed('ArrowRight') || this.gameService.isKeyPressed('KeyD')) {
      this.player.velocityX = moveSpeed;
    } else {
      this.player.velocityX *= 0.8; // Friction
    }
    
    // Jumping
    if ((this.gameService.isKeyPressed('Space') || this.gameService.isKeyPressed('ArrowUp') || this.gameService.isKeyPressed('KeyW')) && this.player.onGround) {
      this.player.velocityY = -jumpPower;
      this.player.onGround = false;
    }
    
    // Apply gravity
    this.player.velocityY += gravity;
    
    // Update position
    this.player.sprite.x += this.player.velocityX;
    this.player.sprite.y += this.player.velocityY;
    
    // Collision detection with platforms
    this.player.onGround = false;
    
    for (const platform of this.platforms) {
      if (this.checkCollision(this.player.sprite, platform)) {
        // Landing on top of platform
        if (this.player.velocityY > 0 && this.player.sprite.y < platform.y) {
          this.player.sprite.y = platform.y - this.player.sprite.height;
          this.player.velocityY = 0;
          this.player.onGround = true;
        }
      }
    }
    
    // Keep player in bounds
    if (this.player.sprite.x < 0) this.player.sprite.x = 0;
    if (this.player.sprite.x > this.gameWidth - this.player.sprite.width) {
      this.player.sprite.x = this.gameWidth - this.player.sprite.width;
    }
    
    // Reset if player falls below screen
    if (this.player.sprite.y > this.gameHeight) {
      this.player.sprite.x = 100;
      this.player.sprite.y = 400;
      this.player.velocityX = 0;
      this.player.velocityY = 0;
    }
  }
  
  checkCollision(obj1: any, obj2: any): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }
  
  async addPlatform() {
    // Add platform at random position
    const x = Math.random() * (this.gameWidth - 150);
    const y = Math.random() * (this.gameHeight - 200) + 100;
    await this.createPlatform(x, y, 150, 20);
    
    // Animate the new platform
    const platform = this.platforms[this.platforms.length - 1];
    if (platform) {
      platform.alpha = 0;
      this.animationService.animate(platform, { alpha: 1 }, 500).subscribe();
    }
  }
  
  playSound() {
    // Simulate sound effect with animation
    if (this.player) {
      const originalScale = this.player.sprite.scaleX || 1;
      this.animationService.animate(
        this.player.sprite,
        { scaleX: originalScale * 1.5, scaleY: originalScale * 1.5 },
        200
      ).subscribe(() => {
        this.animationService.animate(
          this.player.sprite,
          { scaleX: originalScale, scaleY: originalScale },
          200
        ).subscribe();
      });
    }
  }
  
  playAudio() {
    this.mediaService.playAudio('background');
  }
  
  pauseAudio() {
    this.mediaService.pauseAudio('background');
  }
  
  stopAudio() {
    this.mediaService.stopAudio('background');
  }
  
  getPressedKeys(): string {
    const keys = this.gameService.keyboardState$.value;
    const pressedKeys = Object.keys(keys).filter(key => keys[key]);
    return pressedKeys.join(', ') || 'None';
  }
}