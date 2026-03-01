import { buildIndexHtml } from './template';

export type ScriptProvider = () => Promise<string>;

export function startServer(
  scriptPath: string,
  port: number,
  getScript: ScriptProvider,
): ReturnType<typeof Bun.serve> {
  const scriptFileName = scriptPath.split('/').pop() ?? 'script.user.js';
  const scriptUrl = `http://127.0.0.1:${port}/${scriptFileName}`;

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    routes: {
      '/': new Response(buildIndexHtml(scriptUrl, scriptPath), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
      [`/${scriptFileName}`]: async () => {
        const content = await getScript();
        return new Response(content, {
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      },
    },
  });

  console.log(`Serving ${scriptPath} at ${scriptUrl}`);
  return server;
}
