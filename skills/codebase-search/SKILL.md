---
name: codebase-search
description: Fast recursive file search with regex support, context lines, and result grouping
---

# Codebase Search

Fast recursive file search with regex support, context lines, and result grouping. Useful for finding patterns, symbols, or text across a project.

## Usage

```typescript
import { searchCodebase } from '.agent/skills/codebase-search/index.js';

const results = await searchCodebase({
  pattern: 'function\\s+\\w+',
  directory: 'src/',
  contextLines: 2,
});

for (const match of results) {
  console.log(`${match.file}:${match.line} ${match.content}`);
}
```

## Features

- Regex pattern matching
- Configurable context lines before/after matches
- File type filtering with glob patterns
- Result grouping by file
- Respects .gitignore

## Requirements

- Node.js >= 18
