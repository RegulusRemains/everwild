# Everwild

**Version 0.12.1 — quieter, gentler magic**

Everwild is a solo fantasy RPG about exploring a dangerous frontier. Choose from **14 classes**: Magician, Necromancer, Druid, Enchanter, Shaman, Warrior, Rogue, Monk, Ranger, Paladin, Shadowknight, Cleric, Bard, and Wizard. Explore five habitats and eight camps, collect magical equipment, and build a strategy around control, attrition, companions, weapons, or restoration.

The game runs entirely in your browser with HTML, CSS, and JavaScript. It has no runtime dependencies, account requirement, or server-side game state.

## Slower, tactical encounters

Combat now leaves time for sustained effects and decisions. Across 48 seeded fresh-character expedition routes, ordinary fights have a **20.7-second median** and named fights a **52.5-second median**. These simulation measurements include combat movement and preparation; individual classes and encounters vary. [Measured results](docs/CLASS_BALANCE.json) include the full range.

Ordinary health increased 3.8× and named health 2.8× from v0.11, while enemy hit damage fell 20%. DoTs are more efficient than repeated direct casts, companions have more endurance, and resource recovery supports longer fights. Named healing is less frequent and restores a smaller fraction. Root buys positioning and recovery time; nearby rooted enemies still attack. Interrupt marked attacks or leave their ground warning.

**F** starts weapon attacks for melee and hybrid classes and approaches the target. **G** stops, **C** holds position, and **Q** challenges within 85 paces. Manual movement cancels automatic pursuit. Weapon attacks only hit within actual range; most weapon abilities require 60 paces. Ranger bow attacks reach 270 paces. Weapon strikes build combo stacks used by finishers. The spellbook [B] prepares any eight unlocked abilities and shows costs, cooldowns, range and rank previews.

## Expanded class roster

| Path | Classes | Defining mechanics |
| --- | --- | --- |
| Control and attrition | Enchanter, Shaman, Necromancer | Damage-breaking mez and temporary charm; stacked poison/disease and attack slow; health-to-mana and rot detonation |
| Weapons | Warrior, Rogue, Monk | Defensive Resolve finishers; stealth openers and combo points; Focus, kicks and feigned death |
| Hybrids | Ranger, Paladin, Shadowknight, Bard | Bow kiting and temporary hawk; Conviction healing and consecration; draining weapons and a shade; mutually exclusive songs |
| Spellcraft and restoration | Magician, Wizard, Druid, Cleric | Permanent elementals; fragile ranged burst and Blink; timed stag, regeneration and sanctuary; barriers, holy DoTs and powerful healing |

Every class has ten abilities, rank upgrades, its own character identity, class guide and saved progression. The 11 new classes have individual illustrated characters and selection portraits, with new guardian/shade/hawk/wolf art. Their motion uses rendered lean, bob, wing and strike transforms; the original three classes keep their authored four-frame walk/cast sequences. [Class designs and ability tables](docs/CLASS_DESIGN.md) document the full kits and current presentation limits.

## Characters, classes, and roaming combat

Start at character selection, create a named adventurer, or return to an existing one. **Esc → Characters** switches characters. Each slot keeps its own class, equipment, spell ranks, quests, currency, discoveries, and location. Existing saves migrate into a Magician slot; creating or importing a character adds a slot rather than overwriting another.

| Class | Strength | Tradeoff |
| --- | --- | --- |
| Magician | Permanent Earth/Air elementals, strong direct damage and explosive area damage | Relies on companion positioning and mana management |
| Necromancer | Siphon Life restores health; Dark Pact trades health for mana; Blight Bloom consumes rot for burst damage; ranged Shade | Lower health, fragile undead, and deliberate health/mana risk |
| Druid | Temporary Briar Stag, Wild Stride sprint, Rejuvenation over time, Barkskin thorns, stationary healing sanctuary | Must renew the guardian and position inside the sanctuary; weaker direct damage |

The default desktop camera now shows roughly 520 world units vertically, bringing characters and combat closer. **Esc → Camera zoom** adjusts it. Enemies no longer reset when they cross a camp radius: kite across the frontier with roots, slows, and damage over time. They abandon pursuit after losing both you and your companion by over 1000 paces for 10 seconds without an active damage-over-time effect. Willowmere remains a safe refuge. Pets can remain engaged up to 900 paces from you. Outside combat they lag behind your recent path, react after you move away, catch up when distant, and settle nearby rather than occupying a fixed offset.

