// Global test setup
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock DOM APIs for Node.js testing
global.HTMLAudioElement = class HTMLAudioElement {
  constructor() {
    this.src = '';
    this.volume = 1.0;
    this.currentTime = 0;
    this.duration = 0;
    this.paused = true;
    this.ended = false;
    this.readyState = 0;
  }
  
  play() { return Promise.resolve(); }
  pause() {}
  load() {}
  
  addEventListener() {}
  removeEventListener() {}
};

global.HTMLVideoElement = class HTMLVideoElement extends global.HTMLAudioElement {
  constructor() {
    super();
    this.videoWidth = 0;
    this.videoHeight = 0;
    this.poster = '';
  }
};

// Mock Canvas APIs
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 300;
    this.height = 150;
  }
  
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      transform: () => {},
      setLineDash: () => {},
      getLineDash: () => [],
      measureText: () => ({ width: 10 }),
      isPointInPath: () => false,
      isPointInStroke: () => false,
    };
  }
  
  toDataURL() { return 'data:image/png;base64,'; }
  toBlob() {}
};

// Mock File APIs
global.File = class File {
  constructor(fileBits, fileName, options) {
    this.name = fileName;
    this.size = 0;
    this.type = options?.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
  }
  
  readAsText() {}
  readAsDataURL() {}
  readAsArrayBuffer() {}
  
  addEventListener() {}
  removeEventListener() {}
};