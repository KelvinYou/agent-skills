# git-commit

Generate and validate [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) messages from staged git changes.

## Features

- **Auto-generate** commit messages by analyzing staged diffs
- **Auto-detect** commit type (`feat`, `fix`, `refactor`, etc.) from file patterns and content
- **Auto-detect** scope from shared directory paths
- **Lint** existing commit messages against Conventional Commits rules
- **Zero dependencies** — uses only Node.js built-ins and git

## Quick Start

```typescript
import { generateCommit, formatCommit } from '.agent/skills/git-commit/index.js';

const commit = await generateCommit();
console.log(commit.message);
// => "feat(api): add 3 files in src/api"
```

## API

### `generateCommit(options?): Promise<GeneratedCommit>`

Analyze staged git changes and produce a commit message.

**Options:**
- `cwd` — working directory (default: `process.cwd()`)
- `paths` — limit analysis to specific file paths
- `maxDiffLines` — cap diff content for analysis (default: 500)
- `type` — override auto-detected type
- `scope` — override auto-detected scope
- `breaking` — mark as a breaking change

### `lintCommitMessage(message): CommitLintResult`

Validate a commit message string. Returns `{ valid, errors, warnings, type, scope, subject, body }`.

### `formatCommit(commit): string`

Pretty-print a `GeneratedCommit` for display.

### `formatLintResult(result): string`

Pretty-print a `CommitLintResult` for display.

## Lint Rules

| Rule | Severity | Description |
|------|----------|-------------|
| Valid format | error | Must follow `<type>[scope]: <subject>` |
| Valid type | error | Must be a recognized Conventional Commits type |
| Non-empty subject | error | Subject line must not be empty |
| Blank line before body | error | Header and body must be separated by a blank line |
| Lowercase subject | warning | Subject should start with a lowercase letter |
| No trailing period | warning | Subject should not end with a period |
| Header length | warning | Header should be ≤ 72 characters |
| Body line length | warning | Body lines should be ≤ 100 characters |
| Lowercase scope | warning | Scope should be lowercase |

## Commit Message Best Practices

1. **Use imperative mood** — "add feature" not "added feature"
2. **Keep the subject concise** — 72 characters max
3. **Separate subject from body** with a blank line
4. **Explain why, not how** in the body
5. **Reference issues** in the footer: `Closes #42`
6. **Mark breaking changes** with `!` or `BREAKING CHANGE:` footer
7. **One logical change per commit** — don't mix unrelated changes
8. **Use the right type** — `feat` for new features, `fix` for bugs, etc.
