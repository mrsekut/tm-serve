#!/usr/bin/env bun

import { resolve } from 'path';
import open from 'open';
import { generateTemplate } from './template';
import { startServer } from './server';
import { watchScript } from './watcher';

const DEFAULT_SCRIPT_NAME = 'script.user.js';
const DEFAULT_PORT = 4889;

main();

function parseArgs(argv: string[]): { scriptPath: string; port: number } {
  const args = argv.slice(2);
  const scriptPath = resolve(args[0] ?? DEFAULT_SCRIPT_NAME);
  const port = Number(process.env['PORT']) || DEFAULT_PORT;
  return { scriptPath, port };
}

async function main() {
  const { scriptPath, port } = parseArgs(process.argv);

  await ensureScript(scriptPath);

  let scriptContent = await Bun.file(scriptPath).text();

  const server = startServer(scriptPath, port, async () => scriptContent);

  watchScript(scriptPath, async () => {
    scriptContent = await Bun.file(scriptPath).text();
  });

  const scriptFileName = scriptPath.split('/').pop() ?? 'script.user.js';
  const scriptUrl = `http://127.0.0.1:${port}/${scriptFileName}`;

  try {
    await open(scriptUrl);
  } catch {
    console.log(`Open ${scriptUrl} in your browser to install the script.`);
  }

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    server.stop();
    process.exit(0);
  });
}

async function ensureScript(scriptPath: string): Promise<void> {
  const file = Bun.file(scriptPath);
  if (!(await file.exists())) {
    await Bun.write(scriptPath, generateTemplate());
    console.log(`Created template: ${scriptPath}`);
  }
}
