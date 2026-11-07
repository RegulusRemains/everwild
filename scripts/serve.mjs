import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const publicFiles = new Map([
  ['/assets/frontier-atlas.webp', ['assets/frontier-atlas.webp', 'image/webp']],
  ['/assets/frontier-floor.webp', ['assets/frontier-floor.webp', 'image/webp']],
  ['/assets/garb-atlas.webp', ['assets/garb-atlas.webp', 'image/webp']],
  ['/assets/floor-atlas.webp', ['assets/floor-atlas.webp', 'image/webp']],
  ['/assets/environment-atlas.webp', ['assets/environment-atlas.webp', 'image/webp']],
  ['/assets/walk-atlas.webp', ['assets/walk-atlas.webp', 'image/webp']],
  ['/assets/action-atlas.webp', ['assets/action-atlas.webp', 'image/webp']],
  ['/assets/extra-arcana.webp', ['assets/extra-arcana.webp', 'image/webp']],
  ['/assets/woodland-atlas.webp', ['assets/woodland-atlas.webp', 'image/webp']],
  ['/assets/arcana-atlas.webp', ['assets/arcana-atlas.webp', 'image/webp']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/src/engine.js', ['src/engine.js', 'text/javascript; charset=utf-8']],
  ['/src/render.js', ['src/render.js', 'text/javascript; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
]);

function readOptions(args) {
  const options = { host: '127.0.0.1', port: 4173 };
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!['--host', '--port'].includes(key) || !args[i + 1]) {
      throw new Error('Usage: npm start -- [--host 127.0.0.1] [--port 4173]');
    }
    options[key.slice(2)] = args[++i];
  }
  if (!/^\d+$/.test(String(options.port))) throw new Error('Port must be an integer from 1 to 65535.');
  options.port = Number(options.port);
  if (options.port < 1 || options.port > 65535) throw new Error('Port must be an integer from 1 to 65535.');
  return options;
}

function respond(res, status, message, method = 'GET') {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(message),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(method === 'HEAD' ? undefined : message);
}

let options;
try {
  options = readOptions(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    respond(res, 405, 'Method not allowed.\n', req.method);
    return;
  }

  let pathname;
  try {
    // Check the decoded raw path before URL normalization can erase traversal.
    pathname = decodeURIComponent((req.url || '').split('?')[0]);
  } catch {
    respond(res, 400, 'Malformed URL.\n', req.method);
    return;
  }
  if (!pathname.startsWith('/') || pathname.includes('\0') || pathname.includes('\\') ||
      pathname.split('/').some(segment => segment === '.' || segment === '..')) {
    respond(res, 400, 'Invalid path.\n', req.method);
    return;
  }

  const entry = publicFiles.get(pathname === '/' ? '/index.html' : pathname);
  if (!entry) {
    respond(res, 404, 'Not found.\n', req.method);
    return;
  }

  try {
    const resolved = await realpath(path.join(root, entry[0]));
    const relative = path.relative(root, resolved);
    if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
      respond(res, 403, 'Forbidden.\n', req.method);
      return;
    }
    const bytes = await readFile(resolved);
    res.writeHead(200, {
      'Content-Type': entry[1],
      'Content-Length': bytes.length,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      respond(res, 404, 'Not found.\n', req.method);
    } else {
      console.error(`Unable to serve ${entry[0]}: ${error.message}`);
      respond(res, 500, 'Unable to read game file.\n', req.method);
    }
  }
});

server.on('error', error => {
  console.error(`Server failed: ${error.message}`);
  process.exitCode = 1;
});
server.listen(options.port, options.host, () => {
  const host = options.host.includes(':') ? `[${options.host}]` : options.host;
  console.log(`Everwild is ready at http://${host}:${options.port}`);
  console.log('Press Ctrl+C to stop.');
});

