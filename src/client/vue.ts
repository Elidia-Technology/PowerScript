/**
 * EIPS Vue 3 Composables
 * 
 * Vue 3 composables for AS3-style game development and multimedia
 * Using PowerScript client-side modules with Vue's Composition API
 */

import { ref, reactive, onMounted, onUnmounted, watch, computed, Ref } from 'vue';
import { CanvasManager, MediaManager, GameManager } from './index';

// ============================================================================
// TYPES FOR VUE INTEGRATION
// ============================================================================

interface StageComposable {
  canvasRef: Ref<HTMLCanvasElement | null>;
  stage: Ref<any>;
  canvasManager: Ref<any>;
  startRendering: () => void;
  stopRendering: () => void;
  isReady: Ref<boolean>;
}

interface SpriteComposable {
  sprite: Ref<any>;
  addToStage: (stage: any) => void;
  removeFromStage: (stage: any) => void;
  isReady: Ref<boolean>;
}

interface GraphicsComposable {
  graphics: Ref<any>;
  drawRect: (x: number, y: number, width: number, height: number, color?: number) => void;
  drawCircle: (x: number, y: number, radius: number, color?: number) => void;
  clear: () => void;
  isReady: Ref<boolean>;
}

interface AudioPlayerComposable {
  loadAudio: (url: string, config?: any) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isLoading: Ref<boolean>;
  isPlaying: Ref<boolean>;
  currentTime: Ref<number>;
  duration: Ref<number>;
  isReady: Ref<boolean>;
}

interface VideoPlayerComposable {
  loadVideo: (url: string, config?: any) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isLoading: Ref<boolean>;
  isPlaying: Ref<boolean>;
  currentTime: Ref<number>;
  duration: Ref<number>;
  isReady: Ref<boolean>;
}

interface GameComposable {
  canvasRef: Ref<HTMLCanvasElement | null>;
  gameManager: Ref<any>;
  startGame: () => void;
  stopGame: () => void;
  addGameObject: (gameObject: any) => void;
  removeGameObject: (gameObject: any) => void;
  isKeyPressed: (keyCode: string) => boolean;
  isRunning: Ref<boolean>;
  isReady: Ref<boolean>;
}

// ============================================================================
// CANVAS & GRAPHICS COMPOSABLES
// ============================================================================

/**
 * Composable to manage AS3-style Stage and canvas rendering
 */
export function useStage(width: number = 800, height: number = 600): StageComposable {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const canvasManager = ref<any>(null);
  const stage = ref<any>(null);
  const isReady = ref(false);
  
  onMounted(() => {
    if (canvasRef.value) {
      const manager = new CanvasManager(canvasRef.value);
      canvasManager.value = manager;
      stage.value = manager; // For simplicity, use manager as stage
      isReady.value = true;
    }
  });
  
  onUnmounted(() => {
    // Canvas manager doesn't have destroy method in current implementation
    canvasManager.value = null;
  });
  
  watch([() => width, () => height], ([newWidth, newHeight]) => {
    if (canvasManager.value) {
      canvasManager.value.resize(newWidth, newHeight);
    }
  });
  
  const startRendering = () => {
    // Canvas manager doesn't have startRendering method in current implementation
    // This would typically be handled by GameManager
  };
  
  const stopRendering = () => {
    // Canvas manager doesn't have stopRendering method in current implementation
    // This would typically be handled by GameManager
  };
  
  return {
    canvasRef,
    stage,
    canvasManager,
    startRendering,
    stopRendering,
    isReady
  };
}

/**
 * Composable to create and manage AS3-style Sprites
 */
export function useSprite(): SpriteComposable {
  const sprite = ref<any>(null);
  const isReady = ref(false);
  
  onMounted(async () => {
    try {
      const { createSprite } = await import('./index');
      const spriteInstance = await createSprite();
      sprite.value = spriteInstance;
      isReady.value = true;
    } catch (error) {
      console.error('Failed to create sprite:', error);
    }
  });
  
  const addToStage = (stage: any) => {
    if (sprite.value && stage) {
      stage.addChild(sprite.value);
    }
  };
  
  const removeFromStage = (stage: any) => {
    if (sprite.value && stage) {
      stage.removeChild(sprite.value);
    }
  };
  
  return {
    sprite,
    addToStage,
    removeFromStage,
    isReady
  };
}

