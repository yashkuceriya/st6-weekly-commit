import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'node:path';

/**
 * PA host shell configuration.
 *
 * Module Federation: declares `weekly_commit` as a remote loaded at runtime
 * from the remote dev server (4201) or its CDN URL in production.
 *
 * Shared singletons: react, react-dom, redux toolkit, react-redux are pinned
 * with `requiredVersion` so the host and remote use the same instance — critical
 * for hooks and context to work across the federation boundary.
 */
export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  const remoteUrl =
    process.env['WEEKLY_COMMIT_REMOTE_URL'] ??
    (isDev
      ? 'http://localhost:4201/assets/remoteEntry.js'
      : '/remotes/weekly-commit/assets/remoteEntry.js');

  return {
    plugins: [
      react(),
      federation({
        name: 'pa_host',
        remotes: {
          weekly_commit: remoteUrl,
        },
        shared: {
          react: { requiredVersion: '^18.3.0', singleton: true },
          'react-dom': { requiredVersion: '^18.3.0', singleton: true },
          'react-redux': { requiredVersion: '^9.2.0', singleton: true },
          '@reduxjs/toolkit': { requiredVersion: '^2.5.0', singleton: true },
          'react-router-dom': { requiredVersion: '^6.28.0', singleton: true },
          // Share workspace contracts so host and remote use the SAME
          // weeklyCommitApi instance (and therefore the same registered
          // reducer slice in the store). Without this each side bundles
          // its own copy and the remote's hooks read from a reducer
          // that isn't in the host's store.
          '@st6/api-client': { singleton: true },
          '@st6/shared-types': { singleton: true },
          '@st6/shared-ui': { singleton: true },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // @st6/* packages are resolved via node_modules yarn workspace symlinks
        // (see node_modules/@st6/*). Explicit path aliases fight the federation
        // plugin's shared-module resolution, so we rely on the yarn-linked
        // package.json "main" pointing at src/index.ts.
      },
    },
    server: {
      port: 4200,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
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
      css: true,
    },
  };
});
