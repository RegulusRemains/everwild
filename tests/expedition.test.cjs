'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, WORLD, CAMPS, SPELLS, ITEMS, NPCS, QUESTS, SUPPLIES } = require('../src/engine.js');

const create = save => new Game({ save, random: () => 0.5 });
const advance = (game, seconds, input) => {
  for (let left = seconds; left > 1e-8;) {
    const dt = Math.min(0.05, left);
    game.update(dt, input);
    left -= dt;
  }
};
const cast = (game, index) => {
  assert.equal(game.castSpell(index).ok, true, SPELLS[index].name + ' must be castable');
  advance(game, SPELLS[index].cast + 0.05);
};
const visit = (game, id) => {
  // Relocation is scenario setup. All rewards, combat and inventory mutations
  // under test go through the public player actions below.
  const npc = NPCS.find(entry => entry.id === id);
  Object.assign(game.player, { x: npc.x, y: npc.y });
  game.cancelMovement();
  advance(game, 0.05);
};
const scout = game => game.mobs.find(mob => mob.campId === 'briar' && mob.index === 0);
const finished = { status: 'completed', progress: 4 };
const prior = count => Object.fromEntries(QUESTS.slice(0, count).map(quest => [quest.id, { status: 'completed', progress: quest.required }]));
function travel(game, points) {
  for (const [x, y] of points) {
    assert.equal(game.moveTo(x, y).ok, true);
    for (let frames = 0; game.moveTarget && frames < 500; frames++) game.update(0.05);
    assert.equal(game.moveTarget, null, 'Travel should reach the waypoint');
    advance(game, 0.05);
    assert.equal(game.dead, false, 'The route must remain survivable');
  }
}
function boltDown(game, mob) {
  game.setTarget(mob.id);
  for (let spells = 0; mob.alive && spells < 8; spells++) cast(game, 1);
  assert.equal(mob.alive, false);
}
function setupAtTarget(game, mob, offset = 200) {
  Object.assign(game.player, { x: mob.x, y: mob.y + offset, mp: game.player.maxMp });
  game.cancelMovement();
  advance(game, 0.05);
  game.setTarget(mob.id);
}
function awaitIntent(game, mob) {
  for (let ticks = 0; !mob.intent && ticks < 160; ticks++) game.update(0.05);
  assert.ok(mob.intent, 'An engaged special enemy should telegraph its ability');
  return { ...mob.intent };
}

test('a fresh character can complete the four-guard patrol through normal travel and combat', () => {
  const game = create();
  assert.equal(game.player.xp, 0);
  assert.equal(game.player.level, 1);
  assert.equal(game.acceptQuest('scout-road').ok, true, 'Rowan is within speaking distance of the starting point');
  const routes = [
    [[480, 350]],
    [[480, 100], [710, 100]],
    [[480, 100], [850, 100], [850, 160]],
    [[480, 650], [710, 650]],
  ];
  const returnRoutes = [
    [[260, 250]],
    [[480, 100], [260, 250]],
    [[850, 100], [480, 100], [260, 250]],
    [[480, 650], [260, 250]],
  ];
  const originalGuards = game.mobs.filter(mob => mob.campId === 'briar');
  for (let index = 0; index < originalGuards.length; index++) {
    assert.equal(game.restoreAtBindstone().ok, true);
    cast(game, 0);
    travel(game, routes[index]);
    const mob = originalGuards[index];
    assert.equal(mob.alive, true, 'Each patrol victory is a different initial guard');
    game.setTarget(mob.id);
    assert.equal(game.commandPet('attack').ok, true);
    advance(game, 1.5);
    for (let attempts = 0; mob.alive && attempts < 5; attempts++) cast(game, 1);
    assert.equal(mob.alive, false);
    assert.equal(game.dead, false);
    game.commandPet('follow');
    travel(game, returnRoutes[index]);
  }
  assert.equal(game.questState('scout-road').status, 'ready');
  assert.equal(game.questState('scout-road').progress, 4);
  assert.equal(game.turnInQuest('scout-road').ok, true);
  assert.ok(game.player.level >= 2, 'The first patrol and reward should unlock a meaningful level gain');
  assert.ok(game.player.inventory.includes('apprentice-focus'));
  assert.equal(game.equip('apprentice-focus').ok, true);
  assert.equal(game.player.equipment.focus, 'apprentice-focus');
  assert.ok(game.player.gold >= SUPPLIES['health-tonic'].cost, 'A patrol should fund a restorative supply');
});

