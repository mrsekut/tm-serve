// pull command. Extracts .user.js files from a Tampermonkey backup ZIP and writes them to scripts/ with diff confirmation.

import { tmpdir } from 'os';
import { join, basename } from 'path';
import { mkdtemp, rm } from 'node:fs/promises';
import { $ } from 'bun';

export async function pull(zipPath: string, outputDir: string): Promise<void> {
  const file = Bun.file(zipPath);
  if (!(await file.exists())) {
    console.error(`File not found: ${zipPath}`);
    process.exit(1);
  }

  const tmpDir = await mkdtemp(join(tmpdir(), 'tm-serve-pull-'));

  try {
    await $`unzip -o ${zipPath} -d ${tmpDir}`.quiet();

    const glob = new Bun.Glob('**/*.user.js');
    const userScripts = Array.from(
      glob.scanSync({ cwd: tmpDir, absolute: true }),
    );

    if (userScripts.length === 0) {
      console.log('No .user.js files found in the backup.');
      return;
    }

    console.log(`Found ${userScripts.length} script(s) in backup.\n`);

    await $`mkdir -p ${outputDir}`.quiet();

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const srcPath of userScripts) {
      const name = basename(srcPath);
      const destPath = join(outputDir, name);
      const srcContent = await Bun.file(srcPath).text();

      const destFile = Bun.file(destPath);
      if (await destFile.exists()) {
        const destContent = await destFile.text();
        if (srcContent === destContent) {
          console.log(`  Skip (identical): ${name}`);
          skipped++;
          continue;
        }

        // Show diff
        console.log(`\n  Diff for ${name}:`);
        try {
          await $`diff --color ${destPath} ${srcPath}`;
        } catch {
          // diff exits 1 when files differ, which is expected
        }

        const answer = await promptYesNo(`  Overwrite ${name}?`);
        if (!answer) {
          console.log(`  Skipped: ${name}`);
          skipped++;
          continue;
        }

        await Bun.write(destPath, srcContent);
        console.log(`  Updated: ${name}`);
        updated++;
      } else {
        await Bun.write(destPath, srcContent);
        console.log(`  Added: ${name}`);
        added++;
      }
    }

    console.log(
      `\nDone: ${added} added, ${updated} updated, ${skipped} skipped.`,
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function promptYesNo(question: string): Promise<boolean> {
  process.stdout.write(`${question} [y/N] `);
  for await (const line of console) {
    const answer = line.trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  }
  return false;
}
