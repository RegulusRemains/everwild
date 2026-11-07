'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { runExpedition } = require('../scripts/expedition-run.cjs');
const { Game } = require('../src/engine.js');

for (const companion of ['Earth', 'Air']) {
  for (const seed of [42, 73, 2026]) test(`fresh ${companion.toLowerCase()} journey reaches the crypt and reports back (seed ${seed})`, () => {
    const report = runExpedition(seed, companion);
    assert.equal(report.completed, true);
    assert.equal(report.final.kills, 6);
    assert.ok(report.final.level >= 4);
    assert.ok(report.interruptions >= 2, 'Named enemies must survive long enough for control to matter');
    assert.ok(report.fights[0].seconds >= 5, 'The opening sentry must not disappear before the player sees combat');
    assert.ok(report.fights.filter(f => ['Grik the Hoarder','Bramblemaw','The Bonewarden'].includes(f.label)).every(f => f.seconds >= 10));
    assert.ok(report.final.inventory.includes('warden-boneguard'));
    assert.ok(report.final.inventory.includes('ring-of-bound-earth'));
  });
}

test('movement and actual attacks supply animation state without persisting it', () => {
  const game = new Game({ random: () => .5 });
  game.update(.05, {dx:-1});
  assert.equal(game.player.facing, -1);
  assert.ok(game.player.walkUntil > game.clock);
  assert.equal(Object.hasOwn(game.serialize().player, 'walkUntil'), false);
  game.player.x=480; game.player.y=350; game.update(.05);
  game._summon('Earth',1);
  const mob = game.mobs.find(m => m.campId==='briar' && m.index===0);
  game.setTarget(mob.id); game.commandPet('attack');
  for(let i=0;i<60 && !game.pet.strikeUntil;i++)game.update(.05);
  assert.ok(game.pet.strikeUntil > game.clock);
  assert.ok(game.visuals.some(v=>v.kind==='melee'));
});

test('fallen actors animate separately from live spawn slots and expire', () => {
  const game = new Game({ random: () => .5 });
  const mob = game.mobs[0]; game._damageMob(mob,100000,'player');
  assert.equal(game.remains.length,1);
  assert.equal(game.remains[0].id,mob.id);
  assert.equal(game.remains[0].kind,'mob');
  game.update(2);
  assert.equal(game.remains.length,0);
  assert.equal(game.mobs.some(m=>m.id===mob.id),false);
});
