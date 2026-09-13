import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const server = spawn('node', ['server.mjs', '8793'], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => { server.stdout.on('data', (d) => { if (String(d).includes('serving')) r(); }); setTimeout(r, 2000); });
let browser;
try {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:8793/index.html?headless=1', { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 15000 });
  const url = await page.evaluate('window.__beautyShot()');
  const res = await fetch('http://127.0.0.1:8793/save?name=beauty.png', { method: 'POST', body: Buffer.from(url.split(',')[1], 'base64') });
  console.log(res.ok ? 'beauty.png ok' : 'Fehler');
} finally { await browser?.close(); server.kill(); }
