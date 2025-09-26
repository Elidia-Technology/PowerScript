/**
 * EIPS + React Platformer Game Example
 * 
 * This example shows how a developer would use EIPS with React
 * to create AS3-style games and multimedia applications.
 * 
 * Installation:
 * npm install eips-client react
 * 
 * Usage:
 * import { useGame, useSprite, useGraphics } from 'eips-client/react';
 */

import React, { useEffect, useState } from 'react';
import { 
  useGame, 
  useSprite, 
  useGraphics, 
  useAudioPlayer, 
  useKeyboard,
  useAnimation 
} from '../client/react';

// ============================================================================
// GAME COMPONENTS
// ============================================================================

/**
 * AS3-Style Player Component
 */
function Player({ gameManager, onCollision }: { gameManager: any; onCollision: (obj: any) => void }) {
  const { sprite, addToStage } = useSprite();
  const { drawRect, drawCircle } = useGraphics(sprite);
  const { animate } = useAnimation();
  const { isKeyPressed } = useKeyboard();
  
  // Player properties
  const [position, setPosition] = useState({ x: 100, y: 400 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [onGround, setOnGround] = useState(false);
  
  // Create player graphics
  useEffect(() => {
    if (sprite) {
      // Draw player body (blue rectangle)
      drawRect(5, 10, 30, 35, 0x3498DB);
      // Draw player head (skin color circle)
      drawCircle(20, 15, 10, 0xFFDBB0);
      // Draw eyes
      drawCircle(17, 12, 2, 0x000000);
      drawCircle(23, 12, 2, 0x000000);
      
      // Add to game stage
      if (gameManager) {
        gameManager.addGameObject(sprite);
      }
    }
  }, [sprite, drawRect, drawCircle, gameManager]);
  
  // Update player position and physics
  useEffect(() => {
    if (!sprite) return;
    
    const updatePlayer = () => {
      let newVelocityX = velocity.x;
      let newVelocityY = velocity.y;
      let newX = position.x;
      let newY = position.y;
      
      // Handle input
      if (isKeyPressed('ArrowLeft') || isKeyPressed('KeyA')) {
        newVelocityX = -5;
        animate(sprite, { scaleX: -1 }, 200); // Flip sprite
      }
      if (isKeyPressed('ArrowRight') || isKeyPressed('KeyD')) {
        newVelocityX = 5;
        animate(sprite, { scaleX: 1 }, 200); // Normal sprite
      }
      if ((isKeyPressed('Space') || isKeyPressed('ArrowUp') || isKeyPressed('KeyW')) && onGround) {
        newVelocityY = -15;
        setOnGround(false);
      }
      
      // Apply gravity
      if (!onGround) {
        newVelocityY += 0.8;
      }
      
      // Update position
      newX += newVelocityX;
      newY += newVelocityY;
      
      // Ground collision
      const groundY = 525; // 600 - 75 (ground height)
      if (newY >= groundY) {
        newY = groundY;
        newVelocityY = 0;
        setOnGround(true);
      }
      
      // Screen boundaries
      if (newX < 0) newX = 0;
      if (newX > 760) newX = 760; // 800 - 40 (player width)
      
      // Apply friction
      newVelocityX *= 0.9;
      
      // Update sprite position
      sprite.x = newX;
      sprite.y = newY;
      
      setPosition({ x: newX, y: newY });
      setVelocity({ x: newVelocityX, y: newVelocityY });
    };
    
    const interval = setInterval(updatePlayer, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [sprite, position, velocity, onGround, isKeyPressed, animate]);
  
  return null; // This component doesn't render DOM elements
}

/**
 * AS3-Style Obstacle Component
 */
function Obstacle({ gameManager, x, y, width, height, speed = -3, onOffScreen }: {
  gameManager: any;
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  onOffScreen: () => void;
}) {
  const { sprite, addToStage } = useSprite();
  const { drawRect } = useGraphics(sprite);
  const [currentX, setCurrentX] = useState(x);
  
  // Create obstacle graphics
  useEffect(() => {
    if (sprite) {
      // Draw red obstacle
      drawRect(0, 0, width, height, 0xE74C3C);
      
      // Set initial position
      sprite.x = x;
      sprite.y = y;
      
      // Add to game stage
      if (gameManager) {
        gameManager.addGameObject(sprite);
      }
    }
  }, [sprite, drawRect, gameManager, x, y, width, height]);
  
  // Move obstacle
  useEffect(() => {
    if (!sprite) return;
    
    const moveObstacle = () => {
      const newX = currentX + speed;
      sprite.x = newX;
      setCurrentX(newX);
      
      // Check if off-screen
      if (newX + width < 0) {
        onOffScreen();
      }
    };
    
    const interval = setInterval(moveObstacle, 16);
    return () => clearInterval(interval);
  }, [sprite, currentX, speed, width, onOffScreen]);
  
  return null;
}

/**
 * AS3-Style Collectible Component
 */
function Collectible({ gameManager, x, y, speed = -3, onCollected, onOffScreen }: {
  gameManager: any;
  x: number;
  y: number;
  speed?: number;
  onCollected: () => void;
  onOffScreen: () => void;
}) {
  const { sprite, addToStage } = useSprite();
  const { drawCircle } = useGraphics(sprite);
  const [currentX, setCurrentX] = useState(x);
  const [bob, setBob] = useState(0);
  
  // Create collectible graphics
  useEffect(() => {
    if (sprite) {
      // Draw golden coin
      drawCircle(10, 10, 10, 0xF1C40F);
      drawCircle(10, 10, 6, 0xF39C12);
      
      // Set initial position
      sprite.x = x;
      sprite.y = y;
      
      // Add to game stage
      if (gameManager) {
        gameManager.addGameObject(sprite);
      }
    }
  }, [sprite, drawCircle, gameManager, x, y]);
  
  // Move and animate collectible
  useEffect(() => {
    if (!sprite) return;
    
    const moveCollectible = () => {
      const newX = currentX + speed;
      const newBob = bob + 0.2;
      
      sprite.x = newX;
      sprite.y = y + Math.sin(newBob) * 5; // Bobbing animation
      
      setCurrentX(newX);
      setBob(newBob);
      
      // Check if off-screen
      if (newX + 20 < 0) {
        onOffScreen();
      }
    };
    
    const interval = setInterval(moveCollectible, 16);
    return () => clearInterval(interval);
  }, [sprite, currentX, bob, speed, y, onOffScreen]);
  
  return null;
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

/**
 * EIPS React Platformer Game
 */
export default function EIPSPlatformerGame() {
  const { canvasRef, gameManager, startGame, stopGame, isRunning } = useGame(800, 600);
  const { loadAudio, play: playAudio } = useAudioPlayer();
  
  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState<Array<{ id: number; x: number; y: number; width: number; height: number }>>([]);
  const [collectibles, setCollectibles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [spawnTimer, setSpawnTimer] = useState(0);
  
  // Load game audio
  useEffect(() => {
    loadAudio('/sounds/jump.mp3');
  }, [loadAudio]);
  
  // Game loop for spawning objects
  useEffect(() => {
    if (!isRunning) return;
    
    const gameLoop = () => {
      setSpawnTimer(prev => {
        const newTimer = prev + 1;
        
        if (newTimer > 120) { // Spawn every 2 seconds at 60 FPS
          const rand = Math.random();
          
          if (rand < 0.7) {
            // Spawn obstacle
            const height = 40 + Math.random() * 60;
            setObstacles(prevObstacles => [...prevObstacles, {
              id: Date.now(),
              x: 850,
              y: 600 - 75 - height,
              width: 30,
              height
            }]);
          } else {
            // Spawn collectible
            setCollectibles(prevCollectibles => [...prevCollectibles, {
              id: Date.now(),
              x: 850,
              y: 200 + Math.random() * 100
            }]);
          }
          
          return 0;
        }
        
        return newTimer;
      });
      
      // Increase score
      setScore(prev => prev + 1);
    };
    
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [isRunning]);
  
  // Handle obstacle removal
  const removeObstacle = (id: number) => {
    setObstacles(prev => prev.filter(obs => obs.id !== id));
  };
  
  // Handle collectible collection
  const collectItem = (id: number) => {
    setCollectibles(prev => prev.filter(col => col.id !== id));
    setScore(prev => prev + 10);
    playAudio(); // Play collection sound
  };
  
  // Handle collectible removal
  const removeCollectible = (id: number) => {
    setCollectibles(prev => prev.filter(col => col.id !== id));
  };
  
  // Handle game over
  const handleGameOver = () => {
    setGameOver(true);
    stopGame();
  };
  
  // Restart game
  const restartGame = () => {
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setCollectibles([]);
    setSpawnTimer(0);
    startGame();
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '2.5em',
        margin: '0 0 10px 0'
      }}>
        EIPS React Platformer
      </h1>
      
      <p style={{ color: '#666', marginBottom: '20px' }}>
        AS3-Style Game Development with React Hooks
      </p>
      
      <div style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          style={{ 
            border: '2px solid #333',
            borderRadius: '10px',
            background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 87.5%, #8B4513 87.5%, #8B4513 100%)'
          }}
        />
        
        {/* Game UI Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Score: {score}
        </div>
        
        {/* Game Over Overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#E74C3C', margin: '0 0 15px 0' }}>Game Over!</h2>
            <p>Final Score: {score}</p>
            <button 
              onClick={restartGame}
              style={{
                background: 'linear-gradient(45deg, #27AE60, #2ECC71)',
                color: 'white',
                border: 'none',
                padding: '12px 25px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
      
      {/* Game Controls */}
      <div style={{ 
        marginTop: '20px',
        background: 'rgba(255,255,255,0.1)',
        padding: '15px',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Controls</h3>
        <span style={{ 
          display: 'inline-block',
          margin: '5px',
          padding: '5px 10px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>←/A</span> Move Left
        <span style={{ 
          display: 'inline-block',
          margin: '5px',
          padding: '5px 10px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>→/D</span> Move Right
        <span style={{ 
          display: 'inline-block',
          margin: '5px',
          padding: '5px 10px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontWeight: 'bold'
        }}>↑/W/Space</span> Jump
      </div>
      
      {/* Start/Stop Game Button */}
      <div style={{ marginTop: '20px' }}>
        {!isRunning && !gameOver && (
          <button 
            onClick={startGame}
            style={{
              background: 'linear-gradient(45deg, #3498DB, #2980B9)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🎮 Start Game
          </button>
        )}
        
        {isRunning && (
          <button 
            onClick={stopGame}
            style={{
              background: 'linear-gradient(45deg, #E74C3C, #C0392B)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '25px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ⏹️ Stop Game
          </button>
        )}
      </div>
      
      {/* Render Game Objects */}
      {gameManager && (
        <>
          <Player 
            gameManager={gameManager}
            onCollision={handleGameOver}
          />
          
          {obstacles.map(obstacle => (
            <Obstacle
              key={obstacle.id}
              gameManager={gameManager}
              x={obstacle.x}
              y={obstacle.y}
              width={obstacle.width}
              height={obstacle.height}
              onOffScreen={() => removeObstacle(obstacle.id)}
            />
          ))}
          
          {collectibles.map(collectible => (
            <Collectible
              key={collectible.id}
              gameManager={gameManager}
              x={collectible.x}
              y={collectible.y}
              onCollected={() => collectItem(collectible.id)}
              onOffScreen={() => removeCollectible(collectible.id)}
            />
          ))}
        </>
      )}
      
      {/* EIPS Framework Info */}
      <div style={{
        marginTop: '30px',
        background: 'rgba(255,255,255,0.1)',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '800px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#FFD700', margin: '0 0 15px 0' }}>
          EIPS Client-Side Framework Features
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
          margin: '15px 0'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
            <strong>AS3-Style Display Lists</strong><br />
            Stage, Sprite, Graphics API
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
            <strong>React Integration</strong><br />
            Custom hooks and components
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
            <strong>Multimedia Support</strong><br />
            Audio/Video players
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
            <strong>Game Development</strong><br />
            Physics, collision, input handling
          </div>
        </div>
        <p style={{ fontSize: '0.9em', opacity: '0.8' }}>
          <em>Built with PowerScript modules, compatible with React, Vue, Angular, and vanilla HTML5</em>
        </p>
      </div>
    </div>
  );
}