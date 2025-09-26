/**
 * EIPS React Integration Hooks
 * 
 * React hooks for AS3-style game development and multimedia
 * Using PowerScript client-side modules
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CanvasManager, MediaManager, GameManager } from './index';

// ============================================================================
// CANVAS & GRAPHICS HOOKS
// ============================================================================

/**
 * Hook to manage AS3-style Stage and canvas rendering
 */
export function useStage(width: number = 800, height: number = 600) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasManager, setCanvasManager] = useState<CanvasManager | null>(null);
  const [stage, setStage] = useState<any>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      const manager = new CanvasManager(canvasRef.current);
      setCanvasManager(manager);
      
      // Wait for stage to be ready
      const checkStage = () => {
        const stageInstance = manager.getStage();
        if (stageInstance) {
          setStage(stageInstance);
        } else {
          setTimeout(checkStage, 10);
        }
      };
      checkStage();
      
      return () => {
        manager.destroy();
      };
    }
  }, []);
  
  useEffect(() => {
    if (canvasManager) {
      canvasManager.resize(width, height);
    }
  }, [width, height, canvasManager]);
  
  const startRendering = useCallback(() => {
    if (canvasManager) {
      canvasManager.startRendering();
    }
  }, [canvasManager]);
  
  const stopRendering = useCallback(() => {
    if (canvasManager) {
      canvasManager.stopRendering();
    }
  }, [canvasManager]);
  
  return {
    canvasRef,
    stage,
    canvasManager,
    startRendering,
    stopRendering,
    isReady: !!stage
  };
}

/**
 * Hook to create and manage AS3-style Sprites
 */
export function useSprite() {
  const [sprite, setSprite] = useState<any>(null);
  
  useEffect(() => {
    let mounted = true;
    
    import('./index').then(({ createSprite }) => {
      createSprite().then(spriteInstance => {
        if (mounted) {
          setSprite(spriteInstance);
        }
      });
    });
    
    return () => {
      mounted = false;
    };
  }, []);
  
  const addToStage = useCallback((stage: any) => {
    if (sprite && stage) {
      stage.addChild(sprite);
    }
  }, [sprite]);
  
  const removeFromStage = useCallback((stage: any) => {
    if (sprite && stage) {
      stage.removeChild(sprite);
    }
  }, [sprite]);
  
  return {
    sprite,
    addToStage,
    removeFromStage,
    isReady: !!sprite
  };
}

/**
 * Hook for AS3-style graphics drawing
 */
export function useGraphics(sprite: any) {
  const graphics = useMemo(() => {
    return sprite?.graphics || null;
  }, [sprite]);
  
  const drawRect = useCallback((x: number, y: number, width: number, height: number, color: number = 0xFF0000) => {
    if (graphics) {
      graphics.beginFill(color);
      graphics.drawRect(x, y, width, height);
      graphics.endFill();
    }
  }, [graphics]);
  
  const drawCircle = useCallback((x: number, y: number, radius: number, color: number = 0xFF0000) => {
    if (graphics) {
      graphics.beginFill(color);
      graphics.drawCircle(x, y, radius);
      graphics.endFill();
    }
  }, [graphics]);
  
  const clear = useCallback(() => {
    if (graphics) {
      graphics.clear();
    }
  }, [graphics]);
  
  return {
    graphics,
    drawRect,
    drawCircle,
    clear,
    isReady: !!graphics
  };
}

// ============================================================================
// MULTIMEDIA HOOKS
// ============================================================================

/**
 * Hook to manage audio playback
 */
