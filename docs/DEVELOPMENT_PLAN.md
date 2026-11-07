# Everwild development plan

## Goal: a polished first expedition

Build a cohesive solo pet-caster RPG in which the first journey from Willowmere to the crypt feels worth playing. The player's reference is the early EverQuest feeling: dangerous encounters, deliberate magic, a companion that matters, and ordinary equipment that feels like a find. The visual direction is beautiful painterly artwork with a restrained pixel texture.

Work across art, interface, gameplay, spells, equipment, sound, and onboarding. Complete connected improvements and verify them in the playable game. Do not use a version-number change or a pixel filter as a substitute for substantive progress.

## Definition of success

- A new player understands how to summon, pull an enemy, send and recall a pet, support it with spells, recover, and inspect loot through play and contextual guidance.
- Willowmere, goblin camps, and crypt areas look distinct and share a coherent visual language. Actors remain readable behind scenery.
- Enemy attention, incoming specials, cast interruptions, recovery, and deaths communicate their causes clearly.
- Spells present accurate strength, mana cost, role, rank benefits, and requirements before the player invests.
- Gear shows equipped slots, stat gains and losses, special properties, origin, and readable artwork. At least two practical approaches to combat emerge from item choices.
- The village-to-crypt quest chain works from a fresh save and remains coherent after saving, reloading, dying, and returning for rewards.
- Desktop and phone layouts keep controls reachable and menus readable; sound and motion respect player preferences.

## Completed foundation

- v0.2: engine, camps, named drops, pets, eight spells, equipment, persistence, death and recovery.
- v0.3: village NPCs, supplies, quest chain, ten spells with eight assignable slots, guard/taunt, interruptible enemy specials.
- v0.3.1: pixel world pass, hit responses, optional sound, discovery presentation, presentation preferences.
- v0.4: first illustrated trees, village, actors, NPC portraits, spell and item icons; redesigned inventory with slot filters and equipment comparisons; live spell and rank previews; four named-item properties. Existing saves retain progress and gain the properties of equipped relics.

## v0.5 checkpoint: encounter and world identity

- Illustrated camp tents, shaman totems, crypt archways, ritual altars, ground textures, rocks, ferns, logs, walls, and distinct named enemies are integrated.
- Four-frame ordinary-actor walking, casting, and attacking are integrated. Named enemies keep their unique sprite with attack leaning. Fallen actors collapse and fade; full directional animation and authored death frames remain later refinements.
- Summoning rituals, shield aura, pet-mend connection, frost crystals, burning particles, melee arcs, and final-pass telegraphs communicate combat state. Canopy fading covers the wider illustrated trees.
- Six fresh-character runs cover Earth and Air companions and seeds 42, 73, 2026. They use normal movement, targeting, casting, commands, consumables, gear, quests, and one save/reload; no character or mob state is injected. See EXPEDITION_BALANCE.json and scripts/expedition-run.cjs.
- Contextual tactical guidance and companion target/damage/next-strike information are visible in play. Both fresh and staged scenes are inspected in desktop/mobile Chromium, including reduced motion.
- 52 simulation tests pass. Browser smoke covers actual controls, menus, assignments, equipment, tonics, saves, and phone layouts; visual review covers all four camps and combat effects.

## v0.6 checkpoint: useful clothing and a complete first expedition

- Four garb items add a fourth equipment slot: useful humble linen, a protective travel cloak, Liora’s companion-sustain mantle, and Othrek’s optional fire-specialist robe.
- Clothing uses illustrated inventory art, source information, stat gains/losses, property comparisons and a compact phone equipment layout. Cloth remains useful even beside a rare mantle because mana/power and pet sustain are different choices.
- Old saves retain their gear and quest progress; completed old Mossfang assignments receive the new item once without new experience/copper.
- All six fresh-character journey runs now include a deliberate death to a live guard, normal revival, retention checks, and save/reload before finishing the crypt and reporting back. Earth uses the sustain mantle and Air keeps linen reserves. No progression, positions, resources or combat results are injected into these runs.
- Villager dialogue responds to progress, and the journal closes the first expedition while offering an optional next hunt.
- The first-expedition implementation criteria have been audited in FIRST_EXPEDITION_AUDIT.md. Human judgments of fun, difficulty and artistic taste remain playtest feedback rather than claims made by automated checks.

## Future scope: progression worth pursuing

- Add encounter-specific item properties with real tradeoffs, rather than endless stat inflation. Revisit guaranteed first finds and duplicate salvage.
- Develop equipment slots and visual identity only alongside useful item choices and a readable pack; add sorting and inspection as the collection grows.
- Expand elemental roles and spell combinations. Show rank previews and balance each choice against its mana and opportunity cost.
- Add optional camp objectives and village reactions that give repeat trips a purpose without compulsory busywork.
- Expand beyond the current region only after the opening expedition meets the goal above.

## Development loop

Choose the highest-impact unfinished part of the goal, implement it in the playable game, inspect the relevant screens at desktop and phone sizes, run meaningful simulation and browser checks, update this plan, and commit a coherent build. Report what is actually delivered and what remains. This plan records work priorities, not an automatic background schedule.

## Current limitations

Clothing currently affects mechanics and inventory art, not the character outfit sprite. 
The animation set uses mirrored right/left facing rather than eight authored directions. Named enemies use their unique sprite with attack leaning; death collapse/fade is rendered from the actor rather than a separate death-frame atlas. Audio is synthesized rather than a composed soundscape. The seeded journey verifies reproducible supported routes, not human comprehension, exploration time, or every possible combat choice. Online play and new regions remain outside this first-expedition goal.
