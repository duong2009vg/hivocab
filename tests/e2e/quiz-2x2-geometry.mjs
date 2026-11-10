// tests/e2e/quiz-2x2-geometry.mjs
// Automated 2x2 Grid Geometry, Collision & Viewport Containment Test Runner
// Runs headless Edge/Chrome over Chrome DevTools Protocol (CDP) with zero npm dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

const TARGET_VIEWPORTS = [
  { id: 'vp-360', name: 'Galaxy S8 / Compact Android', width: 360, height: 640 },
  { id: 'vp-375', name: 'iPhone SE / 8 (Compact iOS)', width: 375, height: 667 },
  { id: 'vp-390', name: 'iPhone 12/13/14 (Standard iOS)', width: 390, height: 844 },
  { id: 'vp-414', name: 'iPhone XR / 11 (Wide iOS)', width: 414, height: 896 },
  { id: 'vp-430', name: 'iPhone 14/15/16 Pro Max (Large iOS)', width: 430, height: 932 },
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
const HTTP_PORT = parseInt(process.env.TEST_PORT || '4196', 10);
const CDP_PORT = parseInt(process.env.CDP_PORT || '9486', 10);

function findBrowserBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
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

async function waitForSelector(client, selector, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const exists = await client.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (exists) return true;
    await sleep(100);
  }
  return false;
}

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

