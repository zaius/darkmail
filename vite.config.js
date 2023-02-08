import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    watch: true,
    minify: false,
    assetsDir: './',
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
