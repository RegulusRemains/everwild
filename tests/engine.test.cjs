'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, WORLD, CAMPS, SPELLS, ITEMS, VERSION } = require('../src/engine.js');

const deterministic = () => 0.5;
const createGame = save => new Game({ save, random: deterministic });

function advance(game, seconds, input) {
  // Exercise the same small simulation steps used by the browser. Game.update
  // deliberately bounds long frames rather than simulating minutes in one call.
  for (let remaining = seconds; remaining > 1e-8;) {
    const dt = Math.min(0.1, remaining);
    game.update(dt, input);
    remaining -= dt;
  }
}

function firstSentry(game) {
  return game.mobs.find(mob => mob.campId === CAMPS[0].id && mob.index === 0);
}

function standAt(game, x, y) {
  // Scenario setup only; player actions below use the public simulation API.
  Object.assign(game.player, { x, y });
  game.cancelMovement();
  game.update(0.01);
}

function castAndFinish(game, index) {
  assert.equal(game.castSpell(index).ok, true, `Spell ${SPELLS[index].name} should start`);
  advance(game, SPELLS[index].cast + 0.1);
  assert.equal(game.cast, null, 'A completed spell must clear the cast state');
}

function defeatWithBolts(game, mob) {
  castAndFinish(game,0);assert.equal(game.setTarget(mob.id).ok, true);game.commandPet('attack');castAndFinish(game,2);
  for(let attempt=0;mob.alive&&attempt<40;attempt++){if(game.pet&&game.pet.hp<game.pet.maxHp*.5&&game.player.mp>=28)castAndFinish(game,4);else if(game.player.mp>=19)castAndFinish(game,1);else advance(game,1);}
  assert.equal(mob.alive, false, 'The selected enemy should be defeated');
}

test('the opening loop supports summoning, exploration, a solo pet kill, loot, and leveling', () => {
  const game = createGame({ player: { xp: 125 } });
  const startingLevel = game.player.level;
  castAndFinish(game, 0);
  assert.equal(game.pet.type, 'Earth');

  assert.equal(game.moveTo(480, 350).ok, true);
  advance(game, 2);
  assert.equal(game.moveTarget, null);
  assert.ok(game.discovered.includes(CAMPS[0].id));

  const sentry = firstSentry(game);
  game.setTarget(sentry.id);
  assert.equal(game.commandPet('attack').ok, true);
  castAndFinish(game,2);
  for(let turn=0;sentry.alive&&turn<100;turn++){if(game.pet&&game.pet.hp<game.pet.maxHp*.5&&game.player.mp>=28)castAndFinish(game,4);else if(sentry.dotUntil<=game.clock&&game.player.mp>=26)castAndFinish(game,2);else advance(game,.5);}

  assert.equal(sentry.alive, false);
  assert.equal(game.dead, false);
  assert.equal(game.player.kills, 1);
  assert.equal(game.player.level, startingLevel + 1);
  assert.equal(game.player.hp, game.player.maxHp);
  assert.ok(game.player.gold > 0);
  assert.ok(game.player.inventory.length > 0, 'The first victory should give usable loot');
  const item = game.player.inventory[0];
  assert.equal(game.equip(item).ok, true);
  assert.equal(game.player.equipment[ITEMS[item].slot], item);
});

test('a targeted spell stays locked to the target chosen when casting began', () => {
  const game = createGame();
  standAt(game, 600, 150);
  const original = firstSentry(game);
  const other = game.mobs.find(mob => mob.campId === CAMPS[0].id && mob.named);
  const originalHealth = original.hp;
  const otherHealth = other.hp;
  game.setTarget(original.id);
  assert.equal(game.castSpell(1).ok, true);
  game.setTarget(other.id);
  advance(game, SPELLS[1].cast + 0.1);

  assert.ok(original.hp < originalHealth);
  assert.equal(other.hp, otherHealth, 'Retargeting must not redirect an already casting spell');
  assert.equal(game.selected.id, other.id);
});

