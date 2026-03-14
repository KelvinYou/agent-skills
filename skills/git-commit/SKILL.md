---
name: git-commit
description: Generate and validate Conventional Commits messages from staged git changes
---

# Git Commit

Generate and validate [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) messages from staged git changes. Analyzes diffs to auto-detect commit type, scope, and subject line.

## Usage

```typescript
import {
  generateCommit,
  formatCommit,
  lintCommitMessage,
  formatLintResult,
} from '.agent/skills/git-commit/index.js';

// Generate a commit message from staged changes
const commit = await generateCommit();
console.log(formatCommit(commit));

// Lint an existing commit message
const result = lintCommitMessage('feat(auth): add OAuth2 support');
console.log(formatLintResult(result));
```

## Conventional Commits Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When to use                                          |
|------------|------------------------------------------------------|
| `feat`     | A new feature visible to the user                    |
| `fix`      | A bug fix                                            |
| `docs`     | Documentation-only changes                           |
| `style`    | Formatting, whitespace — no logic change             |
| `refactor` | Code restructuring without behavior change           |
| `perf`     | Performance improvement                              |
| `test`     | Adding or updating tests                             |
| `build`    | Build system or dependency changes                   |
| `ci`       | CI/CD configuration changes                          |
| `chore`    | Maintenance tasks (deps, configs, tooling)           |
| `revert`   | Reverting a previous commit                          |

### Best Practices

1. **Subject line**: imperative mood, lowercase, no period, max 72 chars
   - Good: `feat(api): add pagination to /users endpoint`
   - Bad: `Added pagination.`

2. **Scope**: lowercase noun describing the section of the codebase
   - `feat(auth):`, `fix(parser):`, `docs(readme):`

3. **Breaking changes**: append `!` after type/scope, explain in footer
   - `feat(api)!: change response format for /users`

4. **Body**: explain *what* and *why*, not *how* — wrap at 100 chars

5. **Footer**: reference issues (`Closes #123`) or note breaking changes
   - `BREAKING CHANGE: response shape changed from array to object`

## What it does

- Reads staged `git diff` to analyze changes
- Auto-detects the commit type based on file patterns and diff content
- Auto-detects scope from shared directory paths
- Generates a subject line summarizing the changes
- Lints commit messages against Conventional Commits rules
- Reports errors and warnings for malformed messages

## Requirements

- Git repository with staged changes
- Node.js >= 18
