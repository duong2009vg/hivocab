import { defineConfig } from 'vite';
import { resolve } from 'path';

import fs from 'fs';

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) return;

      // 1. Root scripts required by index.html and app.html
      const rootScripts = [
        'dataLayer.js',
        'aiHint.js',
        'dashboardStats.js',
        'soundEngine.js',
        'sessionEngine.js',
        'sessionUI.js',
        'thptExam.js',
        'bilingualReading.js',
        'library.js',
        'dictionary.js',
        'exercises.js',
        'mockData.js',
        'groq.js',
      ];

      for (const file of rootScripts) {
        const src = resolve(__dirname, file);
        const dest = resolve(outDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[copy-assets] Copied script: ${file}`);
        }
      }

      // 2. Static root assets
      const rootAssets = [
        'themes.css',
        'logo-mark.svg',
        'logo-mark-white.svg',
        'apple-touch-icon.png',
        'manifest.webmanifest',
        'robots.txt',
        '_headers',
        'bg-morning.svg',
        'bg-afternoon.svg',
        'bg-night.svg',
        'bg-ocean.svg',
      ];

      for (const file of rootAssets) {
        const src = resolve(__dirname, file);
        const dest = resolve(outDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      // 3. Copy css/ directory
      const cssSrc = resolve(__dirname, 'css');
      const cssDest = resolve(outDir, 'css');
      if (fs.existsSync(cssSrc)) {
        if (!fs.existsSync(cssDest)) fs.mkdirSync(cssDest, { recursive: true });
        for (const f of fs.readdirSync(cssSrc)) {
          const sPath = resolve(cssSrc, f);
          if (fs.statSync(sPath).isFile()) {
            fs.copyFileSync(sPath, resolve(cssDest, f));
          }
        }
        console.log('[copy-assets] Copied css/ directory');
      }

      // 4. Copy data/thpt_exams.json and data/sound/
      const dataDest = resolve(outDir, 'data');
      if (!fs.existsSync(dataDest)) fs.mkdirSync(dataDest, { recursive: true });
      
      const thptJson = resolve(__dirname, 'data', 'thpt_exams.json');
      if (fs.existsSync(thptJson)) {
        fs.copyFileSync(thptJson, resolve(dataDest, 'thpt_exams.json'));
        console.log('[copy-assets] Copied data/thpt_exams.json');
      }

      const soundSrc = resolve(__dirname, 'data', 'sound');
      const soundDest = resolve(dataDest, 'sound');
      if (fs.existsSync(soundSrc)) {
        if (!fs.existsSync(soundDest)) fs.mkdirSync(soundDest, { recursive: true });
        for (const f of fs.readdirSync(soundSrc)) {
          fs.copyFileSync(resolve(soundSrc, f), resolve(soundDest, f));
        }
        console.log('[copy-assets] Copied data/sound/ directory');
      }
    }
  };
}

export default defineConfig({
  plugins: [copyStaticAssetsPlugin()],
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
