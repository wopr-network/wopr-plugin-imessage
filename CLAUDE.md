# wopr-plugin-imessage

iMessage/SMS channel plugin for WOPR via the `imsg` CLI. **macOS only.**

## Commands

```bash
npm run build     # tsc
npm run check     # biome check src/ && tsc --noEmit (run before committing)
npm run lint:fix  # biome check --fix src/
npm run format    # biome format --write src/
npm test          # vitest run
```

## Architecture

```
src/
  index.ts       # Plugin entry — wraps imsg CLI
  imsg-client.ts # imsg subprocess wrapper
  pairing.ts     # Device pairing flow
  logger.ts      # Winston logger
  types.ts       # Plugin-local types
```

## Key Details

- **Dependency**: `imsg` CLI must be installed on the macOS host — this is NOT a cross-platform plugin
- Communicates via `imsg` subprocess over stdio
- **macOS only**: requires Messages.app + Accessibility permissions granted to the terminal/process
- SMS bridging works only if the Mac is signed into an iCloud account with iMessage enabled
- **Gotcha**: macOS privacy permissions must be granted manually — Full Disk Access for WOPR and Automation permission for Messages.app

## Plugin Contract

Imports only from `@wopr-network/plugin-types`. Never import from `@wopr-network/wopr` core.

## Issue Tracking

All issues in **Linear** (team: WOPR). Issue descriptions start with `**Repo:** wopr-network/wopr-plugin-imessage`.

## Session Memory

At the start of every WOPR session, **read `~/.wopr-memory.md` if it exists.** It contains recent session context: which repos were active, what branches are in flight, and how many uncommitted changes exist. Use it to orient quickly without re-investigating.

The `Stop` hook writes to this file automatically at session end. Only non-main branches are recorded — if everything is on `main`, nothing is written for that repo.