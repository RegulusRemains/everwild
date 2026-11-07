# Everwild roadmap

This roadmap records the next development areas; it is not a delivery schedule.

## 0.2 playable foundation

The initial prototype establishes the core loop: explore Willowmere Frontier, summon an earth or air pet, fight across four forest and crypt camps, collect and equip loot, and improve eight spells. Named enemies respawn, death creates experience debt while preserving equipment, and browser saves retain progress between visits.

The code separates the game engine, renderer, and browser interface. A dependency-free local server, static build, automated engine tests, and CI provide a base for continued development.

## Next: improve the expedition

- Tune camp progression, pet durability, healing, spell costs, loot rates, and recovery time from real play sessions.
- Add clearer enemy intent, damage feedback, status effects, and encounter variety.
- Improve navigation, map readability, keyboard access, and smaller-screen layouts.
- Expand tutorial guidance so players can learn pet control, casting, meditation, and equipment naturally.
- Improve save portability and recovery as the save format evolves.

## Later: deepen the world

- Add quests, NPCs, crafted equipment, and distinct regional stories.
- Grow pet specialization and spell progression with meaningful build choices.
- Develop a consistent art and audio direction, with configurable sound and motion.
- Explore additional zones, dungeons, bosses, and a more ambitious camera and world presentation.

## Separate future project: online play

Cooperative or multiplayer play would require an authoritative server, player identity, shared persistence, and a different security model. The current solo browser prototype does not implement those systems. Define the intended multiplayer experience before committing to that architecture.
