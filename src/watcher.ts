import { watch, type FSWatcher } from 'fs';

export function watchScript(
  scriptPath: string,
  onReload: () => void,
): FSWatcher {
  const watcher = watch(scriptPath, event => {
    if (event === 'change') {
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Reloaded ${scriptPath}`);
      onReload();
    }
  });

  watcher.on('error', err => {
    console.error(`Watch error: ${err.message}`);
  });

  return watcher;
}