test('patrol kills count only after accepting and only from the required camp', () => {
  const game = create({ player: { level: 20 } });
  setupAtTarget(game, scout(game));
  boltDown(game, scout(game));
  visit(game, 'rowan');
  assert.equal(game.questState('scout-road').status, 'available');
  assert.equal(game.acceptQuest('scout-road').ok, true);
  assert.equal(game.questState('scout-road').progress, 0);
  const wrongCamp = game.mobs.find(mob => mob.campId === 'mossfang' && !mob.named);
  setupAtTarget(game, wrongCamp);
  boltDown(game, wrongCamp);
  assert.equal(game.questState('scout-road').progress, 0);
  const rightCamp = game.mobs.find(mob => mob.campId === 'briar' && mob.alive);
  setupAtTarget(game, rightCamp);
  boltDown(game, rightCamp);
  assert.equal(game.questState('scout-road').progress, 1);
});

test('quest prerequisites, proximity and readiness gate rewards and a reward cannot be claimed twice', () => {
  const beginner = create();
  assert.equal(beginner.acceptQuest('griks-talisman').ok, false);
  assert.equal(beginner.turnInQuest('scout-road').ok, false);
  visit(beginner, 'mara');
  assert.equal(beginner.acceptQuest('scout-road').ok, false, 'The assigned warden must be nearby');
  const game = create({ player: { level: 4, xp: 0, gold: 7, quests: { 'scout-road': { status: 'ready', progress: 4 } } } });
  visit(game, 'mara');
  assert.equal(game.turnInQuest('scout-road').ok, false);
  assert.equal(game.player.gold, 7);
  visit(game, 'rowan');
  assert.equal(game.turnInQuest('scout-road').ok, true);
  assert.equal(game.player.gold, 37);
  assert.equal(game.player.xp, 70);
  const paid = game.serialize();
  assert.equal(game.turnInQuest('scout-road').ok, false);
  assert.deepEqual(game.serialize(), paid);
  const loaded = create(paid);
  assert.equal(loaded.turnInQuest('scout-road').ok, false);
  assert.equal(loaded.player.gold, 37);
  assert.equal(loaded.player.xp, 70);
  assert.equal(loaded.questState('griks-talisman').status, 'available');
});

test('Grik evidence found before acceptance remains equipped and owned after the reward', () => {
  const game = create({ player: {
    quests: { 'scout-road': finished }, inventory: ['griks-lucky-charm'], equipment: { charm: 'griks-lucky-charm' },
  } });
  assert.equal(game.acceptQuest('griks-talisman').ok, true);
  assert.equal(game.questState('griks-talisman').status, 'ready');
  const equipment = { ...game.player.equipment };
  assert.equal(game.turnInQuest('griks-talisman').ok, true);
  assert.deepEqual(game.player.inventory, ['griks-lucky-charm']);
  assert.deepEqual(game.player.equipment, equipment);
  assert.equal(game.questState('mossfang').status, 'available');
});

test('named quests reject ordinary kills, then persist a real named victory', () => {
  const game = create({ player: { level: 20, quests: prior(2) } });
  visit(game, 'liora');
  assert.equal(game.acceptQuest('mossfang').ok, true);
  const ordinary = game.mobs.find(mob => mob.campId === 'mossfang' && !mob.named);
  setupAtTarget(game, ordinary);
  boltDown(game, ordinary);
  assert.equal(game.questState('mossfang').progress, 0);
  const named = game.mobs.find(mob => mob.name === 'Bramblemaw');
  setupAtTarget(game, named);
  boltDown(game, named);
  assert.equal(game.questState('mossfang').status, 'ready');
  visit(game, 'liora');
  const loaded = create(game.serialize());
  assert.equal(loaded.questState('mossfang').status, 'ready');
  assert.equal(loaded.turnInQuest('mossfang').ok, true);
  assert.equal(loaded.questState('crypt-proof').status, 'available');
});

