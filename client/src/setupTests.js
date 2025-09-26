// Setup file for CRA Jest to avoid hanging tests due to browser APIs
import '@testing-library/jest-dom';
// Use modern fake timers by default to prevent lingering real timers from draft saves or debounced logic
beforeAll(() => {
  jest.useFakeTimers();
});
afterAll(() => {
  jest.useRealTimers();
});

// requestAnimationFrame/cancelAnimationFrame
if (!global.requestAnimationFrame) global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
if (!global.cancelAnimationFrame) global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock AudioContext and related nodes
class MockAnalyserNode {
  constructor() { this.fftSize = 1024; }
  getByteTimeDomainData(arr) { for (let i = 0; i < arr.length; i++) arr[i] = 128; }
}
class MockMediaStreamSource { connect() {} }
class MockAudioContext {
  constructor() {}
  createAnalyser() { return new MockAnalyserNode(); }
  createMediaStreamSource() { return new MockMediaStreamSource(); }
  close() { return Promise.resolve(); }
}
if (!window.AudioContext) window.AudioContext = MockAudioContext;
if (!window.webkitAudioContext) window.webkitAudioContext = MockAudioContext;

// Mock mediaDevices.getUserMedia
if (!navigator.mediaDevices) navigator.mediaDevices = {};
if (!navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue({
    getTracks: () => [{ stop: jest.fn() }],
  });
}

// Mock HTMLMediaElement play/pause to avoid not-implemented errors
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn().mockResolvedValue(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: jest.fn() });

// Clear timers between tests to avoid open handles
afterEach(() => { jest.clearAllTimers(); });

// Mock matchMedia used by MUI and others
if (!window.matchMedia) {
  window.matchMedia = function matchMedia() {
    return {
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// Mock ResizeObserver/IntersectionObserver if used in components
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!window.ResizeObserver) window.ResizeObserver = NoopObserver;
if (!window.IntersectionObserver) window.IntersectionObserver = NoopObserver;

// Mock HTMLMediaElement play/pause to avoid unhandled promise rejections
// (play/pause already mocked above via defineProperty)

// Mock URL.createObjectURL and revokeObjectURL
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:mock';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

// Mock Canvas 2D context used by waveform drawing
if (typeof HTMLCanvasElement !== 'undefined') {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    if (type === '2d') {
      return {
        canvas: this,
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fillStyle: '#000',
        strokeStyle: '#000',
      };
    }
    return origGetContext ? origGetContext.call(this, type, opts) : null;
  };
}

// Minimal MediaRecorder mock so components importing it don’t crash
if (!window.MediaRecorder) {
  class MockMediaRecorder {
    constructor(stream, options) {
      this.stream = stream;
      this.options = options || {};
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
      this._timer = null;
    }
    start() {
      this.state = 'recording';
      this._timer = setTimeout(() => {
        const blob = new Blob(['test'], { type: 'audio/webm' });
        this.ondataavailable && this.ondataavailable({ data: blob });
      }, 10);
    }
    stop() {
      if (this._timer) clearTimeout(this._timer);
      this.state = 'inactive';
      this.onstop && this.onstop();
    }
    addEventListener(name, handler) {
      if (name === 'dataavailable') this.ondataavailable = handler;
      if (name === 'stop') this.onstop = handler;
    }
    removeEventListener() {}
  }
  window.MediaRecorder = MockMediaRecorder;
}

// Minimal Web Audio API mocks used in recording UI (AudioContext/AnalyserNode)
// (AudioContext already mocked at top of file if missing)
