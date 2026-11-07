# First-expedition completion audit — v0.6

Scope: the existing Willowmere village-to-crypt expedition, with Othrek’s Vigil as an optional subsequent hunt. This records implementation evidence; it does not claim that automated tests can establish a human player's enjoyment or taste.

| Completion criterion | Delivered behavior | Verification |
| --- | --- | --- |
| Opening guidance | Village objective, contextual tactical advice, field guide, two build guides, pet summon/attack/follow/guard/taunt feedback, mana/recovery hints | Browser controls smoke; fresh-village desktop/mobile review; fresh journey runner |
| Coherent and distinct environments | Illustrated village, goblin tent camp, shaman totems, crypt archway, ritual altar, terrain textures and ground detail; distinct named enemies | All four camp scenes rendered and inspected at desktop/mobile sizes; wider canopy fading keeps actors visible |
| Readable tactical combat | Melee/cast animations, damage responses, final-pass telegraphs, interruptible specials, shield aura, healing link, frost, burning, summoning, fading remains | Combat regression tests; casting/shield/pet scenes; reduced-motion review |
| Understandable spell investment | Current values, role, mana/cast cost, unlocked/locked requirements and next-rank previews; shared combat/profile calculations | Spell profile and actual resolved spell tests; spellbook controls, binding, keyboard interruption, menus |
| Useful loot and equipment choices | Four equipment slots, twelve items, illustrated lore and origins, stat gains/losses, six special relic properties; guaranteed first ordinary clothing find | Garb/drop/property/migration tests; positive/negative comparisons and four clothing cards inspected at desktop/mobile sizes |
| Two practical approaches | Earth with Mosswoven Mantle favors pet sustain; Air retains the linen robe’s mana and power for faster offense. The field guide explains both | Both builds finish the complete quest chain with seeds 42, 73 and 2026; final loadouts and encounter measurements recorded in EXPEDITION_BALANCE.json |
| Complete persistent expedition | Four quests from Rowan through Bramblemaw and Bonewarden, returning for rewards, NPC reactions and a closing journal card; optional next hunt | Six no-injection runs use public travel/spells/commands/gear/supplies, deliberately die to a live guard, revive retaining items/levels/quest state, save/reload, defeat Bonewarden and report back. Browser review loads a save produced by that runner and verifies closing journal/NPC dialogue |
| Usable desktop/phone and preferences | Readable responsive equipment/spell menus and controls; separate art/sound preferences; reduced-motion behavior | Browser smoke checks overflow and settings persistence; visual review covers phone menus, camps, combat, clothing and ending |

## Reproduce

- `npm test`: simulation and regression tests, including all six complete journey variants.
- `npm run test:journey`: print one reproducible fresh-character journey report.
- `npm run build`: verify all production source/assets and build a portable static copy.
- `npm run test:browser`: optional Playwright Chromium controls and persistence checks.
- `npm run test:visual`: optional Playwright Chromium staged art/menu review plus the closing screens loaded from a genuine journey-produced save. Screenshots are produced under `test-results/visual-review/`.

Playwright is a development-only prerequisite for the last two commands; the game itself still has no runtime package dependencies. A locally installed browser can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Practical limits and later work

Ordinary actors use four-frame walking/action cycles with mirrored right/left facing. Named enemies retain their unique sprite and lean during attacks; death is a collapse/fade rather than an authored death atlas. Clothing changes mechanics and inventory art, not the character's outfit sprite. Audio is synthesized. The simulations exercise six supported routes and tactics, not every possible pull or human learning curve. Full directional animation, outfit sprites, a composed soundscape, more encounters and regions are future project scope.
