// tests/e2e/cdp-helper.mjs
// Lightweight Headless Chrome / Edge DevTools Protocol (CDP) Helper
// Zero third-party npm dependencies — uses native Node.js http, child_process, and WebSocket.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

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

export function findBrowserBinary() {
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
  return null;
}

export class CDPClient {
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

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getDebuggerUrl(cdpPort) {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch (_) {}
    await sleep(250);
  }
  throw new Error(`Could not connect to CDP /json on port ${cdpPort}`);
}

export class CDPHarness {
  constructor({ httpPort = 4198, cdpPort = 9488, distDir = path.resolve('dist') } = {}) {
    this.httpPort = httpPort;
    this.cdpPort = cdpPort;
    this.distDir = distDir;
    this.server = null;
    this.browserProc = null;
    this.tempDir = null;
    this.client = null;
  }

  async start() {
    if (!fs.existsSync(this.distDir)) {
      throw new Error(`Build directory "${this.distDir}" does not exist. Run build first.`);
    }

    const browserPath = findBrowserBinary();
    if (!browserPath) {
      throw new Error('No Chrome/Edge browser binary found.');
    }

    // Start static HTTP file server for dist
    this.server = http.createServer((req, res) => {
      let p = req.url.split('?')[0].split('#')[0];
      if (p === '/' || !path.extname(p)) p = '/index.html';
      const f = path.join(this.distDir, p);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        const ext = path.extname(f).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(f).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(this.distDir, 'index.html')).pipe(res);
      }
    }).listen(this.httpPort, '127.0.0.1');

    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivocab_e2e_cdp_'));
    this.browserProc = spawn(browserPath, [
      '--headless=new',
      `--remote-debugging-port=${this.cdpPort}`,
      `--user-data-dir=${this.tempDir}`,
      '--window-size=375,667',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--mute-audio',
      '--no-first-run',
      'about:blank',
    ]);

    const wsUrl = await getDebuggerUrl(this.cdpPort);
    this.client = new CDPClient(wsUrl);
    await this.client.connect();

    await this.client.send('Page.enable');
    await this.client.send('Runtime.enable');
    await this.client.send('DOM.enable');

    return this;
  }

  async setViewport({ width, height, dpr = 2, mobile = true }) {
    await this.client.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile,
    });
    await this.client.send('Emulation.setTouchEmulationEnabled', {
      enabled: mobile,
      maxTouchPoints: mobile ? 5 : 0,
    });
  }

  async setupSessionFixture(words, allowedType = 'mcq') {
    const fixtureScript = `
      sessionStorage.setItem('hivocab_guest_entered', '1');
      localStorage.setItem('hivocab_guest_entered', '1');
      sessionStorage.setItem('hivocab_study_session_config', JSON.stringify({
        modeIndex: 1,
        allowedType: ${JSON.stringify(allowedType)},
        words: ${JSON.stringify(words)},
        timestamp: Date.now()
      }));
    `;
    await this.client.send('Page.addScriptToEvaluateOnNewDocument', { source: fixtureScript });
  }

  async navigateToQuiz(words = null) {
    if (words) {
      await this.setupSessionFixture(words);
    }
    await this.client.send('Page.navigate', { url: `http://127.0.0.1:${this.httpPort}/#learning` });
    return this.waitForSelector('[role="radiogroup"]', 8000);
  }

  async waitForSelector(selector, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await this.client.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
      if (exists) return true;
      await sleep(100);
    }
    return false;
  }

  async evaluate(code) {
    return this.client.evaluate(code);
  }

  async stop() {
    try {
      if (this.browserProc) this.browserProc.kill();
    } catch (_) {}
    if (this.server) {
      try { this.server.close(); } catch (_) {}
    }
    if (this.tempDir) {
      try { fs.rmSync(this.tempDir, { recursive: true, force: true }); } catch (_) {}
    }
  }
}
