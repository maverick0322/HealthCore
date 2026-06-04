import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia — not available in jsdom but used by SettingsBar for theme detection
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver — not available in jsdom but used by Radix UI components
Object.assign(globalThis, {
  ResizeObserver: class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  }
});