test('movement on the final cast frame cancels the spell without spending mana', () => {
  const game = createGame();
  standAt(game, 460, 350);
  const target = firstSentry(game);
  const health = target.hp;
  const mana = game.player.mp;
  game.setTarget(target.id);
  assert.equal(game.castSpell(1).ok, true);
  advance(game, SPELLS[1].cast - 0.05);
  game.update(0.1, { dx: 1, dy: 0 });

  assert.equal(game.cast, null);
  assert.equal(target.hp, health);
  assert.equal(game.player.mp, mana);
  assert.equal(game.castSpell(1).ok, false, 'A moving character cannot immediately begin a new cast');
  game.update(0.1);
  assert.equal(game.castSpell(1).ok, true, 'Casting resumes after the character stops');
});

test('an original target leaving spell range cancels the cast without a mana charge', () => {
  const game = createGame();
  standAt(game, 460, 350);
  const target = firstSentry(game);
  game.setTarget(target.id);
  const mana = game.player.mp;
  assert.equal(game.castSpell(1).ok, true);
  target.x = 1000;
  advance(game, SPELLS[1].cast + 0.1);

  assert.equal(target.hp, target.maxHp);
  assert.equal(game.player.mp, mana);
  assert.equal(game.cast, null);
  assert.equal(game.castSpell(1).ok, false, 'An out-of-range target also fails before casting begins');
});

test('pet follow stops attacking and brings the elemental back while enemies may pursue', () => {
  const game = createGame();
  standAt(game, 480, 350);
  castAndFinish(game, 0);
  const target = firstSentry(game);
  game.setTarget(target.id);
  game.commandPet('attack');
  advance(game, 1.5);
  assert.ok(target.hp < target.maxHp, 'The elemental must reach and damage its target first');
  const health = target.hp;

  assert.equal(game.commandPet('follow').ok, true);
  advance(game, 3);
  assert.equal(game.pet.targetId, null);
  assert.equal(target.hp, health, 'A recalled pet must not continue attacking');
  assert.ok(Math.hypot(game.pet.x - game.player.x, game.pet.y - game.player.y) < 100);
});

test('a replacement elemental does not inherit the old pet’s threat or attack command', () => {
  const game = createGame();
  standAt(game, 700, 600);
  castAndFinish(game, 0);
  const target = game.mobs.find(mob => mob.campId === CAMPS[0].id && mob.named);
  game.setTarget(target.id);
  assert.equal(game.commandPet('attack').ok, true);
  advance(game, 1.5);
  assert.ok(target.threatPet > 0);
  const previousPetId = game.pet.id;
  castAndFinish(game, 5);

  assert.equal(game.pet.type, 'Air');
  assert.notEqual(game.pet.id, previousPetId);
  assert.equal(game.pet.targetId, null);
  assert.ok(game.mobs.every(mob => mob.threatPet === 0));
  assert.ok(game.mobs.every(mob => mob.targetId !== previousPetId));
  assert.equal(game.dead, false);
});

