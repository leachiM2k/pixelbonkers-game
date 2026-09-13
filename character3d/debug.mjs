import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8792;
const NAMES = (process.argv[2] ?? 'throw_0,throw_1,attack_0,attack_1,attack_2,attack_3,ko_0,ko_1,fall_0,duck_0,jump_1,victory_1').split(',');

const server = spawn('node', ['server.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve) => {
  server.stdout.on('data', (d) => { if (String(d).includes('serving')) resolve(); });
  setTimeout(resolve, 2000);
});

let browser;
try {
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html?headless=1`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__ready === true', { timeout: 15000 });
  const url = await page.evaluate('window.__debugSheet(' + JSON.stringify(NAMES) + ')');
  const res = await fetch(`http://127.0.0.1:${PORT}/save?name=debug_sheet.png`, {
    method: 'POST',
    body: Buffer.from(url.split(',')[1], 'base64'),
  });
  console.log(res.ok ? 'debug_sheet.png gespeichert' : 'Fehler beim Speichern');
} finally {
  await browser?.close();
  server.kill();
}
