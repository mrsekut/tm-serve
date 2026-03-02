#!/usr/bin/env bun
// CLI entry point. Routes subcommands: dev, push, import, init.

import { resolve } from 'path';
import { parseArgs } from 'util';
import { dev } from './dev';
import { push } from './push';
import { importScripts } from './import';
import { init } from './init';

const DEFAULT_SCRIPT_NAME = 'script.user.js';
const DEFAULT_PORT = 4889;

const SUBCOMMANDS = new Set(['dev', 'push', 'import', 'init']);

main();

async function main() {
  const port = Number(process.env['PORT']) || DEFAULT_PORT;
  const args = process.argv.slice(2);
  const subcommand = SUBCOMMANDS.has(args[0] ?? '') ? args[0]! : undefined;
  const restArgs = subcommand ? args.slice(1) : args;

  switch (subcommand) {
    case 'init': {
      await init();
      break;
    }

    case 'push': {
      const { values, positionals } = parseArgs({
        args: restArgs,
        options: {
          all: { type: 'boolean', default: false },
        },
        allowPositionals: true,
      });

      const scriptPaths = resolveScriptPaths(values.all ?? false, positionals);

      if (scriptPaths.length === 0) {
        console.error('No .user.js files found.');
        process.exit(1);
      }

      await push(scriptPaths, port);
      break;
    }

    case 'import': {
      const { positionals } = parseArgs({
        args: restArgs,
        allowPositionals: true,
      });
      const zipPath = positionals[0];
      if (!zipPath) {
        console.error('Usage: tm-serve import <backup.zip>');
        process.exit(1);
      }
      const outputDir = resolve('scripts');
      await importScripts(resolve(zipPath), outputDir);
      break;
    }

    case 'dev':
    default: {
      // Backward compat: `tm-serve foo.user.js` => dev
      const scriptPath = resolve(restArgs[0] ?? DEFAULT_SCRIPT_NAME);
      await dev(scriptPath, port);
      break;
    }
  }
}

function resolveScriptPaths(all: boolean, positionals: string[]): string[] {
  if (all) {
    const glob = new Bun.Glob('**/*.user.js');
    return Array.from(glob.scanSync({ cwd: process.cwd() })).map(f =>
      resolve(f),
    );
  }
  if (positionals.length > 0) {
    return positionals.map(f => resolve(f));
  }
  console.error('Usage: tm-serve push [--all | files...]');
  process.exit(1);
}
