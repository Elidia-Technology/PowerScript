<!--
  Vue 3 EIPS Game Example
  
  Simple platformer game using PowerScript EIPS client framework
  with Vue 3 Composition API
-->

<template>
  <div class="game-container">
    <h1>Vue EIPS Platformer Game</h1>
    
    <!-- Game Canvas -->
    <div class="canvas-wrapper">
      <canvas 
        ref="gameCanvas" 
        :width="gameWidth" 
        :height="gameHeight"
        class="game-canvas"
      ></canvas>
    </div>
    
    <!-- Game Controls -->
    <div class="controls">
      <button @click="startGame" :disabled="!gameReady || isRunning">
        Start Game
      </button>
      <button @click="stopGame" :disabled="!isRunning">
        Stop Game
      </button>
      <button @click="addPlatform">
        Add Platform
      </button>
    </div>
    
    <!-- Game Status -->
    <div class="status">
      <p>Game Ready: {{ gameReady }}</p>
      <p>Game Running: {{ isRunning }}</p>
      <p>FPS: {{ frameRate }}</p>
      <p>Objects: {{ gameObjects.length }}</p>
    </div>
    
    <!-- Instructions -->
    <div class="instructions">
      <h3>Controls:</h3>
      <p>Arrow Keys: Move player</p>
      <p>Space: Jump</p>
      <p>Mouse: Click to add platforms</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGame, useKeyboard, useMouse, useGraphics } from '@/client/vue';

// Game configuration
const gameWidth = 800;
const gameHeight = 600;

// Vue refs
const gameCanvas = ref<HTMLCanvasElement | null>(null);

// EIPS composables
const {
  canvasRef,
  gameManager,
  startGame: startGameLoop,
  stopGame: stopGameLoop,
  addGameObject,
  removeGameObject,
  isRunning,
  isReady: gameReady
} = useGame(gameWidth, gameHeight);

const { keys, isKeyPressed } = useKeyboard();
const mouseState = useMouse(gameCanvas);

// Game state
const frameRate = ref(60);
const gameObjects = ref<any[]>([]);
const player = ref<any>(null);

// Game objects
let platforms: any[] = [];

// Setup game when ready
watch(gameReady, async (ready) => {
  if (ready && gameManager.value) {
    await setupGame();
  }
});

// Handle mouse for new element
onMounted(() => {
  // Sync canvas refs
  canvasRef.value = gameCanvas.value;
});

async function setupGame() {
  if (!gameManager.value) return;
  
  try {
    // Create player sprite
    const { createSprite } = await import('@/client/index');
    player.value = await createSprite();
    
    if (player.value) {
      // Setup player properties
      player.value.x = 100;
      player.value.y = 400;
      player.value.width = 32;
      player.value.height = 32;
      
      // Draw player (red rectangle)
      const graphics = player.value.graphics;
      if (graphics) {
        graphics.beginFill(0xFF0000);
        graphics.drawRect(0, 0, 32, 32);
        graphics.endFill();
      }
      
      // Add player physics properties
      player.value.velocityX = 0;
      player.value.velocityY = 0;
      player.value.onGround = false;
      
      addGameObject(player.value);
      gameObjects.value.push(player.value);
      
      // Create initial platforms
      await createPlatform(0, gameHeight - 40, gameWidth, 40); // Ground
      await createPlatform(200, 450, 150, 20); // Platform 1
      await createPlatform(450, 350, 150, 20); // Platform 2
    }
    
  } catch (error) {
    console.error('Failed to setup game:', error);
  }
}

async function createPlatform(x: number, y: number, width: number, height: number) {
  try {
    const { createSprite } = await import('@/client/index');
    const platform = await createSprite();
    
    if (platform) {
      platform.x = x;
      platform.y = y;
      platform.width = width;
      platform.height = height;
      
      // Draw platform (green rectangle)
      const graphics = platform.graphics;
      if (graphics) {
        graphics.beginFill(0x00FF00);
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();
      }
      
      platforms.push(platform);
      addGameObject(platform);
      gameObjects.value.push(platform);
    }
  } catch (error) {
    console.error('Failed to create platform:', error);
  }
}

function startGame() {
  startGameLoop();
  
  // Start game update loop
  const gameLoop = () => {
    if (isRunning.value) {
      updateGame();
      requestAnimationFrame(gameLoop);
    }
  };
  
  requestAnimationFrame(gameLoop);
}

function stopGame() {
  stopGameLoop();
}

function updateGame() {
  if (!player.value) return;
  
  // Player input
  const moveSpeed = 5;
  const jumpPower = 15;
  const gravity = 0.8;
  
  // Horizontal movement
  if (isKeyPressed('ArrowLeft') || isKeyPressed('KeyA')) {
    player.value.velocityX = -moveSpeed;
  } else if (isKeyPressed('ArrowRight') || isKeyPressed('KeyD')) {
    player.value.velocityX = moveSpeed;
  } else {
    player.value.velocityX *= 0.8; // Friction
  }
  
  // Jumping
  if ((isKeyPressed('Space') || isKeyPressed('ArrowUp') || isKeyPressed('KeyW')) && player.value.onGround) {
    player.value.velocityY = -jumpPower;
    player.value.onGround = false;
  }
  
  // Apply gravity
  player.value.velocityY += gravity;
  
  // Update position
  player.value.x += player.value.velocityX;
  player.value.y += player.value.velocityY;
  
  // Collision detection with platforms
  player.value.onGround = false;
  
  for (const platform of platforms) {
    if (checkCollision(player.value, platform)) {
      // Landing on top of platform
      if (player.value.velocityY > 0 && player.value.y < platform.y) {
        player.value.y = platform.y - player.value.height;
        player.value.velocityY = 0;
        player.value.onGround = true;
      }
    }
  }
  
  // Keep player in bounds
  if (player.value.x < 0) player.value.x = 0;
  if (player.value.x > gameWidth - player.value.width) {
    player.value.x = gameWidth - player.value.width;
  }
  
  // Reset if player falls below screen
  if (player.value.y > gameHeight) {
    player.value.x = 100;
    player.value.y = 400;
    player.value.velocityX = 0;
    player.value.velocityY = 0;
  }
}

function checkCollision(obj1: any, obj2: any): boolean {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

async function addPlatform() {
  // Add platform at random position
  const x = Math.random() * (gameWidth - 150);
  const y = Math.random() * (gameHeight - 200) + 100;
  await createPlatform(x, y, 150, 20);
}
</script>

<style scoped>
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
}

.controls {
  margin: 20px 0;
}

.controls button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.controls button:hover:not(:disabled) {
  background: #45a049;
}

.status {
  background: #f0f0f0;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
}

.status p {
  margin: 5px 0;
  font-family: monospace;
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
</style>