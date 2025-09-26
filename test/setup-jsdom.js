// JSDOM setup for browser-like environment
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

global.performance = {
  now: () => Date.now()
};