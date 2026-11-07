# Encounter artwork and animation

Created using the built-in image generator, encoded to WebP with original alpha. Sprite animation rows share their bounding rectangles across four frames, so body scale and feet registration remain stable. The model-generated RGB background under alpha zero is ignored by the renderer; it is not drawn into the world.

- `environment-atlas.webp`: 4×4; camp props, ground decoration, and four distinct named enemies.
- `walk-atlas.webp`: 4×6; magician, earth pet, air pet, goblin, skeletal guardian, skeletal caster. Four frames per row.
- `action-atlas.webp`: 4×6; same row order, four cast/strike frames per actor.
- `extra-arcana.webp`: 2×2; Frost Lance, Ember Nova, health tonic, mana tonic.

Ordinary actors use animation sheets while walking, casting, or striking. Named enemies keep their distinct full-color sprite and use a bounded lean during attacks. Fallen actors collapse and fade as separate transient remains. Reduced motion suppresses frame cycling, leaning, recoil, and death transforms. Current facing is right/left mirrored rather than a full eight-direction animation set.
+
## Environment atlas

Use case: stylized-concept
Asset type: production woodland RPG environment sprite atlas for Everwild.
Reference image is STYLE AND MATERIAL reference only. Make NEW assets matching its detailed painterly pixel fantasy, lush moss, aged timber, antique gold, warm lanterns, teal shadows. Do not redraw the reference.
One square transparent PNG, EXACT 4 columns by 4 rows of equal square cells, sixteen fully isolated game sprites, transparent gutters. No labels, grid, text, frames, UI, landscape background, or watermark. Elevated three-quarter RPG camera looking down35degrees. Upper-left lighting, visible tiny clustered pixels. Complete each object within cell; objects occupy75percent of their cell. Feet or base near85percent cellheight. Exact order left to right:
Row1: ragged goblin hide tent patched with moss and leather, amber lantern; sinister goblin shaman totem with thorn vines and small emerald stones; ancient ruined crypt archway with carved skull relief and pale cyan lanterns; dark ritual altar with stacked bones and violet candles.
Row2: mossy limestone boulder cluster; fern patch with tiny white flowers; reddish mushrooms on a decaying log; low weathered stone wall with creeping ivy.
Row3: battered goblin wooden supply crate with rope and faded cloth; small campfire with glowing coals in stone circle; willow stump with blue fireflies; forest stone steps with moss and fallen leaves.
Row4: hooded goblin king with a ragged gold crown and rusty mace; tall thorny goblin shaman carrying a green ritual staff; armored skeletal warden with a heavy shield and cleaver; ancient skeleton sorcerer in torn purple robes with violet flame staff.
The last row is character sprites, not statues. Make them intimidating and readable at55pixels tall, coherent with goblin/skeleton reference. Truly transparent between objects.

## Walk animation atlas

Use case: stylized-concept
Asset type: actual animation sprite sheet for Everwild RPG.
Reference image establishes exact character identities and painterly pixel materials. Create new animation frames matching its blue-robed amber-staff magician, moss boulder earth elemental, cyan-violet air elemental, leather goblin and armored skeleton.
Transparent portrait PNG, EXACT regular FOUR COLUMNS by SIX ROWS,24cells. Each row is ONE character walking in place with four sequential WALK CYCLE frames left-contact, passing, right-contact, passing. Same character, identical scale, facing three-quarter right, same camera35degrees down. Full feet and staff within cell. Keep center/feet registration consistent across all four frames. Distinct leg positions and cloth/arm movement, not four identical images. Cell gutters fully transparent. No labels, text, backgrounds, grid, UI, scenery or watermark.
Row1: blue-cloaked hooded magician with amber staff.
Row2: friendly moss-boulder earth elemental with amber eyes.
Row3: swirling cyan air elemental with violet core, four distinct continuous swirl shapes.
Row4: wiry goblin scout carrying rusty shortsword.
Row5: skeletal guardian with old sword and tarnished armor.
Row6: intimidating skeletal sorcerer in ragged purple robe with violet flame staff.
Pixel-painted fantasy, clustered visible pixels, tasteful rich material detail, moss green, copper-gold and deep teal shadows. The four frames must preserve consistent silhouette heights and body proportions, no ground or cast shadow. Each sprite occupies65percent cellheight centered on85percent baseline. Actual reusable game frames.