Biome borders follow warped, blended regional shapes. Groves, clearings, mixed ground, pools, grass, fallen logs, fungi, reeds, ice outcrops, boulders, vents, and charred stumps break up the old uniform scatter. All three classes now have four-frame walking cycles and gather/channel/release casting sequences. Walking follows distance traveled, with surface-specific footsteps; interrupted casts return to movement. Spell buildup, luminous projectile trails, impact bursts, and class colors accompany **short, soft chimes**. The repeated formant-heavy choir sounded like a horn, so that source and its pitch scoop were removed. Routine spells now decay in under a second; charging is a quiet single note. Only summoning and major area magic retain a low sine-pad tail. Companion strikes and footsteps stay understated. The source bank and filtered delay reflections contain no noise layer. **Esc → Effects / Effects volume** controls the mix; **Test effects** previews it. [Signal measurements](docs/AUDIO_REVIEW.json) verify duration, decay and output levels, not a listening preference.

Dark Pact has a 10-second cooldown and cannot kill its caster. Blight Bloom requires active Grave Rot and consumes 60% of its remaining damage as additional burst. Briar Stag lasts 30 seconds at rank 1; Wild Stride grants 45% movement speed for 8 seconds on a 20-second cooldown. Rejuvenation delivers five healing pulses over 10 seconds. Verdant Sanctuary forms at your feet, roots nearby enemies once, and heals you and your companion only while inside its circle. Cooldowns appear on the hotbar.

## Beyond the old road

The map is now **4200 × 2600**, over four times its original area. The original expedition remains intact; four optional hunts extend it:

| Region | Camp / enemies | Levels | Named relic |
| --- | --- | --- | --- |
| Amberfall Downs | Crownfang Den / fast wolves | 3–4 | Crownfang’s Signet: +12% pet strike damage |
| Lantern Mire | Lanternfen Shrine / durable beetles | 5–6 | Lanternheart: recover 8 health per credited kill |
| Rimeglass Reach | Rimeglass Spire / ranged wisps | 8–9 | Rimeglass Focus: +25% slowing-strike damage |
| Cinderwake Barrens | Cinderwake Forge / heavy drakes | 10–11 | Ashwake Mantle: Area-skill radius 135 instead of 100 |

There are **24 equipment items**: twelve new finds include eight common pieces with stat tradeoffs and four named relics. Each new camp has its own common loot table, named drop, landmark, habitat texture, tree species, and marked special attack. Rowan and Liora offer the new hunts as earlier assignments progress. Open the map [M] and camp notes for routes and drop sources.

Trees now ease into transparency near your party and recover smoothly afterward. Unselected monsters no longer make the forest blink. Canopies retain a visible silhouette rather than disappearing.

## Clothing worth keeping

Your first ordinary victory guarantees a **Worn Linen Robe**. It adds mana and spell power in a new **garb** slot. A **Waxed Travel Cloak** trades mana for health. Liora rewards the Mossfang assignment with a **Mosswoven Mantle**: more health and 25% stronger companion healing, at the cost of the linen robe’s mana and power. Older completed assignments receive the new item once without replaying experience or copper.

Othrek can also drop an **Emberwoven Robe** with a 25% additional chance: 15% more primary-strike, affliction, and damaging-burst power, mana and spell power, but 10 less maximum health. Camp notes show both his guaranteed focus and this optional robe. Comparisons explain negative stats and lost properties before you swap. Equipment properties apply by ability role across classes; inventory names the current class’s matching abilities. Ashwake also widens the Druid’s healing sanctuary.

The first expedition now has a closing journal card and villagers who react to your progress. The [completion audit](docs/FIRST_EXPEDITION_AUDIT.md) links each acceptance criterion to its verification, and the [development plan](docs/DEVELOPMENT_PLAN.md) records future scope.

## Encounters come alive

The world now includes illustrated camp tents, shaman totems, crypt entrances, ritual altars, ground textures, rocks, plants, and eight distinct named enemies. The original ordinary actors have four-frame walk and action cycles. New wolves, beetles, wisps, and drakes use distinct illustrated sprites with movement, hover, strike, hit, and death transforms. Named enemies retain their unique artwork and lean into attacks; defeated creatures collapse and fade independently of live spawn slots. Reduced-motion settings disable these transforms and frame cycles.

Summoning circles, a persistent shield, pet-mend connections, frost crystals, melee arcs, and final-pass attack warnings make combat easier to read. The HUD keeps health, mana, companion status, a compact top-edge target, and icon spell slots visible. Character details, quests, map, combat log, and instructions live in menus. The game fills the window at desktop, 4K, ultrawide, and phone sizes; Esc offers HUD sizing, camera zoom, and fullscreen (also Alt+Enter).