/**
 * Composable for AS3-style graphics drawing
 */
export function useGraphics(sprite: Ref<any>): GraphicsComposable {
  const graphics = computed(() => {
    return sprite.value?.graphics || null;
  });
  
  const isReady = computed(() => !!graphics.value);
  
  const drawRect = (x: number, y: number, width: number, height: number, color: number = 0xFF0000) => {
    if (graphics.value) {
      graphics.value.beginFill(color);
      graphics.value.drawRect(x, y, width, height);
      graphics.value.endFill();
    }
  };
  
  const drawCircle = (x: number, y: number, radius: number, color: number = 0xFF0000) => {
    if (graphics.value) {
      graphics.value.beginFill(color);
      graphics.value.drawCircle(x, y, radius);
      graphics.value.endFill();
    }
  };
  
  const clear = () => {
    if (graphics.value) {
      graphics.value.clear();
    }
  };
  
  return {
    graphics,
    drawRect,
    drawCircle,
    clear,
    isReady
  };
}

// ============================================================================
// MULTIMEDIA COMPOSABLES
// ============================================================================

/**
 * Composable to manage audio playback
 */
export function useAudioPlayer(): AudioPlayerComposable {
  const mediaManager = new MediaManager();
  const audioPlayer = ref<any>(null);
  const isLoading = ref(false);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const isReady = ref(false);
  
  onUnmounted(() => {
    // MediaManager doesn't have destroy method in current implementation
  });
  
  const loadAudio = async (url: string, config?: any) => {
    isLoading.value = true;
    try {
      const player = mediaManager.createAudioPlayer(url);
      audioPlayer.value = player;
      isReady.value = true;
      
      // Set up event listeners
      player.addEventListener('play', () => {
        isPlaying.value = true;
      });
      
      player.addEventListener('pause', () => {
        isPlaying.value = false;
      });
      
      player.addEventListener('ended', () => {
        isPlaying.value = false;
      });
      
      player.addEventListener('timeupdate', () => {
        currentTime.value = player.currentTime || 0;
        duration.value = player.duration || 0;
      });
      
    } catch (error) {
      console.error('Failed to load audio:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const play = async () => {
    if (audioPlayer.value) {
      await audioPlayer.value.play();
    }
  };
  
  const pause = () => {
    if (audioPlayer.value) {
      audioPlayer.value.pause();
    }
  };
  
  const stop = () => {
    if (audioPlayer.value) {
      audioPlayer.value.stop();
    }
  };
  
  const setVolume = (volume: number) => {
    if (audioPlayer.value) {
      audioPlayer.value.setVolume(volume);
    }
  };
  
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
    isReady
  };
}

/**
 * Composable to manage video playback
 */
export function useVideoPlayer(): VideoPlayerComposable {
  const mediaManager = new MediaManager();
  const videoPlayer = ref<any>(null);
  const isLoading = ref(false);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const isReady = ref(false);
  
  onUnmounted(() => {
    // MediaManager doesn't have destroy method in current implementation
  });
  
  const loadVideo = async (url: string, config?: any) => {
    isLoading.value = true;
    try {
      const player = mediaManager.createVideoPlayer(url);
      videoPlayer.value = player;
      isReady.value = true;
      
      // Set up event listeners
      player.addEventListener('play', () => {
        isPlaying.value = true;
      });
      
      player.addEventListener('pause', () => {
        isPlaying.value = false;
      });
      
      player.addEventListener('ended', () => {
        isPlaying.value = false;
      });
      
      player.addEventListener('timeupdate', () => {
        currentTime.value = player.currentTime || 0;
        duration.value = player.duration || 0;
      });
      
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const play = async () => {
    if (videoPlayer.value) {
      await videoPlayer.value.play();
    }
  };
  
  const pause = () => {
    if (videoPlayer.value) {
      videoPlayer.value.pause();
    }
  };
  
  const stop = () => {
    if (videoPlayer.value) {
      videoPlayer.value.stop();
    }
  };
  
  const setVolume = (volume: number) => {
    if (videoPlayer.value) {
      videoPlayer.value.setVolume(volume);
    }
  };
  
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
    isReady
  };
}

// ============================================================================
// GAME DEVELOPMENT COMPOSABLES
// ============================================================================

/**
 * Composable for game development with AS3-style objects
 */
export function useGame(width: number = 800, height: number = 600): GameComposable {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const gameManager = ref<any>(null);
  const isRunning = ref(false);
  const isReady = ref(false);
  
  onMounted(() => {
    if (canvasRef.value) {
      const manager = new GameManager(canvasRef.value);
      gameManager.value = manager;
      isReady.value = true;
    }
  });
  
  onUnmounted(() => {
    if (gameManager.value) {
      gameManager.value.stop(); // GameManager has stop but not destroy
    }
  });
  
  const startGame = () => {
    if (gameManager.value) {
      gameManager.value.start();
      isRunning.value = true;
    }
  };
  
  const stopGame = () => {
    if (gameManager.value) {
      gameManager.value.stop();
      isRunning.value = false;
    }
  };
  
  const addGameObject = (gameObject: any) => {
    // GameManager doesn't have addGameObject in current implementation
    // This would typically be handled through update callbacks
  };
  
  const removeGameObject = (gameObject: any) => {
    // GameManager doesn't have removeGameObject in current implementation
    // This would typically be handled through update callbacks
  };
  
  const isKeyPressed = (keyCode: string): boolean => {
    return gameManager.value ? gameManager.value.isKeyPressed(keyCode) : false;
  };
  
  return {
    canvasRef,
    gameManager,
    startGame,
    stopGame,
    addGameObject,
    removeGameObject,
    isKeyPressed,
    isRunning,
    isReady
  };
}

// ============================================================================
// ANIMATION COMPOSABLES
// ============================================================================

/**
 * Composable for animation and tweening
 */
export function useAnimation() {
  const animations = reactive(new Map<string, any>());
  
  const animate = (
    target: any,
    properties: { [key: string]: number },
    duration: number = 1000,
    easing: string = 'linear'
  ): string => {
    const animationId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    const startValues: { [key: string]: number } = {};
    
    // Store initial values
    Object.keys(properties).forEach(prop => {
      startValues[prop] = target[prop] || 0;
    });
    
    const animateFrame = () => {
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
        requestAnimationFrame(animateFrame);
      } else {
        animations.delete(animationId);
      }
    };
    
    animations.set(animationId, { target, properties, duration, easing });
    requestAnimationFrame(animateFrame);
    return animationId;
  };
  
  const stopAnimation = (animationId: string) => {
    animations.delete(animationId);
  };
  
  const stopAllAnimations = () => {
    animations.clear();
  };
  
  const activeAnimations = computed(() => animations.size);
  
  return {
    animate,
    stopAnimation,
    stopAllAnimations,
    activeAnimations
  };
}

// ============================================================================
// UTILITY COMPOSABLES
// ============================================================================

/**
 * Composable for keyboard input handling
 */
export function useKeyboard() {
  const keys = reactive<{ [key: string]: boolean }>({});
  
  onMounted(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
  });
  
  const isKeyPressed = (keyCode: string): boolean => {
    return keys[keyCode] || false;
  };
  
  return {
    keys,
    isKeyPressed
  };
}

/**
 * Composable for mouse/touch input handling
 */
export function useMouse(elementRef?: Ref<HTMLElement | null>) {
  const mouseState = reactive({
    x: 0,
    y: 0,
    isDown: false,
    button: -1
  });
  
  onMounted(() => {
    const element = elementRef?.value || window;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = elementRef?.value?.getBoundingClientRect();
      mouseState.x = rect ? e.clientX - rect.left : e.clientX;
      mouseState.y = rect ? e.clientY - rect.top : e.clientY;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      mouseState.isDown = true;
      mouseState.button = e.button;
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      mouseState.isDown = false;
      mouseState.button = -1;
    };
    
    element.addEventListener('mousemove', handleMouseMove as any);
    element.addEventListener('mousedown', handleMouseDown as any);
    element.addEventListener('mouseup', handleMouseUp as any);
    
    onUnmounted(() => {
      element.removeEventListener('mousemove', handleMouseMove as any);
      element.removeEventListener('mousedown', handleMouseDown as any);
      element.removeEventListener('mouseup', handleMouseUp as any);
    });
  });
  
  return mouseState;
}

// ============================================================================
// EXPORT ALL COMPOSABLES
// ============================================================================

export const EIPSVueComposables = {
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

export default EIPSVueComposables;