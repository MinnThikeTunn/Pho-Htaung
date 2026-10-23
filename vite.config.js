import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    host: '127.0.0.1'
  },
  build: {
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) { if (id.includes('/node_modules/phaser/')) return 'phaser'; }
      }
    }
  }
});
