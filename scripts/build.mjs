import './bundle-action.mjs';
import { cp, mkdir, mkdtemp, readFile, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const files = ['action.html', 'src/painted-assets.js', 'src/action.js', 'src/action.bundle.js', 'vendor/three.module.js', 'vendor/THREE-LICENSE.txt', 'index.html', 'styles.css', 'src/engine.js', 'src/roster.js', 'src/render.js', 'src/app.js', 'src/audio.js', 'assets/woodland-atlas.webp', 'assets/arcana-atlas.webp', 'assets/environment-atlas.webp', 'assets/walk-atlas.webp', 'assets/action-atlas.webp', 'assets/extra-arcana.webp', 'assets/floor-atlas.webp', 'assets/garb-atlas.webp', 'assets/frontier-atlas.webp', 'assets/frontier-floor.webp', 'assets/journey-atlas.webp', 'assets/class-motion.webp', 'assets/roster-atlas.webp', 'assets/companions-atlas.webp', '.nojekyll'];

// Validate every input before touching a previous successful build.
for (const file of files) {
  const input = path.join(root, file);
  const info = await stat(input);
  if (!info.isFile()) throw new Error(`Build input is not a file: ${file}`);
  await readFile(input);
}

const staging = await mkdtemp(path.join(root, '.dist-'));
try {
  for (const file of files) {
    const destination = path.join(staging, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(root, file), destination, { dereference: true });
  }
  await rm(output, { recursive: true, force: true });
  await rename(staging, output);
  console.log(`Built Everwild: ${files.length} files in dist/`);
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}

