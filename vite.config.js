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

      // 1. Copy css/
      const cssSrc = resolve(__dirname, 'css');
      const cssDest = resolve(outDir, 'css');
      if (fs.existsSync(cssSrc)) {
        if (!fs.existsSync(cssDest)) fs.mkdirSync(cssDest, { recursive: true });
        for (const f of fs.readdirSync(cssSrc)) {
          fs.copyFileSync(resolve(cssSrc, f), resolve(cssDest, f));
        }
        console.log('[copy-assets] Copied css/ directory');
      }

      // 2. Copy functions/ recursively
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
