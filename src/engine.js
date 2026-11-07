/* Everwild — Willowmere Frontier. Deterministic, DOM-free game simulation. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Everwild = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '0.8.0';
  const WORLD = Object.freeze({ w: 4200, h: 2600, spawn: Object.freeze({ x: 260, y: 250 }), bindstone: Object.freeze({ x: 202, y: 214 }) });
  const BIOMES = Object.freeze([
    { id:'willowmere', name:'Willowmere Woodland', x:0, y:0, w:1850, h:2600, color:'#46633e', level:1 },
    { id:'amber', name:'Amberfall Downs', x:1850, y:0, w:950, h:1100, color:'#857040', level:3, art:0 },
    { id:'mire', name:'The Lantern Mire', x:1850, y:1100, w:950, h:1500, color:'#355b56', level:5, art:1 },
    { id:'rime', name:'Rimeglass Reach', x:2800, y:0, w:1400, h:1100, color:'#859b9f', level:8, art:2 },
    { id:'cinder', name:'Cinderwake Barrens', x:2800, y:1100, w:1400, h:1500, color:'#59483f', level:10, art:3 }
  ].map(Object.freeze));
  const biomeAt = (x,y) => BIOMES.slice(1).find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h) || BIOMES[0];
  const CAMPS = Object.freeze([
    { id: 'briar', name: 'Briarwatch', x: 710, y: 350, type: 'goblin', n: 4, level: 1, delay: 45, namedName: 'Grik the Hoarder', rareItemId: 'griks-lucky-charm', description: 'A ragged goblin lookout watches the old trade road.', roleHint: 'Pull the western scout alone. Move out of Grik’s marked ground slam.' },
    { id: 'mossfang', name: 'Mossfang Camp', x: 1090, y: 410, type: 'goblin', n: 5, level: 3, delay: 55, namedName: 'Bramblemaw', rareItemId: 'ring-of-bound-earth', description: 'Thorn-twined totems surround the goblin shaman’s refuge.', roleHint: 'Dodge shaman hexes. Root Bramblemaw to interrupt his healing ritual.' },
    { id: 'crypt', name: 'Willowmere Crypt', x: 1330, y: 890, type: 'skeleton', n: 5, level: 5, delay: 65, namedName: 'The Bonewarden', rareItemId: 'warden-boneguard', description: 'The fallen guardians of Willowmere still keep their watch.', roleHint: 'Recall your pet from a guardian’s marked slam, or interrupt it with Root.' },
    { id: 'vigil', name: 'Othrek’s Vigil', x: 1570, y: 1040, type: 'skeleton', n: 4, level: 7, delay: 75, namedName: 'Graveminder Othrek', rareItemId: 'othreks-focus', bonusItemId: 'emberwoven-robe', bonusDropChance: 0.25, description: 'Old magic gathers around the keeper of the deepest graves.', roleHint: 'Keep moving when Othrek marks the ground. Save mana for healing and control.' },

    { id:'amber-den', name:'Crownfang Den', x:2290, y:540, type:'wolf', biome:'amber', n:4, level:3, delay:50, namedName:'Crownfang', rareItemId:'crownfang-ring', loot:['amber-fang','hunter-wrap'], description:'Golden grass hides a pack beneath an antler-crowned den arch.', roleHint:'Wolves close quickly. Root the pack leader or leave the marked hunting pounce.' },
    { id:'lantern-shrine', name:'Lanternfen Shrine', x:2320, y:1790, type:'beetle', biome:'mire', n:4, level:5, delay:60, namedName:'Old Lanternback', rareItemId:'lanternheart', loot:['reedwoven-cloak','carapace-band'], description:'Luminous beetles nest in a drowned shrine among violet fungi.', roleHint:'Beetles are slow but durable. Leave the wide carapace-crush circle.' },
    { id:'rime-spire', name:'Rimeglass Spire', x:3400, y:520, type:'wisp', biome:'rime', n:4, level:8, delay:70, namedName:'The Glass Choir', rareItemId:'rimeglass-focus', loot:['rime-splinter','snowthread-robe'], description:'The frozen choir gathers around a fractured blue runestone.', roleHint:'Wisps are fragile ranged casters. Interrupt their shard volleys or move out of the mark.' },
    { id:'cinder-forge', name:'Cinderwake Forge', x:3460, y:1880, type:'drake', biome:'cinder', n:5, level:10, delay:80, namedName:'Ashjaw', rareItemId:'ashwake-mantle', loot:['basalt-focus','ember-scale'], description:'Wingless drakes have claimed the last burning forge of the frontier.', roleHint:'Drakes hit hard. Step away from the broad breath mark before it erupts.' }

  ].map(Object.freeze));
  const NPCS = Object.freeze([
    { id: 'rowan', name: 'Warden Rowan', role: 'Frontier warden', x: 330, y: 210, description: 'The warden keeps the eastern road open, one patrol at a time.', dialogue: ['The road used to carry lanterns all the way to the crypt. Help me make it safe again.', 'Bring your elemental. Watch the ground when an enemy gathers its strength.'] },
    { id: 'liora', name: 'Elementalist Liora', role: 'Spell mentor', x: 180, y: 320, description: 'A patient magician studying the wild elementals of Willowmere.', dialogue: ['Your companion is more than a weapon. Let it hold an enemy’s attention while you choose your next spell.', 'Frost Lance awakens at level 3; Ember Nova at level 5. Assign them to your spell bar from the spellbook.'] },
    { id: 'mara', name: 'Quartermaster Mara', role: 'Supplies', x: 365, y: 310, description: 'Mara’s traveling shop keeps the frontier’s few adventurers supplied.', dialogue: ['Take a tonic before you need one. Health and mana tonics share a twenty-second recovery time.', 'The bindstone costs nothing. Save your copper for the road, and come home when your pack is full.'] }
  ].map(npc => Object.freeze({ ...npc, dialogue: Object.freeze(npc.dialogue) })));
  const QUESTS = Object.freeze([
    { id: 'scout-road', npcId: 'rowan', title: 'Patrol the Eastern Road', description: 'Thin the Briarwatch lookout so travelers can leave Willowmere safely.', objectiveText: 'Defeat 4 Briarwatch goblins after accepting the patrol.', required: 4, countType: 'kill', campId: 'briar', reward: { xp: 70, gold: 30, itemId: 'apprentice-focus' } },
    { id: 'griks-talisman', npcId: 'rowan', title: 'Grik’s Lucky Talisman', description: 'Rowan wants to examine Grik’s charm. If you already found it, show it to him; you will keep it.', objectiveText: 'Obtain Grik’s Lucky Charm and show it to Rowan.', required: 1, countType: 'item', itemId: 'griks-lucky-charm', prerequisite: 'scout-road', reward: { xp: 110, gold: 45 } },
    { id: 'mossfang', npcId: 'liora', title: 'A Thorn in the Wilds', description: 'Bramblemaw is binding the forest’s strength into his totems. Liora needs his ritual stopped.', objectiveText: 'Defeat Bramblemaw at Mossfang Camp after accepting the task.', required: 1, countType: 'named', campId: 'mossfang', targetName: 'Bramblemaw', prerequisite: 'griks-talisman', reward: { xp: 180, gold: 65, itemId: 'mosswoven-mantle' } },
    { id: 'crypt-proof', npcId: 'rowan', title: 'Proof from the Crypt', description: 'The Bonewarden bars the old crypt road. Break its watch and return with word of your victory.', objectiveText: 'Defeat The Bonewarden at Willowmere Crypt after accepting the task.', required: 1, countType: 'named', campId: 'crypt', targetName: 'The Bonewarden', prerequisite: 'mossfang', reward: { xp: 250, gold: 90 } }
    ,{ id:'amber-hunt', npcId:'rowan', title:'The Crown of Amberfall', description:'A golden pack has claimed the eastern downs. Break its leader’s hold.', objectiveText:'Defeat Crownfang at Crownfang Den.', required:1, countType:'named', campId:'amber-den', targetName:'Crownfang', prerequisite:'scout-road', reward:{xp:150,gold:55} },
    { id:'mire-hunt', npcId:'liora', title:'A Light Beneath the Mire', description:'An ancient beetle guards the drowned shrine. Recover its light.', objectiveText:'Defeat Old Lanternback at Lanternfen Shrine.', required:1, countType:'named', campId:'lantern-shrine', targetName:'Old Lanternback', prerequisite:'griks-talisman', reward:{xp:220,gold:75} },
    { id:'rime-hunt', npcId:'liora', title:'Silence the Glass Choir', description:'A frozen chorus carries beyond the northern pass.', objectiveText:'Defeat The Glass Choir at Rimeglass Spire.', required:1, countType:'named', campId:'rime-spire', targetName:'The Glass Choir', prerequisite:'crypt-proof', reward:{xp:340,gold:110} },
    { id:'cinder-hunt', npcId:'rowan', title:'The Last Burning Forge', description:'Ashjaw keeps the old eastern forge alight. End its watch.', objectiveText:'Defeat Ashjaw at Cinderwake Forge.', required:1, countType:'named', campId:'cinder-forge', targetName:'Ashjaw', prerequisite:'crypt-proof', reward:{xp:420,gold:140} }
  ].map(quest => Object.freeze({ ...quest, reward: Object.freeze(quest.reward) })));
  const SUPPLIES = Object.freeze({
    'health-tonic': Object.freeze({ id: 'health-tonic', name: 'Health Tonic', description: 'Restore up to 60 health. Shares a 20-second recovery time with mana tonics.', cost: 20, restoreHP: 60 }),
    'mana-tonic': Object.freeze({ id: 'mana-tonic', name: 'Mana Tonic', description: 'Restore up to 80 mana. Shares a 20-second recovery time with health tonics.', cost: 22, restoreMP: 80 })
  });
  const SPELLS = Object.freeze([
    { id: 'earth-pet', name: 'Earth Pet', cost: 45, cast: 3.2, key: '1', description: 'Summon a sturdy elemental. Order it to attack with F; recall it with G.' },
    { id: 'fire-bolt', name: 'Fire Bolt', cost: 19, cast: 1.7, key: '2', description: 'Strike your selected enemy with fire. Range: 330 paces.' },
    { id: 'burning-mark', name: 'Burning Mark', cost: 26, cast: 2.3, key: '3', description: 'Mark an enemy with fire that burns every two seconds for 14 seconds.' },
    { id: 'arcane-root', name: 'Arcane Root', cost: 24, cast: 1.2, key: '4', description: 'Interrupt an enemy’s special attack and hold it in place. Duration improves with ranks and relics. Rooted enemies can still make normal attacks nearby.' },
    { id: 'pet-mend', name: 'Pet Mend', cost: 28, cast: 2.5, key: '5', description: 'Restore your elemental’s health. Range: 360 paces.' },
    { id: 'air-pet', name: 'Air Pet', cost: 48, cast: 3, key: '6', description: 'Summon a swift elemental with stronger attacks and less endurance.' },
    { id: 'magic-shield', name: 'Magic Shield', cost: 25, cast: 1.2, key: '7', description: 'Absorb incoming damage. Ranks extend the duration; Warden’s Boneguard strengthens protection.' },
    { id: 'minor-heal', name: 'Minor Heal', cost: 32, cast: 2.5, key: '8', description: 'Restore your health. Being hit does not interrupt a spell; moving does.' },
    { id: 'frost-lance', name: 'Frost Lance', cost: 24, cast: 1.9, key: '', unlockLevel: 3, description: 'Strike an enemy with ice and slow its movement by 45%. Gravebinding extends the chill. Range: 330 paces.' },
    { id: 'ember-nova', name: 'Ember Nova', cost: 38, cast: 2.6, key: '', unlockLevel: 5, description: 'Burst into flame around your selected enemy, damaging foes within 100 paces. Nearby allies may join the fight.' }
  ].map(spell => Object.freeze({ unlockLevel: 1, ...spell })));
  const ITEMS = Object.freeze({
    'goblin-talisman': Object.freeze({ id: 'goblin-talisman', name: 'Goblin Talisman', slot: 'charm', rarity: 'common', description: 'A surprisingly warm knot of polished roots.', stats: Object.freeze({ hp: 12 }) }),
    'cracked-bone-wand': Object.freeze({ id: 'cracked-bone-wand', name: 'Cracked Bone Wand', slot: 'focus', rarity: 'common', description: 'A splintered focus that still remembers its magic.', stats: Object.freeze({ power: 3, mp: 8 }) }),
    'copperleaf-ring': Object.freeze({ id: 'copperleaf-ring', name: 'Copperleaf Ring', slot: 'ring', rarity: 'common', description: 'A copper band etched with tiny leaves.', stats: Object.freeze({ mp: 10 }) }),
    'griks-lucky-charm': Object.freeze({ id: 'griks-lucky-charm', effectName: 'Second Wind', effect: 'Restore 6 mana after each kill credited to you or your elemental.', name: 'Grik’s Lucky Charm', slot: 'charm', rarity: 'rare', description: 'Grik carried this charm through a hundred narrow escapes.', stats: Object.freeze({ hp: 24, power: 2 }) }),
    'ring-of-bound-earth': Object.freeze({ id: 'ring-of-bound-earth', effectName: 'Stonebound', effect: 'Your elemental takes 20% less damage while this ring is equipped.', name: 'Ring of Bound Earth', slot: 'ring', rarity: 'rare', description: 'A quiet pulse of elemental magic lives inside the stone.', stats: Object.freeze({ hp: 10, mp: 18 }) }),
    'othreks-focus': Object.freeze({ id: 'othreks-focus', effectName: 'Gravebinding', effect: 'Arcane Root and Frost Lance hold their effects for 3 additional seconds.', name: 'Othrek’s Runebone Focus', slot: 'focus', rarity: 'rare', description: 'A rune-carved relic recovered from the heart of the crypt.', stats: Object.freeze({ power: 7, mp: 16 }) }),
    'warden-boneguard': Object.freeze({ id: 'warden-boneguard', effectName: 'Warden’s Resolve', effect: 'Magic Shield absorbs 55% of incoming damage instead of 45%.', name: 'Warden’s Boneguard', slot: 'charm', rarity: 'rare', description: 'The Bonewarden’s carved ward carries the resolve of the old crypt guardians.', stats: Object.freeze({ hp: 32, power: 4 }) }),
    'apprentice-focus': Object.freeze({ id: 'apprentice-focus', name: 'Apprentice’s Willow Focus', slot: 'focus', rarity: 'common', description: 'Rowan’s thanks for a safer road: a simple focus carved from Willowmere timber.', stats: Object.freeze({ power: 2, mp: 6 }) }),
    'worn-linen-robe': Object.freeze({ id: 'worn-linen-robe', name: 'Worn Linen Robe', slot: 'garb', rarity: 'common', description: 'Frayed blue linen, mended by someone who refused to waste a single thread. A faint warmth remains in the seams.', stats: Object.freeze({ mp: 16, power: 2 }) }),
    'waxed-travel-cloak': Object.freeze({ id: 'waxed-travel-cloak', name: 'Waxed Travel Cloak', slot: 'garb', rarity: 'common', description: 'Stiff green cloth and a battered leaf clasp. Less room for spellwork, more protection from the wilds.', stats: Object.freeze({ hp: 18, mp: -4 }) }),
    'mosswoven-mantle': Object.freeze({ id: 'mosswoven-mantle', name: 'Mosswoven Mantle', slot: 'garb', rarity: 'rare', description: 'Liora’s living threads stir when your companion is wounded. The cloth smells of rain on warm stone.', effectName: 'Living Thread', effect: 'Pet Mend restores 25% more health. Trades the linen robe’s mana and spell power for endurance.', stats: Object.freeze({ hp: 16 }) }),
    'emberwoven-robe': Object.freeze({ id: 'emberwoven-robe', name: 'Emberwoven Robe', slot: 'garb', rarity: 'rare', campId: 'vigil', description: 'Runic embers breathe along the hem. Its thread is exquisite, and dangerously thin.', effectName: 'Cinderweave', effect: 'Fire Bolt, Burning Mark, and Ember Nova deal 15% more damage. Its fragile cloth reduces maximum health by 10.', stats: Object.freeze({ hp: -10, mp: 24, power: 3 }) })
,
    "amber-fang": Object.freeze({"id": "amber-fang", "name": "Amber Fang", "slot": "charm", "stats": Object.freeze({"power": 3, "hp": -4}), "description": "A honey-colored fang bound in plain twine.", "campId": "amber-den", "frontierArt": 0, "rarity": "common"}),
    "hunter-wrap": Object.freeze({"id": "hunter-wrap", "name": "Hunter’s Wool Wrap", "slot": "garb", "stats": Object.freeze({"hp": 24, "mp": -8}), "description": "Weathered wool that has survived many cold watches.", "campId": "amber-den", "frontierArt": 3, "rarity": "common"}),
    "reedwoven-cloak": Object.freeze({"id": "reedwoven-cloak", "name": "Reedwoven Cloak", "slot": "garb", "stats": Object.freeze({"hp": 12, "mp": 14}), "description": "Dry reeds rustle against soft marsh silk.", "campId": "lantern-shrine", "frontierArt": 3, "rarity": "common"}),
    "carapace-band": Object.freeze({"id": "carapace-band", "name": "Carapace Band", "slot": "ring", "stats": Object.freeze({"hp": 26, "power": -1}), "description": "A curved shell polished smooth by the fen.", "campId": "lantern-shrine", "frontierArt": 1, "rarity": "common"}),
    "rime-splinter": Object.freeze({"id": "rime-splinter", "name": "Rime Splinter", "slot": "focus", "stats": Object.freeze({"mp": 28, "power": 3}), "description": "Frost creeps toward your fingertips.", "campId": "rime-spire", "frontierArt": 2, "rarity": "common"}),
    "snowthread-robe": Object.freeze({"id": "snowthread-robe", "name": "Snowthread Robe", "slot": "garb", "stats": Object.freeze({"mp": 32, "hp": -8}), "description": "Pale cloth light enough to carry on a whisper.", "campId": "rime-spire", "frontierArt": 3, "rarity": "common"}),
    "basalt-focus": Object.freeze({"id": "basalt-focus", "name": "Basalt Focus", "slot": "focus", "stats": Object.freeze({"power": 10, "mp": -12}), "description": "Heavy volcanic glass; powerful, but taxing.", "campId": "cinder-forge", "frontierArt": 2, "rarity": "common"}),
    "ember-scale": Object.freeze({"id": "ember-scale", "name": "Ember Scale", "slot": "charm", "stats": Object.freeze({"hp": 38, "mp": -8}), "description": "A drake’s scale that remains warm in the rain.", "campId": "cinder-forge", "frontierArt": 1, "rarity": "common"}),
    "crownfang-ring": Object.freeze({"id": "crownfang-ring", "name": "Crownfang’s Signet", "slot": "ring", "stats": Object.freeze({"mp": 8}), "description": "An amber fang set in a narrow silver circle.", "campId": "amber-den", "frontierArt": 0, "rarity": "rare", "effectName": "Packbond", "effect": "Your elemental deals 12% more damage. Trades Stonebound’s protection for offense."}),
    "lanternheart": Object.freeze({"id": "lanternheart", "name": "Lanternheart", "slot": "charm", "stats": Object.freeze({"mp": 12, "hp": 10}), "description": "A tiny green light beats beneath the shell.", "campId": "lantern-shrine", "frontierArt": 1, "rarity": "rare", "effectName": "Fen Renewal", "effect": "Restore 8 health after each kill credited to you or your elemental."}),
    "rimeglass-focus": Object.freeze({"id": "rimeglass-focus", "name": "Rimeglass Focus", "slot": "focus", "stats": Object.freeze({"power": 4, "mp": -8}), "description": "A shard humming with a distant choir.", "campId": "rime-spire", "frontierArt": 2, "rarity": "rare", "effectName": "Winter’s Edge", "effect": "Frost Lance deals 25% more damage. Gives up the Runebone Focus’s longer control."}),
    "ashwake-mantle": Object.freeze({"id": "ashwake-mantle", "name": "Ashwake Mantle", "slot": "garb", "stats": Object.freeze({"hp": -12, "mp": 16}), "description": "Black cloth carries the glow of an ancient forge.", "campId": "cinder-forge", "frontierArt": 3, "rarity": "rare", "effectName": "Spreading Cinders", "effect": "Ember Nova reaches 135 paces instead of 100. A wider burst may awaken more enemies."})
  });
  const MAX_LEVEL = 20;
  const CAST_RANGE = 330;
  const SAFE_RADIUS = 150;
  const NPC_RANGE = 90;
  const SUPPLY_COOLDOWN = 20;
  const EQUIPMENT_SLOTS = ['charm', 'focus', 'ring', 'garb'];
  const TARGETED_SPELLS = [1, 2, 3, 8, 9];
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
      this.supplyReadyAt = 0;
      this.logs = [];
      this.effects = [];
      this.visuals = [];
      this.remains = [];
      this._visualId = 0;
      this._uid = 0;
      this._logId = 0;
      this._moving = false;
      this._recentCombat = -100;
      this._slots = [];
      const data = this._readSave(save);
      const hasPlayer = data.player && typeof data.player === 'object' && !Array.isArray(data.player);
      const source = hasPlayer ? data.player : {};
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
        spellRanks: SPELLS.map((_, i) => whole(Array.isArray(source.spellRanks) ? source.spellRanks[i] : undefined, 1, 1, 3)),
        hotbar: [], quests: {},
        supplies: Object.fromEntries(Object.keys(SUPPLIES).map(id => [id,
          whole(source.supplies && typeof source.supplies === 'object' ? source.supplies[id] : undefined,
            hasPlayer ? 1 : id === 'health-tonic' ? 2 : 1, 0, 20)
        ]))
      };
      this.player.hotbar = this._readHotbar(source.hotbar);
      this.player.quests = this._readQuests(source.quests);
      // The mantle became a reward in 0.6. Completed older quests receive only
      // the newly added item, once; copper and experience are never replayed.
      if (this.player.quests.mossfang?.status === 'completed' && !this.player.inventory.includes('mosswoven-mantle')) {
        this.player.inventory.push('mosswoven-mantle');
        this.log('Liora’s Mosswoven Mantle has been added for your completed Mossfang assignment. Inspect it in your pack.', 'rare');
      }
      this.supplyReadyAt = numeric(data.supplyCooldownRemaining, 0, 0, SUPPLY_COOLDOWN);
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
      this.log(this.dead ? 'Your spirit awaits at the bindstone. Return to continue your adventure.' : 'Welcome to Willowmere. Summon an Earth Elemental from your spell bar, then explore east toward Briarwatch.');
      if (unsafeResume) this.log('Enemies reclaimed your saved camp. You resume safely at the bindstone with your progress intact. Press E to restore health and mana.');
      this.log(this.questState('scout-road').status === 'available'
        ? 'Speak with Warden Rowan for your first patrol. The bindstone restores health and mana [E].'
        : 'Open your journal [J] to review your assignments. The bindstone restores health and mana [E].');
    }

    get selected() {
      return this.mobs.find(mob => mob.id === this.selectedId && mob.alive) || null;
    }

    get inCombat() {
      return this.mobs.some(mob => mob.alive && mob.aggro && !mob.returning);
    }

    get activeQuests() {
      return QUESTS.map(quest => ({ ...quest, ...this.questState(quest.id) }))
        .filter(quest => quest.status === 'active' || quest.status === 'ready');
    }

    _readSave(save) {
      if (typeof save === 'string') {
        try { save = JSON.parse(save); } catch (_) { return {}; }
      }
      return save && typeof save === 'object' && !Array.isArray(save) ? save : {};
    }

    _readHotbar(saved) {
      const hotbar = Array(8).fill(null);
      const used = new Set();
      if (Array.isArray(saved)) {
        for (let slot = 0; slot < 8; slot++) {
          const index = saved[slot];
          if (this.isSpellUnlocked(index) && !used.has(index)) { hotbar[slot] = index; used.add(index); }
        }
      }
      for (let slot = 0; slot < 8; slot++) {
        if (hotbar[slot] !== null) continue;
        const index = !used.has(slot) ? slot : SPELLS.findIndex((_, candidate) => this.isSpellUnlocked(candidate) && !used.has(candidate));
        hotbar[slot] = index;
        used.add(index);
      }
      return hotbar;
    }

    _readQuests(saved) {
      const quests = {};
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return quests;
      for (const quest of QUESTS) {
        const entry = saved[quest.id];
        if (!entry || typeof entry !== 'object' || !['active', 'ready', 'completed'].includes(entry.status)) continue;
        if (quest.prerequisite && quests[quest.prerequisite]?.status !== 'completed') continue;
        if (entry.status === 'completed') {
          quests[quest.id] = { status: 'completed', progress: quest.required };
          continue;
        }
        const progress = quest.countType === 'item' ? Number(this.player.inventory.includes(quest.itemId))
          : whole(entry.progress, 0, 0, quest.required);
        quests[quest.id] = { status: progress >= quest.required ? 'ready' : 'active', progress };
      }
      return quests;
    }

    _roll() {
      let result;
      try { result = this.random(); } catch (_) { result = 0.5; }
      return numeric(result, 0.5, 0, 0.999999999);
    }

    hasEquipped(id) {
      return Object.values(this.player.equipment).includes(id);
    }

    spellProfile(index, rank = this.player.spellRanks[index]) {
      if (!Number.isInteger(index) || index < 0 || index >= SPELLS.length) return null;
      rank = whole(rank, 1, 1, 3);
      const level = this.player.level, power = this.player.power, bonus = 1 + (rank - 1) * 0.15;
      const binding = this.hasEquipped('othreks-focus') ? 3 : 0;
      const fireBonus = this.hasEquipped('emberwoven-robe') ? 1.15 : 1;
      const profile = { rank };
      if (index === 0 || index === 5) {
        const earth = index === 0;
        profile.petHp = Math.round((earth ? 95 + level * 19 : 65 + level * 14) * bonus);
        profile.petDamage = Math.round((earth ? 10 + level * 4 : 14 + level * 5) * (1 + (rank - 1) * 0.12));
        profile.summary = `${profile.petHp} pet health · ${Math.round(profile.petDamage*(this.hasEquipped('crownfang-ring')?1.12:1))} damage per strike · ${earth ? '1.65' : '1.45'}s between strikes`;
      } else if ([1, 8, 9].includes(index)) {
        profile.damage = Math.round((index === 1 ? 24 + level * 9 + power : index === 8 ? 18 + level * 8 + power : 20 + level * 6 + power) * bonus * (index === 8 ? (this.hasEquipped('rimeglass-focus') ? 1.25 : 1) : fireBonus));
        profile.slow = 6 + binding;
        profile.radius = this.hasEquipped('ashwake-mantle') ? 135 : 100;
        profile.summary = `${profile.damage} damage${index === 8 ? ' · slows movement for ' + profile.slow + 's' : index === 9 ? ' per enemy within ' + profile.radius + ' paces' : ' to one enemy'}`;
      } else if (index === 2) {
        profile.tickDamage = Math.round((7 + level * 2 + power * 0.4) * bonus * fireBonus);
        profile.summary = `${profile.tickDamage} damage every 2s for 14s · reapplying refreshes the mark`;
      } else if (index === 3) {
        profile.root = 9 + (rank - 1) * 2 + binding;
        profile.summary = `${profile.root}s root · interrupts special attacks · may be resisted`;
      } else if (index === 4 || index === 7) {
        profile.heal = Math.round((index === 4 ? 60 + level * 10 + power : 35 + level * 9 + power) * bonus * (index === 4 && this.hasEquipped('mosswoven-mantle') ? 1.25 : 1));
        profile.summary = `Restores up to ${profile.heal} ${index === 4 ? 'pet' : 'personal'} health`;
      } else if (index === 6) {
        profile.shield = this.hasEquipped('warden-boneguard') ? 55 : 45;
        profile.duration = 24 + (rank - 1) * 6;
        profile.summary = `Absorbs ${profile.shield}% of incoming damage for ${profile.duration}s`;
      }
      return profile;
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

    _visual(kind, entity, options = {}) {
      const life = options.life || 0.7;
      this.visuals.push({ id: ++this._visualId, kind, x: entity.x, y: entity.y, radius: 28, color: '#e4b77f', ...options, life, maxLife: life });
      if (this.visuals.length > 64) this.visuals.splice(0, this.visuals.length - 64);
    }

    _spawn(slot) {
      const camp = CAMPS[slot.campIndex];
      const named = slot.index === camp.n - 1 && (slot.count === 0 || slot.misses >= 2 || this._roll() < 0.35);
      slot.misses = named ? 0 : slot.misses + 1;
      slot.count++;
      const level = camp.level + (named ? 1 : 0);
      const maxHp = Math.round((camp.type === 'goblin' ? 42 + level * 13 : 50 + level * 15) * (named ? 4.125 : 2) * ({wolf:0.9,beetle:1.25,wisp:0.75,drake:1.1}[camp.type] || 1));
      const frontierNames = {wolf:['Amber Wolf','Downs Prowler','Pack Stalker'], beetle:['Fen Beetle','Mire Carapace','Lantern Scarab'], wisp:['Rime Wisp','Shard Singer','Frost Echo'], drake:['Ash Drake','Cinder Stalker','Forge Drake']};
      const names = frontierNames[camp.type] || (camp.type === 'goblin' ? ['Goblin Scout', 'Goblin Raider', 'Goblin Shaman'] : ['Crypt Skeleton', 'Crypt Guardian', 'Crypt Acolyte']);
      const mob = {
        id: 'mob-' + ++this._uid, x: slot.x, y: slot.y, homeX: slot.x, homeY: slot.y,
        campId: camp.id, index: slot.index, type: camp.type,
        name: named ? camp.namedName : names[slot.index % names.length],
        level, hp: maxHp, maxHp, named, aggro: false, alive: true,
        rootUntil: 0, dotUntil: 0, slowUntil: 0, returning: false,
        threatPlayer: 0, threatPet: 0, targetId: null,
        attackAt: 0, dotAt: 0, dotDamage: 0, _slot: slot,
        damage: Math.round((4 + level * 2.2) * (named ? 1.72 : 1.5)),
        speed: ({wolf:122,beetle:63,wisp:80,drake:92}[camp.type] || 86) + level * 2,
        reach: camp.type === 'wisp' ? 185 : 35,
        ability: null, intent: null, abilityReadyAt: 0
      };
      mob.ability = named ? (camp.id === 'mossfang' ? 'heal' : camp.id === 'vigil' ? 'hex' : 'slam')
        : mob.name.includes('Shaman') || mob.name.includes('Acolyte') ? 'hex'
          : mob.name.includes('Guardian') ? 'slam' : null;
      if (frontierNames[camp.type]) mob.ability = camp.type === 'wisp' || camp.type === 'drake' ? 'hex' : (named || slot.index === 1 ? 'slam' : null);
      slot.mobId = mob.id;
      this.mobs.push(mob);
    }

    xpNeeded() { return requirement(this.player.level); }

    isSpellUnlocked(index) {
      return Number.isInteger(index) && index >= 0 && index < SPELLS.length && this.player.level >= SPELLS[index].unlockLevel;
    }

    assignSpell(slot, index) {
      if (!Number.isInteger(slot) || slot < 0 || slot >= 8 || !Number.isInteger(index) || index < 0 || index >= SPELLS.length) return { ok: false };
      if (this.dead) return this._result(false, 'Return to the bindstone before preparing your spell bar.', 'warning');
      if (!this.isSpellUnlocked(index)) return this._result(false, SPELLS[index].name + ' unlocks at level ' + SPELLS[index].unlockLevel + '.', 'warning');
      const previousSlot = this.player.hotbar.indexOf(index);
      if (previousSlot === slot) return { ok: true, message: SPELLS[index].name + ' is already in that slot.' };
      if (previousSlot >= 0) this.player.hotbar[previousSlot] = this.player.hotbar[slot];
      this.player.hotbar[slot] = index;
      return this._result(true, SPELLS[index].name + ' is prepared in spell slot ' + (slot + 1) + '.', 'success');
    }

    nearestNpc() {
      let nearest = null;
      let gap = NPC_RANGE;
      for (const npc of NPCS) {
        const candidate = distance(npc, this.player);
        if (candidate <= gap) { nearest = npc; gap = candidate; }
      }
      return nearest;
    }

    _requireNpc(id) {
      const npc = NPCS.find(candidate => candidate.id === id);
      if (!npc) return this._result(false, 'That villager is not here.', 'warning');
      if (this.dead) return this._result(false, 'Return to the bindstone before visiting ' + npc.name + '.', 'warning');
      if (this.inCombat) return this._result(false, 'Finish combat before speaking with ' + npc.name + '.', 'warning');
      if (distance(this.player, npc) > NPC_RANGE) return this._result(false, 'Move closer to ' + npc.name + ' in Willowmere.', 'warning');
      return null;
    }

    questState(id) {
      const quest = QUESTS.find(candidate => candidate.id === id);
      if (!quest) return { status: 'locked', progress: 0, required: 0 };
      const entry = this.player.quests[id];
      if (entry) return { status: entry.status, progress: entry.progress, required: quest.required };
      const available = !quest.prerequisite || this.player.quests[quest.prerequisite]?.status === 'completed';
      return { status: available ? 'available' : 'locked', progress: 0, required: quest.required };
    }

    npcDialogue(id) {
      const npc = NPCS.find(value => value.id === id);
      if (!npc) return [];
      const complete = this.questState('crypt-proof').status === 'completed';
      if (id === 'rowan' && complete) return [
        'The Bonewarden’s watch is broken. Tonight we will hang lanterns along the eastern road again. You brought our people home a little safer.',
        'Your first expedition is complete. If you choose to face Othrek’s Vigil, prepare with Liora and Mara. That older darkness can wait until you are ready.'
      ];
      if (id === 'rowan' && this.questState('mossfang').status === 'completed') return [
        'Liora says the roots have loosened their grip. One watch remains: the guardians beneath Willowmere’s old crypt.',
        'The Bonewarden strikes hard. Keep your elemental mended, watch the ground, and leave yourself mana for control.'
      ];
      if (id === 'rowan' && this.questState('scout-road').status === 'completed') return [
        'Travelers are using the eastern road again. A humble willow focus is small thanks for that kind of courage.',
        'Grik’s charm may tell us what binds the camps together. Keep it when I have examined it; its luck belongs to you now.'
      ];
      if (id === 'liora' && this.questState('mossfang').status === 'completed') return [
        'The forest is breathing more easily. I wove that mantle for the bond between you and your companion. Wear it when keeping your elemental alive matters most.',
        'A linen robe leaves more strength for your own spells. Neither choice is always right. Study your pack, then decide how you want to fight.'
      ];
      if (id === 'mara' && complete) return [
        'You should have seen the faces when the warden ordered the lanterns lit. There is a place by the fire for you tonight.',
        'And when you are ready to leave again, I will have tonics. Brave does not have to mean unprepared.'
      ];
      return [...npc.dialogue];
    }

    acceptQuest(id) {
      const quest = QUESTS.find(candidate => candidate.id === id);
      if (!quest) return this._result(false, 'That task is not available.', 'warning');
      const blocked = this._requireNpc(quest.npcId);
      if (blocked) return blocked;
      const state = this.questState(id);
      if (state.status !== 'available') return this._result(false, state.status === 'locked' ? 'Finish the previous task before accepting this one.' : 'You have already accepted this task.', 'warning');
      const progress = quest.countType === 'item' && this.player.inventory.includes(quest.itemId) ? 1 : 0;
      this.player.quests[id] = { status: progress >= quest.required ? 'ready' : 'active', progress };
      return this._result(true, 'Accepted: ' + quest.title + '. ' + (progress >= quest.required ? 'You already carry the evidence. Speak with the quest giver to finish.' : quest.objectiveText), 'success');
    }

    turnInQuest(id) {
      const quest = QUESTS.find(candidate => candidate.id === id);
      if (!quest) return this._result(false, 'That task is not available.', 'warning');
      const blocked = this._requireNpc(quest.npcId);
      if (blocked) return blocked;
      const state = this.questState(id);
      if (state.status !== 'ready') return this._result(false, state.status === 'completed' ? 'You have already received this reward.' : 'Complete the task before returning for its reward.', 'warning');
      if (quest.countType === 'item' && !this.player.inventory.includes(quest.itemId)) return this._result(false, 'Bring ' + ITEMS[quest.itemId].name + ' so it can be examined.', 'warning');
      // Claim first, then grant rewards. Repeated clicks and save/reload cannot pay twice.
      this.player.quests[id] = { status: 'completed', progress: quest.required };
      this.player.gold = Math.min(10000000, this.player.gold + quest.reward.gold);
      const paid = this._grantExperience(quest.reward.xp);
      if (quest.reward.itemId) this._loot(quest.reward.itemId);
      return this._result(true, 'Completed: ' + quest.title + '. ' + quest.reward.xp + ' experience' + (paid ? ' (' + paid + ' repays debt)' : '') + ' and ' + quest.reward.gold + ' copper. Your evidence stays with you.', 'success');
    }

    _recordQuestKill(mob) {
      for (const quest of QUESTS) {
        const state = this.player.quests[quest.id];
        if (!state || state.status !== 'active' || quest.countType === 'item') continue;
        if (quest.campId && quest.campId !== mob.campId) continue;
        if (quest.countType === 'named' && (!mob.named || mob.name !== quest.targetName)) continue;
        state.progress = Math.min(quest.required, state.progress + 1);
        if (state.progress >= quest.required) {
          state.status = 'ready';
          const npc = NPCS.find(candidate => candidate.id === quest.npcId);
          this.log('Task ready: ' + quest.title + '. Return to ' + npc.name + '.', 'success');
          this._effect(this.player, 'Task complete', '#e6d59b');
        } else this.log(quest.title + ': ' + state.progress + ' / ' + quest.required + '.', 'info');
      }
    }

    _recordQuestItems() {
      for (const quest of QUESTS) {
        const state = this.player.quests[quest.id];
        if (quest.countType !== 'item' || !state || state.status !== 'active' || !this.player.inventory.includes(quest.itemId)) continue;
        state.progress = quest.required;
        state.status = 'ready';
        this.log('Task ready: ' + quest.title + '. Bring the charm back to Rowan; you will keep it.', 'success');
        this._effect(this.player, 'Evidence found', '#e6d59b');
      }
    }

    buySupply(id) {
      if (typeof id !== 'string' || !Object.hasOwn(SUPPLIES, id)) return this._result(false, 'That supply is not available.', 'warning');
      const blocked = this._requireNpc('mara');
      if (blocked) return blocked;
      const supply = SUPPLIES[id];
      if (this.player.supplies[id] >= 20) return this._result(false, 'You can carry at most 20 of each tonic.', 'warning');
      if (this.player.gold < supply.cost) return this._result(false, supply.name + ' costs ' + supply.cost + ' copper.', 'warning');
      this.player.gold -= supply.cost;
      this.player.supplies[id]++;
      return this._result(true, 'Bought ' + supply.name + ' for ' + supply.cost + ' copper.', 'loot');
    }

    useSupply(id) {
      if (typeof id !== 'string' || !Object.hasOwn(SUPPLIES, id)) return { ok: false };
      if (this.dead) return this._result(false, 'Tonics cannot revive you. Return to the bindstone.', 'warning');
      const supply = SUPPLIES[id];
      if (!this.player.supplies[id]) return this._result(false, 'You have no ' + supply.name.toLowerCase() + 's. Visit Mara in Willowmere.', 'warning');
      if (this.supplyReadyAt > this.clock) return this._result(false, 'Tonics will be ready in ' + Math.ceil(this.supplyReadyAt - this.clock) + ' seconds.', 'warning');
      if ((supply.restoreHP && this.player.hp >= this.player.maxHp) || (supply.restoreMP && this.player.mp >= this.player.maxMp)) {
        return this._result(false, supply.restoreHP ? 'Your health is already full.' : 'Your mana is already full.');
      }
      this.player.supplies[id]--;
      this.supplyReadyAt = this.clock + SUPPLY_COOLDOWN;
      let restored;
      if (supply.restoreHP) restored = this._heal(this.player, supply.restoreHP);
      else {
        restored = Math.round(Math.min(supply.restoreMP, this.player.maxMp - this.player.mp));
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + supply.restoreMP);
        this._effect(this.player, '+' + restored + ' mana', '#a6c6e6');
      }
      this._visual('heal', this.player, { color: supply.restoreHP ? '#a9d5a1' : '#a6c6e6', radius: 30 });
      return this._result(true, supply.name + ' restores ' + restored + (supply.restoreHP ? ' health.' : ' mana.'), 'success');
    }

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
      if (!this.isSpellUnlocked(index)) return this._result(false, SPELLS[index].name + ' unlocks at level ' + SPELLS[index].unlockLevel + '.', 'warning');
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
      const profile = this.spellProfile(pending.i, rank);
      switch (pending.i) {
        case 0: case 5: this._summon(pending.i === 0 ? 'Earth' : 'Air', rank); break;
        case 1:
          this._visual('bolt', target, { fromX: this.player.x, fromY: this.player.y, radius: 14, color: '#f3a05e', life: 0.5 });
          this._damageMob(target, profile.damage, 'player');
          this.log('Fire Bolt strikes ' + target.name + '.', 'combat');
          break;
        case 2:
          target.dotUntil = this.clock + 14;
          target.dotAt = this.clock + 2;
          target.dotDamage = profile.tickDamage;
          this._engage(target, 'player', 8, true);
          this._visual('bolt', target, { fromX: this.player.x, fromY: this.player.y, radius: 24, color: '#d88b7a', life: 0.65 });
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
            target.rootUntil = this.clock + profile.root;
            if (target.intent) {
              this.log('Arcane Root interrupts ' + target.name + '’s ' + target.intent.name + '!', 'success');
              target.intent = null;
              target.abilityReadyAt = this.clock + 8;
              target.attackAt = Math.max(target.attackAt, this.clock + 0.8);
            }
            this._visual('root', target, { radius: 33, color: '#b6acd6', life: 0.9 });
            this._effect(target, 'Rooted', '#b1bde8');
            this.log(target.name + ' is rooted.', 'combat');
          }
          break;
        }
        case 4: {
          const restored = this._heal(this.pet, profile.heal);
          this._visual('heal', this.pet, { fromX: this.player.x, fromY: this.player.y, radius: 35, color: '#aecf9e' });
          this._healingThreat(restored * 0.2);
          this.log('Pet Mend restores ' + restored + ' health to your elemental.', 'success');
          break;
        }
        case 6:
          this.shieldUntil = this.clock + profile.duration;
          this._visual('heal', this.player, { radius: 38, color: '#abd8ed', life: 0.9 });
          this._effect(this.player, 'Shield', '#abd8ed');
          this.log('A magic shield surrounds you.', 'success');
          break;
        case 7: {
          const restored = this._heal(this.player, profile.heal);
          this._visual('heal', this.player, { radius: 32, color: '#aecf9e' });
          this._healingThreat(restored * 0.25);
          this.log('Minor Heal restores ' + restored + ' health.', 'success');
          break;
        }
        case 8:
          target.slowUntil = this.clock + profile.slow;
          this._visual('bolt', target, { fromX: this.player.x, fromY: this.player.y, radius: 17, color: '#a7d9e7', life: 0.55 });
          this._damageMob(target, profile.damage, 'player');
          this.log('Frost Lance chills ' + target.name + ' for ' + profile.slow + ' seconds.', 'combat');
          break;
        case 9: {
          const center = { x: target.x, y: target.y };
          const victims = this.mobs.filter(mob => mob.alive && !mob.returning && distance(mob, center) <= profile.radius);
          this._visual('nova', center, { radius: profile.radius, color: '#edaa70', life: 0.85 });
          const damage = profile.damage;
          for (const victim of victims) this._damageMob(victim, damage, 'player');
          this.log('Ember Nova strikes ' + victims.length + (victims.length === 1 ? ' enemy.' : ' enemies.'), 'combat');
          break;
        }
      }
      if ([1, 2, 8, 9].includes(pending.i)) this._assistPet(target);
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
      const profile = this.spellProfile(earth ? 0 : 5, rank);
      const maxHp = profile.petHp;
      this.pet = {
        id: 'pet-' + ++this._uid, type, x: this.player.x - 32, y: this.player.y + 28,
        hp: maxHp, maxHp, targetId: null, attackAt: this.clock, mode: 'guard', tauntReadyAt: this.clock,
        damage: profile.petDamage,
        speed: earth ? 152 : 185
      };
      this._visual('summon', this.pet, { radius: 42, color: earth ? '#c0c599' : '#a6d3da', life: 1.2 });
      this._effect(this.pet, type + ' elemental', '#bad6ae');
      this.log('Your ' + type.toLowerCase() + ' elemental is guarding you. Send it to attack [F], or use Follow [G] to make it passive.', 'success');
    }

    _assistPet(target) {
      if (!target || !target.alive || target.returning || !this.pet || this.pet.mode !== 'guard' || this.pet.targetId) return;
      if (distance(target, this.player) > 360) return;
      this.pet.targetId = target.id;
    }

    commandPet(command) {
      if (this.dead) return { ok: false };
      if (!this.pet) return this._result(false, 'Summon an Earth or Air Elemental from your spell bar first.', 'warning');
      if (command === 'follow') {
        this.pet.targetId = null;
        this.pet.mode = 'follow';
        return this._result(true, 'Your elemental stops attacking and follows passively. Enemies may still pursue it.');
      }
      if (command === 'guard') {
        this.pet.mode = 'guard';
        return this._result(true, 'Your elemental will assist your attack spells and defend you when struck.');
      }
      if (command === 'taunt') {
        const target = this.mobs.find(mob => mob.id === this.pet.targetId && mob.alive && !mob.returning);
        if (!target) return this._result(false, 'Order your elemental to attack a target before taunting.', 'warning');
        if (this.pet.tauntReadyAt > this.clock) return this._result(false, 'Your elemental can taunt again in ' + Math.ceil(this.pet.tauntReadyAt - this.clock) + ' seconds.', 'warning');
        if (distance(this.pet, target) > 85) return this._result(false, 'Your elemental must be within 85 paces of its target to taunt.', 'warning');
        this._engage(target, 'pet', 1, true);
        target.threatPet = Math.max(target.threatPet, target.threatPlayer + 40 + this.player.level * 6);
        target.targetId = this.pet.id;
        this.pet.tauntReadyAt = this.clock + 12;
        this._visual('taunt', this.pet, { radius: 60, color: '#dcc18b', life: 0.8 });
        this._effect(target, 'Taunted', '#dcc18b');
        return this._result(true, 'Your elemental draws ' + target.name + '’s attention.', 'combat');
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
      if (!this.isSpellUnlocked(index)) return this._result(false, SPELLS[index].name + ' unlocks at level ' + SPELLS[index].unlockLevel + '.', 'warning');
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

    restoreAtBindstone() {
      if (this.dead) return this._result(false, 'Return to the bindstone to revive.', 'warning');
      if (distance(this.player, WORLD.spawn) > 110) return this._result(false, 'Move closer to the Willowmere bindstone to restore your party.', 'warning');
      if (this.inCombat) return this._result(false, 'The bindstone cannot restore you while enemies pursue you.', 'warning');
      this.player.hp = this.player.maxHp;
      this.player.mp = this.player.maxMp;
      if (this.pet) this.pet.hp = this.pet.maxHp;
      this._effect(this.player, 'Restored', '#cce0b6');
      this._visual('heal', this.player, { color: '#cce0b6', radius: 48, life: 0.9 });
      return this._result(true, 'The Willowmere bindstone restores you and your elemental. Spell upgrades become available at levels 2 and 5.', 'success');
    }

    interact() {
      if (this.dead) return this._result(false, 'Return to the bindstone to revive.', 'warning');
      if (distance(this.player, WORLD.bindstone) <= 80 && distance(this.player, WORLD.spawn) <= 110) return this.restoreAtBindstone();
      const npc = this.nearestNpc();
      if (npc) {
        const blocked = this._requireNpc(npc.id);
        if (blocked) return blocked;
        const result = this._result(true, npc.name + ': ' + npc.dialogue[0]);
        return { ...result, npcId: npc.id };
      }
      if (distance(this.player, WORLD.spawn) <= 110) return this.restoreAtBindstone();
      const camp = CAMPS.find(candidate => distance(candidate, this.player) < 210);
      if (camp) return this._result(true, camp.name + ': level ' + camp.level + ' territory. ' + camp.roleHint);
      return this._result(true, 'Warden Rowan offers patrols in Willowmere. Explore east for Briarwatch’s goblins, then southeast toward the crypt.');
    }

    _engage(mob, source, amount = 1, assist = false) {
      if (!mob.alive || mob.returning) return;
      const fresh = !mob.aggro;
      mob.aggro = true;
      mob[source === 'pet' ? 'threatPet' : 'threatPlayer'] += Math.max(1, amount);
      if (fresh) {
        mob.attackAt = this.clock + 0.8;
        mob.abilityReadyAt = this.clock + (mob.named ? 4.5 : 3.5);
      }
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
      this._impact(mob, amount, source);
      this._effect(mob, '−' + amount, source === 'pet' ? '#d2dbb0' : '#f3be8b');
      if (mob.hp <= 0) this._kill(mob);
    }

    _impact(entity, amount, source) {
      entity.hitUntil = this.clock + 0.22;
      this._visual('impact', entity, {
        entityId: entity.id || 'player', source, amount,
        color: source === 'enemy' ? '#eca58b' : '#f4d8a3',
        radius: Math.min(30, 10 + amount * 0.2), life: 0.3
      });
    }

    _strike(attacker, target) {
      attacker.strikeAt = this.clock;
      attacker.strikeUntil = this.clock + 0.55;
      if (Math.abs(target.x - attacker.x) > 1) attacker.facing = target.x > attacker.x ? 1 : -1;
      this._visual(attacker.type==='wisp'?'bolt':'melee', target, { fromX: attacker.x, fromY: attacker.y, sourceId: attacker.id,
        color: attacker.type === 'wisp' ? '#afdce9' : attacker.type === 'Air' ? '#b0e4ed' : attacker.type === 'Earth' ? '#d2c594' : '#efbd92', life: 0.35 });
    }

    _fall(entity, kind) {
      this.remains.push({ ...entity, kind, life: 1.4, maxLife: 1.4 });
      if (this.remains.length > 24) this.remains.shift();
    }

    _kill(mob) {
      if (!mob.alive) return;
      mob.alive = false;
      this._fall(mob, 'mob');
      mob.aggro = false;
      mob.dotUntil = 0;
      mob.rootUntil = 0;
      mob.slowUntil = 0;
      mob.intent = null;
      mob._slot.at = this.clock + CAMPS[mob._slot.campIndex].delay;
      mob._slot.mobId = null;
      if (this.selectedId === mob.id) this.selectedId = null;
      if (this.pet && this.pet.targetId === mob.id) this.pet.targetId = null;
      this.player.kills++;
      if (this.hasEquipped('griks-lucky-charm')) {
        const restored = Math.min(6, this.player.maxMp - this.player.mp);
        this.player.mp += restored;
        if (restored > 0) this._effect(this.player, '+' + Math.round(restored) + ' mana · Second Wind', '#a6c6e6');
      }
      if (this.hasEquipped('lanternheart')) this._heal(this.player, 8);
      const modifier = clamp(1 + (mob.level - this.player.level) * 0.16, 0.25, 1.8);
      const xp = Math.max(2, Math.round((15 + mob.level * 7) * modifier * (mob.named ? 1.5 : 1)));
      const copper = Math.floor(3 + this._roll() * 5 + mob.level * 1.5 + (mob.named ? 12 : 0));
      this.player.gold = Math.min(10000000, this.player.gold + copper);
      const paid = this._grantExperience(xp);
      this.log(mob.name + ' falls: ' + xp + ' experience' + (paid ? ' (' + paid + ' repays debt)' : '') + ', ' + copper + ' copper.', 'combat');
      this._recordQuestKill(mob);
      // First named defeat per item guarantees a usable rare; later copies turn into copper.
      if (mob.named) {
        this._loot(CAMPS[mob._slot.campIndex].rareItemId);
        const camp = CAMPS[mob._slot.campIndex];
        if (camp.bonusItemId && this._roll() < camp.bonusDropChance) this._loot(camp.bonusItemId);
      } else if (!this.player.inventory.includes('worn-linen-robe')) {
        this._loot('worn-linen-robe');
      } else if (this._roll() < 0.3) {
        const table = CAMPS[mob._slot.campIndex].loot || (mob.type === 'skeleton' ? ['cracked-bone-wand', 'waxed-travel-cloak', 'copperleaf-ring']
          : ['goblin-talisman', 'copperleaf-ring', 'worn-linen-robe', 'waxed-travel-cloak']);
        this._loot(table[Math.floor(this._roll() * table.length)]);
      }
    }

    _loot(id) {
      const item = ITEMS[id];
      if (this.player.inventory.includes(id)) {
        const value = item.rarity === 'rare' ? 20 : 6;
        this.player.gold = Math.min(10000000, this.player.gold + value);
        this.log('Duplicate ' + item.name + ' salvaged for ' + value + ' copper.', 'loot');
        this._recordQuestItems();
        return;
      }
      this.player.inventory.push(id);
      this._visual('discovery', this.player, { itemId: id, rare: item.rarity === 'rare', color: item.rarity === 'rare' ? '#cbb6f1' : '#dfc28a', radius: 42, life: 1.8 });
      this.log('Found ' + item.name + '. Equip it from your pack.', item.rarity === 'rare' ? 'rare' : 'loot');
      this._effect(this.player, item.name, item.rarity === 'rare' ? '#cbb6f1' : '#dfc28a');
      this._recordQuestItems();
    }

    _grantExperience(amount) {
      const paid = Math.min(this.player.debt, amount);
      this.player.debt -= paid;
      this.player.xp += amount - paid;
      this._levelUp();
      return paid;
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
        for (const spell of SPELLS) if (spell.unlockLevel === this.player.level && spell.unlockLevel > 1) {
          this.log('New spell: ' + spell.name + '. Prepare it in a spell-bar slot from your spellbook.', 'success');
        }
      }
      if (this.player.level === MAX_LEVEL) this.player.xp = Math.min(this.player.xp, this.xpNeeded());
    }

    _returnHome(mob) {
      mob.returning = true;
      mob.aggro = false;
      mob.targetId = null;
      mob.rootUntil = 0;
      mob.dotUntil = 0;
      mob.slowUntil = 0;
      mob.intent = null;
      mob.abilityReadyAt = this.clock + 4.5;
      mob.dotDamage = 0;
      mob.threatPlayer = 0;
      mob.threatPet = 0;
      mob.hp = mob.maxHp;
      if (this.pet && this.pet.targetId === mob.id) this.pet.targetId = null;
    }

    _takePlayerDamage(amount, attacker = null) {
      if (this.dead) return;
      this._recentCombat = this.clock;
      if (this.meditate) { this.meditate = false; this.log('Taking damage ends your meditation.', 'warning'); }
      const damage = Math.max(1, Math.round(amount * (this.shieldUntil > this.clock ? (this.hasEquipped('warden-boneguard') ? 0.45 : 0.55) : 1)));
      this.player.hp = Math.max(0, this.player.hp - damage);
      this._impact(this.player, damage, 'enemy');
      this._effect(this.player, '−' + damage, '#ef9c90');
      if (this.player.hp <= 0) this._die();
      else if (attacker && this.pet && this.pet.mode === 'guard' && !this.pet.targetId && distance(attacker, this.player) <= 230) this._assistPet(attacker);
    }

    _takePetDamage(amount) {
      const pet = this.pet;
      if (!pet || this.dead) return;
      amount = Math.max(1, Math.round(amount * (this.hasEquipped('ring-of-bound-earth') ? 0.8 : 1)));
      pet.hp = Math.max(0, pet.hp - amount);
      this._impact(pet, amount, 'enemy');
      this._effect(pet, '−' + amount, '#efb691');
      if (pet.hp <= 0) {
        this._fall(pet, 'pet');
        this.log('Your ' + pet.type.toLowerCase() + ' elemental crumbles. Summon another or retreat.', 'danger');
        this.pet = null;
        this._clearPetThreat();
      }
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
      this.visuals = [];
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
      this.remains = [];
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
      if (Math.abs(target.x - entity.x) > 1) entity.facing = target.x > entity.x ? 1 : -1;
      entity.walkUntil = this.clock + 0.1;
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
      this.remains = this.remains.filter(entity => { entity.life -= dt; return entity.life > 0; });
      this.effects = this.effects.filter(effect => { effect.life -= dt; return effect.life > 0; });
      this.visuals = this.visuals.filter(visual => { visual.life -= dt; return visual.life > 0; });
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
        if (input.dx) this.player.facing = input.dx > 0 ? 1 : -1;
        this.player.walkUntil = this.clock + 0.1;
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
          this._strike(pet, target);
          this._damageMob(target, Math.round(pet.damage * (this.hasEquipped('crownfang-ring') ? 1.12 : 1)), 'pet');
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

    _beginIntent(mob, target) {
      if (!mob.ability || mob.rootUntil > this.clock || this.clock < mob.abilityReadyAt) return false;
      const kind = mob.ability;
      if (kind === 'heal' && mob.hp > mob.maxHp * 0.72) return false;
      if (kind !== 'heal' && distance(mob, target) > (kind === 'hex' ? 240 : 100)) return false;
      const point = kind === 'heal' ? mob : target;
      const frontierIntent = {wolf:'Hunting Pounce',beetle:'Carapace Crush',wisp:'Shard Volley',drake:'Cinder Breath'}[mob.type];
      const name = frontierIntent || (kind === 'heal' ? 'Thorn Renewal' : kind === 'hex' ? (mob.named ? 'Grave Hex' : 'Withering Hex')
        : mob.name === 'The Bonewarden' ? 'Bonebreaker Slam' : mob.named ? 'Groundbreaker' : 'Grave Slam');
      mob.intent = {
        name, kind, started: this.clock, done: this.clock + (kind === 'hex' ? 1.8 : 2),
        x: point.x, y: point.y, radius: mob.type === 'drake' ? 95 : mob.type === 'beetle' ? 85 : kind === 'hex' ? 50 : 65
      };
      this.log(mob.name + ' prepares ' + name + '. ' + (kind === 'heal' ? 'Root can interrupt the ritual.' : 'Leave the marked ground or interrupt with Root.'), 'warning');
      return true;
    }

    _resolveIntent(mob) {
      const intent = mob.intent;
      if (!intent || !mob.alive || mob.returning || this.dead) return;
      mob.intent = null;
      mob.abilityReadyAt = this.clock + (intent.kind === 'heal' ? 12 : intent.kind === 'slam' ? 10 : 8);
      mob.attackAt = Math.max(mob.attackAt, this.clock + 0.7);
      if (intent.kind === 'heal') {
        const amount = this._heal(mob, Math.round(mob.maxHp * 0.22));
        this._visual('heal', mob, { color: '#b9c985', radius: intent.radius, life: 0.8 });
        this.log(mob.name + ' restores ' + amount + ' health with ' + intent.name + '.', 'warning');
        return;
      }
      this._visual('nova', intent, { radius: intent.radius, color: intent.kind === 'hex' ? '#bca1db' : '#d5b18a', life: 0.65 });
      const damage = Math.round(mob.damage * (intent.kind === 'hex' ? 1.45 : 1.65) + 4);
      let hits = 0;
      if (this.pet && distance(this.pet, intent) <= intent.radius && distance(this.pet, WORLD.spawn) >= SAFE_RADIUS) {
        this._takePetDamage(damage);
        hits++;
      }
      if (!this.dead && distance(this.player, intent) <= intent.radius && distance(this.player, WORLD.spawn) >= SAFE_RADIUS) {
        this._takePlayerDamage(damage, mob);
        hits++;
      }
      this.log(mob.name + '’s ' + intent.name + (hits ? ' strikes the marked ground.' : ' misses.'), hits ? 'combat' : 'success');
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
      if (mob.intent) {
        if (mob.rootUntil > this.clock) {
          mob.intent = null;
          mob.abilityReadyAt = this.clock + 8;
        } else if (this.clock >= mob.intent.done) this._resolveIntent(mob);
        return;
      }
      if (this._beginIntent(mob, target)) return;
      if (mob.rootUntil <= this.clock) this._walk(mob, target, mob.speed * (mob.slowUntil > this.clock ? 0.55 : 1), dt, Math.max(30,mob.reach-5));
      if (distance(mob, target) <= mob.reach && this.clock >= mob.attackAt) {
        mob.attackAt = this.clock + 2.2;
        this._strike(mob, target);
        if (attacksPet) this._takePetDamage(mob.damage);
        else this._takePlayerDamage(mob.damage, mob);
      }
    }

    serialize() {
      const player = this.player;
      return {
        version: VERSION, dead: this.dead, discovered: [...this.discovered],
        supplyCooldownRemaining: Math.max(0, this.supplyReadyAt - this.clock),
        player: {
          x: player.x, y: player.y, hp: this.dead ? 0 : player.hp, maxHp: player.maxHp,
          mp: player.mp, maxMp: player.maxMp, level: player.level, xp: player.xp,
          gold: player.gold, debt: player.debt, kills: player.kills,
          inventory: [...player.inventory], equipment: { ...player.equipment }, spellRanks: [...player.spellRanks],
          hotbar: [...player.hotbar], supplies: { ...player.supplies },
          quests: Object.fromEntries(Object.entries(player.quests).map(([id, state]) => [id, { status: state.status, progress: state.progress }]))
        }
      };
    }
  }

  // The renderer extends this namespace after loading; shared data stay frozen.
  return { Game, WORLD, BIOMES, biomeAt, CAMPS, SPELLS, ITEMS, NPCS, QUESTS, SUPPLIES, VERSION };
});

