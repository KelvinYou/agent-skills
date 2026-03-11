---
name: code-review
description: Static analysis and code quality review for TypeScript/JavaScript files
---

# Code Review

Static analysis and code quality review for TypeScript/JavaScript files. Runs a set of configurable rules against source files and returns structured findings.

## Usage

```typescript
import { reviewFiles } from '.agent/skills/code-review/index.js';

const results = await reviewFiles({
  paths: ['src/'],
});

for (const finding of results) {
  console.log(`${finding.file}:${finding.line} [${finding.severity}] ${finding.message}`);
}
```

## What it checks

- Code quality patterns and anti-patterns
- Debug statements and leftover development artifacts
- TODO / FIXME / HACK markers
- Potential security issues
- Style and consistency rules

## Requirements

- Node.js >= 18