export async function runQuizGeometryTestSuite() {
  const startTime = Date.now();
  console.log('================================================================================');
  console.log('📐 HIVOCAB 2x2 QUIZ GEOMETRY & COLLISION CDP TEST SUITE');
  console.log('================================================================================');

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Build directory "${DIST_DIR}" not found. Run "npm run build" first.`);
    process.exit(1);
  }

  const browserPath = findBrowserBinary();
  console.log(`Using Headless Browser: ${browserPath}`);
  console.log(`Serving Dist Build on : http://127.0.0.1:${HTTP_PORT}`);
  console.log(`Testing Viewports     : 360x640, 375x667, 390x844, 414x896, 430x932`);
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

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivocab_geom_e2e_'));
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

  function recordTest(category, name, passed, details = '') {
    if (passed) {
      totalPass++;
      console.log(`  ✅ PASS: [${category}] ${name}`);
      if (details) console.log(`          ${details}`);
    } else {
      totalFail++;
      console.log(`  ❌ FAIL: [${category}] ${name}`);
      if (details) console.log(`          ${details}`);
    }
    testResults.push({ category, name, passed, details });
  }

  try {
    const wsUrl = await getDebuggerUrl();
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    // Deterministic Mock Word Fixture covering varied word & meaning lengths
    const fixtureScript = `
      const testWords = [
        { id: 'w1', word: 'meticulous', meaning: 'tỉ mỉ, cẩn thận từng chi tiết nhỏ nhất trong mọi công việc', pos: 'adjective', phonetic: 'məˈtɪkjələs', example_sentence: 'She made a meticulous record of all expenses.' },
        { id: 'w2', word: 'collaborate', meaning: 'hợp tác cùng nhau làm việc hướng tới mục tiêu chung', pos: 'verb', phonetic: 'kəˈlæbəreɪt', example_sentence: 'Scientists collaborate across international borders.' },
        { id: 'w3', word: 'resilient', meaning: 'kiên cường, có khả năng phục hồi nhanh sau khó khăn', pos: 'adjective', phonetic: 'rɪˈzɪliənt', example_sentence: 'Children are surprisingly resilient to hardship.' },
        { id: 'w4', word: 'scrutinize', meaning: 'xem xét kỹ lưỡng và thận trọng', pos: 'verb', phonetic: 'ˈskruːtənaɪz', example_sentence: 'Inspectors scrutinize every component before release.' },
        { id: 'w5', word: 'comprehensive', meaning: 'toàn diện, bao quát toàn bộ mọi khía cạnh và chi tiết phức tạp của vấn đề', pos: 'adjective', phonetic: 'ˌkɒmprɪˈhensɪv', example_sentence: 'The team conducted a comprehensive audit of the system.' },
      ];
      sessionStorage.setItem('hivocab_guest_entered', '1');
      localStorage.setItem('hivocab_guest_entered', '1');
      sessionStorage.setItem('hivocab_study_session_config', JSON.stringify({
        modeIndex: 1,
        allowedType: 'mcq',
        words: testWords,
        timestamp: Date.now()
      }));
    `;

    await client.send('Page.addScriptToEvaluateOnNewDocument', { source: fixtureScript });

    for (const vp of TARGET_VIEWPORTS) {
      console.log(`\n================================================================================`);
      console.log(`📱 TESTING VIEWPORT: ${vp.name} (${vp.width}px × ${vp.height}px)`);
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

      // Navigate to #learning
      await client.send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/#learning` });

      const ready = await waitForSelector(client, '[role="radiogroup"]', 8000);
      if (!ready) {
        recordTest('Navigation', `${vp.width}x${vp.height} - Exercise Options Container Mounted`, false, 'Timed out waiting for [role="radiogroup"]');
        continue;
      }

      // ─── CHECK 1: 2-COLUMN GRID LAYOUT (2 TRACKS & 2x2 SPATIAL MATRIX) ───
      const gridMetrics = await client.evaluate(`(() => {
        const container = document.querySelector('[role="radiogroup"]') || document.querySelector('.grid.grid-cols-2');
        if (!container) return { found: false };
        const style = window.getComputedStyle(container);
        const rawCols = style.gridTemplateColumns || '';
        const tracks = rawCols.trim().split(/\\s+/).filter(Boolean);
        const options = Array.from(container.children);
        const rects = options.map(o => {
          const r = o.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
        });

        const is2x2 = rects.length === 4 &&
          Math.abs(rects[0].top - rects[1].top) <= 10 &&
          Math.abs(rects[2].top - rects[3].top) <= 10 &&
          Math.abs(rects[0].left - rects[2].left) <= 10 &&
          Math.abs(rects[1].left - rects[3].left) <= 10 &&
          rects[0].left < rects[1].left &&
          rects[0].top < rects[2].top;

        return {
          found: true,
          display: style.display,
          trackCount: tracks.length,
          tracks,
          optionCount: options.length,
          is2x2,
          rects,
        };
      })()`);

      const has2Tracks = gridMetrics.found && gridMetrics.trackCount === 2;
      recordTest(
        '2-Column Layout',
        `${vp.width}x${vp.height} - computed grid-template-columns has exactly 2 tracks`,
        has2Tracks,
        `tracks: [${gridMetrics.tracks?.join(', ')}], display: ${gridMetrics.display}`
      );

      recordTest(
        '2x2 Spatial Matrix',
        `${vp.width}x${vp.height} - 4 option cards form 2 distinct columns and 2 rows`,
        Boolean(gridMetrics.is2x2),
        `options: ${gridMetrics.optionCount}, R1: (${gridMetrics.rects?.[0]?.top}px, ${gridMetrics.rects?.[1]?.top}px), R2: (${gridMetrics.rects?.[2]?.top}px, ${gridMetrics.rects?.[3]?.top}px)`
      );

      // ─── CHECK 2: PROGRESS BAR COLLISION AVOIDANCE (>= 8px) ───
      const collisionMetrics = await client.evaluate(`(() => {
        const progressBar = document.querySelector('[data-purpose="learning-progress"]') || document.querySelector('.crayon-stripe-bg')?.closest('.relative')?.parentElement;
        const topBar = document.querySelector('[data-purpose="quiz-top-bar"]') || document.querySelector('header');
        const card = document.querySelector('[data-purpose="mcq-card"]') || document.querySelector('[role="radiogroup"]')?.closest('.bg-white');

        if (!progressBar || !card) return { found: false, hasProgress: !!progressBar, hasCard: !!card };

        const pRect = progressBar.getBoundingClientRect();
        const cRect = card.getBoundingClientRect();
        const tRect = topBar ? topBar.getBoundingClientRect() : null;

        const clearance = cRect.top - pRect.bottom;
        const topBarClearance = tRect ? (cRect.top - tRect.bottom) : clearance;

        return {
          found: true,
          progressBottom: Math.round(pRect.bottom),
          cardTop: Math.round(cRect.top),
          topBarBottom: tRect ? Math.round(tRect.bottom) : null,
          clearance: Math.round(clearance),
          topBarClearance: Math.round(topBarClearance),
          noCollision: clearance >= 8.0,
        };
      })()`);

      recordTest(
        'Collision Avoidance',
        `${vp.width}x${vp.height} - Card top vs Progress bar bottom distance >= 8px`,
        Boolean(collisionMetrics.found && collisionMetrics.noCollision),
        `clearance: ${collisionMetrics.clearance}px (progressBottom: ${collisionMetrics.progressBottom}px, cardTop: ${collisionMetrics.cardTop}px)`
      );

      // ─── CHECK 3: VIEWPORT VERTICAL CONTAINMENT (0px OVERFLOW) ───
      const overflowMetrics = await client.evaluate(`(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const innerH = window.innerHeight;
        const innerW = window.innerWidth;
        const docScrollH = docEl.scrollHeight;
        const bodyScrollH = body ? body.scrollHeight : 0;
        const docScrollW = docEl.scrollWidth;

        const vOverflow = Math.max(0, docScrollH - innerH);
        const hOverflow = Math.max(0, docScrollW - innerW);

        return {
          innerH,
          innerW,
          docScrollH,
          bodyScrollH,
          docScrollW,
          vOverflow: Math.round(vOverflow),
          hOverflow: Math.round(hOverflow),
          containedV: docScrollH <= innerH + 1.0,
          containedH: docScrollW <= innerW + 1.0,
          scrollY: window.scrollY,
        };
      })()`);

      recordTest(
        'Vertical Containment',
        `${vp.width}x${vp.height} - 0px vertical page overflow (scrollHeight <= innerHeight)`,
        Boolean(overflowMetrics.containedV),
        `docScrollH: ${overflowMetrics.docScrollH}px / innerH: ${overflowMetrics.innerH}px (overflow: ${overflowMetrics.vOverflow}px)`
      );

      recordTest(
        'Horizontal Containment',
        `${vp.width}x${vp.height} - 0px horizontal page overflow (scrollWidth <= innerWidth)`,
        Boolean(overflowMetrics.containedH),
        `docScrollW: ${overflowMetrics.docScrollW}px / innerW: ${overflowMetrics.innerW}px (overflow: ${overflowMetrics.hOverflow}px)`
      );

      // ─── CHECK 4: OPTION TEXT EXPANSION & LINE WRAPPING ───
      const textMetrics = await client.evaluate(`(() => {
        const container = document.querySelector('[role="radiogroup"]') || document.querySelector('.grid.grid-cols-2');
        if (!container) return { found: false };
        const options = Array.from(container.children);

        const details = options.map((opt, i) => {
          const textEl = opt.querySelector('.font-quicksand') || opt.querySelector('span:nth-child(2)') || opt;
          const optRect = opt.getBoundingClientRect();
          const textStyle = window.getComputedStyle(textEl);

          return {
            index: i,
            buttonHeight: Math.round(optRect.height),
            buttonWidth: Math.round(optRect.width),
            whiteSpace: textStyle.whiteSpace,
            spillsHorizontally: opt.scrollWidth > opt.clientWidth + 1.0,
            hasMinHeight: optRect.height >= 44.0,
          };
        });

        const allWrap = details.every(d => !d.spillsHorizontally && d.whiteSpace !== 'nowrap');
        const allMinHeight = details.every(d => d.hasMinHeight);

        return {
          found: true,
          details,
          allWrap,
          allMinHeight,
        };
      })()`);

      recordTest(
        'Text Wrapping & Fit',
        `${vp.width}x${vp.height} - Option buttons wrap text cleanly without horizontal spill`,
        Boolean(textMetrics.found && textMetrics.allWrap),
        `whiteSpace: ${textMetrics.details?.[0]?.whiteSpace}, no spills: ${textMetrics.allWrap}`
      );

      recordTest(
        'Touch Ergonomics',
        `${vp.width}x${vp.height} - 2x2 option buttons satisfy minimum touch height >= 44px`,
        Boolean(textMetrics.found && textMetrics.allMinHeight),
        `heights: [${textMetrics.details?.map(d => d.buttonHeight + 'px').join(', ')}]`
      );
    }

    console.log('\n================================================================================');
    console.log('📊 TEST RUN SUMMARY');
    console.log('================================================================================');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total Checks Executed : ${testResults.length}`);
    console.log(`Passed Checks         : ${totalPass} ✅`);
    console.log(`Failed Checks         : ${totalFail} ❌`);
    console.log(`Total Run Time        : ${elapsedSec}s`);
    console.log('================================================================================\n');

    if (totalFail > 0) {
      console.error(`💥 TEST SUITE FAILED: ${totalFail} checks did not pass.`);
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL 2x2 GRID GEOMETRY & COLLISION CHECKS PASSED WITH 0PX OVERFLOW!');
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

if (process.argv[1] && process.argv[1].endsWith('quiz-2x2-geometry.mjs')) {
  runQuizGeometryTestSuite();
}
