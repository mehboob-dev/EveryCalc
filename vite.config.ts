/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: true
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: true
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild'
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.claude/**', '**/dist/**']
  }
});

