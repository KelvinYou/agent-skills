# skills CLI

Install and manage reusable AI agent skills from any GitHub repo that follows the `skills/` directory convention.

## Quick Start

```bash
# Install a skill from any compatible repo
npx skills add https://github.com/my-org/agent-skills --skill github-pr-review

# Install multiple skills at once
npx skills add my-org/agent-skills --skill codebase-search code-review

# Install every skill in a repo
npx skills add my-org/agent-skills --skill all

# List installed skills
npx skills list

# Remove a skill
npx skills remove github-pr-review
```

## Installation

```bash
# Run directly without installing
npx skills <command>

# Or install globally
npm install -g skills
```

## Commands

### `skills add <repo>`

Fetch one or more skills from a GitHub repository and install them into `.agent/skills/<name>/`.

```
Options:
  -s, --skill <names...>    Skill name(s) to install — use "all" for everything
  -b, --branch <branch>     Git branch (default: main)
  -t, --token <token>       GitHub personal access token (private repos)
  -f, --force               Reinstall even if already installed
  --skip-cache              Bypass local repo cache and re-clone
  -d, --dir <directory>     Target directory (default: cwd)
```

Examples:

```bash
# Short repo form
skills add my-org/agent-skills --skill codebase-search

# Specific branch
skills add my-org/agent-skills --skill my-skill --branch develop

# Private repo
skills add https://github.com/my-org/private-skills \
  --skill internal-tool \
  --token ghp_xxxxxxxxxxxx

# Force reinstall
skills add my-org/agent-skills --skill codebase-search --force
```

---

### `skills list`

Show all skills installed in the current project.

```bash
skills list          # formatted table
skills list --json   # raw JSON
```

---

### `skills remove <name>`

Remove an installed skill and its files.

```bash
skills remove github-pr-review
skills rm codebase-search --force
```

---

### `skills search <repo>`

Browse available skills in a remote repository without installing anything.

```bash
skills search https://github.com/my-org/agent-skills
skills search my-org/agent-skills --branch develop
```

---

### `skills cache`

Manage the local repository cache (`~/.skills-cache/`).

```bash
skills cache clear   # delete all cached clones
skills cache size    # show disk usage
```

---

## Project structure after install

```
your-project/
├── .agent/
│   ├── registry.json          ← installed skill manifest
│   └── skills/
│       ├── github-pr-review/
│       │   ├── skill.json
│       │   ├── index.ts
│       │   ├── analyser.ts
│       │   └── types.ts
│       └── codebase-search/
│           ├── skill.json
│           ├── index.ts
│           └── types.ts
└── ...
```

## Supported repo URL formats

```bash
# Full HTTPS
skills add https://github.com/owner/repo --skill name

# Short owner/repo form
skills add owner/repo --skill name

# SSH (converted automatically)
skills add git@github.com:owner/repo.git --skill name
```

## Private repos

Pass a GitHub personal access token with `repo` scope:

```bash
skills add https://github.com/my-org/private-skills \
  --skill my-skill \
  --token $GITHUB_TOKEN
```

Or set it as an environment variable and pass with `--token $GITHUB_TOKEN`.

## Caching

The CLI caches cloned repos in `~/.skills-cache/` to speed up repeated installs. The cache is automatically refreshed on each `add` run (pulls latest from origin). Use `--skip-cache` to force a fresh clone.

---

## Publishing to npm

```bash
cd cli
npm run build       # compiles to dist/
npm publish         # publishes as "skills" package
```

After publishing, users can run:

```bash
npx skills add ...
```

For a scoped package, update `name` in `package.json` to `@your-org/skills` and users run:

```bash
npx @your-org/skills add ...
```
