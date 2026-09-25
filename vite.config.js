import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import react from '@vitejs/plugin-react';

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) return;

      // Copy css/
      const cssSrc = resolve(__dirname, 'css');
      const cssDest = resolve(outDir, 'css');
      if (fs.existsSync(cssSrc)) {
        if (!fs.existsSync(cssDest)) fs.mkdirSync(cssDest, { recursive: true });
        for (const f of fs.readdirSync(cssSrc)) {
          fs.copyFileSync(resolve(cssSrc, f), resolve(cssDest, f));
        }
        console.log('[copy-assets] Copied css/ directory');
      }

      // Copy functions/ recursively
      function copyDirRecursive(src, dest) {
        if (!fs.existsSync(src)) return;
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
          const sPath = resolve(src, item);
          const dPath = resolve(dest, item);
          if (fs.statSync(sPath).isDirectory()) {
            copyDirRecursive(sPath, dPath);
          } else {
            fs.copyFileSync(sPath, dPath);
          }
        }
      }

      const functionsSrc = resolve(__dirname, 'functions');
      const functionsDest = resolve(outDir, 'functions');
      if (fs.existsSync(functionsSrc)) {
        copyDirRecursive(functionsSrc, functionsDest);
        console.log('[copy-assets] Copied functions/ recursively');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyStaticAssetsPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
