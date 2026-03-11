# codebase-search

Fast recursive file search with regex support, configurable context lines, and results grouped by file. Zero dependencies.

## Install

```bash
npx skills add https://github.com/KelvinYou/agent-skills --skill codebase-search
```

## Usage

```typescript
import { searchCodebase, formatResults } from '.agent/skills/codebase-search/index.js';

// Basic search
const result = await searchCodebase({
  pattern: 'TODO',
  directory: './src',
});

// Pretty-print
console.log(formatResults(result));

// Access structured data
for (const [file, matches] of Object.entries(result.byFile)) {
  console.log(`${file}: ${matches.length} match(es)`);
}
```

## SearchOptions

| Field           | Type       | Default                         | Description                                     |
|-----------------|------------|---------------------------------|-------------------------------------------------|
| pattern         | string     | —                               | Regex or literal string                         |
| directory       | string     | `process.cwd()`                 | Root directory to search from                   |
| fileExtensions  | string[]   | Common source extensions        | Extensions to include                           |
| caseSensitive   | boolean    | `false`                         | Case-sensitive matching                         |
| contextLines    | number     | `2`                             | Lines to show before/after each match           |
| maxResults      | number     | `100`                           | Cap on total matches returned                   |
| ignore          | string[]   | `[]`                            | Extra dir/file names to skip                    |

## SearchResult shape

```typescript
{
  pattern: string;
  filesScanned: number;
  totalMatches: number;
  byFile: Record<string, SearchMatch[]>;  // grouped by absolute path
  matches: SearchMatch[];                  // flat list
}
```

## Examples

```typescript
// Find all usages of a function
const result = await searchCodebase({ pattern: 'useAuthContext' });

// Case-sensitive regex
const result = await searchCodebase({
  pattern: 'error\\(',
  caseSensitive: true,
  fileExtensions: ['.ts', '.tsx'],
});

// Get just the file paths
import { matchingFiles } from '.agent/skills/codebase-search/index.js';
const files = matchingFiles(result);
```
