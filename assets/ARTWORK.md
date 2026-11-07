# Everwild artwork

Production assets created with the built-in image generator and encoded to WebP with alpha preserved. These are integrated gameplay assets, not interface mockups. The original output was 1254 × 1254 pixels for each atlas. The renderer keeps procedural fallback artwork if the woodland asset cannot load.

- `woodland-atlas.webp`: four rows of four sprites. Trees; lodge, market, study, bindstone; magician, earth elemental, air elemental, goblin; skeleton, Rowan, Liora, Mara. Source rectangles live in `Renderer._art` and align each sprite to its feet or trunk base.
- `arcana-atlas.webp`: four rows of four icons. Eight opening spells followed by eight equipment items. In the initial 0.4 pass Frost Lance shared the air icon and Ember Nova shared fire. Both now have dedicated illustrations in `extra-arcana.webp`, documented in ANIMATION_AND_ENVIRONMENT.md.

## Woodland prompt

+Use case: stylized-concept
Asset type: production game sprite atlas for Everwild, a browser fantasy RPG. This is real gameplay art, not a mockup.
Create one square 1536x1536 PNG with genuinely transparent background, arranged in an EXACT regular 4-column by 4-row grid of 384x384 cells. No drawn grid lines. Each sprite entirely within its own cell, generous transparent gutters. Front-three-quarter elevated RPG view, camera looking down about 35 degrees, consistent perspective and warm upper-left lighting. Beautiful detailed painterly pixel art, visible carefully clustered pixels, moss green, rich deep teal shadows, antique gold, warm amber lights. Atmospheric old-world fantasy with tactile materials, lush foliage, personality. No vector shapes, flat cartoon clip art, outlines, text, labels, ground tiles, UI, watermark or backdrop. Use tiny soft contact shadows only. All objects centered horizontally in their cell with feet/trunk base at y=85% of cell height. Tree height 80% of cell, buildings 72%, characters 65%. All objects complete and isolated. Do not crop.
Exact order left to right:
Row 1: broad ancient oak with twisted roots and layered mossy canopy; tall richly branched fir; silver birch cluster with golden green leaves; gnarled dark woodland tree with hanging moss.
Row 2: rustic timber woodland lodge, mossy shingle roof, warm amber windows and porch lantern; striped canvas merchant stall with crates bottles and lantern; small open-air mage study with shelves scrolls and candles; weathered rune-carved standing bindstone with a pale cyan crystal.
Row 3: lone blue-cloaked hooded magician with wooden staff and tiny glowing amber orb; sturdy friendly earth elemental made of moss-covered boulders with glowing amber eyes; graceful swirling air elemental with cyan mist and violet core, clearly defined silhouette; wiry sinister goblin scout with patchwork leather and rusty short sword.
Row 4: ancient skeletal guardian with tarnished armor and old sword; human village warden with green cloak gray hair and spear; female elven elemental mentor with silver hair and moss-purple robes; friendly female merchant in rustic brown and copper clothing with satchel.
The 16 sprites must be large, polished and cohesive enough to replace crude procedural sprites in the playable game. Actual transparency between sprites.

## Arcana prompt

+Use case: stylized-concept
Asset type: Everwild RPG inventory and spell icon atlas, production bitmap assets.
Create ONE square image, an EXACT regular four-column four-row grid of SIXTEEN icons with transparent background and clear transparent gutters. Every icon is confined to its own equal square cell, centered, all complete, no overlaps, no text, letters, numbers, UI, labels, border, drawn grid, or watermark. Painterly pixel art with jewel-like richness, tactile materials, antique gold, woodland moss, warm ember and luminous cyan. Crisp carefully clustered pixels, not flat vector graphics. Each object fills about 75% of its cell.
Row 1: mossy boulder hand holding a small amber light (earth summoning); curling orange firebolt (fire spell); twisted thorn with red embers (burning magic); violet runic roots curling around a stone (root spell).
Row 2: leaf with luminous green dew (pet healing); cyan spiral of air with a violet jewel (air summoning); blue translucent arcane shield (protection spell); silver chalice with green light (healing spell).
Row 3: primitive polished-root talisman on a cord; splintered carved bone wand with pale blue light; engraved copper ring with a green leaf gemstone; lucky goblin charm made of antique gold and a tiny emerald.
Row 4: heavy stone ring containing an amber rune; ornate runebone focus wand with violet crystal; carved bone ward amulet on a leather cord; simple willow wand with a warm amber bud.
Each silhouette should remain legible when scaled to 40px. True alpha transparency outside objects; no black backgrounds. Consistent lighting from upper left. These will be used as clickable game inventory and spellbook art.

## Frontier expansion (v0.8)

`frontier-atlas.webp`: 4 columns × 5 rows, normalized 256px cells with alpha. Rows: wolf/beetle/wisp/drake; matching named creatures; den/shrine/spire/forge; oak/cypress/spruce/charred tree; signet/talisman/focus/mantle. Runtime crop bounds are recorded in `src/render.js`; item icons use the final row. Common loot reuses existing slot artwork.

`frontier-floor.webp`: 2×2 ground atlas: amber grass, marsh peat, rime earth, basalt ash. Runtime mirrored tiles remove hard repeat seams and feathered masks soften region boundaries.

Generated with the built-in image generator, then cropped, normalized, and compressed for game use. Prompt set: “A perfectly regular 4×5 transparent sprite atlas in slightly pixelated hand-painted fantasy style; ordinary and named wolf, beetle, wisp and drake; matching camp landmarks, biome trees, and four magical relic icons; isolated whole subjects, consistent elevated 3/4 view, no text.” Terrain prompt: “Four orthographic, independently repeatable painterly pixel ground quadrants: golden meadow, teal marsh peat, blue-grey frosty earth and dark basalt gravel; subtle tiny detail, no large focal objects, no borders or text.”
