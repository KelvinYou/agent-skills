/**
 * Skill: codebase-search
 *
 * Fast recursive file search with regex support, configurable context lines,
 * and results grouped by file.
 *
 * Usage:
 *   import { searchCodebase, formatResults } from '.agent/skills/codebase-search/index.js';
 *
 *   const result = await searchCodebase({
 *     pattern: 'TODO',
 *     directory: './src',
 *     contextLines: 2,
 *   });
 *
 *   console.log(formatResults(result));
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SearchOptions, SearchMatch, SearchResult } from './types.js';

export type { SearchOptions, SearchMatch, SearchResult };

const DEFAULT_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt',
  '.c', '.cpp', '.h', '.cs',
  '.rb', '.php', '.swift',
  '.json', '.yaml', '.yml', '.toml', '.env',
  '.md', '.mdx', '.txt',
];

const DEFAULT_IGNORE = [
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  '.cache', '__pycache__', '.venv', 'venv', 'target', '.turbo',
  'coverage', '.nyc_output', 'out', '.output',
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search a directory tree for a pattern.
 */
export async function searchCodebase(
  options: SearchOptions,
): Promise<SearchResult> {
  const {
    pattern,
    directory = process.cwd(),
    fileExtensions = DEFAULT_EXTENSIONS,
    caseSensitive = false,
    contextLines = 2,
    maxResults = 100,
    ignore = [],
  } = options;

  const ignoreSet = new Set([...DEFAULT_IGNORE, ...ignore]);
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(pattern, flags);

  const matches: SearchMatch[] = [];
  let filesScanned = 0;

  walk(directory, fileExtensions, ignoreSet, (filePath) => {
    filesScanned++;
    if (matches.length >= maxResults) return;
    const fileMatches = searchFile(filePath, regex, contextLines, maxResults - matches.length);
    matches.push(...fileMatches);
  });

  const byFile: Record<string, SearchMatch[]> = {};
  for (const match of matches) {
    if (!byFile[match.file]) byFile[match.file] = [];
    byFile[match.file].push(match);
  }

  return {
    pattern,
    filesScanned,
    totalMatches: matches.length,
    byFile,
    matches,
  };
}

/**
 * Format a SearchResult as a readable string.
 */
export function formatResults(result: SearchResult): string {
  if (result.totalMatches === 0) {
    return `No matches found for pattern: ${result.pattern}\n(${result.filesScanned} files scanned)`;
  }

  const lines: string[] = [
    `Found ${result.totalMatches} match(es) across ${Object.keys(result.byFile).length} file(s)`,
    `(${result.filesScanned} files scanned for pattern: ${result.pattern})`,
    '',
  ];

  for (const [file, matches] of Object.entries(result.byFile)) {
    lines.push(`── ${file}`);
    for (const m of matches) {
      lines.push(`   ${m.line}:${m.column}  ${m.content}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Return every unique file path that matches the pattern.
 */
export function matchingFiles(result: SearchResult): string[] {
  return Object.keys(result.byFile);
}

// ─── Internals ────────────────────────────────────────────────────────────────

function walk(
  dir: string,
  extensions: string[],
  ignore: Set<string>,
  visitor: (filePath: string) => void,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return; // unreadable directory
  }

  for (const entry of entries) {
    if (ignore.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, extensions, ignore, visitor);
    } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
      visitor(full);
    }
  }
}

function searchFile(
  filePath: string,
  regex: RegExp,
  contextLines: number,
  remaining: number,
): SearchMatch[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.split('\n');
  const results: SearchMatch[] = [];

  for (let i = 0; i < lines.length && results.length < remaining; i++) {
    const line = lines[i];
    regex.lastIndex = 0;
    const match = regex.exec(line);
    if (!match) continue;

    const beforeStart = Math.max(0, i - contextLines);
    const afterEnd = Math.min(lines.length - 1, i + contextLines);

    results.push({
      file: filePath,
      line: i + 1,
      column: match.index + 1,
      content: line.trimEnd(),
      context: {
        before: lines.slice(beforeStart, i),
        after: lines.slice(i + 1, afterEnd + 1),
      },
    });
  }

  return results;
}
