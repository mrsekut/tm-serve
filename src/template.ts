const METADATA_TEMPLATE = `// ==UserScript==
// @name        my-script
// @namespace   http://tampermonkey.net/
// @version     0.0.1
// @description A new userscript
// @match       *://*/*
// @grant       none
// ==/UserScript==
`;

export function generateTemplate(): string {
  return METADATA_TEMPLATE;
}

export function buildIndexHtml(scriptUrl: string, scriptPath: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>tm-serve</title></head>
<body>
  <h1>tm-serve</h1>
  <p>Monitoring: <code>${scriptPath}</code></p>
  <p>Install: <a href="${scriptUrl}">${scriptUrl}</a></p>
</body>
</html>`;
}
