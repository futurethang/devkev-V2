import { vi, beforeEach } from 'vitest'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Mock fetch globally
global.fetch = vi.fn()

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}