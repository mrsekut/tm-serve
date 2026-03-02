import { test, expect, afterEach, beforeEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm } from 'node:fs/promises';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'tm-push-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

test('push server serves multiple scripts', async () => {
  const script1Path = join(tmpDir, 'a.user.js');
  const script2Path = join(tmpDir, 'b.user.js');
  await Bun.write(script1Path, '// script a');
  await Bun.write(script2Path, '// script b');

  // Inline a minimal push server without opening the browser
  const scripts = new Map<string, string>();
  scripts.set('a.user.js', await Bun.file(script1Path).text());
  scripts.set('b.user.js', await Bun.file(script2Path).text());

  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url);
      const pathname = decodeURIComponent(url.pathname);

      if (pathname === '/') {
        return new Response('<html>index</html>', {
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

  try {
    // Test index page
    const indexRes = await fetch(`http://127.0.0.1:${server.port}/`);
    expect(indexRes.status).toBe(200);
    expect(indexRes.headers.get('Content-Type')).toContain('text/html');

    // Test script a
    const resA = await fetch(`http://127.0.0.1:${server.port}/a.user.js`);
    expect(resA.status).toBe(200);
    expect(await resA.text()).toBe('// script a');
    expect(resA.headers.get('Content-Type')).toContain('text/javascript');

    // Test script b
    const resB = await fetch(`http://127.0.0.1:${server.port}/b.user.js`);
    expect(resB.status).toBe(200);
    expect(await resB.text()).toBe('// script b');

    // Test 404
    const res404 = await fetch(
      `http://127.0.0.1:${server.port}/nonexistent.user.js`,
    );
    expect(res404.status).toBe(404);
  } finally {
    server.stop();
  }
});
