# EIPS Client-Side Framework

**ActionScript 3-Style Multimedia & Game Development for Modern Web Frameworks**

EIPS Client is a powerful JavaScript/TypeScript library that brings the familiar ActionScript 3 programming model to modern web development. Build games, multimedia applications, and interactive experiences using AS3-style classes and APIs, while leveraging the power of React, Vue, Angular, or vanilla HTML5.

## 🚀 Quick Start

### Installation

```bash
# Install EIPS Client-Side Framework
npm install eips-client

# For React projects
npm install eips-client react

# For Vue projects  
npm install eips-client vue

# For Angular projects
npm install eips-client @angular/core
```

### Basic Usage

#### Vanilla HTML5
```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { EIPS, createCanvas, initializeEIPS } from 'eips-client';
        
        const container = document.getElementById('game-container');
        const { canvas, gameManager } = initializeEIPS(container, {
            width: 800,
            height: 600,
            enableGame: true
        });
        
        // Create AS3-style sprite
        const sprite = await EIPS.createSprite();
        sprite.graphics.beginFill(0xFF0000);
        sprite.graphics.drawRect(0, 0, 50, 50);
        sprite.graphics.endFill();
        
        gameManager.addGameObject(sprite);
        gameManager.start();
    </script>
</head>
<body>
    <div id="game-container"></div>
</body>
</html>
```

#### React Integration
```tsx
import React from 'react';
import { useGame, useSprite, useGraphics } from 'eips-client/react';

function MyGame() {
    const { canvasRef, gameManager, startGame } = useGame(800, 600);
    const { sprite, addToStage } = useSprite();
    const { drawRect } = useGraphics(sprite);
    
    useEffect(() => {
        if (sprite && gameManager) {
            // Draw AS3-style graphics
            drawRect(0, 0, 50, 50, 0xFF0000);
            gameManager.addGameObject(sprite);
        }
    }, [sprite, gameManager, drawRect]);
    
    return (
        <div>
            <canvas ref={canvasRef} />
            <button onClick={startGame}>Start Game</button>
        </div>
    );
}
```

## 🎯 Core Features

### AS3-Style Display System
- **Stage**: Root display container with rendering management
- **Sprite**: Display object with graphics drawing capabilities  
- **Graphics**: Vector graphics API with familiar AS3 methods
- **Point/Rectangle**: Geometry classes for positioning and collision detection

```typescript
import { Stage, Sprite, Point, Rectangle } from 'eips-client';

// Create stage and sprite
const stage = new Stage(800, 600);
const sprite = new Sprite();

// Draw graphics using familiar AS3 API
sprite.graphics.beginFill(0x3498DB);
sprite.graphics.drawRect(0, 0, 100, 50);
sprite.graphics.endFill();

// Position and add to display list
sprite.x = 100;
sprite.y = 100;
stage.addChild(sprite);
```

### Multimedia System
- **Audio Player**: Enhanced HTML5 audio with AS3-style controls
- **Video Player**: Custom video player with quality selection
- **Cross-platform**: Works in browsers and Node.js environments

```typescript
import { MediaManager } from 'eips-client';

const mediaManager = new MediaManager();

// Play audio
const audioPlayer = await mediaManager.createAudioPlayer();
await audioPlayer.load('/sounds/music.mp3');
await audioPlayer.play();

// Play video
const videoPlayer = await mediaManager.createVideoPlayer();
await videoPlayer.load('/videos/intro.mp4');
await videoPlayer.play();
```

### Game Development
- **Physics**: Built-in gravity, collision detection, and movement
- **Input**: Keyboard and mouse handling with event system
- **Animation**: Tweening and timeline management

```typescript
import { GameManager } from 'eips-client';

const gameManager = new GameManager(canvas);

// Create game object
const player = await createSprite();
player.graphics.beginFill(0x00FF00);
player.graphics.drawCircle(20, 20, 20);

// Add physics and input
gameManager.addGameObject(player);

// Handle keyboard input
if (gameManager.isKeyPressed('ArrowLeft')) {
    player.x -= 5;
}

gameManager.start();
```

## 🔌 Framework Integration

### React Hooks

EIPS provides custom React hooks for seamless integration:

