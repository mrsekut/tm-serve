// init command. Creates the scripts/ directory and a sample userscript.

import { join } from 'path';
import { generateTemplate } from './template';

const SCRIPTS_DIR = 'scripts';
const EXAMPLE_FILE = 'example.user.js';

export async function init(): Promise<void> {
  const scriptsDir = join(process.cwd(), SCRIPTS_DIR);
  const examplePath = join(scriptsDir, EXAMPLE_FILE);

  // Create scripts/ if needed
  const dir = Bun.file(scriptsDir);
  if (!(await dir.exists())) {
    await Bun.$`mkdir -p ${scriptsDir}`.quiet();
    console.log(`Created ${SCRIPTS_DIR}/`);
  } else {
    console.log(`${SCRIPTS_DIR}/ already exists.`);
  }

  // Create example script if needed
  const exampleFile = Bun.file(examplePath);
  if (!(await exampleFile.exists())) {
    await Bun.write(examplePath, generateTemplate());
    console.log(`Created ${SCRIPTS_DIR}/${EXAMPLE_FILE}`);
  } else {
    console.log(`${SCRIPTS_DIR}/${EXAMPLE_FILE} already exists.`);
  }

  console.log('\nDone! Edit scripts in the scripts/ directory.');
}
