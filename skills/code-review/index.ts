/**
 * Skill: code-review
 *
 * Static analysis and code quality review for TypeScript/JavaScript files.
 * Runs a set of configurable rules and returns structured results.
 *
 * Usage:
 *   import { reviewCode, formatCodeReview } from '.agent/skills/code-review/index.js';
 *
 *   const result = await reviewCode({ target: './src' });
 *   console.log(formatCodeReview(result));
 */

import * as fs from 'fs';
import * as path from 'path';
import { rules as defaultRules } from './rules.js';
import type {
  CodeReviewOptions,
  CodeReviewResult,
  FileReviewResult,
  Issue,
  RuleDefinition,
} from './types.js';

export type { CodeReviewOptions, CodeReviewResult, Issue, RuleDefinition };
export { defaultRules as rules };

const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run all (or a subset of) rules over a file or directory tree.
 */
export async function reviewCode(
  options: CodeReviewOptions,
  customRules: RuleDefinition[] = [],
): Promise<CodeReviewResult> {
  const {
    target,
    extensions = DEFAULT_EXTENSIONS,
    skipRules = [],
    maxFiles = 200,
  } = options;

  const activeRules = [...defaultRules, ...customRules].filter(
    (r) => !skipRules.includes(r.id),
  );

  const files = collectFiles(path.resolve(target), extensions, maxFiles);
  const byFile: FileReviewResult[] = [];

  for (const file of files) {
    const result = reviewFile(file, activeRules);
    byFile.push(result);
  }

  const allIssues = byFile.flatMap((f) => f.issues);
  const byRule: Record<string, Issue[]> = {};
  for (const issue of allIssues) {
    if (!byRule[issue.ruleId]) byRule[issue.ruleId] = [];
    byRule[issue.ruleId].push(issue);
  }

  const errors = allIssues.filter((i) => i.severity === 'error').length;
  const warnings = allIssues.filter((i) => i.severity === 'warning').length;
  const infos = allIssues.filter((i) => i.severity === 'info').length;

  return {
    target,
    filesReviewed: files.length,
    totalIssues: allIssues.length,
    errors,
    warnings,
    infos,
    byFile: byFile.filter((f) => f.issues.length > 0),
    byRule,
    passed: errors === 0,
  };
}

/**
 * Format a CodeReviewResult as a readable report string.
 */
export function formatCodeReview(result: CodeReviewResult): string {
  const lines: string[] = [];
  const { errors, warnings, infos, totalIssues, filesReviewed } = result;

  const status = result.passed ? '✓ PASSED' : '✗ FAILED';
  lines.push(`\n${status}  (${filesReviewed} files, ${totalIssues} issue(s): ${errors} errors, ${warnings} warnings, ${infos} infos)`);
  lines.push('');

  for (const fileResult of result.byFile) {
    lines.push(`── ${fileResult.file}`);
    for (const issue of fileResult.issues) {
      const sev = issue.severity === 'error' ? 'ERR' : issue.severity === 'warning' ? 'WRN' : 'INF';
      lines.push(`   ${sev}  ${issue.line}:${issue.column}  [${issue.ruleId}]  ${issue.message}`);
      lines.push(`         ${issue.snippet}`);
    }
    lines.push('');
  }

  if (totalIssues === 0) {
    lines.push('No issues found.');
  }

  return lines.join('\n');
}

/**
 * Review a single source file and return its issues.
 */
export function reviewFile(
  filePath: string,
  activeRules: RuleDefinition[] = defaultRules,
): FileReviewResult {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return { file: filePath, issues: [], linesReviewed: 0 };
  }

  const lines = content.split('\n');
  const issues: Issue[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (const rule of activeRules) {
      const issue = rule.check(lines[i], i, lines, filePath);
      if (issue) issues.push(issue);
    }
  }

  return { file: filePath, issues, linesReviewed: lines.length };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function collectFiles(
  target: string,
  extensions: string[],
  maxFiles: number,
): string[] {
  const results: string[] = [];

  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return extensions.includes(path.extname(target)) ? [target] : [];
  }

  walk(target, extensions, IGNORE, (f) => {
    if (results.length < maxFiles) results.push(f);
  });

  return results;
}

function walk(
  dir: string,
  extensions: string[],
  ignore: Set<string>,
  visitor: (f: string) => void,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
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