```tsx
import { 
    useStage, 
    useSprite, 
    useGraphics,
    useAudioPlayer,
    useVideoPlayer,
    useGame,
    useAnimation,
    useKeyboard 
} from 'eips-client/react';

function GameComponent() {
    // Stage management
    const { canvasRef, stage, startRendering } = useStage(800, 600);
    
    // Sprite creation and management
    const { sprite, addToStage } = useSprite();
    
    // Graphics drawing
    const { drawRect, drawCircle, clear } = useGraphics(sprite);
    
    // Audio playback
    const { loadAudio, play, pause } = useAudioPlayer();
    
    // Game development
    const { gameManager, startGame, isKeyPressed } = useGame();
    
    // Animation system
    const { animate, stopAnimation } = useAnimation();
    
    // Input handling
    const { isKeyPressed: checkKey } = useKeyboard();
    
    return <canvas ref={canvasRef} />;
}
```

### Vue Composables

```vue
<template>
    <canvas ref="canvasRef"></canvas>
    <button @click="startGame">Start Game</button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VueUtils } from 'eips-client';

const canvasRef = ref(null);
const canvasManager = VueUtils.createCanvasManager();
const mediaManager = VueUtils.createMediaManager();

onMounted(() => {
    if (canvasRef.value) {
        canvasManager.setCanvas(canvasRef.value);
        canvasManager.startRendering();
    }
});

const startGame = () => {
    // Game logic here
};
</script>
```

### Angular Services

```typescript
import { Injectable, Component } from '@angular/core';
import { CanvasManager, MediaManager } from 'eips-client';

@Injectable()
export class EIPSService {
    private canvasManager = new CanvasManager();
    private mediaManager = new MediaManager();
    
    initializeCanvas(canvas: HTMLCanvasElement) {
        this.canvasManager.setCanvas(canvas);
        return this.canvasManager;
    }
    
    async playAudio(url: string) {
        return this.mediaManager.playAudio(url);
    }
}

@Component({
    template: `
        <canvas #gameCanvas width="800" height="600"></canvas>
        <button (click)="startGame()">Start Game</button>
    `
})
export class GameComponent {
    constructor(private eips: EIPSService) {}
    
    ngAfterViewInit() {
        const canvas = this.gameCanvas.nativeElement;
        this.eips.initializeCanvas(canvas);
    }
}
```

## 🎮 Complete Game Example

Here's a complete platformer game using EIPS + React:

```tsx
import React, { useEffect, useState } from 'react';
import { useGame, useSprite, useGraphics, useKeyboard } from 'eips-client/react';

function PlatformerGame() {
    const { canvasRef, gameManager, startGame, stopGame, isRunning } = useGame(800, 600);
    const { sprite: player, addToStage } = useSprite();
    const { drawRect, drawCircle } = useGraphics(player);
    const { isKeyPressed } = useKeyboard();
    
    const [score, setScore] = useState(0);
    const [playerPos, setPlayerPos] = useState({ x: 100, y: 400 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0 });
    
    // Create player graphics
    useEffect(() => {
        if (player) {
            // Draw player character
            drawRect(5, 10, 30, 35, 0x3498DB); // Body
            drawCircle(20, 15, 10, 0xFFDBB0);  // Head
            drawCircle(17, 12, 2, 0x000000);   // Left eye
            drawCircle(23, 12, 2, 0x000000);   // Right eye
            
            // Position player
            player.x = playerPos.x;
            player.y = playerPos.y;
            
            if (gameManager) {
                gameManager.addGameObject(player);
            }
        }
    }, [player, gameManager, drawRect, drawCircle]);
    
    // Game physics and input
    useEffect(() => {
        if (!isRunning || !player) return;
        
        const updateGame = () => {
            let newVelX = velocity.x;
            let newVelY = velocity.y;
            
            // Handle input
            if (isKeyPressed('ArrowLeft') || isKeyPressed('KeyA')) {
                newVelX = -5;
            }
            if (isKeyPressed('ArrowRight') || isKeyPressed('KeyD')) {
                newVelX = 5;
            }
            if (isKeyPressed('Space') && playerPos.y >= 525) {
                newVelY = -15; // Jump
            }
            
            // Apply gravity
            if (playerPos.y < 525) {
                newVelY += 0.8;
            }
            
            // Update position
            const newX = Math.max(0, Math.min(760, playerPos.x + newVelX));
            const newY = Math.min(525, playerPos.y + newVelY);
            
            // Update player sprite
            player.x = newX;
            player.y = newY;
            
            setPlayerPos({ x: newX, y: newY });
            setVelocity({ x: newVelX * 0.9, y: newY >= 525 ? 0 : newVelY });
            setScore(prev => prev + 1);
        };
        
        const interval = setInterval(updateGame, 16); // 60 FPS
        return () => clearInterval(interval);
    }, [isRunning, player, playerPos, velocity, isKeyPressed]);
    
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>EIPS Platformer Game</h1>
            <div style={{ position: 'relative' }}>
                <canvas 
                    ref={canvasRef}
                    style={{ 
                        border: '2px solid #333',
                        background: 'linear-gradient(to bottom, #87CEEB 87.5%, #8B4513 12.5%)'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px'
                }}>
                    Score: {score}
                </div>
            </div>
            <div style={{ marginTop: '20px' }}>
                {!isRunning ? (
                    <button onClick={startGame}>Start Game</button>
                ) : (
                    <button onClick={stopGame}>Stop Game</button>
                )}
            </div>
            <p>Use Arrow Keys or WASD to move, Space to jump!</p>
        </div>
    );
}

export default PlatformerGame;
```

