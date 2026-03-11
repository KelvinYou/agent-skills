# code-review

Static analysis and code quality review for TypeScript/JavaScript files. Runs a configurable rule set and returns structured results — zero dependencies.

## Install

```bash
npx skills add https://github.com/KelvinYou/agent-skills --skill code-review
```

## Usage

```typescript
import { reviewCode, formatCodeReview } from '.agent/skills/code-review/index.js';

const result = await reviewCode({ target: './src' });

// Pretty-print report
console.log(formatCodeReview(result));

// Structured data
console.log(result.errors, result.warnings);

// CI gate
if (!result.passed) process.exit(1);
```

## CodeReviewOptions

| Field       | Type       | Default                         | Description                              |
|-------------|------------|---------------------------------|------------------------------------------|
| target      | string     | —                               | File or directory path                   |
| extensions  | string[]   | `.ts .tsx .js .jsx .mjs .cjs`   | File extensions to include               |
| skipRules   | string[]   | `[]`                            | Rule IDs to disable                      |
| maxFiles    | number     | `200`                           | Cap on files reviewed                    |

## Built-in Rules

| Rule ID                  | Severity | Description                                    |
|--------------------------|----------|------------------------------------------------|
| `no-console`             | warning  | Disallow `console.*` in production code        |
| `no-debugger`            | error    | Disallow `debugger` statements                 |
| `no-todo`                | info     | Flag TODO/FIXME/HACK comments                  |
| `no-hardcoded-secret`    | error    | Detect possible hardcoded credentials          |
| `no-eval`                | error    | Disallow `eval()`                              |
| `max-line-length`        | warning  | Lines must not exceed 120 chars                |
| `no-trailing-whitespace` | info     | Lines must not end with whitespace             |
| `no-any`                 | warning  | Avoid explicit `any` type                      |
| `no-non-null-assertion`  | info     | Avoid non-null assertions `!`                  |

## Custom Rules

```typescript
import { reviewCode, rules } from '.agent/skills/code-review/index.js';
import type { RuleDefinition } from '.agent/skills/code-review/types.js';

const myRule: RuleDefinition = {
  id: 'no-magic-numbers',
  description: 'Avoid magic numbers in expressions',
  severity: 'warning',
  check: (line, lineIndex, allLines, filePath) => {
    if (!/[^0-9]\b[2-9][0-9]{2,}\b/.test(line)) return null;
    return {
      ruleId: 'no-magic-numbers',
      severity: 'warning',
      message: 'Magic number detected — extract to a named constant',
      file: filePath,
      line: lineIndex + 1,
      column: 1,
      snippet: line.trim(),
    };
  },
};

const result = await reviewCode({ target: './src' }, [myRule]);
```

## Skipping Rules

```typescript
const result = await reviewCode({
  target: './src',
  skipRules: ['no-console', 'no-todo'],
});
```
