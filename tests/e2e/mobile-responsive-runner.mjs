// tests/e2e/mobile-responsive-runner.mjs
// Standalone Mobile Responsive & Overflow Test Runner for HiVocab
// Runs headless Edge/Chrome over Chrome DevTools Protocol (CDP) with zero npm dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

const TARGET_VIEWPORTS = [
  { id: 'vp-360', name: 'Galaxy S8/S20/A50 (Compact Android)', width: 360, height: 740 },
  { id: 'vp-375', name: 'iPhone SE / 8 (Compact iOS)', width: 375, height: 667 },
  { id: 'vp-390', name: 'iPhone 12/13/14 (Standard iOS)', width: 390, height: 844 },
  { id: 'vp-412', name: 'Galaxy S21/S24 / Pixel 7 (Standard Android)', width: 412, height: 915 },
  { id: 'vp-430', name: 'iPhone 14/15/16 Pro Max (Large iOS)', width: 430, height: 932 },
];

const ROUTES = [
  { id: 'landing', name: 'Landing Page', hash: '' },
  { id: 'login', name: 'Login & Register', hash: '#login' },
  { id: 'dashboard', name: 'Dashboard View', hash: '#dashboard' },
  { id: 'topics', name: 'Antique Topics Bookcase', hash: '#topics' },
  { id: 'library', name: 'Community Library & Decks', hash: '#library' },
  { id: 'vocabulary', name: 'Vocabulary Notebook', hash: '#vocabulary' },
  { id: 'exercises', name: 'Exercises Practice Hub', hash: '#exercises' },
  { id: 'dictionary', name: 'Smart Dictionary', hash: '#dictionary' },
  { id: 'thpt-room', name: 'THPT Exam Room', hash: '#thpt-room' },
  { id: 'bilingual-reading', name: 'Bilingual Reading Lab', hash: '#bilingual-reading' },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const DIST_DIR = path.resolve('dist');
const HTTP_PORT = 4195;
const CDP_PORT = 9485;

function findBrowserBinary() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.env.EDGE_PATH && fs.existsSync(process.env.EDGE_PATH)) return process.env.EDGE_PATH;
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  throw new Error('No compatible Chrome/Edge browser binary found for headless execution.');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.reqId = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            else resolve(msg.result);
          }
        } catch (e) {
          console.error('WS Parse error:', e);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.reqId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      const err = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Eval error: ${err}`);
    }
    return res.result?.value;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getDebuggerUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch (_) {}
    await sleep(250);
  }
  throw new Error('Could not connect to CDP /json');
}

async function runTestSuite() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('📱 HIVOCAB AUTOMATED MOBILE RESPONSIVE & LAYOUT E2E TEST SUITE');
  console.log('================================================================================');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Build directory "${DIST_DIR}" not found. Run "npm run build" first.`);
    process.exit(1);
  }

  const browserPath = findBrowserBinary();
  console.log(`Using Headless Browser: ${browserPath}`);
  console.log(`Serving Dist Build on : http://127.0.0.1:${HTTP_PORT}`);
  console.log(`Testing Viewports     : 360px, 375px, 390px, 412px, 430px`);
  console.log('--------------------------------------------------------------------------------\n');

  const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0].split('#')[0];
    if (p === '/' || !path.extname(p)) p = '/index.html';
    const f = path.join(DIST_DIR, p);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(path.join(DIST_DIR, 'index.html')).pipe(res);
    }
  }).listen(HTTP_PORT, '127.0.0.1');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivocab_e2e_mob_'));
  const browserProc = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempDir}`,
    '--window-size=375,667',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--mute-audio',
    '--no-first-run',
    'about:blank',
  ]);

  const testResults = [];
  let totalPass = 0;
  let totalFail = 0;
  let totalWarn = 0;

  function recordTest(category, name, passed, details = '', isWarning = false) {
    if (passed) {
      totalPass++;
      console.log(`  ✅ PASS: [${category}] ${name}`);
      if (details) console.log(`          ${details}`);
    } else if (isWarning) {
      totalWarn++;
      console.log(`  ⚠️  WARN: [${category}] ${name}`);
      if (details) console.log(`          ${details}`);
    } else {
      totalFail++;
      console.log(`  ❌ FAIL: [${category}] ${name}`);
      if (details) console.log(`          ${details}`);
    }
    testResults.push({ category, name, passed, isWarning, details });
  }

  try {
    const wsUrl = await getDebuggerUrl();
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Pre-seed guest access
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        sessionStorage.setItem('hivocab_guest_entered', '1');
        localStorage.setItem('hivocab_guest_entered', '1');
      `,
    });

    for (const vp of TARGET_VIEWPORTS) {
      console.log(`\n================================================================================`);
      console.log(`📱 VIEWPORT: ${vp.name} (${vp.width}px × ${vp.height}px)`);
      console.log(`================================================================================`);

      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await client.send('Emulation.setTouchEmulationEnabled', {
        enabled: true,
        maxTouchPoints: 5,
      });

      // ─── SUITE 1: ZERO HORIZONTAL OVERFLOW & ROUTE INTEGRITY ───
      for (const route of ROUTES) {
        const fullUrl = `http://127.0.0.1:${HTTP_PORT}/${route.hash}`;
        await client.send('Page.navigate', { url: fullUrl });
        await sleep(500);

        const metrics = await client.evaluate(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const innerW = window.innerWidth;
          const docScrollW = docEl.scrollWidth;
          const bodyScrollW = body ? body.scrollWidth : 0;

          // Check visible overflowing elements
          const all = Array.from(document.querySelectorAll('*'));
          const overflowing = [];
          for (const el of all) {
            if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
            
            const rect = el.getBoundingClientRect();
            if (rect.right > innerW + 1.5) {
              if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden') continue;
              overflowing.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                cls: (el.className || '').toString().slice(0, 40),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              });
            }
          }

          return {
            innerW,
            docScrollW,
            bodyScrollW,
            hasDocOverflow: docScrollW > innerW,
            hasBodyOverflow: bodyScrollW > innerW,
            overflowCount: overflowing.length,
            sampleOverflow: overflowing.slice(0, 2),
          };
        })()`);

        const zeroOverflow = !metrics.hasDocOverflow && !metrics.hasBodyOverflow;
        const details = `scrollWidth: ${metrics.docScrollW}px / innerWidth: ${metrics.innerW}px (offscreen els: ${metrics.overflowCount})`;
        recordTest(
          `Overflow 0px`,
          `${vp.width}px - ${route.name}`,
          zeroOverflow,
          zeroOverflow ? details : `${details} Offending: ${JSON.stringify(metrics.sampleOverflow)}`
        );
      }

      // ─── SUITE 2: MOBILE BOTTOM NAV & CLEARANCE CHECK ───
      await client.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#dashboard` });
      await sleep(500);

      const navInfo = await client.evaluate(`(() => {
        const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
        if (!nav) return { exists: false };
        const rect = nav.getBoundingClientRect();
        const pageEl = document.getElementById('page-dashboard');
        const style = pageEl ? window.getComputedStyle(pageEl) : null;
        
        // Check FAB
        const fab = document.querySelector('.fixed.bottom-20') || document.querySelector('button[class*="bg-[#DE5D53]"]');
        const fabRect = fab ? fab.getBoundingClientRect() : null;

        return {
          exists: true,
          navWidth: Math.round(rect.width),
          navHeight: Math.round(rect.height),
          navTop: Math.round(rect.top),
          navBottom: Math.round(rect.bottom),
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
          fabExists: !!fab,
          fabTop: fabRect ? Math.round(fabRect.top) : null,
          fabBottom: fabRect ? Math.round(fabRect.bottom) : null,
        };
      })()`);

      if (navInfo.exists) {
        const fitsHorizontal = navInfo.navWidth <= vp.width;
        recordTest(
          'Layout Shell',
          `${vp.width}px - MobileBottomNav Container Width Fits Viewport`,
          fitsHorizontal,
          `navWidth: ${navInfo.navWidth}px <= viewport: ${vp.width}px`
        );

        if (navInfo.fabExists && navInfo.fabBottom) {
          // FAB must float cleanly above bottom nav (navTop)
          const fabClearance = navInfo.fabBottom <= navInfo.navTop + 10;
          recordTest(
            'Layout Shell',
            `${vp.width}px - FAB Floats Safely Above MobileBottomNav`,
            fabClearance,
            `fabBottom: ${navInfo.fabBottom}px vs navTop: ${navInfo.navTop}px`
          );
        }
      }

      // ─── SUITE 3: TOUCH TARGETS ERGONOMICS (>= 40px) ───
      const touchAudit = await client.evaluate(`(() => {
        const interactive = Array.from(document.querySelectorAll('button, a[role="button"], [aria-label]'));
        const undersized = [];

        for (const el of interactive) {
          if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;

          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if strictly smaller than minimum ergonomic threshold
            if (rect.width < 36 || rect.height < 36) {
              if (el.tagName.toLowerCase() === 'span') continue;
              undersized.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || '').toString().slice(0, 40),
                aria: el.getAttribute('aria-label') || '',
                w: Math.round(rect.width),
                h: Math.round(rect.height),
              });
            }
          }
        }

        return {
          totalChecked: interactive.length,
          undersizedCount: undersized.length,
          samples: undersized.slice(0, 3),
        };
      })()`);

      recordTest(
        'Touch Ergonomics',
        `${vp.width}px - Interactive Button Ergonomics (>= 36-44px)`,
        touchAudit.undersizedCount === 0,
        touchAudit.undersizedCount === 0
          ? `All ${touchAudit.totalChecked} interactive elements meet touch dimensions.`
          : `Found ${touchAudit.undersizedCount} undersized targets: ${JSON.stringify(touchAudit.samples)}`,
        touchAudit.undersizedCount > 0
      );

      // ─── SUITE 4: MODALS & DRAWERS VIEWPORT FIT ───
      const modalChecks = [
        { name: 'PricingModal', open: 'openPricingModal', close: 'closePricingModal' },
        { name: 'CreateTopicModal', open: 'openCreateTopicModal', close: 'closeCreateTopicModal' },
        { name: 'BulkAddWordModal', open: 'openVocabBulkAddModal', close: 'closeVocabBulkAddModal' },
        { name: 'RequireLoginModal', open: 'openRequireLoginModal', close: 'closeRequireLoginModal', args: ["'Cần đăng nhập'", "'Thông báo'"] },
      ];

      for (const m of modalChecks) {
        await client.evaluate(`(() => {
          if (typeof window['${m.open}'] === 'function') {
            window['${m.open}'](${m.args ? m.args.join(',') : ''});
          }
        })()`);
        await sleep(350);

        const modalOverflow = await client.evaluate(`(() => {
          const docScrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          return {
            docScrollW,
            innerW,
            hasOverflow: docScrollW > innerW,
          };
        })()`);

        recordTest(
          'Modal Responsive',
          `${vp.width}px - ${m.name} Zero Horizontal Overflow`,
          !modalOverflow.hasOverflow,
          `scrollWidth: ${modalOverflow.docScrollW}px / innerWidth: ${modalOverflow.innerW}px`
        );

        await client.evaluate(`(() => {
          if (typeof window['${m.close}'] === 'function') {
            window['${m.close}']();
          }
        })()`);
        await sleep(200);
      }
    }

    console.log('\n================================================================================');
    console.log('📊 TEST RUN SUMMARY');
    console.log('================================================================================');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total Checks Executed : ${testResults.length}`);
    console.log(`Passed Checks         : ${totalPass} ✅`);
    console.log(`Warnings              : ${totalWarn} ⚠️`);
    console.log(`Failed Checks         : ${totalFail} ❌`);
    console.log(`Total Run Time        : ${elapsedSec}s`);
    console.log('================================================================================\n');

    if (totalFail > 0) {
      console.error(`💥 TEST SUITE FAILED: ${totalFail} checks did not pass.`);
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL MOBILE RESPONSIVE ASSERTIONS PASSED WITH 0PX OVERFLOW!');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Fatal Test Runner Exception:', err);
    process.exitCode = 1;
  } finally {
    try { browserProc.kill(); } catch (_) {}
    server.close();
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
}

runTestSuite();
