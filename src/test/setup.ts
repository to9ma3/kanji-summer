import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom does not implement matchMedia; provide a minimal stub used by
// prefers-reduced-motion / prefers-color-scheme checks.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// jsdom does not implement the Canvas 2D API used by the handwriting
// canvas. Provide a lightweight stub so components can mount in tests.
if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext =
    vi.fn() as unknown as typeof HTMLCanvasElement.prototype.getContext
}

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// scrollIntoView is unimplemented in jsdom and is used by some focus helpers.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// window.scrollTo is unimplemented in jsdom; NavigationContext calls it on every navigation.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
