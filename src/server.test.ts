import { test, expect, afterEach } from 'bun:test';
import { startServer } from './server';

let server: ReturnType<typeof startServer> | null = null;

afterEach(() => {
  server?.stop();
  server = null;
});

test('serves script at /<filename> with correct headers', async () => {
  const scriptContent = '// ==UserScript==\nconsole.log("hello");';
  server = startServer('test.user.js', 0, async () => scriptContent);

  const res = await fetch(`http://127.0.0.1:${server.port}/test.user.js`);
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toContain('text/javascript');
  expect(res.headers.get('Cache-Control')).toContain('no-cache');
  expect(await res.text()).toBe(scriptContent);
});

test('serves index HTML at /', async () => {
  server = startServer('test.user.js', 0, async () => '');

  const res = await fetch(`http://127.0.0.1:${server.port}/`);
  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Type')).toContain('text/html');
  expect(await res.text()).toContain('test.user.js');
});

test('returns latest script content on each request', async () => {
  let content = 'v1';
  server = startServer('test.user.js', 0, async () => content);

  const res1 = await fetch(`http://127.0.0.1:${server.port}/test.user.js`);
  expect(await res1.text()).toBe('v1');

  content = 'v2';
  const res2 = await fetch(`http://127.0.0.1:${server.port}/test.user.js`);
  expect(await res2.text()).toBe('v2');
});
