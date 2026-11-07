'use strict';

// Optional real-browser smoke test. The game itself has no package dependencies.
// Install Playwright and its Chromium browser in your development environment,
// then run: node tests/browser-smoke.cjs
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    if (runtimeModules) return require(path.join(runtimeModules, 'playwright'));
    throw new Error('Optional browser smoke testing needs Playwright. Install it with npm install --no-save playwright, then npx playwright install chromium.');
  }
}

async function freePort() {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function startServer() {
  const port = await freePort();
  const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', data => { output += data; });
  server.stderr.on('data', data => { output += data; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Local server did not start. ${output}`)), 10000);
    const ready = data => {
      if (!String(data).includes('Everwild is ready')) return;
      clearTimeout(timeout);
      server.stdout.off('data', ready);
      resolve();
    };
    server.stdout.on('data', ready);
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Local server exited (${code}). ${output}`)); });
  }).catch(error => { server.kill('SIGTERM'); throw error; });
  return { server, url: `http://127.0.0.1:${port}` };
}

async function main() {
  const { chromium } = loadPlaywright();
  let server;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const started = await startServer();
    server = started.server;
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(started.url);
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => Boolean(window.everwild?.game));
    assert.match(await page.title(), /Everwild/);
    assert.equal(await page.locator('#actionbar button').count(), 8);

    // Menus must pause the simulation and return focus to the game safely.
    await page.locator('nav [data-dialog="guide"]').click();
    assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
    assert.equal(await page.evaluate(() => window.everwild.paused), true);
    await page.locator('#dialog-close').click();
    assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), false);

    // Use the player's actual controls: summon, move, then persist and reload.
    await page.locator('#game').focus();
    await page.keyboard.press('1');
    await page.waitForFunction(() => Boolean(window.everwild.game.pet), undefined, { timeout: 10000 });
    await page.waitForFunction(() => /earth/i.test(document.getElementById('pet-type').textContent));
    assert.match(await page.locator('#pet-type').textContent(), /earth/i);
    const before = await page.evaluate(() => ({ x: window.everwild.game.player.x, y: window.everwild.game.player.y }));
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    const after = await page.evaluate(() => ({ x: window.everwild.game.player.x, y: window.everwild.game.player.y }));
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 10, 'WASD must move the character');
    await page.evaluate(() => window.everwild.save());
    const saved = await page.evaluate(() => ({ level: window.everwild.game.player.level, gold: window.everwild.game.player.gold }));
    await page.reload();
    await page.waitForFunction(() => Boolean(window.everwild?.game));
    const loaded = await page.evaluate(() => ({ level: window.everwild.game.player.level, gold: window.everwild.game.player.gold }));
    assert.deepEqual(loaded, saved);

    for (const menu of ['inventory', 'spellbook', 'save']) {
      await page.locator(`nav [data-dialog="${menu}"]`).click();
      assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
      assert.ok((await page.locator('#dialog-content').textContent()).trim().length > 0);
      await page.locator('#dialog-close').click();
    }

    // A compact touch layout should remain usable without horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      game: document.getElementById('game').getBoundingClientRect().width,
    }));
    assert.ok(dimensions.content <= dimensions.viewport + 1, 'Mobile layout must not overflow horizontally');
    assert.ok(dimensions.game > 200, 'The game canvas must remain visible on mobile');
    assert.deepEqual(errors, [], 'The browser must not report runtime or console errors');
    console.log('Browser smoke passed: startup, menus, summoning, movement, save/reload, and compact layout.');
  } finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) {
      server.kill('SIGTERM');
      await once(server, 'exit');
    }
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