test('death persists through save/reload and revival keeps progression and belongings', () => {
  const game = createGame({ player: {
    level: 3, xp: 41, gold: 92, debt: 7, hp: 1,
    inventory: ['goblin-talisman'], equipment: { charm: 'goblin-talisman' },
    spellRanks: [1, 2, 1, 1, 1, 1, 1, 1],
  } });
  const initial = game.serialize().player;
  const guard = firstSentry(game);
  standAt(game, guard.x, guard.y);
  advance(game, 1.2);

  assert.equal(game.dead, true);
  assert.equal(game.player.hp, 0);
  assert.ok(game.player.debt > initial.debt);
  assert.equal(game.castSpell(0).ok, false);
  const debt = game.player.debt;
  const loaded = createGame(JSON.stringify(game.serialize()));
  assert.equal(loaded.dead, true);
  assert.equal(loaded.player.hp, 0);
  assert.equal(loaded.player.debt, debt, 'Reloading must not add another death penalty');
  advance(loaded, 2);
  assert.equal(loaded.dead, true, 'A zero-HP saved character must not regenerate back to life');

  assert.equal(loaded.revive().ok, true);
  assert.equal(loaded.dead, false);
  assert.equal(loaded.player.x, WORLD.spawn.x);
  assert.equal(loaded.player.y, WORLD.spawn.y);
  assert.equal(loaded.player.hp, loaded.player.maxHp);
  assert.equal(loaded.player.mp, loaded.player.maxMp);
  for (const key of ['level', 'xp', 'gold', 'inventory', 'equipment', 'spellRanks']) {
    assert.deepEqual(loaded.player[key], initial[key], `${key} must survive death`);
  }
  assert.equal(loaded.player.debt, debt);
  assert.equal(loaded.revive().ok, false, 'Revival must not become a reusable free teleport');
});

test('experience repays debt before advancing the next level', () => {
  const normal = createGame();
  const indebted = createGame({ player: { debt: 100 } });
  for (const game of [normal, indebted]) {
    standAt(game, 460, 350);
    defeatWithBolts(game, firstSentry(game));
  }
  assert.ok(normal.player.xp > 0);
  assert.equal(indebted.player.xp, 0);
  assert.equal(indebted.player.debt, 100 - normal.player.xp);
  assert.equal(indebted.player.gold, normal.player.gold, 'Debt must not consume loot or copper');
});

test('retreating to the bindstone clears enemy effects and restores enemies at their camp', () => {
  const game = createGame();
  standAt(game, 480, 350);
  const target = firstSentry(game);
  game.setTarget(target.id);
  castAndFinish(game, 2);
  castAndFinish(game, 3);
  assert.ok(target.dotUntil > game.clock);
  assert.ok(target.rootUntil > game.clock);
  assert.equal(target.aggro, true);

  game.moveTo(WORLD.spawn.x, WORLD.spawn.y);
  advance(game, 5);
  assert.equal(game.dead, false);
  assert.equal(game.inCombat, false);
  assert.equal(target.hp, target.maxHp);
  assert.equal(target.x, target.homeX);
  assert.equal(target.y, target.homeY);
  assert.equal(target.rootUntil, 0);
  assert.equal(target.dotUntil, 0);
  assert.equal(target.threatPlayer, 0);
  assert.equal(target.threatPet, 0);
  assert.equal(game.interact().ok, true);
  assert.equal(game.player.hp, game.player.maxHp);
  assert.equal(game.player.mp, game.player.maxMp);
});

test('repeated camp respawns do not accumulate corpses or duplicate spawn slots', () => {
  const game = createGame({ player: { level: 20 } });
  standAt(game, 460, 350);
  const population = game.mobs.length;
  const seen = new Set();
  for (let cycle = 0; cycle < 40; cycle++) {
    const target = firstSentry(game);
    assert.ok(target && target.alive);
    assert.equal(seen.has(target.id), false, 'Each respawn should receive a fresh identity');
    seen.add(target.id);
    defeatWithBolts(game, target);
    advance(game, 0.1);
    assert.equal(game.mobs.length, population - 1);
    assert.ok(game.mobs.every(mob => mob.alive), 'Dead entities must leave the active simulation');
    advance(game, CAMPS[0].delay + 0.1);
    assert.equal(game.mobs.length, population);
    assert.equal(new Set(game.mobs.map(mob => `${mob.campId}:${mob.index}`)).size, population);
  }
  assert.equal(game.player.kills, 40);
  assert.equal(game.player.level, 20);
  assert.ok(game.player.xp <= game.xpNeeded());
});

