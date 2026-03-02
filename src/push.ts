// push command. Serves multiple .user.js files and opens them sequentially in the browser for Tampermonkey installation.

import { basename } from 'path';
import open from 'open';

export async function push(scriptPaths: string[], port: number): Promise<void> {
  const scripts = new Map<string, string>();

  for (const p of scriptPaths) {
    const name = basename(p);
    const content = await Bun.file(p).text();
    scripts.set(name, content);
  }

  const indexHtml = buildPushIndexHtml(port, Array.from(scripts.keys()));

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url);
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === '/') {
        return new Response(indexHtml, {
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

  console.log(`Push server started at http://127.0.0.1:${server.port}/`);
  console.log(`Serving ${scripts.size} script(s):\n`);

  for (const name of scripts.keys()) {
    const url = `http://127.0.0.1:${server.port}/${encodeURIComponent(name)}`;
    console.log(`  Opening ${name}...`);
    try {
      await open(url);
    } catch {
      console.log(`  Could not open browser. Visit: ${url}`);
    }
    await sleep(1000);
  }

  console.log('\nAll scripts opened. Press Ctrl+C to stop the server.');

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.stop();
    process.exit(0);
  });
}

function buildPushIndexHtml(port: number, fileNames: string[]): string {
  const links = fileNames
    .map(name => {
      const url = `http://127.0.0.1:${port}/${encodeURIComponent(name)}`;
      return `  <li><a href="${url}">${name}</a></li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>tm-serve push</title></head>
<body>
  <h1>tm-serve push</h1>
  <p>${fileNames.length} script(s):</p>
  <ul>
${links}
  </ul>
</body>
</html>`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
