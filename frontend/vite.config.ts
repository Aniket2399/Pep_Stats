/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Pin the test run to UTC so assertions on locale-formatted dates (e.g.
    // `toLocaleDateString`) are deterministic regardless of the machine/CI
    // runner's local timezone.
    env: { TZ: 'UTC' },
  },
})
