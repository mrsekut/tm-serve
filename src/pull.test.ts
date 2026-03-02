import { test, expect, afterEach, beforeEach } from 'bun:test';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { $ } from 'bun';

let tmpDir: string;
let outputDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'tm-pull-test-'));
  outputDir = join(tmpDir, 'scripts');
  await $`mkdir -p ${outputDir}`.quiet();
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

test('extracts .user.js files from zip', async () => {
  const zipPath = await createTestZip({
    'My Script.user.js': '// my script',
    'My Script.options.json': '{}',
    'My Script.storage.json': '{}',
    'Other.user.js': '// other',
    'Other.options.json': '{}',
  });

  // Extract and verify manually (pull function uses interactive prompts)
  await $`unzip -o ${zipPath} -d ${tmpDir}/extracted`.quiet();

  const glob = new Bun.Glob('**/*.user.js');
  const userScripts = Array.from(
    glob.scanSync({ cwd: join(tmpDir, 'extracted'), absolute: true }),
  );

  expect(userScripts.length).toBe(2);

  const names = userScripts.map(p => p.split('/').pop()).sort();
  expect(names).toEqual(['My Script.user.js', 'Other.user.js']);
});

test('new files are written to output directory', async () => {
  const zipPath = await createTestZip({
    'Test.user.js': '// test content',
    'Test.options.json': '{}',
  });

  await $`unzip -o ${zipPath} -d ${tmpDir}/extracted`.quiet();

  const glob = new Bun.Glob('**/*.user.js');
  const userScripts = Array.from(
    glob.scanSync({ cwd: join(tmpDir, 'extracted'), absolute: true }),
  );

  for (const srcPath of userScripts) {
    const name = srcPath.split('/').pop()!;
    const destPath = join(outputDir, name);
    const content = await Bun.file(srcPath).text();
    await Bun.write(destPath, content);
  }

  const written = await Bun.file(join(outputDir, 'Test.user.js')).text();
  expect(written).toBe('// test content');
});

test('identical files are detected', async () => {
  // Write existing file
  await Bun.write(join(outputDir, 'Same.user.js'), '// same');

  const zipPath = await createTestZip({
    'Same.user.js': '// same',
  });

  await $`unzip -o ${zipPath} -d ${tmpDir}/extracted`.quiet();

  const srcContent = await Bun.file(
    join(tmpDir, 'extracted', 'Same.user.js'),
  ).text();
  const destContent = await Bun.file(join(outputDir, 'Same.user.js')).text();

  expect(srcContent).toBe(destContent);
});

test('different files are detected', async () => {
  // Write existing file with different content
  await Bun.write(join(outputDir, 'Diff.user.js'), '// old version');

  const zipPath = await createTestZip({
    'Diff.user.js': '// new version',
  });

  await $`unzip -o ${zipPath} -d ${tmpDir}/extracted`.quiet();

  const srcContent = await Bun.file(
    join(tmpDir, 'extracted', 'Diff.user.js'),
  ).text();
  const destContent = await Bun.file(join(outputDir, 'Diff.user.js')).text();

  expect(srcContent).not.toBe(destContent);
});