Combat tuning is based on a reproducible fresh-character run: ordinary fights now have a measured median near 21 seconds and named fights near 53 seconds using supported pet tactics, healing, interrupts, gear, and consumables. All 14 classes complete the entire quest chain across three seeded runs, including a deliberate unprotected death, revival with retained progression, and save/reload before the crypt. These are simulation measurements, not a measure of how long a human expedition takes. Run `npm run test:journey` or inspect [the results](docs/EXPEDITION_BALANCE.json).

## Illustrated Willowmere

Trees, village buildings, villagers, enemies, and elemental companions now use integrated painterly pixel artwork. Spells and items share an illustrated icon atlas. The pack shows four equipped slots, filters, item lore, drop origins, and stat gains and losses when replacing gear. The spellbook shows actual current strength and next-rank benefits; previews use the same calculations as combat.

Named relics now change play:

| Relic | Equipped property |
| --- | --- |
| Grik’s Lucky Charm | Recover up to 6 mana on a kill credited to you or your pet. |
| Ring of Bound Earth | Your existing or newly summoned pet takes 20% less damage. |
| Othrek’s Runebone Focus | Arcane Root and Frost Lance last 3 extra seconds. |
| Warden’s Boneguard | Magic Shield absorbs 55% of damage instead of 45%. |

Replacing an item removes its property. Existing saves gain these properties from their equipped items. Further progression, equipment choices, and the current completion audit are tracked in the [development plan](docs/DEVELOPMENT_PLAN.md). Asset specifications are in [artwork notes](assets/ARTWORK.md).

## Impact and discovery

The world now renders on a lightly pixelated canvas layer while names, damage numbers, and interface text stay crisp. Use **Pixel art / Smooth art** in the header to choose your preference. Hits have a brief brightness and recoil response plus small impact particles; reduced-motion settings remove the recoil and particle travel.

New equipment gets a discovery banner, with a longer violet presentation for rare items. Duplicate salvage does not replay a discovery. Layered synthesized instruments accompany spell charging, projectiles, impacts, summoning, healing, roots, and discoveries. Sound starts after a user gesture unless your saved preference is muted; adjust Effects and Effects volume in the game menu. Both presentation preferences stay in this browser, independently of character saves.

## Play locally

### Open the game directly

Download this repository using **Code → Download ZIP**, extract it, and open `index.html` in a modern desktop browser. Keep `styles.css` and the `src` directory beside `index.html`.

For the most predictable save behavior, use the local server below. Browsers can handle storage for directly opened files differently.

### Run the local server