test('named enemies award usable rare equipment', () => {
  const game = createGame({ player: { level: 5 } });
  standAt(game, 700, 600);
  const named = game.mobs.find(mob => mob.campId === CAMPS[0].id && mob.named);
  assert.ok(named);
  defeatWithBolts(game, named);
  const rare = game.player.inventory.find(id => ITEMS[id].rarity === 'rare');
  assert.ok(rare, 'The named victory must award its promised rare item');
  assert.equal(game.equip(rare).ok, true);
  assert.equal(game.player.equipment[ITEMS[rare].slot], rare);
  assert.equal(game.dead, false);
});

test('equipment bonuses apply once and replacing an item removes its previous bonus', () => {
  const game = createGame({ player: {
    inventory: ['goblin-talisman', 'griks-lucky-charm'], equipment: {},
  } });
  const baseHealth = game.player.maxHp;
  assert.equal(game.equip('goblin-talisman').ok, true);
  const firstHealth = game.player.maxHp;
  for (let repeat = 0; repeat < 5; repeat++) game.equip('goblin-talisman');
  assert.equal(game.player.maxHp, firstHealth);
  assert.equal(game.equip('griks-lucky-charm').ok, true);
  assert.equal(game.player.maxHp, baseHealth + ITEMS['griks-lucky-charm'].stats.hp);
  assert.equal(game.equip('othreks-focus').ok, false, 'Unowned items cannot be equipped');
});

test('spell upgrades require the bindstone, level, and copper, and stop at rank three', () => {
  const beginner = createGame({ player: { gold: 500 } });
  assert.equal(beginner.buyUpgrade(1).ok, false);
  assert.equal(beginner.player.gold, 500);

  const student = createGame({ player: { level: 2, gold: 100 } });
  const cost = student.upgradeCost(1);
  assert.equal(student.buyUpgrade(1).ok, true);
  assert.equal(student.player.spellRanks[1], 2);
  assert.equal(student.player.gold, 100 - cost);
  assert.equal(student.buyUpgrade(1).ok, false, 'Rank three is locked until a later level');

  const advanced = createGame({ player: { level: 5, gold: 0 } });
  assert.equal(advanced.buyUpgrade(1).ok, false);
  advanced.player.gold = 500;
  standAt(advanced, 1000, 100);
  assert.equal(advanced.buyUpgrade(1).ok, false, 'Training requires returning to the bindstone');
  standAt(advanced, WORLD.spawn.x, WORLD.spawn.y);
  assert.equal(advanced.buyUpgrade(1).ok, true);
  assert.equal(advanced.buyUpgrade(1).ok, true);
  assert.equal(advanced.player.spellRanks[1], 3);
  const remaining = advanced.player.gold;
  assert.equal(advanced.buyUpgrade(1).ok, false);
  assert.equal(advanced.player.gold, remaining);
});

test('meditation recovers faster and is canceled by movement or damage', () => {
  const walking = createGame({ player: { hp: 30, mp: 10 } });
  const resting = createGame({ player: { hp: 30, mp: 10 } });
  resting.toggleMeditate();
  advance(walking, 3);
  advance(resting, 3);
  assert.ok(resting.player.hp > walking.player.hp);
  assert.ok(resting.player.mp > walking.player.mp);
  resting.update(0.1, { dx: 1 });
  assert.equal(resting.meditate, false);
  const guard = firstSentry(resting);
  standAt(resting, guard.x, guard.y);
  resting.toggleMeditate();
  advance(resting, 1.2);
  assert.equal(resting.meditate, false);
});

test('a save round-trip preserves progression, equipment, discoveries, and a safe location', () => {
  const game = createGame({ discovered: [CAMPS[0].id, CAMPS[2].id], player: {
    x: 480, y: 350, level: 6, xp: 37, hp: 111, mp: 81, gold: 420, debt: 17, kills: 23,
    inventory: ['griks-lucky-charm', 'cracked-bone-wand', 'ring-of-bound-earth'],
    equipment: { charm: 'griks-lucky-charm', focus: 'cracked-bone-wand', ring: 'ring-of-bound-earth' },
    spellRanks: [2, 3, 1, 2, 1, 1, 1, 2],
  } });
  const save = game.serialize();
  assert.equal(save.version, VERSION);
  const loaded = createGame(JSON.stringify(save));
  assert.deepEqual(loaded.serialize(), save);
});

