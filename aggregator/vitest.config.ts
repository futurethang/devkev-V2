import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './lib'),
      '@tests': path.resolve(__dirname, './__tests__'),
    },
  },
})