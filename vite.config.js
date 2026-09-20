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
        'pricing.js',
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

      // Copy functions/
      const functionsSrc = resolve(__dirname, 'functions');
      const functionsDest = resolve(outDir, 'functions');
      if (fs.existsSync(functionsSrc)) {
        if (!fs.existsSync(functionsDest)) fs.mkdirSync(functionsDest, { recursive: true });
        for (const f of fs.readdirSync(functionsSrc)) {
          const srcPath = resolve(functionsSrc, f);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, resolve(functionsDest, f));
          }
        }
        console.log('[copy-assets] Copied functions/ directory');
      }

      // 2. Re-inject legacy non-module scripts into dist/index.html
      // Vite strips <script src="..."> tags without type="module" during build.
      // We must add them back manually so the app works in production.
      const distHtmlPath = resolve(outDir, 'index.html');
      if (fs.existsSync(distHtmlPath)) {
        let html = fs.readFileSync(distHtmlPath, 'utf-8');
        const legacyScripts = [
          '<script src="dataLayer.js?v=20260920-v1"></script>',
          '<script src="aiHint.js"></script>',
          '<script src="dashboardStats.js"></script>',
          '<script src="soundEngine.js?v=20260912-v1"></script>',
          '<script src="sessionEngine.js?v=20260913-qa-fix-v1"></script>',
          '<script src="sessionUI.js?v=20260920-lock-v1"></script>',
          '<script src="thptExam.js?v=20260913-monitoring-v1"></script>',
          '<script src="bilingualReading.js?v=20260920-lock-v1"></script>',
          '<script src="library.js?v=20260914-remove-game-v6"></script>',
          '<script src="pricing.js?v=20260920-v4"></script>',
          '<script src="dictionary.js"></script>',
          '<script defer src="app.js?v=20260920-pro-v2"></script>',
        ].join('\n');
        // Inject right before </body>
        if (!html.includes('dataLayer.js')) {
          const replaced = html.replace(/<\/body>/i, `${legacyScripts}\n</body>`);
          if (replaced !== html) {
            fs.writeFileSync(distHtmlPath, replaced, 'utf-8');
            console.log('[copy-assets] Re-injected legacy scripts into dist/index.html');
          } else {
            console.warn('[copy-assets] WARNING: Could not find </body> in dist/index.html to inject scripts!');
            // Fallback: append before </html>
            const replaced2 = html.replace(/<\/html>/i, `${legacyScripts}\n</html>`);
            fs.writeFileSync(distHtmlPath, replaced2, 'utf-8');
            console.log('[copy-assets] Injected before </html> as fallback');
          }
        } else {
          console.log('[copy-assets] dataLayer.js already found in dist/index.html, skipping injection');
        }
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
