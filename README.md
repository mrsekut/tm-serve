# tm-serve

Serve local `.user.js` files for Tampermonkey installation.

## Usage

```bash
bunx tm-serve ./my-script.user.js
```

This will:

1. Create a template `.user.js` file if it doesn't exist
2. Start an HTTP server serving your userscript
3. Open your browser to the script URL
4. Tampermonkey automatically shows the install dialog
5. Watch for file changes and reload on save

## Options

- First argument: path to `.user.js` file (default: `script.user.js`)
- `PORT` env var: server port (default: `4889`)
