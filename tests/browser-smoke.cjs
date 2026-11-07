'use strict';

// Optional real-browser smoke test. The game itself has no package dependencies.
// Install Playwright and its Chromium browser in your development environment,
// then run: node tests/browser-smoke.cjs
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs/promises');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'test-results', 'browser-smoke');

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
  let page;
  try {
    await fs.mkdir(screenshots, { recursive: true });
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    const started = await startServer();
    server = started.server;
    const errors = [];
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(started.url);
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => Boolean(window.everwild?.game));
    assert.equal(await page.evaluate(() => window.everwild.renderer.artReady), true, 'Illustrated world art must load');
    const atlasResponse = await page.request.get(new URL('assets/arcana-atlas.webp', started.url).href);
    assert.equal(atlasResponse.status(), 200);
    assert.match(atlasResponse.headers()['content-type'], /image\/webp/);
    assert.match(await page.title(), /Everwild/);
    assert.equal(await page.locator('#actionbar button').count(), 8);

    // Presentation toggles preserve a crisp UI and persist across reloads.
    assert.equal(await page.locator('#art-style').getAttribute('aria-pressed'), 'true');
    await page.locator('#art-style').click();
    assert.equal(await page.evaluate(() => window.everwild.renderer.pixelArt), false);
    await page.reload();
    await page.waitForFunction(() => Boolean(window.everwild?.game));
    assert.equal(await page.locator('#art-style').getAttribute('aria-pressed'), 'false');
    await page.locator('#art-style').click();
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
    await page.locator('#sound').click();
    await page.evaluate(() => window.everwild.game._loot('griks-lucky-charm'));
    await page.waitForFunction(() => !document.getElementById('discovery').hidden);
    assert.match(await page.locator('#discovery').textContent(), /RARE DISCOVERY/);
    // Reload clears transient discoveries but retains character progression.
    await page.reload();
    await page.waitForFunction(() => Boolean(window.everwild?.game));

    // Menus must pause the simulation and return focus to the game safely.
    await page.locator('nav [data-dialog="guide"]').click();
    assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
    assert.equal(await page.evaluate(() => window.everwild.paused), true);
    await page.locator('#dialog-close').click();
    assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), false);

    // Use the player's actual controls for the opening companion and movement.
    await page.locator('#game').focus();
    await page.keyboard.press('1');
    await page.waitForFunction(() => Boolean(window.everwild.game.pet), undefined, { timeout: 10000 });
    await page.waitForFunction(() => /earth/i.test(document.getElementById('pet-type').textContent));
    const before = await page.evaluate(() => ({ x: window.everwild.game.player.x, y: window.everwild.game.player.y }));
    await page.keyboard.down('d');
    await page.waitForTimeout(500);
    await page.keyboard.up('d');
    const after = await page.evaluate(() => ({ x: window.everwild.game.player.x, y: window.everwild.game.player.y }));
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 10, 'WASD must move the character');

    // Scenario setup places the character beside Rowan; acceptance itself is UI-driven.
    await page.evaluate(() => {
      const game = window.everwild.game;
      const rowan = window.Everwild.NPCS.find(npc => npc.id === 'rowan');
      Object.assign(game.player, { x: rowan.x, y: rowan.y });
      game.cancelMovement();
    });
    await page.keyboard.press('e');
    await page.waitForFunction(() => document.getElementById('menu-dialog').open);
    assert.match(await page.locator('#dialog-title').textContent(), /Rowan/);
    await page.locator('[data-action="accept-quest"][data-quest="scout-road"]').click();
    assert.equal(await page.evaluate(() => window.everwild.game.questState('scout-road').status), 'active');
    await page.locator('#dialog-close').click();

    // Explicit high-level scenario: real hotkey casts exercise quest counting.
    // This is a functional smoke check, not a claim to have played the full progression.
    await page.evaluate(() => { window.everwild.game.player.level = 20; });
    const sentries = await page.evaluate(() => window.everwild.game.mobs.filter(mob => mob.campId === 'briar').map(mob => mob.id));
    for (const id of sentries) {
      await page.evaluate(targetId => {
        const game = window.everwild.game;
        const mob = game.mobs.find(enemy => enemy.id === targetId);
        Object.assign(game.player, {
          x: mob.x - (mob.y > 400 ? 0 : 100),
          y: mob.y + (mob.y > 400 ? 190 : -200),
          mp: game.player.maxMp,
        });
        game.cancelMovement();
        game.commandPet('follow');
        game.setTarget(targetId);
      }, id);
      await page.locator('#game').focus();
      for (let casts = 0; casts < 3; casts++) {
        if (!(await page.evaluate(targetId => window.everwild.game.mobs.some(mob => mob.id === targetId && mob.alive), id))) break;
        await page.keyboard.press('2');
        await page.waitForFunction(() => !window.everwild.game.cast, undefined, { timeout: 7000 });
      }
      assert.equal(await page.evaluate(targetId => window.everwild.game.mobs.some(mob => mob.id === targetId && mob.alive), id), false);
    }
    assert.equal(await page.evaluate(() => window.everwild.game.questState('scout-road').status), 'ready');
    await page.evaluate(() => {
      const game = window.everwild.game;
      const rowan = window.Everwild.NPCS.find(npc => npc.id === 'rowan');
      Object.assign(game.player, { x: rowan.x, y: rowan.y });
      game.cancelMovement();
    });
    await page.keyboard.press('e');
    const copperBeforeReward = await page.evaluate(() => window.everwild.game.player.gold);
    await page.locator('[data-action="turn-in"][data-quest="scout-road"]').click();
    assert.equal(await page.evaluate(() => window.everwild.game.questState('scout-road').status), 'completed');
    assert.equal(await page.evaluate(() => window.everwild.game.player.inventory.includes('apprentice-focus')), true);
    assert.equal(await page.evaluate(() => window.everwild.game.player.gold), copperBeforeReward + 30);
    assert.equal(await page.locator('[data-action="turn-in"][data-quest="scout-road"]').count(), 0, 'The paid quest cannot be claimed again in the dialogue');
    await page.screenshot({ path: path.join(screenshots, 'npc-dialog.png'), fullPage: true });
    await page.locator('#dialog-close').click();

    // Equip the quest reward through the pack and assign an unlocked spell to key 2.
    await page.keyboard.press('i');
    await page.locator('[data-action="equip"][data-item="apprentice-focus"]').click();
    assert.equal(await page.evaluate(() => window.everwild.game.player.equipment.focus), 'apprentice-focus');
    await page.locator('#dialog-close').click();
    await page.locator('nav [data-dialog="spellbook"]').click();
    await page.locator('select[data-spell-index="8"]').selectOption('1');
    assert.equal(await page.evaluate(() => window.everwild.game.player.hotbar[1]), 8);
    await page.locator('#dialog-close').click();
    await page.waitForFunction(() => document.getElementById('spell1').dataset.spellIndex === '8');
    assert.match(await page.locator('#spell1').textContent(), /Frost Lance/);
    await page.evaluate(() => {
      const game = window.everwild.game;
      const target = game.mobs.find(mob => mob.campId === 'mossfang' && mob.index === 0);
      Object.assign(game.player, { x: target.x - 120, y: target.y - 200, mp: game.player.maxMp });
      game.cancelMovement();
      game.setTarget(target.id);
    });
    await page.keyboard.press('2');
    await page.waitForFunction(() => window.everwild.game.cast?.i === 8);
    await page.keyboard.down('a');
    await page.waitForTimeout(120);
    await page.keyboard.up('a');
    assert.equal(await page.evaluate(() => window.everwild.game.cast), null, 'Movement must interrupt the reassigned spell');

    // Keyboard commands control the same existing companion, including taunt.
    // The positions below create a short encounter without inventing combat results.
    await page.evaluate(() => {
      const game = window.everwild.game;
      const target = game.mobs.find(mob => mob.campId === 'mossfang' && mob.index === 0);
      Object.assign(game.player, { x: target.x - 125, y: target.y, hp: game.player.maxHp });
      Object.assign(game.pet, { x: target.x - 75, y: target.y });
      game.cancelMovement();
      game.setTarget(target.id);
    });
    await page.locator('#game').focus();
    await page.keyboard.press('c');
    assert.equal(await page.evaluate(() => window.everwild.game.pet.mode), 'guard');
    await page.keyboard.press('f');
    assert.ok(await page.evaluate(() => window.everwild.game.pet.targetId));
    await page.keyboard.press('q');
    const tauntReadyAt = await page.evaluate(() => {
      const game = window.everwild.game;
      const target = game.mobs.find(mob => mob.id === game.pet.targetId);
      if (target.targetId !== game.pet.id || target.threatPet <= target.threatPlayer) throw new Error('Taunt must switch the enemy to the pet');
      return game.pet.tauntReadyAt;
    });
    assert.ok(tauntReadyAt > await page.evaluate(() => window.everwild.game.clock));
    await page.keyboard.press('q');
    assert.equal(await page.evaluate(() => window.everwild.game.pet.tauntReadyAt), tauntReadyAt, 'Repeated Q cannot reset the cooldown');
    await page.keyboard.press('g');
    assert.equal(await page.evaluate(() => window.everwild.game.pet.mode), 'follow');
    assert.equal(await page.evaluate(() => window.everwild.game.pet.targetId), null);

    // Buy through Mara's dialogue, then use the actual tonic shortcuts.
    await page.evaluate(() => {
      const game = window.everwild.game;
      const mara = window.Everwild.NPCS.find(npc => npc.id === 'mara');
      Object.assign(game.player, { x: mara.x, y: mara.y });
      game.cancelMovement();
      game.update(0.1);
    });
    await page.keyboard.press('e');
    await page.waitForFunction(() => document.getElementById('menu-dialog').open);
    assert.match(await page.locator('#dialog-title').textContent(), /Mara/);
    const beforePurchase = await page.evaluate(() => ({ gold: window.everwild.game.player.gold, count: window.everwild.game.player.supplies['health-tonic'] }));
    await page.locator('[data-action="buy-supply"][data-item="health-tonic"]').click();
    const afterPurchase = await page.evaluate(() => ({ gold: window.everwild.game.player.gold, count: window.everwild.game.player.supplies['health-tonic'] }));
    assert.equal(afterPurchase.gold, beforePurchase.gold - 20);
    assert.equal(afterPurchase.count, beforePurchase.count + 1);
    await page.locator('#dialog-close').click();

    // Return to sanctuary before checking shared supply cooldown and menu keys.
    await page.evaluate(() => {
      const game = window.everwild.game;
      Object.assign(game.player, { x: 260, y: 250, hp: 30, mp: 20 });
      game.cancelMovement();
      game.commandPet('follow');
      game.update(0.1);
    });
    const supplyCounts = await page.evaluate(() => ({ ...window.everwild.game.player.supplies }));
    await page.keyboard.press('z');
    assert.equal(await page.evaluate(() => window.everwild.game.player.supplies['health-tonic']), supplyCounts['health-tonic'] - 1);
    await page.keyboard.press('x');
    assert.equal(await page.evaluate(() => window.everwild.game.player.supplies['mana-tonic']), supplyCounts['mana-tonic'], 'The shared tonic cooldown must reject the second hotkey');
    await page.evaluate(() => {
      const game = window.everwild.game;
      for (let i = 0; i < 4; i++) game.update(5);
      game.update(0.1);
    });
    await page.keyboard.press('x');
    assert.equal(await page.evaluate(() => window.everwild.game.player.supplies['mana-tonic']), supplyCounts['mana-tonic'] - 1);

    for (const [key, title] of [['j', /Eastern Road|journal/i], ['m', /frontier|map/i], ['b', /spellbook/i]]) {
      await page.keyboard.press(key);
      assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
      assert.match(await page.locator('#dialog-title').textContent(), title);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), false);
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.everwild.paused), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.everwild.paused), false);

    await page.evaluate(() => window.everwild.save());
    const saved = await page.evaluate(() => {
      const player = window.everwild.game.player;
      return { level: player.level, gold: player.gold, equipment: player.equipment, quests: player.quests, hotbar: player.hotbar, supplies: player.supplies };
    });
    await page.reload();
    await page.waitForFunction(() => Boolean(window.everwild?.game));
    const loaded = await page.evaluate(() => {
      const player = window.everwild.game.player;
      return { level: player.level, gold: player.gold, equipment: player.equipment, quests: player.quests, hotbar: player.hotbar, supplies: player.supplies };
    });
    assert.deepEqual(loaded, saved, 'Quest, equipment, supply, and spell-bar progress must survive a browser reload');
    await page.screenshot({ path: path.join(screenshots, 'desktop.png'), fullPage: true });

    for (const menu of ['inventory', 'spellbook', 'save']) {
      await page.locator(`nav [data-dialog="${menu}"]`).click();
      assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
      assert.ok((await page.locator('#dialog-content').textContent()).trim().length > 0);
      if (menu === 'inventory') {
        assert.equal(await page.locator('.gear-slot').count(), 4);
        await page.locator('[data-filter="focus"]').click();
        const names = await page.locator('.item-card .eyebrow').allTextContents();
        assert.ok(names.every(name => name.includes('FOCUS')));
        await page.locator('[data-filter="all"]').click();
      } else if (menu === 'spellbook') {
        assert.equal(await page.locator('.spell-numbers').count(), 10);
        assert.match(await page.locator('.spell-numbers').first().textContent(), /pet health/);
      }
      await page.screenshot({ path: path.join(screenshots, menu + '.png'), fullPage: true });
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
    await page.locator('nav [data-dialog="journal"]').click();
    assert.equal(await page.locator('#menu-dialog').evaluate(dialog => dialog.open), true);
    await page.locator('#dialog-close').click();
    await page.screenshot({ path: path.join(screenshots, 'mobile.png'), fullPage: true });
    for (const menu of ['inventory', 'spellbook']) {
      await page.evaluate(menu => window.everwild.openMenu(menu), menu);
      const overflow = await page.locator('#dialog-content').evaluate(el => el.scrollWidth - el.clientWidth);
      assert.ok(overflow <= 1, menu + ' must fit the mobile dialog');
      await page.screenshot({ path: path.join(screenshots, 'mobile-' + menu + '.png'), fullPage: true });
      await page.locator('#dialog-close').click();
    }
    assert.deepEqual(errors, [], 'The browser must not report runtime or console errors');
    console.log('Browser smoke passed: controls, NPC dialogue, quest rewards, equipment, spell assignment, pet guard/taunt, tonic purchase/cooldown, save/reload, and mobile layout.');
    console.log(`Screenshots: ${screenshots}`);
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(screenshots, 'failure.png'), fullPage: true }).catch(() => {});
    throw error;
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