Install [Node.js 22 or newer](https://nodejs.org/), then run:

```sh
git clone https://github.com/RegulusRemains/everwild.git
cd everwild
npm start
```

Open [http://localhost:4173](http://localhost:4173). There are no packages to install. Stop the server with **Ctrl+C**.

To use another local port:

```sh
npm start -- --port 4174
```

## Your first expedition

Start at Willowmere’s bindstone and speak to **Warden Rowan** for **Patrol the Eastern Road**. Summon an **Earth Pet** with **1**, follow the road east, and select the western goblin scout at Briarwatch. Send the elemental in with **F** and support it with Fire Bolt, control, and healing. The patrol counts four Briarwatch victories made after you accept it.

Return to Rowan to claim copper, experience, and an **Apprentice’s Willow Focus**. Equip the focus in your pack. Rowan’s next task asks to examine **Grik’s Lucky Charm**; a charm you already found counts, and you keep it after the conversation. The remaining tasks take you to **Elementalist Liora**, Bramblemaw at Mossfang Camp, and the Bonewarden in Willowmere Crypt. The map also shows Othrek’s Vigil for a later challenge.

**Quartermaster Mara** sells health and mana tonics for travel. They share a 20-second cooldown. The bindstone restores your own health and mana for free when you return safely, so copper can go toward spell ranks or supplies for a longer journey.

Watch enemy attack warnings. Leave marked ground before a slam or hex resolves, recall your pet when it stands in danger, or finish **Arcane Root** to interrupt an enemy’s special attack. Root also stops movement, but a rooted enemy can still strike a nearby opponent. Named foes have distinct equipment drops; repeat copies are salvaged into copper.

## Controls

| Action | Control |
| --- | --- |
| Move | **WASD**, **arrow keys**, or click the ground |
| Select a target | Click an enemy; **Tab** cycles targets; **Space** selects a nearby target |
| Cast a bar slot | **1–8**, or the spell bar |
| Send pet to attack your target | **F** |
| Recall pet to passive Follow | **G** |
| Set pet to Guard | **C** |
| Make the pet taunt its assigned enemy | **Q** |
| Drink a health or mana tonic | **Z** / **X** |
| Toggle meditation | **R** |
| Interact with a nearby villager or bindstone | **E** |
| Open or close the quest journal | **J** |
| Open or close your pack | **I** |
| Open or close the spellbook | **B** |
| Open or close the map | **M** |
| Pause or resume | **Esc** |

The starting bar contains **Earth Pet**, **Fire Bolt**, **Burning Mark**, **Arcane Root**, **Pet Mend**, **Air Pet**, **Magic Shield**, and **Minor Heal**. **Frost Lance** unlocks at level 3 and **Ember Nova** at level 5. Use the spellbook to assign any unlocked spell to one of eight slots. Number keys always cast the spell currently assigned to that slot.

Moving interrupts your cast without spending its mana. Meditation restores resources but ends when you move or take damage. Pet **Guard** can defend you automatically; **Follow** recalls the elemental and keeps it from attacking. **Taunt** has a 12-second cooldown and affects the elemental’s assigned enemy when it is within reach, even if you have selected a different enemy.

## Saving progress

Progress autosaves in this browser's local storage. Saves belong to the browser profile and the address where you play; the direct file, a local server, and a hosted version can have separate saves. This is not cloud synchronization. Clearing site data or using a private window can remove progress. If storage is blocked, use a normal browser window with site storage enabled.

The **Save** menu includes **Export character** and **Import character** for backups and transferring progress. Importing requires a confirmation before replacing the current character. Saves from v0.1 and v0.2 migrate automatically; existing levels, equipment, and spell ranks are retained. A new character also requires confirmation.

Your character’s progression, equipment, position, death state, quests, supplies, and spell-bar choices persist. An active tonic cooldown also survives reload. Encounters restart and you must summon a new elemental after loading. A saved position too close to a newly spawned guard returns you to the bindstone for a safe start, with a journal message explaining why.

## Development

```sh
npm test       # Run the game engine's automated checks
npm run build  # Copy the playable files into dist/
```

No compilation is required. `npm start` serves the source files; changes appear after refreshing the page. The build contains only the game entry point, stylesheet, JavaScript modules, and `.nojekyll`, so `dist` can be copied to a static web host or downloaded as a playable folder.

- `index.html` and `styles.css` define the interface.
- `src/audio.js` implements the layered live/offline Web Audio instruments.
- `src/engine.js` implements the world, combat, progression, and save data.
- `src/render.js` draws the game world.
- `src/app.js` connects browser input, interface, and persistence to the engine.
- `tests/engine.test.cjs` checks the original combat and persistence rules using Node's built-in test runner.
- `tests/expedition.test.cjs` checks quest progression, supplies, new spells, pet commands, and the opening patrol.

GitHub Actions runs the engine tests, builds a downloadable **everwild-playable** artifact, and runs a separate Chromium smoke test on pushes and pull requests. The browser test covers startup, dialogue and quest actions, pack and spell assignments, keyboard controls, save/reload, and the compact layout. It uses explicit scenario setup for later progression checks rather than representing a complete playthrough. Screenshots are written under `test-results/browser-smoke/`. Playwright is installed only in the browser test job; the game remains dependency-free. CI does not publish the game.

To run the optional browser check locally:

```sh
npm install --no-save --package-lock=false --ignore-scripts playwright@1.62.1
npx --no-install playwright install chromium
node tests/browser-smoke.cjs
```

## Optional GitHub Pages hosting

If you want a public browser link, enable hosting once in this repository's **Settings → Pages**:

1. Under **Build and deployment**, choose **Deploy from a branch**.
2. Choose the **main** branch and **/ (root)** directory, then **Save**.
3. Wait for GitHub to finish publishing and use the link shown in Pages settings.

The source files already work at the repository root. Hosting is not enabled by the development scripts or CI workflow.

## Scope

This release is a playable starting point with a top-down presentation and a local roster of solo characters. It is not a complete production RPG: there is no multiplayer service, shared persistent world, or cloud account system. Encounter balance, art, audio, and the breadth of content will continue to evolve. See [the roadmap](docs/ROADMAP.md) for the next development areas.


## Wildspell action experiment

Branch `experiment/action-combat` adds `/action.html`: a standalone Three.js woodland combat blockout. Download and extract this branch, then double-click `action.html`, or run `npm start` and open that path. The checked-in classic-script bundle supports direct file opening; `npm run build` regenerates it from source. WASD moves, mouse aims, left click fires, Q roots, E places a storm, F shatters rooted targets for bonus damage, Space dashes, and R restarts. Clear nine enemies and the guardian. This is a mechanics prototype with geometric placeholder art; it does not yet integrate classic progression, pets, audio, or persistent loot. Three.js r170 is vendored with its MIT license.
