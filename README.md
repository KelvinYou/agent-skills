# Agent Skills

A reusable AI agent skills ecosystem. Install curated skills from this (or any compatible) GitHub repository using a single CLI command.

```bash
npx skills add https://github.com/KelvinYou/agent-skills --skill github-pr-review
```

---

## Available Skills

| Skill | Description | Tags |
|-------|-------------|------|
| [`github-pr-review`](./skills/github-pr-review/) | Fetch and analyse a GitHub pull request | github, pr, review |
| [`codebase-search`](./skills/codebase-search/) | Recursive regex file search with context | search, filesystem |
| [`code-review`](./skills/code-review/) | Static analysis for TypeScript/JS files | lint, quality |

---

## Using Skills

### Prerequisites

- Node.js ≥ 18

### Install the CLI

```bash
# Use directly with npx (no global install needed)
npx skills add https://github.com/KelvinYou/agent-skills --skill <name>

# Or install globally
npm install -g skills
```

### Install a skill

```bash
# Single skill
skills add https://github.com/KelvinYou/agent-skills --skill github-pr-review

# Multiple skills
skills add your-org/agent-skills --skill codebase-search code-review

# All skills in repo
skills add your-org/agent-skills --skill all

# Specific branch
skills add your-org/agent-skills --skill github-pr-review --branch develop
```

### Manage installed skills

```bash
skills list               # show installed skills
skills remove code-review # remove a skill
skills search your-org/agent-skills  # browse without installing
```

Skills are installed into `.agent/skills/<name>/` in your project root and tracked in `.agent/registry.json`.

---

## Repo Structure

```
agent-skills/
├── cli/                        # The "skills" npm package
│   ├── src/
│   │   ├── index.ts            # CLI entry point
│   │   ├── types/
│   │   │   └── index.ts        # Shared TypeScript types
│   │   ├── commands/
│   │   │   ├── add.ts          # skills add
│   │   │   ├── list.ts         # skills list
│   │   │   ├── remove.ts       # skills remove
│   │   │   └── search.ts       # skills search
│   │   └── utils/
│   │       ├── github.ts       # Repo cloning & caching
│   │       ├── skills.ts       # File copy & dep install
│   │       └── registry.ts     # .agent/registry.json I/O
│   ├── package.json
│   ├── tsconfig.json
│   └── tsup.config.ts
└── skills/                     # Skill library
    ├── github-pr-review/
    │   ├── skill.json
    │   ├── index.ts
    │   ├── analyser.ts
    │   ├── types.ts
    │   └── README.md
    ├── codebase-search/
    │   ├── skill.json
    │   ├── index.ts
    │   ├── types.ts
    │   └── README.md
    └── code-review/
        ├── skill.json
        ├── index.ts
        ├── rules.ts
        ├── types.ts
        └── README.md
```

---

## Creating a New Skill

### 1. Create the skill directory

```bash
mkdir skills/my-skill
```

### 2. Write `skill.json`

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "What this skill does",
  "entry": "index.ts",
  "dependencies": {
    "some-package": "^1.0.0"
  },
  "files": ["index.ts", "utils.ts", "types.ts", "README.md"],
  "tags": ["category", "keyword"],
  "author": "Your Name",
  "license": "MIT"
}
```

**`skill.json` fields:**

| Field        | Required | Description                                                     |
|--------------|----------|-----------------------------------------------------------------|
| name         | ✓        | Lowercase, hyphens OK (`my-skill`)                              |
| description  | ✓        | One-line summary                                                |
| entry        | ✓        | Primary export file (`index.ts`)                                |
| dependencies | ✓        | npm packages to install (object or string array)                |
| version      |          | Semver version (default: `0.0.0`)                               |
| files        |          | Explicit list of files to copy (copies all files if omitted)    |
| tags         |          | Searchable keywords                                             |
| author       |          | Skill author                                                    |
| license      |          | SPDX identifier                                                 |

### 3. Implement `index.ts`

Export a clean public API. Avoid side-effects at module load time.

```typescript
// skills/my-skill/index.ts

export interface MySkillOptions {
  // ...
}

export async function runMySkill(options: MySkillOptions): Promise<void> {
  // ...
}
```

### 4. Write a `README.md`

Document:
- What the skill does
- Installation command
- Usage examples
- Options reference

### 5. Test locally

Install your skill from the local filesystem by passing a file path:

```bash
# From the repo root
skills add . --skill my-skill
```

> The CLI accepts any local path as a "repo" — it just looks for `skills/<name>/` inside it.

---

## skill.json dependency formats

Both formats are supported:

```json
// Object (recommended — pinned versions)
"dependencies": {
  "@octokit/rest": "^21.0.0",
  "zod": "^3.23.0"
}

// Array (installs at latest)
"dependencies": ["@octokit/rest", "zod"]
```

---

## Registry

Installed skills are tracked in `.agent/registry.json`:

```json
{
  "version": "1.0.0",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "skills": {
    "github-pr-review": {
      "name": "github-pr-review",
      "version": "1.0.0",
      "description": "...",
      "source": "https://github.com/KelvinYou/agent-skills",
      "branch": "main",
      "installedAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "path": "/your/project/.agent/skills/github-pr-review",
      "tags": ["github", "pr", "review"]
    }
  }
}
```

Commit `.agent/registry.json` to version-control so teammates can reproduce installs. Add `.agent/skills/` to `.gitignore` if you don't want the skill source committed.

---

## Publishing the CLI to npm

```bash
cd cli
npm install
npm run build
npm publish --access public
```

After publishing, anyone can run:

```bash
npx skills add https://github.com/KelvinYou/agent-skills --skill my-skill
```

---

## License

MIT
