import { test, expect, afterEach, beforeEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm } from 'node:fs/promises';

let tmpDir: string;
let originalCwd: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'tm-init-test-'));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tmpDir, { recursive: true, force: true });
});

test('init creates scripts directory and example file', async () => {
  const { init } = await import('./init');
  await init();

  const scriptsDir = join(tmpDir, 'scripts');
  const exampleFile = join(scriptsDir, 'example.user.js');

  expect(await Bun.file(exampleFile).exists()).toBe(true);

  const content = await Bun.file(exampleFile).text();
  expect(content).toContain('==UserScript==');
  expect(content).toContain('==/UserScript==');
});

test('init is idempotent', async () => {
  const { init } = await import('./init');
  await init();
  await init(); // second call should not error

  const exampleFile = join(tmpDir, 'scripts', 'example.user.js');
  expect(await Bun.file(exampleFile).exists()).toBe(true);
});

test('init does not overwrite existing example file', async () => {
  const { init } = await import('./init');

  // Create scripts dir with custom content
  const scriptsDir = join(tmpDir, 'scripts');
  await Bun.$`mkdir -p ${scriptsDir}`.quiet();
  await Bun.write(join(scriptsDir, 'example.user.js'), '// custom content');

  await init();

  const content = await Bun.file(join(scriptsDir, 'example.user.js')).text();
  expect(content).toBe('// custom content');
});
