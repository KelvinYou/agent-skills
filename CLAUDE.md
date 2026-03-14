# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing two main components:
1. **`/cli`** — A Node.js CLI package (`skills` npm package) for installing and managing skills
2. **`/skills`** — A library of reusable AI agent skills

## CLI Development Commands

All commands run from `/cli`:

```bash
npm run build      # Bundle with tsup into dist/
npm run dev        # Run CLI directly with tsx (no build required)
npm run typecheck  # Type-check with tsc (also used as lint)
```

To test CLI commands during development:
```bash
cd cli && npx tsx src/index.ts <command> [options]
# e.g., npx tsx src/index.ts search ./
```

## Architecture

### CLI (`/cli/src/`)

- **`index.ts`** — Commander.js entry; registers `add`, `list`, `remove`, `search`, `cache` commands
- **`commands/`** — One file per CLI command; thin orchestration layer
- **`utils/github.ts`** — Git repo fetch/clone with caching to `~/.skills-cache/`
- **`utils/skills.ts`** — Manifest validation, file copying, dependency installation
- **`utils/registry.ts`** — Read/write `.agent/registry.json` in target projects

### Skills (`/skills/`)

Each skill is a self-contained directory with:
- **`skill.json`** — Required manifest (`name`, `version`, `description`, `entry`, `dependencies`, optional `files` array and `tags`)
- **`index.ts`** — Public API entry point
- **`SKILL.md`** — Frontmatter metadata (`name`, `description`) + markdown docs for Claude Code discovery

When installed, skills are copied to `.agent/skills/<name>/` in the target project. Users import from `.agent/skills/<name>/index.js`.

### Registry

Installed skills are tracked in `.agent/registry.json` (committed to version control). The CLI auto-detects the package manager (bun/pnpm/yarn/npm) from lockfiles and installs skill dependencies accordingly.

## Adding a New Skill

1. Create `/skills/<skill-name>/` directory
2. Add `skill.json` with required fields
3. Add `index.ts` exporting the public API
4. Add `SKILL.md` with frontmatter (`name`, `description`) and usage docs
5. If the skill has supporting files, list them explicitly in `skill.json` under `"files"`

## Key Conventions

- Skills should have zero side-effects at import time
- `skill.json` dependencies can be an object (`{ "pkg": "^1.0.0" }`) or array (`["pkg"]`)
- The `files` field in `skill.json` controls exactly which files get copied during install; if omitted, all files are copied
- SKILL.md frontmatter format: `name` and `description` fields used by the `find-skills` skill for discovery