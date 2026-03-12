---
name: code-review
description: Static analysis and code quality review for TypeScript/JavaScript files
---

# Code Review

Static analysis and code quality review for TypeScript/JavaScript files. Runs a set of configurable rules against source files and returns structured findings.

## Usage

```typescript
import { reviewCode, formatCodeReview } from '.agent/skills/code-review/index.js';

const result = await reviewCode({ target: './src' });

// Structured data
console.log(`Passed: ${result.passed}, Issues: ${result.totalIssues}`);

// Or pretty-print to stdout
console.log(formatCodeReview(result));
```

## What it checks

- Code quality patterns and anti-patterns
- Debug statements and leftover development artifacts
- TODO / FIXME / HACK markers
- Potential security issues
- Style and consistency rules

## Requirements

- Node.js >= 18
