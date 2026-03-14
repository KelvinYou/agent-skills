import type { CommitLintResult } from './types.js';

/**
 * Conventional Commits lint rules.
 * Based on: https://www.conventionalcommits.org/en/v1.0.0/
 */

const VALID_TYPES = new Set([
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf',
  'test', 'build', 'ci', 'chore', 'revert',
]);

const HEADER_RE = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s+(?<subject>.+)$/;

const MAX_SUBJECT_LENGTH = 72;
const MAX_BODY_LINE_LENGTH = 100;

export function lintCommitMessage(raw: string): CommitLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = raw.trim().split('\n');
  const header = lines[0] ?? '';

  const match = header.match(HEADER_RE);

  if (!match || !match.groups) {
    errors.push(
      'Header must follow Conventional Commits format: <type>[optional scope]: <description>',
    );
    return { valid: false, errors, warnings, subject: header, type: null, scope: null, body: null };
  }

  const { type, scope, subject } = match.groups;

  // Type validation
  if (!VALID_TYPES.has(type)) {
    errors.push(
      `Invalid type "${type}". Must be one of: ${[...VALID_TYPES].join(', ')}`,
    );
  }

  // Subject rules
  if (subject.length === 0) {
    errors.push('Subject must not be empty');
  }

  if (subject[0] && subject[0] === subject[0].toUpperCase() && subject[0] !== subject[0].toLowerCase()) {
    warnings.push('Subject should start with a lowercase letter');
  }

  if (subject.endsWith('.')) {
    warnings.push('Subject should not end with a period');
  }

  if (header.length > MAX_SUBJECT_LENGTH) {
    warnings.push(`Header exceeds ${MAX_SUBJECT_LENGTH} characters (${header.length})`);
  }

  // Blank line between header and body
  const body = lines.length > 1 ? lines.slice(1).join('\n') : null;

  if (body !== null) {
    if (lines[1] !== '') {
      errors.push('There must be a blank line between the header and body');
    }

    const bodyLines = body.split('\n').filter((l) => l.trim().length > 0);
    for (const line of bodyLines) {
      if (line.length > MAX_BODY_LINE_LENGTH) {
        warnings.push(`Body line exceeds ${MAX_BODY_LINE_LENGTH} characters: "${line.slice(0, 40)}…"`);
        break;
      }
    }
  }

  // Scope validation
  if (scope && /[A-Z]/.test(scope)) {
    warnings.push('Scope should be lowercase');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    subject,
    type: VALID_TYPES.has(type) ? type : null,
    scope: scope ?? null,
    body: body?.trim() || null,
  };
}

/**
 * Format lint results as a human-readable string.
 */
export function formatLintResult(result: CommitLintResult): string {
  const lines: string[] = [];

  const status = result.valid ? '✓ Valid' : '✗ Invalid';
  lines.push(`${status} commit message`);

  if (result.type) {
    lines.push(`  Type: ${result.type}`);
  }
  if (result.scope) {
    lines.push(`  Scope: ${result.scope}`);
  }
  lines.push(`  Subject: ${result.subject}`);

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const e of result.errors) {
      lines.push(`  ✗ ${e}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const w of result.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
  }

  return lines.join('\n');
}
