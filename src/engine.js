/* Everwild — Willowmere Frontier. Deterministic, DOM-free game simulation. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Everwild = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '0.2.0';
  const WORLD = Object.freeze({ w: 1900, h: 1350, spawn: Object.freeze({ x: 260, y: 250 }) });
  const CAMPS = Object.freeze([
    { id: 'briar', name: 'Briarwatch', x: 710, y: 350, type: 'goblin', n: 4, level: 1, delay: 45 },
    { id: 'mossfang', name: 'Mossfang Camp', x: 1090, y: 410, type: 'goblin', n: 5, level: 3, delay: 55 },
    { id: 'crypt', name: 'Willowmere Crypt', x: 1330, y: 890, type: 'skeleton', n: 5, level: 5, delay: 65 },
    { id: 'vigil', name: 'Othrek’s Vigil', x: 1570, y: 1040, type: 'skeleton', n: 4, level: 7, delay: 75 }
  ].map(Object.freeze));
  const SPELLS = Object.freeze([
    { id: 'earth-pet', name: 'Earth Pet', cost: 45, cast: 3.2, key: '1', description: 'Summon a sturdy elemental. Order it to attack with F; recall it with G.' },
    { id: 'fire-bolt', name: 'Fire Bolt', cost: 19, cast: 1.7, key: '2', description: 'Strike your selected enemy with fire. Range: 330 paces.' },
    { id: 'burning-mark', name: 'Burning Mark', cost: 26, cast: 2.3, key: '3', description: 'Mark an enemy with fire that burns every two seconds for 14 seconds.' },
    { id: 'arcane-root', name: 'Arcane Root', cost: 24, cast: 2.1, key: '4', description: 'Hold an enemy in place for nine seconds. Rooted enemies can still attack nearby foes.' },
    { id: 'pet-mend', name: 'Pet Mend', cost: 28, cast: 2.5, key: '5', description: 'Restore your elemental’s health. Range: 360 paces.' },
    { id: 'air-pet', name: 'Air Pet', cost: 48, cast: 3, key: '6', description: 'Summon a swift elemental with stronger attacks and less endurance.' },
    { id: 'magic-shield', name: 'Magic Shield', cost: 25, cast: 1.2, key: '7', description: 'Reduce incoming damage by 45% for 24 seconds.' },
    { id: 'minor-heal', name: 'Minor Heal', cost: 32, cast: 2.5, key: '8', description: 'Restore your health. Being hit does not interrupt a spell; moving does.' }
  ].map(Object.freeze));
  const ITEMS = Object.freeze({
    'goblin-talisman': Object.freeze({ id: 'goblin-talisman', name: 'Goblin Talisman', slot: 'charm', rarity: 'common', description: 'A surprisingly warm knot of polished roots.', stats: Object.freeze({ hp: 12 }) }),
    'cracked-bone-wand': Object.freeze({ id: 'cracked-bone-wand', name: 'Cracked Bone Wand', slot: 'focus', rarity: 'common', description: 'A splintered focus that still remembers its magic.', stats: Object.freeze({ power: 3, mp: 8 }) }),
    'copperleaf-ring': Object.freeze({ id: 'copperleaf-ring', name: 'Copperleaf Ring', slot: 'ring', rarity: 'common', description: 'A copper band etched with tiny leaves.', stats: Object.freeze({ mp: 10 }) }),
    'griks-lucky-charm': Object.freeze({ id: 'griks-lucky-charm', name: 'Grik’s Lucky Charm', slot: 'charm', rarity: 'rare', description: 'Grik carried this charm through a hundred narrow escapes.', stats: Object.freeze({ hp: 24, power: 2 }) }),
    'ring-of-bound-earth': Object.freeze({ id: 'ring-of-bound-earth', name: 'Ring of Bound Earth', slot: 'ring', rarity: 'rare', description: 'A quiet pulse of elemental magic lives inside the stone.', stats: Object.freeze({ hp: 10, mp: 18 }) }),
    'othreks-focus': Object.freeze({ id: 'othreks-focus', name: 'Othrek’s Runebone Focus', slot: 'focus', rarity: 'rare', description: 'A rune-carved relic recovered from the heart of the crypt.', stats: Object.freeze({ power: 7, mp: 16 }) })
  });
  const MAX_LEVEL = 20;
  const CAST_RANGE = 330;
  const SAFE_RADIUS = 120;
  const EQUIPMENT_SLOTS = ['charm', 'focus', 'ring'];
  const TARGETED_SPELLS = [1, 2, 3];
  const NAMED = ['Grik the Hoarder', 'Bramblemaw', 'The Bonewarden', 'Graveminder Othrek'];
  const RARE_DROPS = ['griks-lucky-charm', 'ring-of-bound-earth', 'ring-of-bound-earth', 'othreks-focus'];
  const ITEM_NAMES = Object.fromEntries(Object.values(ITEMS).map(item => [item.name.replace(/’/g, "'"), item.id]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const numeric = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
  const whole = (value, fallback, min, max) => Math.floor(numeric(value, fallback, min, max));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const requirement = level => 75 + level * 65;
  const itemId = value => {
    if (typeof value !== 'string') return null;
    if (Object.hasOwn(ITEMS, value)) return value;
    const normalized = value.replace(/’/g, "'");
    return Object.hasOwn(ITEM_NAMES, normalized) ? ITEM_NAMES[normalized] : null;
  };

  class Game {
    constructor({ save = null, random = Math.random } = {}) {
      this.random = typeof random === 'function' ? random : Math.random;
      this.clock = 0;
      this.mobs = [];
      this.pet = null;
      this.cast = null;
      this.selectedId = null;
      this.moveTarget = null;
      this.meditate = false;
      this.shieldUntil = 0;
      this.logs = [];
      this.effects = [];
      this._uid = 0;
      this._logId = 0;
      this._moving = false;
      this._recentCombat = -100;
      this._slots = [];
      const data = this._readSave(save);
      const source = data.player && typeof data.player === 'object' ? data.player : {};
      const level = whole(source.level, 1, 1, MAX_LEVEL);
      const inventory = Array.isArray(source.inventory) ? [...new Set(source.inventory.slice(0, 100).map(itemId).filter(Boolean))] : [];
      const equipment = {};
      const oldEquipment = source.equipment && typeof source.equipment === 'object' ? source.equipment : null;
      if (oldEquipment) {
        for (const slot of EQUIPMENT_SLOTS) {
          const id = itemId(oldEquipment[slot]);
          if (id && inventory.includes(id) && ITEMS[id].slot === slot) equipment[slot] = id;
        }
      } else {
        // v0.1 items were names; duplicate ring drops permanently inflated max mana.
        // Migrate one copy and derive its benefit once from the equipment slot.
        for (const id of inventory) {
          const slot = ITEMS[id].slot;
          if (!equipment[slot] || ITEMS[id].rarity === 'rare') equipment[slot] = id;
        }
      }
      this.player = {
        x: numeric(source.x, WORLD.spawn.x, 24, WORLD.w - 24),
        y: numeric(source.y, WORLD.spawn.y, 24, WORLD.h - 24),
        hp: 110, maxHp: 110, mp: 160, maxMp: 160,
        level, xp: whole(source.xp, 0, 0, requirement(level) - (level < MAX_LEVEL ? 1 : 0)),
        gold: whole(source.gold, 0, 0, 10000000),
        debt: whole(source.debt, 0, 0, requirement(level) * 3),
        inventory, equipment, kills: whole(source.kills, 0, 0, 10000000),
        spellRanks: SPELLS.map((_, i) => whole(Array.isArray(source.spellRanks) ? source.spellRanks[i] : undefined, 1, 1, 3))
      };
      this._refreshStats();
      this.player.hp = numeric(source.hp, this.player.maxHp, 0, this.player.maxHp);
      this.player.mp = numeric(source.mp, this.player.maxMp, 0, this.player.maxMp);
      this.dead = data.dead === true || this.player.hp <= 0;
      if (this.dead) this.player.hp = 0;
      this.discovered = Array.isArray(data.discovered) ? [...new Set(data.discovered.filter(id => CAMPS.some(camp => camp.id === id)))] : [];
      CAMPS.forEach((camp, campIndex) => {
        for (let index = 0; index < camp.n; index++) {
          // Wide, repeatable placements leave the western sentry available for a single pull.
          const angle = Math.PI + index * (Math.PI * 2 / camp.n);
          const slot = { campId: camp.id, campIndex, index, x: camp.x + Math.cos(angle) * 115, y: camp.y + Math.sin(angle) * 115, at: 0, count: 0, misses: 0, mobId: null };
          this._slots.push(slot);
          this._spawn(slot);
        }
      });
      // Camps reset between sessions, so a save made over a defeated guard could
      // otherwise reload inside its replacement without the player's old pet.
      const unsafeResume = source.x !== undefined && !this.dead && this.mobs.some(mob => distance(mob, this.player) < 110);
      if (unsafeResume) {
        this.player.x = WORLD.spawn.x;
        this.player.y = WORLD.spawn.y;
      }
      this.log(this.dead ? 'Your spirit awaits at the bindstone. Return to continue your adventure.' : 'Welcome to Willowmere. Summon an Earth Pet [1], then explore east toward Briarwatch.');
      if (unsafeResume) this.log('Enemies reclaimed your saved camp. You resume safely at the bindstone with your progress intact. Press E to restore health and mana.');
      this.log('The bindstone restores health and mana [E]. Named foes carry rare equipment.');
    }

    get selected() {
      return this.mobs.find(mob => mob.id === this.selectedId && mob.alive) || null;
    }

    get inCombat() {
      return this.mobs.some(mob => mob.alive && mob.aggro && !mob.returning);
    }

    _readSave(save) {
      if (typeof save === 'string') {
        try { save = JSON.parse(save); } catch (_) { return {}; }
      }
      return save && typeof save === 'object' && !Array.isArray(save) ? save : {};
    }

    _roll() {
      let result;
      try { result = this.random(); } catch (_) { result = 0.5; }
      return numeric(result, 0.5, 0, 0.999999999);
    }

    _refreshStats() {
      const player = this.player;
      player.maxHp = 110 + (player.level - 1) * 13;
      player.maxMp = 160 + (player.level - 1) * 18;
      player.power = 0;
      for (const id of Object.values(player.equipment)) {
        const item = ITEMS[id];
        if (!item) continue;
        player.maxHp += item.stats.hp || 0;
        player.maxMp += item.stats.mp || 0;
        player.power += item.stats.power || 0;
      }
      player.hp = clamp(player.hp, 0, player.maxHp);
      player.mp = clamp(player.mp, 0, player.maxMp);
    }

    log(text, type = 'info') {
      const allowed = ['info', 'combat', 'loot', 'rare', 'success', 'warning', 'danger'];
      this.logs.push({ id: ++this._logId, text: String(text).slice(0, 300), type: allowed.includes(type) ? type : 'info' });
      if (this.logs.length > 80) this.logs.splice(0, this.logs.length - 80);
    }

    _result(ok, message, type = 'info') {
      if (message) this.log(message, type);
      return { ok, message };
    }

    _effect(entity, text, color = '#e7d39d') {
      this.effects.push({ x: entity.x, y: entity.y - 20, text, color, life: 1.25 });
      if (this.effects.length > 80) this.effects.splice(0, this.effects.length - 80);
    }

    _spawn(slot) {
      const camp = CAMPS[slot.campIndex];
      const named = slot.index === camp.n - 1 && (slot.count === 0 || slot.misses >= 2 || this._roll() < 0.35);
      slot.misses = named ? 0 : slot.misses + 1;
      slot.count++;
      const level = camp.level + (named ? 1 : 0);
      const maxHp = Math.round((camp.type === 'goblin' ? 42 + level * 13 : 50 + level * 15) * (named ? 1.65 : 1));
      const names = camp.type === 'goblin' ? ['Goblin Scout', 'Goblin Raider', 'Goblin Shaman'] : ['Crypt Skeleton', 'Crypt Guardian', 'Crypt Acolyte'];
      const mob = {
        id: 'mob-' + ++this._uid, x: slot.x, y: slot.y, homeX: slot.x, homeY: slot.y,
        campId: camp.id, index: slot.index, type: camp.type,
        name: named ? NAMED[slot.campIndex] : names[slot.index % names.length],
        level, hp: maxHp, maxHp, named, aggro: false, alive: true,
        rootUntil: 0, dotUntil: 0, returning: false,
        threatPlayer: 0, threatPet: 0, targetId: null,
        attackAt: 0, dotAt: 0, dotDamage: 0, _slot: slot,
        damage: Math.round((4 + level * 2.2) * (named ? 1.15 : 1))
      };
      slot.mobId = mob.id;
      this.mobs.push(mob);
    }

    xpNeeded() { return requirement(this.player.level); }

    setTarget(id) {
      if (id === null) { this.selectedId = null; return { ok: true }; }
      const mob = this.mobs.find(enemy => enemy.id === id && enemy.alive);
      if (!mob) return { ok: false, message: 'That target is no longer here.' };
      this.selectedId = mob.id;
      return { ok: true, message: mob.name };
    }

    targetNearest() {
      if (this.dead) return { ok: false };
      const visible = this.mobs.filter(mob => mob.alive && !mob.returning && distance(mob, this.player) <= 440);
      visible.sort((a, b) => distance(a, this.player) - distance(b, this.player));
      if (!visible.length) return this._result(false, 'No enemies nearby. Follow the eastern road toward Briarwatch.');
      this.selectedId = visible[0].id;
      return this._result(true, 'Target: ' + visible[0].name + ' · level ' + visible[0].level + '.');
    }

    moveTo(x, y) {
      if (this.dead || !Number.isFinite(x) || !Number.isFinite(y)) return { ok: false };
      this.moveTarget = { x: clamp(x, 24, WORLD.w - 24), y: clamp(y, 24, WORLD.h - 24) };
      this.meditate = false;
      if (distance(this.moveTarget, this.player) > 2) this._interruptCast();
      return { ok: true };
    }

    cancelMovement() { this.moveTarget = null; this._moving = false; }

    _interruptCast() {
      if (!this.cast) return;
      this.log('Movement interrupted ' + SPELLS[this.cast.i].name + '. Mana was not spent.', 'warning');
      this.cast = null;
    }

    castSpell(index) {
      if (!Number.isInteger(index) || index < 0 || index >= SPELLS.length) return { ok: false };
      if (this.dead) return this._result(false, 'Return to the bindstone before casting.', 'warning');
      if (this.cast) return this._result(false, 'Finish your current spell or move to interrupt it.', 'warning');
      if (this._moving || this.moveTarget) return this._result(false, 'Stand still to cast. Press Esc to stop traveling.', 'warning');
      const spell = SPELLS[index];
      if (this.player.mp < spell.cost) return this._result(false, 'Not enough mana for ' + spell.name + '. Meditate [R] or return to the bindstone.', 'warning');
      let targetId = null;
      if (TARGETED_SPELLS.includes(index)) {
        const target = this.selected;
        if (!target) return this._result(false, 'Select an enemy first. Click one or press Space.', 'warning');
        if (target.returning) return this._result(false, target.name + ' is returning home and cannot be attacked.', 'warning');
        if (distance(target, this.player) > CAST_RANGE) return this._result(false, 'Move closer to your target. Spell range is 330 paces.', 'warning');
        targetId = target.id;
      }
      if (index === 4) {
        if (!this.pet) return this._result(false, 'Summon an elemental before using Pet Mend.', 'warning');
        if (distance(this.pet, this.player) > 360) return this._result(false, 'Your elemental is too far away to mend.', 'warning');
        targetId = this.pet.id;
      }
      this.meditate = false;
      this.cast = { i: index, targetId, started: this.clock, done: this.clock + spell.cast };
      return { ok: true, message: 'Casting ' + spell.name + '.' };
    }

    _finishCast() {
      const pending = this.cast;
      if (!pending || this.dead) return;
      this.cast = null;
      const spell = SPELLS[pending.i];
      const rank = this.player.spellRanks[pending.i];
      const target = this.mobs.find(mob => mob.id === pending.targetId && mob.alive);
      if (TARGETED_SPELLS.includes(pending.i) && (!target || target.returning || distance(target, this.player) > CAST_RANGE)) {
        this.log('Your original target is gone or out of range. Mana was not spent.', 'warning');
        return;
      }
      if (pending.i === 4 && (!this.pet || this.pet.id !== pending.targetId || distance(this.pet, this.player) > 360)) {
        this.log('Your elemental is gone or out of range. Mana was not spent.', 'warning');
        return;
      }
      if (this.player.mp < spell.cost) return;
      this.player.mp -= spell.cost;
      const power = this.player.power;
      const bonus = 1 + (rank - 1) * 0.15;
      switch (pending.i) {
        case 0: case 5: this._summon(pending.i === 0 ? 'Earth' : 'Air', rank); break;
        case 1:
          this._damageMob(target, Math.round((24 + this.player.level * 9 + power) * bonus), 'player');
          this.log('Fire Bolt strikes ' + target.name + '.', 'combat');
          break;
        case 2:
          target.dotUntil = this.clock + 14;
          target.dotAt = this.clock + 2;
          target.dotDamage = Math.round((7 + this.player.level * 2 + power * 0.4) * bonus);
          this._engage(target, 'player', 8, true);
          this._effect(target, 'Burning', '#efa17a');
          this.log(target.name + ' bears your Burning Mark.', 'combat');
          break;
        case 3: {
          const resist = clamp(0.04 + Math.max(0, target.level - this.player.level) * 0.06 - (rank - 1) * 0.02, 0.02, 0.45);
          this._engage(target, 'player', 7, true);
          if (this._roll() < resist) {
            this._effect(target, 'Resisted', '#e99a84');
            this.log(target.name + ' resists Arcane Root.', 'warning');
          } else {
            target.rootUntil = this.clock + 9 + (rank - 1) * 2;
            this._effect(target, 'Rooted', '#b1bde8');
            this.log(target.name + ' is rooted.', 'combat');
          }
          break;
        }
        case 4: {
          const restored = this._heal(this.pet, Math.round((60 + this.player.level * 10 + power) * bonus));
          this._healingThreat(restored * 0.2);
          this.log('Pet Mend restores ' + restored + ' health to your elemental.', 'success');
          break;
        }
        case 6:
          this.shieldUntil = this.clock + 24 + (rank - 1) * 6;
          this._effect(this.player, 'Shield', '#abd8ed');
          this.log('A magic shield surrounds you.', 'success');
          break;
        case 7: {
          const restored = this._heal(this.player, Math.round((35 + this.player.level * 9 + power) * bonus));
          this._healingThreat(restored * 0.25);
          this.log('Minor Heal restores ' + restored + ' health.', 'success');
          break;
        }
      }
    }

    _heal(entity, amount) {
      const restored = Math.round(Math.min(amount, entity.maxHp - entity.hp));
      entity.hp = Math.min(entity.maxHp, entity.hp + amount);
      this._effect(entity, '+' + restored, '#a9d5a1');
      return restored;
    }

    _healingThreat(amount) {
      for (const mob of this.mobs) if (mob.alive && mob.aggro && !mob.returning) mob.threatPlayer += amount;
    }

    _clearPetThreat() {
      for (const mob of this.mobs) {
        mob.threatPet = 0;
        if (mob.targetId !== 'player') mob.targetId = null;
        if (mob.aggro && !mob.returning) mob.threatPlayer = Math.max(1, mob.threatPlayer);
      }
    }

    _summon(type, rank) {
      this._clearPetThreat();
      const earth = type === 'Earth';
      const maxHp = Math.round((earth ? 95 + this.player.level * 19 : 65 + this.player.level * 14) * (1 + (rank - 1) * 0.15));
      this.pet = {
        id: 'pet-' + ++this._uid, type, x: this.player.x - 32, y: this.player.y + 28,
        hp: maxHp, maxHp, targetId: null, attackAt: this.clock,
        damage: Math.round((earth ? 10 + this.player.level * 4 : 14 + this.player.level * 5) * (1 + (rank - 1) * 0.12)),
        speed: earth ? 152 : 185
      };
      this._effect(this.pet, type + ' elemental', '#bad6ae');
      this.log('Your ' + type.toLowerCase() + ' elemental is ready. Select an enemy and order it to attack [F].', 'success');
    }

    commandPet(command) {
      if (this.dead) return { ok: false };
      if (!this.pet) return this._result(false, 'Summon an elemental first [1 or 6].', 'warning');
      if (command === 'follow') {
        this.pet.targetId = null;
        return this._result(true, 'Your elemental stops attacking and follows you. Enemies may still pursue it.');
      }
      if (command !== 'attack') return { ok: false };
      const target = this.selected;
      if (!target) return this._result(false, 'Select an enemy for your pet.', 'warning');
      if (target.returning) return this._result(false, 'That enemy is returning home.', 'warning');
      if (distance(target, this.player) > 360) return this._result(false, 'Move closer before sending your elemental. Command range is 360 paces.', 'warning');
      this.pet.targetId = target.id;
      // Threat begins when the elemental reaches its enemy, so distant allies do not pull remotely.
      return this._result(true, 'Your elemental advances on ' + target.name + '.');
    }

    toggleMeditate() {
      if (this.dead) return { ok: false };
      this.meditate = !this.meditate;
      this.cancelMovement();
      if (this.meditate && this.cast) {
        this.cast = null;
        this.log('Your spell is canceled. Mana was not spent.');
      }
      return this._result(true, this.meditate ? 'You sit to meditate. Taking damage will make you stand.' : 'You stand up.');
    }

    equip(id) {
      if (this.dead) return this._result(false, 'Return to the bindstone before changing equipment.', 'warning');
      if (!Object.hasOwn(ITEMS, id) || !this.player.inventory.includes(id)) return this._result(false, 'That item is not in your pack.', 'warning');
      const item = ITEMS[id];
      if (this.player.equipment[item.slot] === id) return { ok: true, message: item.name + ' is already equipped.' };
      this.player.equipment[item.slot] = id;
      this._refreshStats();
      return this._result(true, 'Equipped ' + item.name + '.', 'loot');
    }

    upgradeCost(index) {
      if (!Number.isInteger(index) || index < 0 || index >= SPELLS.length) return 0;
      return this.player.spellRanks[index] >= 3 ? 0 : this.player.spellRanks[index] * 45;
    }

    buyUpgrade(index) {
      if (!Number.isInteger(index) || index < 0 || index >= SPELLS.length) return { ok: false };
      if (this.dead) return this._result(false, 'Return to the bindstone to study your spells.', 'warning');
      if (distance(this.player, WORLD.spawn) > 110) return this._result(false, 'Visit the bindstone to study a spell upgrade.', 'warning');
      if (this.inCombat) return this._result(false, 'Finish combat before studying a spell upgrade.', 'warning');
      const rank = this.player.spellRanks[index];
      if (rank >= 3) return this._result(false, SPELLS[index].name + ' is already at rank 3.');
      const requiredLevel = rank === 1 ? 2 : 5;
      if (this.player.level < requiredLevel) return this._result(false, 'Reach level ' + requiredLevel + ' to learn rank ' + (rank + 1) + '.', 'warning');
      const cost = this.upgradeCost(index);
      if (this.player.gold < cost) return this._result(false, 'This upgrade costs ' + cost + ' copper.', 'warning');
      this.player.gold -= cost;
      this.player.spellRanks[index]++;
      return this._result(true, SPELLS[index].name + ' reaches rank ' + (rank + 1) + '.', 'success');
    }

    interact() {
      if (this.dead) return this._result(false, 'Return to the bindstone to revive.', 'warning');
      if (distance(this.player, WORLD.spawn) <= 110) {
        if (this.inCombat) return this._result(false, 'The bindstone cannot restore you while enemies pursue you.', 'warning');
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        if (this.pet) this.pet.hp = this.pet.maxHp;
        this._effect(this.player, 'Restored', '#cce0b6');
        return this._result(true, 'The Willowmere bindstone restores you and your elemental. Spell upgrades become available at levels 2 and 5.', 'success');
      }
      const camp = CAMPS.find(candidate => distance(candidate, this.player) < 210);
      if (camp) return this._result(true, camp.name + ': level ' + camp.level + ' territory. ' + NAMED[CAMPS.indexOf(camp)] + ' is sometimes found among its guards.');
      return this._result(true, 'Explore east for Briarwatch’s level 1 goblins. The road southeast leads to the crypt. The bindstone lies northwest.');
    }

    _engage(mob, source, amount = 1, assist = false) {
      if (!mob.alive || mob.returning) return;
      const fresh = !mob.aggro;
      mob.aggro = true;
      mob[source === 'pet' ? 'threatPet' : 'threatPlayer'] += Math.max(1, amount);
      if (fresh) mob.attackAt = this.clock + 0.8;
      this._recentCombat = this.clock;
      if (assist) {
        for (const ally of this.mobs) {
          if (ally !== mob && ally.alive && !ally.returning && !ally.aggro && ally.campId === mob.campId && distance(ally, mob) < 75) {
            this._engage(ally, source, 5, false);
            this.log(ally.name + ' comes to its ally’s aid!', 'warning');
          }
        }
      }
    }

    _damageMob(mob, amount, source) {
      if (!mob.alive || mob.returning || this.dead) return;
      this._engage(mob, source, amount * (source === 'pet' ? 1.55 : 1), true);
      mob.hp = Math.max(0, mob.hp - amount);
      this._effect(mob, '−' + amount, source === 'pet' ? '#d2dbb0' : '#f3be8b');
      if (mob.hp <= 0) this._kill(mob);
    }

    _kill(mob) {
      if (!mob.alive) return;
      mob.alive = false;
      mob.aggro = false;
      mob.dotUntil = 0;
      mob.rootUntil = 0;
      mob._slot.at = this.clock + CAMPS[mob._slot.campIndex].delay;
      mob._slot.mobId = null;
      if (this.selectedId === mob.id) this.selectedId = null;
      if (this.pet && this.pet.targetId === mob.id) this.pet.targetId = null;
      this.player.kills++;
      const modifier = clamp(1 + (mob.level - this.player.level) * 0.16, 0.25, 1.8);
      const xp = Math.max(2, Math.round((15 + mob.level * 7) * modifier * (mob.named ? 1.5 : 1)));
      const copper = Math.floor(3 + this._roll() * 5 + mob.level * 1.5 + (mob.named ? 12 : 0));
      this.player.gold = Math.min(10000000, this.player.gold + copper);
      const paid = Math.min(this.player.debt, xp);
      this.player.debt -= paid;
      this.player.xp += xp - paid;
      this.log(mob.name + ' falls: ' + xp + ' experience' + (paid ? ' (' + paid + ' repays debt)' : '') + ', ' + copper + ' copper.', 'combat');
      this._levelUp();
      // First named defeat per item guarantees a usable rare; later copies turn into copper.
      if (mob.named) {
        this._loot(RARE_DROPS[mob._slot.campIndex]);
      } else if (this.player.kills === 1 || this._roll() < 0.3) {
        this._loot(mob.type === 'skeleton' ? 'cracked-bone-wand' : (this._roll() < 0.65 ? 'goblin-talisman' : 'copperleaf-ring'));
      }
    }

    _loot(id) {
      const item = ITEMS[id];
      if (this.player.inventory.includes(id)) {
        const value = item.rarity === 'rare' ? 20 : 6;
        this.player.gold = Math.min(10000000, this.player.gold + value);
        this.log('Duplicate ' + item.name + ' salvaged for ' + value + ' copper.', 'loot');
        return;
      }
      this.player.inventory.push(id);
      this.log('Found ' + item.name + '. Equip it from your pack.', item.rarity === 'rare' ? 'rare' : 'loot');
      this._effect(this.player, item.name, item.rarity === 'rare' ? '#cbb6f1' : '#dfc28a');
    }

    _levelUp() {
      while (this.player.level < MAX_LEVEL && this.player.xp >= this.xpNeeded()) {
        this.player.xp -= this.xpNeeded();
        this.player.level++;
        this._refreshStats();
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        this._effect(this.player, 'Level ' + this.player.level, '#e9d79f');
        this.log('You reached level ' + this.player.level + '! Health and mana restored.', 'success');
      }
      if (this.player.level === MAX_LEVEL) this.player.xp = Math.min(this.player.xp, this.xpNeeded());
    }

    _returnHome(mob) {
      mob.returning = true;
      mob.aggro = false;
      mob.targetId = null;
      mob.rootUntil = 0;
      mob.dotUntil = 0;
      mob.dotDamage = 0;
      mob.threatPlayer = 0;
      mob.threatPet = 0;
      mob.hp = mob.maxHp;
      if (this.pet && this.pet.targetId === mob.id) this.pet.targetId = null;
    }

    _takePlayerDamage(amount) {
      if (this.dead) return;
      this._recentCombat = this.clock;
      if (this.meditate) { this.meditate = false; this.log('Taking damage ends your meditation.', 'warning'); }
      const damage = Math.max(1, Math.round(amount * (this.shieldUntil > this.clock ? 0.55 : 1)));
      this.player.hp = Math.max(0, this.player.hp - damage);
      this._effect(this.player, '−' + damage, '#ef9c90');
      if (this.player.hp <= 0) this._die();
    }

    _die() {
      if (this.dead) return;
      this.dead = true;
      this.player.hp = 0;
      const penalty = Math.ceil(this.xpNeeded() * 0.15);
      this.player.debt = Math.min(this.xpNeeded() * 3, this.player.debt + penalty);
      this.cast = null;
      this.pet = null;
      this.meditate = false;
      this.shieldUntil = 0;
      this.cancelMovement();
      this.selectedId = null;
      for (const mob of this.mobs) if (mob.alive) this._returnHome(mob);
      this.log('You have fallen. ' + penalty + ' experience debt was added. Your level, items, and copper are safe.', 'danger');
    }

    revive() {
      if (!this.dead) return { ok: false, message: 'You are already alive.' };
      this.dead = false;
      Object.assign(this.player, { x: WORLD.spawn.x, y: WORLD.spawn.y, hp: this.player.maxHp, mp: this.player.maxMp });
      this.pet = null;
      this.cast = null;
      this.meditate = false;
      this.shieldUntil = 0;
      this.cancelMovement();
      this._recentCombat = -100;
      for (const mob of this.mobs) {
        if (!mob.alive) continue;
        this._returnHome(mob);
        mob.x = mob.homeX;
        mob.y = mob.homeY;
        mob.returning = false;
      }
      return this._result(true, 'You return to Willowmere’s bindstone. Experience from your next victories will repay the debt.', 'success');
    }

    _walk(entity, target, speed, dt, stop = 0) {
      const gap = distance(entity, target);
      if (gap <= stop || gap === 0) return false;
      const amount = Math.min(speed * dt, gap - stop);
      entity.x += (target.x - entity.x) / gap * amount;
      entity.y += (target.y - entity.y) / gap * amount;
      return amount > 0;
    }

    update(dt, { dx = 0, dy = 0 } = {}) {
      // Substeps preserve attack/cast ordering when the host updates at a low frame rate.
      let remaining = numeric(dt, 0, 0, 5);
      const input = { dx: numeric(dx, 0, -1, 1), dy: numeric(dy, 0, -1, 1) };
      while (remaining > 0.000001) {
        const step = Math.min(0.05, remaining);
        this._step(step, input);
        remaining -= step;
      }
    }

    _step(dt, input) {
      this.clock += dt;
      this.effects = this.effects.filter(effect => { effect.life -= dt; return effect.life > 0; });
      this.mobs = this.mobs.filter(mob => mob.alive);
      for (const slot of this._slots) if (!slot.mobId && this.clock >= slot.at) this._spawn(slot);
      this._moving = false;
      if (this.dead) {
        for (const mob of this.mobs) if (mob.returning) this._updateReturning(mob, dt);
        return;
      }

      const inputLength = Math.hypot(input.dx, input.dy);
      if (inputLength > 0) {
        this.moveTarget = null;
        this._interruptCast();
        this.meditate = false;
        const speed = 175 * dt;
        this.player.x = clamp(this.player.x + input.dx / inputLength * speed, 24, WORLD.w - 24);
        this.player.y = clamp(this.player.y + input.dy / inputLength * speed, 24, WORLD.h - 24);
        this._moving = true;
      } else if (this.moveTarget) {
        this._interruptCast();
        this.meditate = false;
        this._moving = this._walk(this.player, this.moveTarget, 175, dt);
        if (distance(this.player, this.moveTarget) < 1) this.moveTarget = null;
      }
      // Movement is resolved first, including a movement input on a cast's final frame.
      if (this.cast && this.clock >= this.cast.done) this._finishCast();
      if (this.pet) this._updatePet(dt);
      for (const mob of this.mobs) {
        if (this.dead) break;
        this._updateMob(mob, dt);
      }
      if (this.dead) return;
      const resting = !this.inCombat && this.clock - this._recentCombat > 4;
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + dt * (this.meditate ? 9 : this.cast ? 1.3 : 3));
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * (this.meditate ? 2.8 : resting ? 0.5 : 0));
      if (this.pet && resting) this.pet.hp = Math.min(this.pet.maxHp, this.pet.hp + dt * 1.2);
      for (const camp of CAMPS) {
        if (!this.discovered.includes(camp.id) && distance(camp, this.player) < 235) {
          this.discovered.push(camp.id);
          this.log('Discovered ' + camp.name + ' · level ' + camp.level + ' territory.', 'success');
          this._effect(this.player, camp.name, '#e9d79f');
        }
      }
    }

    _updatePet(dt) {
      const pet = this.pet;
      let target = this.mobs.find(mob => mob.id === pet.targetId && mob.alive && !mob.returning);
      if (target && (distance(target, this.player) > 470 || distance(pet, this.player) > 440)) {
        pet.targetId = null;
        target = null;
        this.log('Your elemental returns; its target is too far away.', 'warning');
      }
      if (target) {
        this._walk(pet, target, pet.speed, dt, 29);
        if (distance(pet, target) <= 35 && this.clock >= pet.attackAt) {
          pet.attackAt = this.clock + (pet.type === 'Air' ? 1.45 : 1.65);
          this._damageMob(target, pet.damage, 'pet');
        }
      } else {
        pet.targetId = null;
        this._walk(pet, { x: this.player.x - 30, y: this.player.y + 25 }, pet.speed + 35, dt, 5);
      }
    }

    _updateReturning(mob, dt) {
      this._walk(mob, { x: mob.homeX, y: mob.homeY }, 160, dt);
      if (Math.hypot(mob.x - mob.homeX, mob.y - mob.homeY) < 1) {
        mob.x = mob.homeX;
        mob.y = mob.homeY;
        mob.returning = false;
        mob.hp = mob.maxHp;
      }
    }

    _updateMob(mob, dt) {
      if (!mob.alive) return;
      if (mob.returning) { this._updateReturning(mob, dt); return; }
      const safe = distance(this.player, WORLD.spawn) < SAFE_RADIUS;
      if (mob.aggro && (Math.hypot(mob.x - mob.homeX, mob.y - mob.homeY) > 310 || safe || (distance(mob, this.player) > 450 && (!this.pet || distance(mob, this.pet) > 230)))) {
        this._returnHome(mob);
        return;
      }
      if (mob.dotUntil > 0 && this.clock >= mob.dotAt && mob.dotAt <= mob.dotUntil) {
        mob.dotAt += 2;
        this._damageMob(mob, mob.dotDamage, 'player');
        if (!mob.alive) return;
      }
      if (!mob.aggro && !safe) {
        if (distance(mob, this.player) < 78) this._engage(mob, 'player', 2, true);
        else if (this.pet && distance(mob, this.pet) < 55) this._engage(mob, 'pet', 2, true);
      }
      if (!mob.aggro) return;
      this._recentCombat = this.clock;
      const petAvailable = this.pet && this.pet.hp > 0 && distance(mob, this.pet) < 300;
      const attacksPet = petAvailable && mob.threatPet > mob.threatPlayer;
      const target = attacksPet ? this.pet : this.player;
      mob.targetId = attacksPet ? this.pet.id : 'player';
      if (mob.rootUntil <= this.clock) this._walk(mob, target, 86 + mob.level * 2, dt, 30);
      if (distance(mob, target) <= 35 && this.clock >= mob.attackAt) {
        mob.attackAt = this.clock + 2.2;
        if (attacksPet) {
          const pet = this.pet;
          pet.hp = Math.max(0, pet.hp - mob.damage);
          this._effect(pet, '−' + mob.damage, '#efb691');
          if (pet.hp <= 0) {
            this.log('Your ' + pet.type.toLowerCase() + ' elemental crumbles. Summon another or retreat.', 'danger');
            this.pet = null;
            this._clearPetThreat();
          }
        } else this._takePlayerDamage(mob.damage);
      }
    }

    serialize() {
      const player = this.player;
      return {
        version: VERSION, dead: this.dead, discovered: [...this.discovered],
        player: {
          x: player.x, y: player.y, hp: this.dead ? 0 : player.hp, maxHp: player.maxHp,
          mp: player.mp, maxMp: player.maxMp, level: player.level, xp: player.xp,
          gold: player.gold, debt: player.debt, kills: player.kills,
          inventory: [...player.inventory], equipment: { ...player.equipment }, spellRanks: [...player.spellRanks]
        }
      };
    }
  }

  // The renderer extends this namespace after loading; shared data stay frozen.
  return { Game, WORLD, CAMPS, SPELLS, ITEMS, VERSION };
});
