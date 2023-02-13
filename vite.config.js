import { defineConfig } from 'vite';
import * as fs from 'fs';

const jsonify = obj =>
  Object.fromEntries(
    Object.keys(obj)
      .filter(key => key !== 'info')
      .map(key => [key, obj[key]])
  );
const hotUpdate = {
  async handleHotUpdate({ file, timestamp, modules, read, server }) {
    console.log('MOD TYPE', modules[0].info);
    server.ws.send({
      type: 'custom',
      event: 'special-update',
      data: {
        file,
        timestamp,
        modules: modules.map(m => m.id),
        keys: Object.keys(modules[0]),
        mods: modules.map(jsonify),
        content: await read(),
      },
    });
    return [];
  },
};
export default defineConfig({
  root: './src',
  base: `https://localhost:5173/`,
  target: ['es2015'],
  // cssCodeSplit: false,
  // optimizeDeps: {
  //   force: true,
  // },
  plugins: [hotUpdate],
  server: {
    port: 5173,
    hmr: {
      protocol: 'wss',
      host: 'localhost',
    },
    https: {
      cert: fs.readFileSync(__dirname + '/keys/localhost.cert'),
      key: fs.readFileSync(__dirname + '/keys/localhost.key'),
    },
  },
  build: {
    watch: true,
    minify: false,
    assetsDir: './',
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    lib: {
      fileName: '[name]',
      entry: {
        ext: './src/ext.js',
        main: './src/main.js',
        bg: './src/bg.js',
      },
    },

    rollupOptions: {
      input: {
        main: 'src/main.js',
        bg: 'src/bg.html',
        ext: 'src/ext.html',
        // 'style.css': 'src/style.scss',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
