'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../src/engine.js');
function equip(game, id) { game._loot(id); assert.equal(game.equip(id).ok, true); }
function fresh() { return new Game({ random: () => 0.5 }); }

test('Grik’s charm restores mana on a credited kill, respects the cap, and stops after replacement', () => {
  const game = fresh(); equip(game, 'griks-lucky-charm');
  game.player.mp = 20;
  game._damageMob(game.mobs[0], 10000, 'pet');
  assert.equal(game.player.mp, 26);
  game.player.mp = game.player.maxMp - 1;
  game._damageMob(game.mobs[1], 10000, 'player');
  assert.equal(game.player.mp, game.player.maxMp);
  equip(game, 'goblin-talisman');
  game.player.mp = 20;
  game._damageMob(game.mobs[2], 10000, 'player');
  assert.equal(game.player.mp, 20);
});

test('Stonebound protects an existing companion without stacking across repeated equips', () => {
  const game = fresh(); game._summon('Earth', 1);
  equip(game, 'ring-of-bound-earth'); game.equip('ring-of-bound-earth');
  const hp = game.pet.hp;
  game._takePetDamage(20);
  assert.equal(game.pet.hp, hp - 16);
  equip(game, 'copperleaf-ring');
  game._takePetDamage(20);
  assert.equal(game.pet.hp, hp - 36);
});

test('Warden’s Resolve changes active shield mitigation and ends when replaced', () => {
  const game = fresh(); equip(game, 'warden-boneguard');
  game.shieldUntil = 20;
  let hp = game.player.hp;
  game._takePlayerDamage(20);
  assert.equal(game.player.hp, hp - 9);
  equip(game, 'goblin-talisman'); hp = game.player.hp;
  game._takePlayerDamage(20);
  assert.equal(game.player.hp, hp - 11);
});

test('Gravebinding extends actual root and frost effects and survives save reload', () => {
  const game = fresh(); game.player.level = 5; game._refreshStats();
  equip(game, 'othreks-focus');
  const reloaded = new Game({ save: game.serialize(), random: () => 0.5 });
  assert.equal(reloaded.spellProfile(3).root, 12);
  assert.equal(reloaded.spellProfile(8).slow, 9);
  for (const index of [3, 8]) {
    const mob = reloaded.mobs[0];
    mob.hp = mob.maxHp = 1000; // Inspect the duration on a surviving target.
    reloaded.player.x = mob.x - 200; reloaded.player.y = mob.y;
    reloaded.player.mp = reloaded.player.maxMp;
    assert.equal(reloaded.setTarget(mob.id).ok, true);
    assert.equal(reloaded.castSpell(index).ok, true);
    reloaded.clock = reloaded.cast.done;
    reloaded._finishCast();
    const remaining = (index === 3 ? mob.rootUntil : mob.slowUntil) - reloaded.clock;
    assert.equal(remaining, index === 3 ? 12 : 9);
  }
});

test('spellbook preview matches resolved damage and next-rank companion stats', () => {
  const game = fresh(); const mob = game.mobs[0];
  game.player.x = mob.x - 200; game.player.y = mob.y;
  game.setTarget(mob.id);
  const preview = game.spellProfile(1), hp = mob.hp;
  assert.equal(game.castSpell(1).ok, true);
  game.clock = game.cast.done; game._finishCast();
  assert.equal(hp - mob.hp, preview.damage);
  const petPreview = game.spellProfile(0, 2);
  game._summon('Earth', 2);
  assert.equal(game.pet.maxHp, petPreview.petHp);
  assert.equal(game.pet.damage, petPreview.petDamage);
});