## 📚 API Reference

### Core Classes

#### `Stage`
```typescript
class Stage extends DisplayObjectContainer {
    constructor(width: number, height: number);
    stageWidth: number;
    stageHeight: number;
    frameRate: number;
    backgroundColor: number;
    
    render(): void;
    startAnimation(): void;
    stopAnimation(): void;
    resize(width: number, height: number): void;
}
```

#### `Sprite`
```typescript
class Sprite extends DisplayObjectContainer {
    graphics: Graphics;
    
    startDrag(lockCenter?: boolean): void;
    stopDrag(): void;
    getBounds(): Rectangle;
    hitTestPoint(x: number, y: number): boolean;
}
```

#### `Graphics`
```typescript
class Graphics {
    beginFill(color: number, alpha?: number): Graphics;
    endFill(): Graphics;
    lineStyle(thickness: number, color: number, alpha?: number): Graphics;
    drawRect(x: number, y: number, width: number, height: number): Graphics;
    drawCircle(x: number, y: number, radius: number): Graphics;
    drawRoundRect(x: number, y: number, width: number, height: number, radius: number): Graphics;
    clear(): Graphics;
}
```

### React Hooks

#### `useStage(width, height)`
```typescript
const {
    canvasRef,           // Canvas element ref
    stage,              // Stage instance
    canvasManager,      // Canvas manager
    startRendering,     // Start render loop
    stopRendering,      // Stop render loop
    isReady            // Stage ready state
} = useStage(800, 600);
```

#### `useSprite()`
```typescript
const {
    sprite,            // Sprite instance
    addToStage,        // Add sprite to stage
    removeFromStage,   // Remove sprite from stage
    isReady           // Sprite ready state
} = useSprite();
```

#### `useGraphics(sprite)`
```typescript
const {
    graphics,         // Graphics instance
    drawRect,         // Draw rectangle
    drawCircle,       // Draw circle
    clear,           // Clear graphics
    isReady         // Graphics ready state
} = useGraphics(sprite);
```

#### `useAudioPlayer()`
```typescript
const {
    loadAudio,        // Load audio file
    play,            // Play audio
    pause,           // Pause audio
    stop,            // Stop audio
    setVolume,       // Set volume (0-1)
    isLoading,       // Loading state
    isPlaying,       // Playing state
    currentTime,     // Current playback time
    duration,        // Total duration
    isReady         // Player ready state
} = useAudioPlayer();
```

#### `useGame(width, height)`
```typescript
const {
    canvasRef,        // Canvas element ref
    gameManager,      // Game manager instance
    startGame,        // Start game loop
    stopGame,         // Stop game loop
    addGameObject,    // Add game object
    removeGameObject, // Remove game object
    isKeyPressed,     // Check key state
    isRunning,       // Game running state
    isReady         // Game ready state
} = useGame(800, 600);
```

