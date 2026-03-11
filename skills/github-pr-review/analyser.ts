import type { FileReview } from './types.js';

/** Produce automated notes for a single changed file. */
export function analyseFile(
  filename: string,
  patch: string | undefined,
  additions: number,
  deletions: number,
): string[] {
  const notes: string[] = [];

  if (!patch) {
    notes.push('Binary file or no textual diff available.');
    return notes;
  }

  // Volume warnings
  if (additions > 300) {
    notes.push(
      `Large addition (${additions} lines) — consider splitting into smaller PRs.`,
    );
  }
  if (deletions > additions * 2) {
    notes.push(
      `Significant removal (${deletions} lines deleted vs ${additions} added) — verify this is intentional.`,
    );
  }

  // Debug artefacts
  if (/console\.(log|warn|error|debug)/.test(patch)) {
    notes.push('Debug console statements detected — remove before merging.');
  }
  if (/\bdebugger\b/.test(patch)) {
    notes.push('`debugger` statement found.');
  }

  // TODO / FIXME markers
  const todoMatches = patch.match(/\+.*\b(TODO|FIXME|HACK|XXX)\b/g);
  if (todoMatches && todoMatches.length > 0) {
    notes.push(
      `${todoMatches.length} TODO/FIXME/HACK marker(s) added — track or resolve.`,
    );
  }

  // Hardcoded secrets heuristic
  if (/\+.*(password|secret|api_key|apikey)\s*[:=]\s*['"][^'"]{6,}/i.test(patch)) {
    notes.push(
      '⚠  Possible hardcoded secret detected — review carefully and use environment variables.',
    );
  }

  // Test coverage hint
  const isSourceFile = /\.(ts|js|tsx|jsx|py|go|rs|java)$/.test(filename);
  const isTestFile = /\.(test|spec)\.(ts|js|tsx|jsx|py)$/.test(filename);
  if (isSourceFile && !isTestFile && additions > 30) {
    notes.push('No corresponding test file modified — consider adding tests.');
  }

  if (notes.length === 0) {
    notes.push('No automated issues detected.');
  }

  return notes;
}

/** Produce a plain-text summary of the whole review. */
export function buildSummary(files: FileReview[]): string {
  const flagged = files.filter(
    (f) =>
      f.notes.length > 0 &&
      f.notes[0] !== 'No automated issues detected.',
  );

  const parts: string[] = [
    `${files.length} file(s) changed.`,
  ];

  if (flagged.length === 0) {
    parts.push('No automated issues found — good to review manually.');
  } else {
    parts.push(`${flagged.length} file(s) flagged for attention:`);
    flagged.forEach((f) => {
      parts.push(`  • ${f.filename}: ${f.notes.join(' | ')}`);
    });
  }

  return parts.join('\n');
}