test('v0.2 saves retain progression and all eight ranks while gaining valid new feature defaults', () => {
  const ranks = [2, 3, 1, 2, 3, 1, 2, 1];
  const old = { version: '0.2.0', discovered: ['briar', 'mossfang'], player: {
    x: 480, y: 350, level: 4, xp: 33, hp: 81, mp: 40, gold: 175, debt: 20, kills: 12,
    inventory: ['griks-lucky-charm', 'ring-of-bound-earth'],
    equipment: { charm: 'griks-lucky-charm', ring: 'ring-of-bound-earth' }, spellRanks: ranks,
  } };
  const game = create(old);
  for (const key of ['level', 'xp', 'hp', 'mp', 'gold', 'debt', 'kills', 'x', 'y']) assert.equal(game.player[key], old.player[key]);
  assert.deepEqual(game.player.inventory, old.player.inventory);
  assert.deepEqual(game.player.equipment, old.player.equipment);
  assert.deepEqual(game.player.spellRanks, [...ranks, 1, 1]);
  assert.deepEqual(game.player.hotbar, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(game.player.quests, {});
  assert.equal(game.questState('scout-road').status, 'available');
  assert.deepEqual(create(game.serialize()).serialize(), game.serialize());
});

test('quest saves preserve partial progress without inventing completed prerequisites', () => {
  const game = create({ player: { quests: {
    'scout-road': { status: 'active', progress: 2 },
    'griks-talisman': { status: 'completed', progress: 1 },
    unknown: { status: 'completed', progress: 999 },
  } } });
  assert.deepEqual(game.player.quests, { 'scout-road': { status: 'active', progress: 2 } });
  assert.equal(game.questState('griks-talisman').status, 'locked');
  const loaded = create(game.serialize());
  assert.equal(loaded.questState('scout-road').progress, 2);
  assert.equal(loaded.acceptQuest('scout-road').ok, false, 'Reload does not reset an accepted patrol');
});

test('Mara sells bounded supplies only nearby and only for available copper', () => {
  const game = create({ player: { gold: 100, supplies: { 'health-tonic': 0, 'mana-tonic': 0 } } });
  assert.equal(game.buySupply('health-tonic').ok, false);
  visit(game, 'mara');
  assert.equal(game.buySupply('health-tonic').ok, true);
  assert.equal(game.player.gold, 100 - SUPPLIES['health-tonic'].cost);
  assert.equal(game.player.supplies['health-tonic'], 1);
  assert.equal(game.buySupply('mana-tonic').ok, true);
  assert.equal(game.player.gold, 100 - SUPPLIES['health-tonic'].cost - SUPPLIES['mana-tonic'].cost);
  assert.equal(game.buySupply('__proto__').ok, false);
  game.player.gold = 0;
  assert.equal(game.buySupply('health-tonic').ok, false);
  game.player.gold = 100;
  game.player.supplies['health-tonic'] = 20;
  assert.equal(game.buySupply('health-tonic').ok, false);
  assert.equal(game.player.gold, 100);
});

test('tonics share a cooldown, do not waste full resources, and cannot revive a dead character', () => {
  const game = create({ player: { hp: 20, mp: 0, supplies: { 'health-tonic': 2, 'mana-tonic': 2 } } });
  assert.equal(game.useSupply('health-tonic').ok, true);
  assert.equal(game.player.hp, 80);
  assert.equal(game.player.supplies['health-tonic'], 1);
  assert.equal(game.useSupply('mana-tonic').ok, false);
  assert.equal(game.player.supplies['mana-tonic'], 2);
  advance(game, 20.05);
  assert.equal(game.useSupply('mana-tonic').ok, true);
  assert.equal(game.player.supplies['mana-tonic'], 1);
  advance(game, 20.05);
  game.restoreAtBindstone();
  assert.equal(game.useSupply('health-tonic').ok, false);
  assert.equal(game.player.supplies['health-tonic'], 1);
  const dead = create({ dead: true, player: { hp: 0, supplies: { 'health-tonic': 2 } } });
  assert.equal(dead.useSupply('health-tonic').ok, false);
  assert.equal(dead.player.hp, 0);
  assert.equal(dead.player.supplies['health-tonic'], 2);
});

test('saving and reloading retain the remaining shared tonic cooldown', () => {
  const game = create({ player: { hp: 20, mp: 0, supplies: { 'health-tonic': 2, 'mana-tonic': 2 } } });
  game.useSupply('health-tonic');
  advance(game, 7);
  const save = game.serialize();
  assert.ok(Math.abs(save.supplyCooldownRemaining - 13) < 0.01);
  const loaded = create(save);
  assert.equal(loaded.useSupply('mana-tonic').ok, false);
  advance(loaded, 12.9);
  assert.equal(loaded.useSupply('mana-tonic').ok, false);
  advance(loaded, 0.2);
  assert.equal(loaded.useSupply('mana-tonic').ok, true);
});

test('level unlocks and eight-slot assignment remain validated and persist through save', () => {
  const beginner = create();
  assert.equal(beginner.isSpellUnlocked(8), false);
  assert.equal(beginner.castSpell(8).ok, false);
  assert.equal(beginner.assignSpell(0, 8).ok, false);
  const game = create({ player: { level: 3 } });
  assert.equal(game.isSpellUnlocked(8), true);
  assert.equal(game.isSpellUnlocked(9), false);
  assert.equal(game.assignSpell(0, 8).ok, true);
  assert.equal(game.assignSpell(1, 8).ok, true);
  assert.deepEqual(game.player.hotbar, [1, 8, 2, 3, 4, 5, 6, 7]);
  for (const [slot, spell] of [[8, 8], [-1, 1], [0, 9], [0, 99], [1.5, 2]]) assert.equal(game.assignSpell(slot, spell).ok, false);
  assert.deepEqual(create(game.serialize()).player.hotbar, game.player.hotbar);
  const repaired = create({ player: { level: 1, hotbar: [9, 9, -1, 99, null, '1', 0, 0] } });
  assert.equal(new Set(repaired.player.hotbar).size, 8);
  assert.ok(repaired.player.hotbar.every(index => repaired.isSpellUnlocked(index)));
  const advanced = create({ player: { level: 5 } });
  assert.equal(advanced.assignSpell(7, 9).ok, true);
});

test('Frost Lance slows a living target and returning home clears its slow', () => {
  const game = create({ player: { level: 3 } });
  Object.assign(game.player, { x: 480, y: 350 });
  const mob = scout(game);
  game.setTarget(mob.id);
  cast(game, 8);
  assert.equal(mob.alive, true);
  assert.ok(mob.slowUntil > game.clock + 5);
  const point = { x: mob.x, y: mob.y };
  advance(game, 0.4);
  const moved = Math.hypot(mob.x - point.x, mob.y - point.y);
  assert.ok(moved > 15 && moved < 22, 'A slowed scout should move at roughly 55% of its usual speed');
  Object.assign(game.player, WORLD.spawn);
  advance(game, 3);
  assert.equal(mob.slowUntil, 0);
  assert.equal(mob.hp, mob.maxHp);
  assert.equal(mob.aggro, false);
});

test('Ember Nova hits the original selected group and leaves an outside enemy untouched', () => {
  const game = create({ player: { level: 5 } });
  const [original, nearby, outside] = game.mobs.filter(mob => mob.campId === 'briar');
  // Controlled placement makes the area boundary unambiguous without replacing damage logic.
  Object.assign(original, { x: 600, y: 350, homeX: 600, homeY: 350 });
  Object.assign(nearby, { x: 680, y: 350, homeX: 680, homeY: 350 });
  Object.assign(outside, { x: 850, y: 350, homeX: 850, homeY: 350 });
  Object.assign(game.player, { x: 600, y: 100 });
  const hp = [original.hp, nearby.hp, outside.hp];
  game.setTarget(original.id);
  assert.equal(game.castSpell(9).ok, true);
  game.setTarget(outside.id);
  advance(game, SPELLS[9].cast + 0.05);
  assert.ok(original.hp < hp[0]);
  assert.ok(nearby.hp < hp[1]);
  assert.equal(outside.hp, hp[2]);
  assert.ok(game.visuals.some(effect => effect.kind === 'nova'));
  Object.assign(game.player, WORLD.spawn);
  advance(game, 3);
  assert.equal(game.visuals.length, 0, 'Finished visual effects must not remain as persistent entities');
});

test('Guard assists spells, while Follow prevents automatic reacquisition after spells or incoming damage', () => {
  const game = create();
  cast(game, 0);
  Object.assign(game.player, { x: 480, y: 350 });
  Object.assign(game.pet, { x: 448, y: 378 });
  const mob = scout(game);
  game.setTarget(mob.id);
  cast(game, 1);
  assert.equal(game.pet.targetId, mob.id);
  game.commandPet('follow');
  assert.equal(game.pet.mode, 'follow');
  assert.equal(game.pet.targetId, null);
  cast(game, 2);
  assert.equal(game.pet.targetId, null, 'A second offensive spell cannot undo Follow');
  const defending = create();
  cast(defending, 0);
  defending.commandPet('follow');
  const attacker = scout(defending);
  Object.assign(defending.player, { x: attacker.x, y: attacker.y });
  Object.assign(defending.pet, { x: attacker.x - 45, y: attacker.y + 20 });
  const hp = defending.player.hp;
  advance(defending, 0.9);
  assert.ok(defending.player.hp < hp, 'The player must actually take a hit in this scenario');
  assert.equal(defending.pet.targetId, null, 'Incoming damage cannot undo Follow');
  assert.equal(defending.commandPet('guard').ok, true);
  assert.equal(defending.pet.mode, 'guard');
  advance(defending, 2.3);
  assert.equal(defending.pet.targetId, attacker.id, 'Guard responds to the next actual hit');
});

test('pet taunt requires a nearby assigned target and has a twelve-second cooldown', () => {
  const game = create();
  cast(game, 0);
  Object.assign(game.player, { x: 480, y: 350 });
  Object.assign(game.pet, { x: 448, y: 378 });
  const mob = scout(game);
  game.setTarget(mob.id);
  assert.equal(game.commandPet('taunt').ok, false);
  game.commandPet('attack');
  assert.equal(game.commandPet('taunt').ok, false, 'The pet is initially outside taunt range');
  advance(game, 0.8);
  assert.equal(game.commandPet('taunt').ok, true);
  assert.equal(mob.targetId, game.pet.id);
  assert.ok(mob.threatPet > mob.threatPlayer);
  assert.ok(Math.abs(game.pet.tauntReadyAt - game.clock - 12) < 0.001);
  assert.equal(game.commandPet('taunt').ok, false);
  game.commandPet('follow');
  Object.assign(game.player, WORLD.spawn);
  advance(game, 12.1);
  Object.assign(game.player, { x: 480, y: 350 });
  Object.assign(game.pet, { x: 500, y: 350 });
  game.setTarget(mob.id);
  game.commandPet('attack');
  advance(game, 0.3);
  assert.equal(game.commandPet('taunt').ok, true);
});

test('ground telegraphs remain fixed while the player moves clear, allowing the slam to miss', () => {
  const game = create();
  const mob = game.mobs.find(enemy => enemy.name === 'Grik the Hoarder');
  setupAtTarget(game, mob, 60);
  const intent = awaitIntent(game, mob);
  const hp = game.player.hp;
  assert.equal(game.moveTo(game.player.x + 150, game.player.y).ok, true);
  advance(game, 0.9);
  assert.equal(mob.intent.x, intent.x);
  assert.equal(mob.intent.y, intent.y);
  assert.ok(Math.hypot(game.player.x - intent.x, game.player.y - intent.y) > intent.radius);
  advance(game, Math.max(0, intent.done - game.clock) + 0.05);
  assert.equal(mob.intent, null);
  assert.equal(game.player.hp, hp, 'Leaving the warning circle avoids its damage');
  assert.ok(game.logs.some(log => log.text.includes('misses')));
});

test('Arcane Root is fast enough to interrupt an observed enemy windup', () => {
  const game = create();
  const mob = game.mobs.find(enemy => enemy.name === 'Grik the Hoarder');
  setupAtTarget(game, mob, 60);
  const intent = awaitIntent(game, mob);
  const hp = game.player.hp;
  assert.ok(SPELLS[3].cast < intent.done - game.clock, 'A reaction cast must fit inside the warning');
  cast(game, 3);
  assert.equal(mob.intent, null);
  assert.ok(mob.rootUntil > game.clock);
  // Root prevents movement and the special attack, but does not stun ordinary
  // melee swings. Step away after the cast so those remain a separate mechanic.
  assert.ok(game.player.hp >= hp - mob.damage);
  const afterRoot = game.player.hp;
  game.moveTo(game.player.x + 100, game.player.y);
  advance(game, 1);
  assert.equal(game.player.hp, afterRoot);
  assert.equal(game.visuals.some(effect => effect.kind === 'nova'), false);
  assert.ok(game.logs.some(log => log.text.includes('interrupts')));
});

test('Bramblemaw healing can be interrupted and each named camp offers distinct rare equipment', () => {
  const game = create({ player: { level: 3 } });
  const mob = game.mobs.find(enemy => enemy.name === 'Bramblemaw');
  setupAtTarget(game, mob);
  mob.hp = Math.floor(mob.maxHp * 0.6); // A wounded-enemy encounter setup.
  cast(game, 1);
  const intent = awaitIntent(game, mob);
  assert.equal(intent.kind, 'heal');
  const hp = mob.hp;
  cast(game, 3);
  advance(game, 1);
  assert.equal(mob.hp, hp, 'Interrupted renewal cannot apply delayed healing');
  assert.equal(mob.intent, null);
  assert.equal(new Set(CAMPS.map(camp => camp.rareItemId)).size, CAMPS.length);
  assert.ok(CAMPS.every(camp => ITEMS[camp.rareItemId]?.rarity === 'rare'));
});
