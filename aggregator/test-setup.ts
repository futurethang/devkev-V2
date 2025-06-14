import { vi, beforeEach } from 'vitest'
import fetch from 'node-fetch'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Add fetch polyfill for Node.js (for integration tests)
if (!global.fetch) {
  global.fetch = fetch as any
}

// Mock console methods to avoid noise in tests (but keep warn for integration tests)
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: console.warn, // Keep real warn for integration test feedback
  info: vi.fn(),
}