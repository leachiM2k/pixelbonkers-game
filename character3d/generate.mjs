import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8791;
const CHAR = process.argv[2] ?? 'teen';

const server = spawn('node', ['server.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve) => {
  server.stdout.on('data', (d) => { if (String(d).includes('serving')) resolve(); });
  server.stderr.on('data', () => {});
  setTimeout(resolve, 2000);
});

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--hide-scrollbars',
      '--disable-gpu-sandbox',
      '--no-first-run',
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000 });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));

  await page.goto(`http://127.0.0.1:${PORT}/index.html?headless=1&char=${CHAR}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 15000 });

  const started = Date.now();
  const count = await page.evaluate('window.__renderAll()');
  console.log(`${count} Posen gerendert in ${((Date.now() - started) / 1000).toFixed(1)}s`);
} finally {
  await browser?.close();
  server.kill();
}
