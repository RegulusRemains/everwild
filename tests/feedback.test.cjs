'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../src/engine.js');

test('damage feedback reflects shielded damage and expires without affecting position', () => {
  const game = new Game({ random: () => 0.5 });
  const { x, y } = game.player;
  game.shieldUntil = 10;
  const hp = game.player.hp;
  game._takePlayerDamage(20);
  const hit = game.visuals.find(v => v.kind === 'impact');
  assert.equal(hit.amount, hp - game.player.hp);
  assert.equal(hit.source, 'enemy');
  assert.equal(hit.entityId, 'player');
  for (let i = 0; i < 10; i++) game.update(0.05);
  assert.equal(game.visuals.some(v => v.kind === 'impact'), false);
  assert.equal(game.player.x, x);
  assert.equal(game.player.y, y);
});

test('new items create a discovery once, while duplicate salvage does not', () => {
  const game = new Game({ random: () => 0.5 });
  game._loot('griks-lucky-charm');
  game._loot('griks-lucky-charm');
  const found = game.visuals.filter(v => v.kind === 'discovery');
  assert.equal(found.length, 1);
  assert.equal(found[0].rare, true);
  assert.equal(found[0].itemId, 'griks-lucky-charm');
});

test('bounded visual events retain increasing identifiers after eviction', () => {
  const game = new Game({ random: () => 0.5 });
  for (let i = 0; i < 100; i++) game._visual('impact', game.player);
  assert.equal(game.visuals.length, 64);
  for (let i = 1; i < game.visuals.length; i++) assert.ok(game.visuals[i].id > game.visuals[i - 1].id);
});
