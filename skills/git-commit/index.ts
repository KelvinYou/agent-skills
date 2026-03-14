/**
 * Skill: git-commit
 *
 * Generates and validates Conventional Commits messages from staged git changes.
 * Analyzes diffs to auto-detect commit type, scope, and subject.
 *
 * Usage:
 *   import { generateCommit, lintCommitMessage, formatCommit } from '.agent/skills/git-commit/index.js';
 *
 *   const commit = await generateCommit();
 *   console.log(formatCommit(commit));
 *
 *   const lint = lintCommitMessage('feat(auth): add OAuth2 support');
 *   console.log(lint.valid);
 */

import { execSync } from 'child_process';
import * as path from 'path';
import type { CommitMessageOptions, CommitType, GeneratedCommit } from './types.js';
export type { CommitMessageOptions, CommitType, GeneratedCommit, CommitLintResult } from './types.js';
export { lintCommitMessage, formatLintResult } from './rules.js';

// ─── Type detection heuristics ───────────────────────────────────────────────

interface DiffStats {
  filesAdded: string[];
  filesModified: string[];
  filesDeleted: string[];
  filesRenamed: string[];
  totalAdditions: number;
  totalDeletions: number;
  diffContent: string;
}

const TYPE_SIGNALS: Record<CommitType, (s: DiffStats) => number> = {
  feat: (s) => {
    let score = 0;
    if (s.filesAdded.length > 0) score += 2;
    if (s.totalAdditions > s.totalDeletions * 2) score += 2;
    if (s.diffContent.includes('export ')) score += 1;
    return score;
  },
  fix: (s) => {
    let score = 0;
    if (s.diffContent.match(/fix(es|ed)?[\s:]/i)) score += 3;
    if (s.diffContent.match(/bug|issue|patch|error|crash/i)) score += 2;
    if (s.totalDeletions > 0 && s.totalAdditions > 0 && s.filesAdded.length === 0) score += 1;
    return score;
  },
  docs: (s) => {
    let score = 0;
    const docExts = ['.md', '.txt', '.rst', '.adoc'];
    const allFiles = [...s.filesAdded, ...s.filesModified, ...s.filesDeleted];
    if (allFiles.every((f) => docExts.includes(path.extname(f)))) score += 5;
    if (s.diffContent.match(/README|CHANGELOG|LICENSE|CONTRIBUTING/)) score += 2;
    return score;
  },
  test: (s) => {
    let score = 0;
    const allFiles = [...s.filesAdded, ...s.filesModified];
    const testFiles = allFiles.filter((f) =>
      /\.(test|spec|e2e)\.[^.]+$/.test(f) || f.includes('__tests__'),
    );
    if (testFiles.length > 0 && testFiles.length === allFiles.length) score += 5;
    if (testFiles.length > 0) score += 2;
    return score;
  },
  refactor: (s) => {
    let score = 0;
    if (s.filesRenamed.length > 0) score += 2;
    if (s.totalAdditions > 0 && s.totalDeletions > 0 && Math.abs(s.totalAdditions - s.totalDeletions) < 10) score += 2;
    if (s.filesAdded.length === 0 && s.filesDeleted.length === 0) score += 1;
    return score;
  },
  style: (s) => {
    let score = 0;
    if (s.diffContent.match(/^\s*[+-]\s*$/m)) score += 1;
    const styleFiles = [...s.filesAdded, ...s.filesModified].filter((f) =>
      /\.(css|scss|less|styled)/.test(f),
    );
    if (styleFiles.length > 0) score += 2;
    return score;
  },
  perf: (s) => {
    let score = 0;
    if (s.diffContent.match(/perf(ormance)?|optimi[zs]|cache|memo|lazy/i)) score += 3;
    return score;
  },
  build: (s) => {
    let score = 0;
    const buildFiles = [...s.filesAdded, ...s.filesModified].filter((f) =>
      /(package\.json|tsconfig|webpack|vite|rollup|esbuild|Makefile|Dockerfile|\.dockerignore)/.test(f),
    );
    if (buildFiles.length > 0) score += 3;
    return score;
  },
  ci: (s) => {
    let score = 0;
    const ciFiles = [...s.filesAdded, ...s.filesModified].filter((f) =>
      /\.github\/workflows|\.gitlab-ci|Jenkinsfile|\.circleci|\.travis/.test(f),
    );
    if (ciFiles.length > 0) score += 5;
    return score;
  },
  chore: () => 0,
  revert: (s) => {
    let score = 0;
    if (s.totalDeletions > s.totalAdditions * 2) score += 2;
    if (s.diffContent.match(/revert/i)) score += 3;
    return score;
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze staged git changes and generate a Conventional Commits message.
 */
export async function generateCommit(
  options: CommitMessageOptions = {},
): Promise<GeneratedCommit> {
  const {
    cwd = process.cwd(),
    paths,
    maxDiffLines = 500,
    type: typeOverride,
    scope: scopeOverride,
    breaking = false,
  } = options;

  const stats = getStagedDiffStats(cwd, paths, maxDiffLines);

  if (stats.filesAdded.length + stats.filesModified.length + stats.filesDeleted.length + stats.filesRenamed.length === 0) {
    throw new Error('No staged changes found. Stage files with `git add` first.');
  }

  const type = typeOverride ?? detectType(stats);
  const scope = scopeOverride ?? detectScope(stats);
  const subject = buildSubject(type, stats);
  const changeSummary = buildChangeSummary(stats);
  const body = changeSummary.length > 1 ? changeSummary.map((s) => `- ${s}`).join('\n') : null;

  const breakingMarker = breaking ? '!' : '';
  const scopePart = scope ? `(${scope})` : '';
  const header = `${type}${scopePart}${breakingMarker}: ${subject}`;
  const message = body ? `${header}\n\n${body}` : header;

  return { message, type, scope, subject, body, breaking, changeSummary };
}

/**
 * Format a GeneratedCommit as a readable preview string.
 */
export function formatCommit(commit: GeneratedCommit): string {
  const lines: string[] = [];
  lines.push('Generated commit message:');
  lines.push('');
  lines.push(`  ${commit.message.split('\n').join('\n  ')}`);
  lines.push('');
  lines.push(`Type: ${commit.type}${commit.breaking ? ' (BREAKING)' : ''}`);
  if (commit.scope) lines.push(`Scope: ${commit.scope}`);
  if (commit.changeSummary.length > 0) {
    lines.push('');
    lines.push('Changes:');
    for (const s of commit.changeSummary) {
      lines.push(`  - ${s}`);
    }
  }
  return lines.join('\n');
}

// ─── Internals ───────────────────────────────────────────────────────────────

function git(args: string, cwd: string): string {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function getStagedDiffStats(cwd: string, paths?: string[], maxDiffLines?: number): DiffStats {
  const pathSpec = paths && paths.length > 0 ? `-- ${paths.map((p) => `"${p}"`).join(' ')}` : '';

  const nameStatus = git(`diff --cached --name-status ${pathSpec}`, cwd);
  const filesAdded: string[] = [];
  const filesModified: string[] = [];
  const filesDeleted: string[] = [];
  const filesRenamed: string[] = [];

  for (const line of nameStatus.split('\n').filter(Boolean)) {
    const [status, ...fileParts] = line.split('\t');
    const file = fileParts[fileParts.length - 1] ?? '';
    switch (status?.[0]) {
      case 'A': filesAdded.push(file); break;
      case 'M': filesModified.push(file); break;
      case 'D': filesDeleted.push(file); break;
      case 'R': filesRenamed.push(file); break;
    }
  }

  const numstat = git(`diff --cached --numstat ${pathSpec}`, cwd);
  let totalAdditions = 0;
  let totalDeletions = 0;
  for (const line of numstat.split('\n').filter(Boolean)) {
    const [add, del] = line.split('\t');
    totalAdditions += parseInt(add ?? '0', 10) || 0;
    totalDeletions += parseInt(del ?? '0', 10) || 0;
  }

  let diffContent = git(`diff --cached ${pathSpec}`, cwd);
  if (maxDiffLines) {
    diffContent = diffContent.split('\n').slice(0, maxDiffLines).join('\n');
  }

  return { filesAdded, filesModified, filesDeleted, filesRenamed, totalAdditions, totalDeletions, diffContent };
}

function detectType(stats: DiffStats): CommitType {
  let bestType: CommitType = 'chore';
  let bestScore = 0;

  for (const [type, scoreFn] of Object.entries(TYPE_SIGNALS) as [CommitType, (s: DiffStats) => number][]) {
    const score = scoreFn(stats);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

function detectScope(stats: DiffStats): string | null {
  const allFiles = [
    ...stats.filesAdded,
    ...stats.filesModified,
    ...stats.filesDeleted,
    ...stats.filesRenamed,
  ];

  if (allFiles.length === 0) return null;

  // Extract top-level directories
  const dirs = allFiles
    .map((f) => f.split('/'))
    .filter((parts) => parts.length > 1)
    .map((parts) => parts[0]);

  if (dirs.length === 0) return null;

  // If all files share the same top-level dir, use it
  const unique = [...new Set(dirs)];
  if (unique.length === 1) return unique[0]!.toLowerCase();

  // If all files share a second-level dir under a common root, use "root/subdir"
  if (unique.length === 1) {
    const subdirs = allFiles
      .map((f) => f.split('/'))
      .filter((parts) => parts.length > 2)
      .map((parts) => parts[1]);
    const uniqueSub = [...new Set(subdirs)];
    if (uniqueSub.length === 1) return `${unique[0]}/${uniqueSub[0]}`.toLowerCase();
  }

  return null;
}

function buildSubject(type: CommitType, stats: DiffStats): string {
  const allFiles = [
    ...stats.filesAdded,
    ...stats.filesModified,
    ...stats.filesDeleted,
    ...stats.filesRenamed,
  ];

  const basenames = allFiles.map((f) => path.basename(f, path.extname(f)));

  // Single file change
  if (allFiles.length === 1) {
    const verb = stats.filesAdded.length ? 'add' : stats.filesDeleted.length ? 'remove' : 'update';
    return `${verb} ${allFiles[0]}`;
  }

  // Multiple files in same dir
  const dirs = [...new Set(allFiles.map((f) => path.dirname(f)))];
  if (dirs.length === 1) {
    const verb = stats.filesAdded.length > stats.filesModified.length ? 'add' : 'update';
    return `${verb} ${basenames.length} files in ${dirs[0]}`;
  }

  // Fallback
  const verb = type === 'feat' ? 'add' : type === 'fix' ? 'fix' : type === 'refactor' ? 'refactor' : 'update';
  return `${verb} ${allFiles.length} files`;
}

function buildChangeSummary(stats: DiffStats): string[] {
  const summary: string[] = [];

  if (stats.filesAdded.length > 0) {
    summary.push(`Added: ${stats.filesAdded.join(', ')}`);
  }
  if (stats.filesModified.length > 0) {
    summary.push(`Modified: ${stats.filesModified.join(', ')}`);
  }
  if (stats.filesDeleted.length > 0) {
    summary.push(`Deleted: ${stats.filesDeleted.join(', ')}`);
  }
  if (stats.filesRenamed.length > 0) {
    summary.push(`Renamed: ${stats.filesRenamed.join(', ')}`);
  }

  summary.push(`${stats.totalAdditions} insertion(s), ${stats.totalDeletions} deletion(s)`);

  return summary;
}
