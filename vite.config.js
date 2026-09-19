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
        'app.js',
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
    }
  };
}

function htmlPartialsPlugin() {
  return {
    name: 'html-partials',
    transformIndexHtml(html) {
      return html.replace(/<!--\s*@include\s+['"]([^'"]+)['"]\s*-->/g, (match, filePath) => {
        const fullPath = resolve(__dirname, filePath);
        return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : match;
      });
    }
  };
}

export default defineConfig({
  plugins: [htmlPartialsPlugin(), copyStaticAssetsPlugin()],
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
