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

## Next milestone: encounter and world identity

Prioritize these together, rather than expanding the map first:

1. Replace the remaining geometric goblin tents, totems, crypt masonry, floor textures, rocks, and ground plants with cohesive artwork. Give each camp a recognizable silhouette and lighting.
2. Add real walking, striking, casting, and death animation. Distinguish named monsters beyond scale and labels; create dedicated Frost Lance and Ember Nova icons.
3. Make spell effects distinct: visible rooted vines, burning marks, frost trails, protective shield, pet mend connection, summoning ritual. Telegraphs must remain readable under scenery and effects.
4. Run fresh-character expeditions to tune risk, time between kills, pet durability, healing pressure, mana recovery, tonic costs, spell upgrades, and quest reward timing.
5. Improve contextual feedback for commands that cannot execute and make the pet's target and attack rhythm legible without opening a menu.

## Following milestone: progression worth pursuing

- Add encounter-specific item properties with real tradeoffs, rather than endless stat inflation. Revisit guaranteed first finds and duplicate salvage.
- Develop equipment slots and visual identity only alongside useful item choices and a readable pack; add sorting and inspection as the collection grows.
- Expand elemental roles and spell combinations. Show rank previews and balance each choice against its mana and opportunity cost.
- Add optional camp objectives and village reactions that give repeat trips a purpose without compulsory busywork.
- Expand beyond the current region only after the opening expedition meets the goal above.

## Development loop

Choose the highest-impact unfinished part of the goal, implement it in the playable game, inspect the relevant screens at desktop and phone sizes, run meaningful simulation and browser checks, update this plan, and commit a coherent build. Report what is actually delivered and what remains. This plan records work priorities, not an automatic background schedule.

## Current limitations

The artwork is a first integrated pass. Movement and attacks still use single-frame sprites; some camp props and terrain remain procedural. Audio is synthesized rather than a composed soundscape. Expanded equipment slots, deeper elemental specialization, and new regions are not implemented. Balance needs observed fresh-character play beyond automated regression checks.
