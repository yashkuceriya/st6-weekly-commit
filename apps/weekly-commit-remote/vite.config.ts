import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'node:path';

/**
 * Weekly Commit remote.
 *
 * Exposes `./WeeklyCommitApp` (default export) for federation. Production
 * builds emit `assets/remoteEntry.js` to S3+CloudFront; dev serves it from
 * :4201. The host imports it as `weekly_commit/WeeklyCommitApp`.
 *
 * Important: build must be run (or `vite preview`) — Vite Module Federation
 * does NOT work via the dev server. Use `yarn dev:remote` for the
 * build+watch+preview cycle.
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'weekly_commit',
      filename: 'remoteEntry.js',
      exposes: {
        './WeeklyCommitApp': './src/WeeklyCommitApp.tsx',
      },
      shared: {
        react: { requiredVersion: '^18.3.0', singleton: true },
        'react-dom': { requiredVersion: '^18.3.0', singleton: true },
        'react-redux': { requiredVersion: '^9.2.0', singleton: true },
        '@reduxjs/toolkit': { requiredVersion: '^2.5.0', singleton: true },
        'react-router-dom': { requiredVersion: '^6.28.0', singleton: true },
        // Share workspace contracts — must match host's federation config
        // so both sides resolve to the same weeklyCommitApi instance.
        '@st6/api-client': { singleton: true },
        '@st6/shared-types': { singleton: true },
        '@st6/shared-ui': { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // @st6/* resolved via yarn workspace symlinks (see node_modules/@st6/).
      // Explicit path aliases fight the federation plugin's shared-module
      // matcher, so we let package.json "main" do the work.
    },
  },
  server: {
    port: 4201,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4201,
    strictPort: true,
    cors: true,
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    modulePreload: false,
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.config.*', '**/test-setup.ts', '**/main.tsx', 'src/types/**'],
    },
  },
});
