# Contributing to Qbique CLI

## Development Setup

```bash
# Clone
git clone git@github.com:kimboguk/qbique-portfolio-management-cli.git
cd qbique-portfolio-management-cli

# Install dependencies
cd packages/cli-core && npm install

# Build
npm run build

# Run in dev mode
node bin/dev.js health
```

## Project Structure

```
packages/
  cli-core/          # Main CLI (oclif v4, TypeScript)
    src/
      commands/      # CLI commands (one file per command)
      lib/           # Core libraries (BaseCommand, ApiClient, etc.)
      types/         # TypeScript type definitions
  sdk-python/        # Python SDK (httpx)
  sdk-node/          # Node.js SDK (axios, TypeScript)
  plugin-quantum/    # Quantum engine plugin (scaffold)
```

## Adding a New Command

1. Create `src/commands/<topic>/<name>.ts`
2. Extend `BaseCommand`
3. Define `static flags`, `static args`, `static description`
4. Implement `async run()`
5. Run `npm run build` and test with `node bin/run.js <topic> <name>`

## Creating a Plugin

Plugins are oclif npm packages. See `packages/plugin-quantum/` for the scaffold.

1. Create a new package with `oclif` section in `package.json`
2. Add commands in `src/commands/`
3. Build and publish to npm
4. Users install via `qbique plugins install @qbique/your-plugin`

## Code Style

- TypeScript strict mode
- ESM modules (`.js` extensions in imports)
- No default exports except for oclif Command classes
