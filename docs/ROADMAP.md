# Everwild roadmap

The active goal, acceptance criteria, and prioritized work are in [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md). This history records development areas, not a delivery schedule.

## 0.2: playable foundation

The initial prototype established Willowmere Frontier, four forest and crypt camps, earth and air companions, eight spells, equipment, named enemies, death debt, and portable browser saves. The engine, renderer, and browser interface live in separate modules. A dependency-free local server, static build, automated engine checks, and Chromium smoke tests provide the development base.

## 0.3: the first expedition

Willowmere now has three villagers with distinct jobs: Rowan offers patrols, Liora teaches elemental magic, and Mara sells health and mana tonics. A four-part quest chain leads from Briarwatch to the crypt, with persistent progress and rewards that can be claimed once. Grik’s charm remains yours when Rowan examines it.

Spell progression adds Frost Lance at level 3 and Ember Nova at level 5, with ten learned spells and eight assignable bar slots. Pet Guard and Taunt add ways to control enemy attention while Follow remains a passive recall. Enemy roles and visible attack warnings create reasons to move, recall a companion, or interrupt with Root. Named camps have distinct equipment rewards.

## 0.3.1: impact and discovery

A separate world render pass adds light pixelation without reducing interface clarity. Optional synthesized impact, spell, and discovery sounds accompany hit reactions and item discovery banners. Presentation preferences persist separately from character saves. Reduced motion removes recoil and particle travel. This is an initial presentation pass; original character sprites, environmental artwork, and a fuller soundscape remain future work.

## 0.4: illustrated Willowmere

Integrated painterly pixel atlases replace the trees, village buildings, characters, companions, NPC portraits, and spell/item icons. Equipment slots, filters, comparison gains/losses, named drop origins, and active properties explain loot. Spell profiles share combat calculations and display current and next-rank benefits. Four relic properties add mana recovery, companion protection, longer control, and stronger shielding. Further environmental art, animation, effects, and observed balancing remain open in the active development plan.

## 0.5: encounters come alive

Illustrated environments and ground textures, four-frame walk/action cycles for ordinary actors, distinct named enemies, death remains, spell auras/connections, tactical coaching, and visible pet attack rhythm. Encounter health and damage now leave room for mechanics to matter. The full fresh-character quest chain passes with both companions across three seeded runs each, with recorded balance evidence. The active development plan tracks the next equipment and completion pass.

## 0.6: clothing and the first-expedition close

A fourth equipment slot adds a guaranteed first linen robe, a defensive cloak, a healing mantle reward and a fire-specialist robe to pursue at Othrek. Comparisons explain tradeoffs and older completed quests migrate the new reward without duplicating currency. Both companion builds finish across three seeds, including deliberate death/revival and save/reload. Villagers react to completed work and the journal marks the ending. FIRST_EXPEDITION_AUDIT.md records the scoped completion evidence and remaining limitations.

## Next: make repeated expeditions richer

- Tune progression, tonic prices, pet durability, spell choices, and recovery time using observed play sessions.
- Add further encounter patterns, readable effects, and clearer feedback when a pet or spell command cannot execute.
- Develop rewards that change a build, with useful tradeoffs between equipment and elemental specializations.
- Continue keyboard, touch, map, and accessibility improvements.
- Test save upgrades against earlier releases as content grows.

## Later: deepen the frontier

- Extend the villagers’ stories with optional side quests, crafting, and additional regions.
- Develop a consistent art and audio direction, with configurable sound and motion.
- Explore dungeons and bosses that reward combinations of movement, control, and companion commands.

## Separate future project: online play

Cooperative or multiplayer play would require an authoritative server, player identity, shared persistence, and a different security model. The current solo browser prototype does not implement those systems. Define the intended multiplayer experience before committing to that architecture.