## 🔧 Advanced Usage

### Custom Game Objects

Create custom game objects using AS3-style inheritance:

```typescript
import { Sprite } from 'eips-client';

class Player extends Sprite {
    private velocityX = 0;
    private velocityY = 0;
    private speed = 5;
    
    constructor() {
        super();
        this.createGraphics();
    }
    
    private createGraphics() {
        this.graphics.beginFill(0x3498DB);
        this.graphics.drawRoundRect(5, 10, 30, 35, 5);
        this.graphics.endFill();
        
        this.graphics.beginFill(0xFFDBB0);
        this.graphics.drawCircle(20, 15, 10);
        this.graphics.endFill();
    }
    
    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Apply friction
        this.velocityX *= 0.9;
        this.velocityY *= 0.9;
    }
    
    moveLeft() {
        this.velocityX = -this.speed;
    }
    
    moveRight() {
        this.velocityX = this.speed;
    }
    
    jump() {
        this.velocityY = -15;
    }
}
```

### Animation System

```typescript
import { useAnimation } from 'eips-client/react';

function AnimatedSprite({ sprite }) {
    const { animate, stopAnimation } = useAnimation();
    
    const bounceAnimation = () => {
        // Animate sprite properties
        animate(sprite, { 
            y: sprite.y - 50,
            scaleX: 1.2,
            scaleY: 0.8
        }, 500, 'easeOut').then(() => {
            animate(sprite, {
                y: sprite.y + 50,
                scaleX: 1.0,
                scaleY: 1.0
            }, 500, 'bounce');
        });
    };
    
    return (
        <button onClick={bounceAnimation}>
            Animate Sprite
        </button>
    );
}
```

### Physics Integration

```typescript
class PhysicsObject extends Sprite {
    public velocityX = 0;
    public velocityY = 0;
    public mass = 1;
    public friction = 0.98;
    public gravity = 0.5;
    
    update() {
        // Apply physics
        this.velocityY += this.gravity;
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Boundary collision
        if (this.y > 550) {
            this.y = 550;
            this.velocityY *= -0.8; // Bounce
        }
    }
    
    applyForce(forceX: number, forceY: number) {
        this.velocityX += forceX / this.mass;
        this.velocityY += forceY / this.mass;
    }
}
```

## 🚀 Deployment

### Build for Production

```bash
# Build the client-side package
npm run build

# This creates:
# - dist/cjs/     - CommonJS modules
# - dist/esm/     - ES modules  
# - dist/types/   - TypeScript definitions
```

### CDN Usage

```html
<!-- Use EIPS via CDN -->
<script type="module">
    import { EIPS } from 'https://cdn.jsdelivr.net/npm/eips-client@latest/dist/esm/index.js';
    
    const { canvas, gameManager } = EIPS.initializeEIPS(document.body, {
        width: 800,
        height: 600,
        enableGame: true
    });
    
    // Your game code here
</script>
```

### Framework-Specific Builds

```javascript
// React project
import { useGame, useSprite } from 'eips-client/react';

// Vue project  
import { VueUtils } from 'eips-client/vue';

// Angular project
import { CanvasManager } from 'eips-client/angular';

// Vanilla JavaScript
import { EIPS } from 'eips-client';
```

## 🤝 Contributing

EIPS is built on top of the PowerScript framework. To contribute:

1. Fork the [PowerScript repository](https://github.com/SaleemLww/PowerScript)
2. Create a feature branch
3. Make your changes in the `src/client/` directory
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [PowerScript Framework](https://github.com/SaleemLww/PowerScript)
- [Documentation](https://github.com/SaleemLww/PowerScript/tree/main/TechDocs)
- [Examples](https://github.com/SaleemLww/PowerScript/tree/main/examples)
- [Issues](https://github.com/SaleemLww/PowerScript/issues)

---

**EIPS Client-Side Framework** - Bringing ActionScript 3 development experience to modern web frameworks. Build games, multimedia apps, and interactive experiences with familiar AS3 APIs and modern JavaScript performance.