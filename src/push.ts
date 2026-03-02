// push command. Serves multiple .user.js files and opens an index page for Tampermonkey installation.

import { basename } from 'path';
import open from 'open';

export async function push(scriptPaths: string[], port: number): Promise<void> {
  const scripts = new Map<string, string>();

  for (const p of scriptPaths) {
    const name = basename(p);
    const content = await Bun.file(p).text();
    scripts.set(name, content);
  }

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url);
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === '/') {
        const html = buildPushIndexHtml(url.origin, Array.from(scripts.keys()));
        return new Response(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const fileName = pathname.slice(1);
      const content = scripts.get(fileName);
      if (content != null) {
        return new Response(content, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  const indexUrl = `http://127.0.0.1:${server.port}/`;
  console.log(`Serving ${scripts.size} script(s) at ${indexUrl}`);
  for (const name of scripts.keys()) {
    console.log(`  - ${name}`);
  }
  console.log('\nOpening browser... Click each link to install.');

  try {
    await open(indexUrl);
  } catch {
    console.log(`Could not open browser. Visit: ${indexUrl}`);
  }

  console.log('Press Ctrl+C to stop the server.');

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.stop();
    process.exit(0);
  });
}

function buildPushIndexHtml(origin: string, fileNames: string[]): string {
  const links = fileNames
    .map(name => {
      const url = `${origin}/${encodeURIComponent(name)}`;
      return `  <li><a href="${url}">${name}</a></li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>tm-serve push</title></head>
<body>
  <h1>tm-serve push</h1>
  <p>${fileNames.length} script(s). Click each link to install:</p>
  <ul>
${links}
  </ul>
</body>
</html>`;
}
