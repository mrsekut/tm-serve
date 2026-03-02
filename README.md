# tm-serve

Development server for Tampermonkey userscripts. A CLI tool to serve, sync, and manage local `.user.js` files.

## how to use

```bash
bunx tm-serve
```

## Commands

### `dev` — Development server (default)

Starts an HTTP server for a single script with file watching.

```bash
tm-serve dev ./my-script.user.js
tm-serve ./my-script.user.js       # "dev" can be omitted
tm-serve                            # default: script.user.js
```

1. Creates a template `.user.js` file if it doesn't exist
2. Starts an HTTP server serving your userscript
3. Opens your browser — Tampermonkey shows the install dialog
4. Watches for file changes and reloads on save

### `push` — Install scripts to browser

Serves multiple `.user.js` files and opens an index page in the browser. Click each link to install via Tampermonkey.

```bash
tm-serve push --all                 # all *.user.js under current directory
tm-serve push scripts/a.user.js scripts/b.user.js  # specific files
```

### `import` — Import from backup

Extracts `.user.js` files from a Tampermonkey backup ZIP and writes them to `scripts/`.
Shows a diff and prompts for confirmation when an existing file differs.

```bash
tm-serve import ~/Downloads/tampermonkey-backup.zip
```

### `init` — Initialize project

Creates a `scripts/` directory and a sample userscript.

```bash
tm-serve init
```

## Options

- `PORT` env var: server port (default: `4889`)

## Requirements

- macOS (uses `ditto` for ZIP extraction in the `import` command)