export function useAudioPlayer() {
  const [mediaManager] = useState(() => new MediaManager());
  const [audioPlayer, setAudioPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    return () => {
      mediaManager.destroy();
    };
  }, [mediaManager]);
  
  const loadAudio = useCallback(async (url: string, config?: any) => {
    setIsLoading(true);
    try {
      const player = await mediaManager.createAudioPlayer(config);
      await player.load(url);
      setAudioPlayer(player);
      
      // Set up event listeners
      player.addEventListener('play', () => setIsPlaying(true));
      player.addEventListener('pause', () => setIsPlaying(false));
      player.addEventListener('ended', () => setIsPlaying(false));
      player.addEventListener('timeupdate', () => {
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      });
      
    } catch (error) {
      console.error('Failed to load audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mediaManager]);
  
  const play = useCallback(async () => {
    if (audioPlayer) {
      await audioPlayer.play();
    }
  }, [audioPlayer]);
  
  const pause = useCallback(() => {
    if (audioPlayer) {
      audioPlayer.pause();
    }
  }, [audioPlayer]);
  
  const stop = useCallback(() => {
    if (audioPlayer) {
      audioPlayer.stop();
    }
  }, [audioPlayer]);
  
  const setVolume = useCallback((volume: number) => {
    if (audioPlayer) {
      audioPlayer.setVolume(volume);
    }
  }, [audioPlayer]);
  
  return {
    loadAudio,
    play,
    pause,
    stop,
    setVolume,
    isLoading,
    isPlaying,
    currentTime,
    duration,
    isReady: !!audioPlayer
  };
}

/**
 * Hook to manage video playback
 */
export function useVideoPlayer() {
  const [mediaManager] = useState(() => new MediaManager());
  const [videoPlayer, setVideoPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    return () => {
      mediaManager.destroy();
    };
  }, [mediaManager]);
  
  const loadVideo = useCallback(async (url: string, config?: any) => {
    setIsLoading(true);
    try {
      const player = await mediaManager.createVideoPlayer(config);
      await player.load(url);
      setVideoPlayer(player);
      
      // Set up event listeners
      player.addEventListener('play', () => setIsPlaying(true));
      player.addEventListener('pause', () => setIsPlaying(false));
      player.addEventListener('ended', () => setIsPlaying(false));
      player.addEventListener('timeupdate', () => {
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      });
      
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mediaManager]);
  
  const play = useCallback(async () => {
    if (videoPlayer) {
      await videoPlayer.play();
    }
  }, [videoPlayer]);
  
  const pause = useCallback(() => {
    if (videoPlayer) {
      videoPlayer.pause();
    }
  }, [videoPlayer]);
  
  const stop = useCallback(() => {
    if (videoPlayer) {
      videoPlayer.stop();
    }
  }, [videoPlayer]);
  
  const setVolume = useCallback((volume: number) => {
    if (videoPlayer) {
      videoPlayer.setVolume(volume);
    }
  }, [videoPlayer]);
  
  return {
    loadVideo,
    play,
    pause,
    stop,
    setVolume,
    isLoading,
    isPlaying,
    currentTime,
    duration,
    isReady: !!videoPlayer
  };
}

// ============================================================================
// GAME DEVELOPMENT HOOKS
// ============================================================================

/**
 * Hook for game development with AS3-style objects
 */
export function useGame(width: number = 800, height: number = 600) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (canvasRef.current) {
      const manager = new GameManager(canvasRef.current);
      setGameManager(manager);
      
      return () => {
        manager.destroy();
      };
    }
  }, []);
  
  const startGame = useCallback(() => {
    if (gameManager) {
      gameManager.start();
      setIsRunning(true);
    }
  }, [gameManager]);
  
  const stopGame = useCallback(() => {
    if (gameManager) {
      gameManager.stop();
      setIsRunning(false);
    }
  }, [gameManager]);
  
  const addGameObject = useCallback((gameObject: any) => {
    if (gameManager) {
      gameManager.addGameObject(gameObject);
    }
  }, [gameManager]);
  
  const removeGameObject = useCallback((gameObject: any) => {
    if (gameManager) {
      gameManager.removeGameObject(gameObject);
    }
  }, [gameManager]);
  
  const isKeyPressed = useCallback((keyCode: string) => {
    return gameManager ? gameManager.isKeyPressed(keyCode) : false;
  }, [gameManager]);
  
  return {
    canvasRef,
    gameManager,
    startGame,
    stopGame,
    addGameObject,
    removeGameObject,
    isKeyPressed,
    isRunning,
    isReady: !!gameManager
  };
}

/**
 * Hook for animation and tweening
 */
export function useAnimation() {
  const [animations, setAnimations] = useState<Map<string, any>>(new Map());
  
  const animate = useCallback((
    target: any,
    properties: { [key: string]: number },
    duration: number = 1000,
    easing: string = 'linear'
  ) => {
    const animationId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    const startValues: { [key: string]: number } = {};
    
    // Store initial values
    Object.keys(properties).forEach(prop => {
      startValues[prop] = target[prop] || 0;
    });
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing (simple linear for now)
      const easedProgress = progress;
      
      // Update properties
      Object.keys(properties).forEach(prop => {
        const startValue = startValues[prop];
        const endValue = properties[prop];
        target[prop] = startValue + (endValue - startValue) * easedProgress;
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimations(prev => {
          const newMap = new Map(prev);
          newMap.delete(animationId);
          return newMap;
        });
      }
    };
    
    setAnimations(prev => {
      const newMap = new Map(prev);
      newMap.set(animationId, { target, properties, duration, easing });
      return newMap;
    });
    
    requestAnimationFrame(animate);
    return animationId;
  }, []);
  
  const stopAnimation = useCallback((animationId: string) => {
    setAnimations(prev => {
      const newMap = new Map(prev);
      newMap.delete(animationId);
      return newMap;
    });
  }, []);
  
  const stopAllAnimations = useCallback(() => {
    setAnimations(new Map());
  }, []);
  
  return {
    animate,
    stopAnimation,
    stopAllAnimations,
    activeAnimations: animations.size
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for keyboard input handling
 */
export function useKeyboard() {
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: true }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  const isKeyPressed = useCallback((keyCode: string) => {
    return keys[keyCode] || false;
  }, [keys]);
  
  return {
    keys,
    isKeyPressed
  };
}

/**
 * Hook for mouse/touch input handling
 */
export function useMouse(elementRef?: React.RefObject<HTMLElement>) {
  const [mouseState, setMouseState] = useState({
    x: 0,
    y: 0,
    isDown: false,
    button: -1
  });
  
  useEffect(() => {
    const element = elementRef?.current || window;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef?.current?.getBoundingClientRect();
      setMouseState(prev => ({
        ...prev,
        x: rect ? e.clientX - rect.left : e.clientX,
        y: rect ? e.clientY - rect.top : e.clientY
      }));
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      setMouseState(prev => ({
        ...prev,
        isDown: true,
        button: e.button
      }));
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      setMouseState(prev => ({
        ...prev,
        isDown: false,
        button: -1
      }));
    };
    
    element.addEventListener('mousemove', handleMouseMove as any);
    element.addEventListener('mousedown', handleMouseDown as any);
    element.addEventListener('mouseup', handleMouseUp as any);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove as any);
      element.removeEventListener('mousedown', handleMouseDown as any);
      element.removeEventListener('mouseup', handleMouseUp as any);
    };
  }, [elementRef]);
  
  return mouseState;
}

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

export const EIPSReactHooks = {
  useStage,
  useSprite,
  useGraphics,
  useAudioPlayer,
  useVideoPlayer,
  useGame,
  useAnimation,
  useKeyboard,
  useMouse
};

export default EIPSReactHooks;