test('legacy saves migrate known named items without stacking duplicate permanent bonuses', () => {
  const legacy = createGame({ player: {
    level: 1, maxHp: 999999, maxMp: 999999, mp: 999999,
    inventory: ['Ring of Bound Earth', 'Ring of Bound Earth', 'Cracked Bone Wand', '__proto__', 'constructor', '<script>alert(1)</script>'],
  } });
  assert.deepEqual(legacy.player.inventory.sort(), ['cracked-bone-wand', 'ring-of-bound-earth']);
  assert.equal(legacy.player.maxHp, 110 + ITEMS['ring-of-bound-earth'].stats.hp);
  assert.equal(legacy.player.maxMp, 160 + ITEMS['ring-of-bound-earth'].stats.mp + ITEMS['cracked-bone-wand'].stats.mp);
  assert.ok(legacy.player.mp <= legacy.player.maxMp);
  const reloaded = createGame(legacy.serialize());
  assert.equal(reloaded.player.maxMp, legacy.player.maxMp);
  assert.equal(reloaded.player.maxHp, legacy.player.maxHp);
});

test('malformed and unreasonable save data produces finite, bounded playable state', () => {
  for (const broken of ['{not valid json', null, [], { player: null }]) {
    const game = createGame(broken);
    assert.equal(game.dead, false);
    assert.equal(game.player.level, 1);
    assert.equal(game.player.hp, game.player.maxHp);
  }
  const game = createGame({ discovered: ['unknown', CAMPS[0].id, CAMPS[0].id], player: {
    x: NaN, y: Infinity, hp: null, mp: 'infinite', level: 999,
    xp: Infinity, gold: -100, debt: 1e50, kills: 'many',
    inventory: [null, {}, '__proto__'], spellRanks: [9, -3, '2', null],
    equipment: { ring: 'goblin-talisman' },
  } });
  for (const key of ['x', 'y', 'hp', 'mp', 'maxHp', 'maxMp', 'level', 'xp', 'gold', 'debt', 'kills']) {
    assert.ok(Number.isFinite(game.player[key]), `${key} must be finite`);
    assert.ok(game.player[key] >= 0, `${key} must be nonnegative`);
  }
  assert.ok(game.player.level <= 20);
  assert.ok(game.player.x < WORLD.w && game.player.y < WORLD.h);
  assert.ok(game.player.debt <= game.xpNeeded() * 3);
  assert.ok(game.player.spellRanks.every(rank => Number.isInteger(rank) && rank >= 1 && rank <= 3));
  assert.deepEqual(game.player.inventory, []);
  assert.deepEqual(game.player.equipment, {});
  assert.deepEqual(game.discovered, [CAMPS[0].id]);
});

test('reload near fresh guards returns living characters to safety without reviving dead ones', () => {
  const occupied = firstSentry(createGame());
  const living = createGame({ player: { x: occupied.x, y: occupied.y, hp: 40, mp: 20 } });
  assert.equal(living.player.x, WORLD.spawn.x);
  assert.equal(living.player.y, WORLD.spawn.y);
  assert.equal(living.player.hp, 40, 'Safe loading must not grant free healing');
  assert.equal(living.player.mp, 20);
  const fallen = createGame({ dead: true, player: { x: occupied.x, y: occupied.y, hp: 0, debt: 21 } });
  assert.equal(fallen.dead, true);
  assert.equal(fallen.player.hp, 0);
  assert.equal(fallen.player.debt, 21);
});

