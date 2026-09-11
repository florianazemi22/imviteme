// Imvite render service — SKELETON.
//
// Turns an HTML document into a PNG/JPEG (OG images) or a PDF (print packs),
// using the same engine that renders the invitation itself. Deliberately has
// no framework and one dependency.
//
// Contract (docs/architecture/07-link-previews.md §7.1):
//   GET  /healthz          -> 200 {ok:true} once a browser is live
//   POST /render           -> image bytes
//        { html, width?, height?, format?: 'jpeg'|'png', quality?, dpr? }
//   POST /pdf              -> pdf bytes
//        { html, format?: 'A5'|'A6', landscape? }
//
// The caller owns the HTML. Symfony renders it from the theme's tokens so the
// OG card looks like the theme, and this service stays ignorant of themes.

import http from 'node:http';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT ?? 3000);
const MAX_CONCURRENCY = Number(process.env.MAX_CONCURRENCY ?? 2);
const RENDERS_PER_BROWSER = Number(process.env.RENDERS_PER_BROWSER ?? 200);
const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS ?? 15_000);
const MAX_BODY_BYTES = 2 * 1024 * 1024;

// --- browser lifecycle -------------------------------------------------------
// One long-lived browser, a fresh context per render. Launching per request
// costs ~800ms and will not survive any real load. Chromium also leaks slowly,
// so the browser is recycled after a fixed number of renders.

let browser = null;
let rendersOnBrowser = 0;
let launching = null;

async function getBrowser() {
  if (browser && rendersOnBrowser < RENDERS_PER_BROWSER) return browser;
  if (launching) return launching;

  launching = (async () => {
    const old = browser;
    browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
    rendersOnBrowser = 0;
    if (old) await old.close().catch(() => {});
    launching = null;
    return browser;
  })();

  return launching;
}

// --- a crude semaphore -------------------------------------------------------
// Chromium contexts are memory-hungry; unbounded concurrency is how this
// service dies. Queue instead.

let active = 0;
const waiting = [];

async function withSlot(fn) {
  if (active >= MAX_CONCURRENCY) await new Promise((r) => waiting.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    const next = waiting.shift();
    if (next) next();
  }
}

// --- rendering ---------------------------------------------------------------

async function withPage(viewport, dpr, fn) {
  return withSlot(async () => {
    const b = await getBrowser();
    rendersOnBrowser++;
    const ctx = await b.newContext({ viewport, deviceScaleFactor: dpr });
    try {
      const page = await ctx.newPage();
      page.setDefaultTimeout(NAV_TIMEOUT_MS);
      return await fn(page);
    } finally {
      await ctx.close().catch(() => {});
    }
  });
}

// Never screenshot on a timeout — that is how an image ships in a fallback
// font. Wait for fonts to settle, and for the template to say it is ready if
// it opts in by setting window.__ready.
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__ready !== false, null, { timeout: 5_000 })
    .catch(() => {});
}

async function renderImage({ html, width = 1200, height = 630, format = 'jpeg', quality = 82, dpr = 1 }) {
  return withPage({ width, height }, dpr, async (page) => {
    await page.setContent(html, { waitUntil: 'load' });
    await settle(page);
    return page.screenshot({
      type: format,
      ...(format === 'jpeg' ? { quality } : {}),
    });
  });
}

async function renderPdf({ html, format = 'A5', landscape = false }) {
  return withPage({ width: 1240, height: 1754 }, 1, async (page) => {
    await page.setContent(html, { waitUntil: 'load' });
    await settle(page);
    return page.pdf({ format, landscape, printBackground: true, preferCSSPageSize: true });
  });
}

// --- http --------------------------------------------------------------------

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-length': Buffer.byteLength(body), ...headers });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  try {
    if (req.method === 'GET' && req.url === '/healthz') {
      await getBrowser();
      return send(res, 200, JSON.stringify({ ok: true, active, rendersOnBrowser }), {
        'content-type': 'application/json',
      });
    }

    if (req.method === 'POST' && (req.url === '/render' || req.url === '/pdf')) {
      const body = await readJson(req);
      if (typeof body.html !== 'string' || body.html.length === 0) {
        return send(res, 400, JSON.stringify({ error: 'html is required' }), {
          'content-type': 'application/json',
        });
      }

      const isPdf = req.url === '/pdf';
      const bytes = isPdf ? await renderPdf(body) : await renderImage(body);
      const type = isPdf ? 'application/pdf' : `image/${body.format ?? 'jpeg'}`;

      console.log(`${req.url} ${bytes.length}B ${Date.now() - started}ms`);
      return send(res, 200, bytes, { 'content-type': type, 'cache-control': 'no-store' });
    }

    send(res, 404, JSON.stringify({ error: 'not found' }), { 'content-type': 'application/json' });
  } catch (err) {
    console.error(err);
    send(res, err.status ?? 500, JSON.stringify({ error: String(err.message ?? err) }), {
      'content-type': 'application/json',
    });
  }
});

server.listen(PORT, () => console.log(`og-render listening on :${PORT}`));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    server.close();
    if (browser) await browser.close().catch(() => {});
    process.exit(0);
  });
}
