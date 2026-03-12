---
name: codebase-search
description: Fast recursive file search with regex support, context lines, and result grouping
---

# Codebase Search

Fast recursive file search with regex support, context lines, and result grouping. Useful for finding patterns, symbols, or text across a project.

## Usage

```typescript
import { searchCodebase, formatResults } from '.agent/skills/codebase-search/index.js';

const result = await searchCodebase({
  pattern: 'function\\s+\\w+',
  directory: 'src/',
  contextLines: 2,
});

// Structured data
for (const match of result.matches) {
  console.log(`${match.file}:${match.line} ${match.content}`);
}

// Or pretty-print to stdout
console.log(formatResults(result));
```

## Features

- Regex pattern matching
- Configurable context lines before/after matches
- File type filtering with glob patterns
- Result grouping by file
- Respects .gitignore

## Requirements

- Node.js >= 18
