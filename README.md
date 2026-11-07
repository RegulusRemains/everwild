# Everwild

**Version 0.2.0 — initial playable prototype**

Everwild is a solo fantasy RPG about exploring a dangerous frontier with a summoned companion. Fight through Willowmere's forest and crypt camps, collect equipment, and grow an earth or air pet into the center of your combat strategy.

The game runs entirely in your browser with HTML, CSS, and JavaScript. It has no runtime dependencies, account requirement, or server-side game state.

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

Start near the Willowmere bindstone, summon an **Earth Pet** with **1**, then approach the nearest goblin camp. Select a foe, send your pet in with **F**, and support it with damage, control, and healing spells. Return to the bindstone to recover and improve your spell ranks as you grow stronger.

Four camps provide a progression through the frontier. Named enemies return after their respawn timer and can award equipment. Equip useful loot in your pack, then prepare for the next camp. Dying sends you back to your bindstone with experience debt while preserving your level and equipment.

## Controls

| Action | Control |
| --- | --- |
| Move | **WASD**, **arrow keys**, or click the ground |
| Select a target | Click an enemy; **Tab** cycles targets; **Space** selects a nearby target |
| Cast spells | **1–8**, or the spell bar |
| Send pet to attack your target | **F** |
| Recall pet to follow | **G** |
| Toggle meditation | **R** |
| Interact with a nearby bindstone | **E** |
| Open or close your pack | **I** |
| Open or close the map | **M** |
| Pause or resume | **Esc** |

The spell bar contains **Earth Pet**, **Fire Bolt**, **Burning Mark**, **Arcane Root**, **Pet Mend**, **Air Pet**, **Magic Shield**, and **Minor Heal**. Moving interrupts a spell being cast. Meditation restores resources but leaves you vulnerable, so recover somewhere safe.

## Saving progress

Progress autosaves in this browser's local storage. Saves belong to the browser profile and the address where you play; the direct file, a local server, and a hosted version can have separate saves. This is not cloud synchronization. Clearing site data or using a private window can remove progress. If storage is blocked, use a normal browser window with site storage enabled.

The **Save** menu includes **Export character** and **Import character** for backups and transferring progress. Importing requires a confirmation before replacing the current character. The original v0.1 save format is migrated automatically. A new character also requires confirmation.

Your character's progression, equipment, position, and death state persist. Encounters restart and you must summon a new elemental after loading. A saved position within a newly spawned guard's aggro radius returns you to the bindstone for a safe start, with a journal message explaining why.

## Development

```sh
npm test       # Run the game engine's automated checks
npm run build  # Copy the playable files into dist/
```

No compilation is required. `npm start` serves the source files; changes appear after refreshing the page. The build contains only the game entry point, stylesheet, JavaScript modules, and `.nojekyll`, so `dist` can be copied to a static web host or downloaded as a playable folder.

- `index.html` and `styles.css` define the interface.
- `src/engine.js` implements the world, combat, progression, and save data.
- `src/render.js` draws the game world.
- `src/app.js` connects browser input, interface, and persistence to the engine.
- `tests/engine.test.cjs` checks gameplay rules using Node's built-in test runner.

GitHub Actions runs the engine tests, builds a downloadable **everwild-playable** artifact, and runs a separate Chromium smoke test on pushes and pull requests. The browser test covers startup, menus, summoning, movement, save/reload, and the compact layout. Playwright is installed only in the browser test job; the game remains dependency-free. CI does not publish the game.

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

This release is a playable starting point with a top-down presentation and one solo character. It is not a complete production RPG: there is no multiplayer service, shared persistent world, or cloud account system. Encounter balance, art, audio, and the breadth of content will continue to evolve. See [the roadmap](docs/ROADMAP.md) for the next development areas.