## Action animation atlas

Use case: stylized-concept
Asset type: production character ACTION animation sprite sheet for Everwild.
Use reference image only for character identity and matching painterly pixel style. One transparent portrait PNG, EXACT four equal COLUMNS by six equal ROWS =24cells. Each row shows four sequential frames of ONE ACTION by the SAME character, identical scale, full body, same three-quarter right facing camera35degrees elevated. Clear pose changes, correct consistent anatomy and costume. Same feet baseline and center registration across four columns. True transparent gutters, no text, labels, grid, background, UI, watermark or floor.
Row1 blue-hooded magician casting with amber staff: lift staff, gather golden magic, thrust glowing staff forward to release, return to ready.
Row2 friendly moss boulder earth elemental punching: pull arm back, lunge punch forward, follow through with rock fist extended, recover.
Row3 cyan swirling air elemental with violet core attacking: coil inward, stretch into crescent wind blade, slash forward, reform vortex.
Row4 wiry goblin scout with rusty sword: raise blade, lunge slash, followthrough, recover.
Row5 ancient armored skeleton with tarnished sword: raise sword, swing slash, followthrough, recover.
Row6 skeletal sorcerer in ragged purple robes with violet staff: raise staff, gather violet flame, release bolt forward, recover.
Use visible well-crafted clusters of tiny pixels and rich tactile material detail, consistent warm upperleft lighting, copper-gold accents and deep teal shadows. Every character complete within its cell. Occupy65percent cellheight, centered on85percent baseline. No weapons or magic spilling into neighboring cells.

## Frost, nova, and tonic icons

Use case: stylized-concept
Asset type: four small gameplay UI icons for Everwild.
Match the painterly pixel fantasy material and lighting of the reference icon sheet. Create one square transparent PNG, EXACT2columns x2rows four equal cells, fully isolated icon objects with generous transparent gutters. No text, labels, borders, UI, watermark or backdrop.
Top left: long icy spear of pale cyan crystalline frost with snowflakes and a flowing icy trail, unmistakable frost-lance spell.
Top right: circular exploding orange-gold fire nova, a glowing ring with embers radiating outward and dark center, unmistakable area fire spell.
Bottom left: squat red ruby-glass health tonic bottle with warm red glowing liquid, cork stopper and small ivy decoration.
Bottom right: tall blue sapphire-glass mana tonic bottle with luminous blue liquid and tiny gold crescent, cork stopper.
Consistent upperleft lighting, crisp clusters of tiny pixels, tactile material detail, rich amber and cyan, recognizable at32px. Eachicon occupies70percent cellwidth andheight. No effects overlapping adjacent cells. True alpha transparency.


## Ground texture atlas

`floor-atlas.webp` contains 2×2 opaque swatches: forest, path, crypt limestone, ritual slate. They are sampled into repeating ground patterns; terrain and map textures rebuild once after this image loads.

## Clothing atlas

`garb-atlas.webp` is a transparent 2×2 sheet: worn linen robe, waxed travel cloak, mosswoven mantle, emberwoven robe. Source artwork was generated with the built-in image generator and encoded to WebP with alpha preserved. Garments are inventory illustrations; the character outfit sprite does not change on equip.

Prompt specification: four isolated clothing icons, exact 2×2 grid, transparent gutters, no mannequin, body, head, labels, borders, UI, background or watermark. Painterly pixel fantasy, upper-left lighting, moss green and antique gold accents. A humble frayed blue-gray linen robe with stitched sleeves and cloth belt; a sturdy waxed moss-green cloak with leather shoulder patch and brass leaf clasp; a rare layered-leaf and silver-linen mantle with jade clasp and subtle healing-green hem; a rare burgundy robe with gold embroidery, amber runic stitching and delicate embers. Natural fabric construction, tiny pixel clusters and tactile cloth texture, legible at 50 pixels.
