import { test, expect, afterEach, beforeEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { $ } from 'bun';
import { importScripts } from './import';

let tmpDir: string;
let outputDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'tm-import-test-'));
  outputDir = join(tmpDir, 'scripts');
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

async function createTestZip(files: Record<string, string>): Promise<string> {
  const zipContentDir = join(tmpDir, 'zip-content');
  await $`mkdir -p ${zipContentDir}`.quiet();

  for (const [name, content] of Object.entries(files)) {
    await Bun.write(join(zipContentDir, name), content);
  }

  const zipPath = join(tmpDir, 'backup.zip');
  await $`cd ${zipContentDir} && zip -r ${zipPath} .`.quiet();
  return zipPath;
}

test('imports new .user.js files from zip, ignoring .json files', async () => {
  const zipPath = await createTestZip({
    'My Script.user.js': '// my script',
    'My Script.options.json': '{}',
    'My Script.storage.json': '{}',
    'Other.user.js': '// other',
    'Other.options.json': '{}',
  });

  await importScripts(zipPath, outputDir);

  expect(await Bun.file(join(outputDir, 'My Script.user.js')).text()).toBe(
    '// my script',
  );
  expect(await Bun.file(join(outputDir, 'Other.user.js')).text()).toBe(
    '// other',
  );
  // .json files should not be written
  expect(
    await Bun.file(join(outputDir, 'My Script.options.json')).exists(),
  ).toBe(false);
});

test('skips identical existing files', async () => {
  await $`mkdir -p ${outputDir}`.quiet();
  await Bun.write(join(outputDir, 'Same.user.js'), '// same');

  const zipPath = await createTestZip({
    'Same.user.js': '// same',
  });

  await importScripts(zipPath, outputDir);

  // File should still exist with same content
  expect(await Bun.file(join(outputDir, 'Same.user.js')).text()).toBe(
    '// same',
  );
});

test('creates output directory if it does not exist', async () => {
  const zipPath = await createTestZip({
    'Test.user.js': '// test',
  });

  const newOutputDir = join(tmpDir, 'new-dir');
  await importScripts(zipPath, newOutputDir);

  expect(await Bun.file(join(newOutputDir, 'Test.user.js')).text()).toBe(
    '// test',
  );
});
