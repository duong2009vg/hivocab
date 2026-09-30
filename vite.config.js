import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

import fs from 'fs';

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) return;

      // 1. Root scripts required by index.html
      const rootScripts = [
        'legacyApp.js',
        'dataLayer.js',
        'aiHint.js',
        'dashboardStats.js',
        'soundEngine.js',
        'sessionEngine.js',
        'sessionUI.js',
        'thptExam.js',
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

      // 3. Copy standalone static HTML pages that don't need Vite processing
      const staticPages = ['admin.html', 'privacy.html', 'terms.html'];
      for (const page of staticPages) {
        const src = resolve(__dirname, page);
        const dest = resolve(outDir, page);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[copy-assets] Copied static page: ${page}`);
        }
      }

      // 2. Re-inject legacy non-module scripts into dist/index.html
      // Vite strips <script src="..."> tags without type="module" during build.
      // We must add them back manually so the app works in production.
      const distHtmlPath = resolve(outDir, 'index.html');
      if (fs.existsSync(distHtmlPath)) {
        let html = fs.readFileSync(distHtmlPath, 'utf-8');
        const legacyScripts = [
          '<script src="dataLayer.js?v=20260922-v11"></script>',
          '<script src="aiHint.js"></script>',
          '<script src="dashboardStats.js"></script>',
          '<script src="soundEngine.js?v=20260921-v8"></script>',
          '<script src="sessionEngine.js?v=20260913-qa-fix-v1"></script>',
          '<script src="sessionUI.js?v=20260921-v9"></script>',
          '<script src="thptExam.js?v=20260913-monitoring-v1"></script>',
          '<script src="pricing.js?v=20260920-v4"></script>',
          '<script src="dictionary.js?v=20260926-cleanui-v1"></script>',
          '<script defer src="legacyApp.js?v=20260927-v1"></script>',
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

function ttsDevPlugin() {
  return {
    name: 'tts-dev-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          const text = (url.searchParams.get('text') || url.searchParams.get('q') || '').trim();
          const lang = (url.searchParams.get('tl') || url.searchParams.get('lang') || 'en').trim();
          if (!text) {
            res.statusCode = 400;
            res.end('Missing text');
            return;
          }
          const sanitized = text
            .replace(/\.{2,}/g, ' ')
            .replace(/[/_]/g, ' ')
            .replace(/[-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 300);
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(sanitized)}`;
          const upstream = await fetch(googleUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end('TTS Error');
            return;
          }
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
          const buffer = await upstream.arrayBuffer();
          res.end(Buffer.from(buffer));
        } catch (e) {
          res.statusCode = 502;
          res.end(e.message);
        }
      });
    }
  };
}

function spaRoutesPlugin() {
  return {
    name: 'spa-routes-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawPath = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';
        // If route is /app or /login, redirect internally to /index.html
        if (rawPath === '/app' || rawPath === '/login') {
          req.url = '/index.html' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), spaRoutesPlugin(), ttsDevPlugin(), copyStaticAssetsPlugin()],
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
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  },
});
