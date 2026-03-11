import type { RuleDefinition, Issue } from './types.js';

function makeIssue(
  ruleId: string,
  severity: Issue['severity'],
  message: string,
  file: string,
  line: number,
  column: number,
  snippet: string,
): Issue {
  return { ruleId, severity, message, file, line, column, snippet };
}

export const rules: RuleDefinition[] = [
  // ── Debug artefacts ─────────────────────────────────────────────────────────
  {
    id: 'no-console',
    description: 'Disallow console.* statements in production code',
    severity: 'warning',
    check: (line, i, _all, file) => {
      const m = line.match(/console\.(log|warn|error|debug|info|trace)\s*\(/);
      if (!m) return null;
      return makeIssue('no-console', 'warning', `console.${m[1]} should be removed`, file, i + 1, line.indexOf('console') + 1, line.trim());
    },
  },
  {
    id: 'no-debugger',
    description: 'Disallow debugger statements',
    severity: 'error',
    check: (line, i, _all, file) => {
      if (!/\bdebugger\b/.test(line)) return null;
      return makeIssue('no-debugger', 'error', '`debugger` statement found', file, i + 1, line.indexOf('debugger') + 1, line.trim());
    },
  },

  // ── TODO markers ─────────────────────────────────────────────────────────────
  {
    id: 'no-todo',
    description: 'Flag TODO/FIXME/HACK comments',
    severity: 'info',
    check: (line, i, _all, file) => {
      const m = line.match(/\/\/.*\b(TODO|FIXME|HACK|XXX)\b(.*)$/i);
      if (!m) return null;
      const col = line.indexOf('//') + 1;
      return makeIssue('no-todo', 'info', `${m[1]}: ${m[2].trim() || '(no detail)'}`, file, i + 1, col, line.trim());
    },
  },

  // ── Security ──────────────────────────────────────────────────────────────────
  {
    id: 'no-hardcoded-secret',
    description: 'Detect possible hardcoded passwords or API keys',
    severity: 'error',
    check: (line, i, _all, file) => {
      if (/(password|secret|api_?key|auth_?token)\s*[:=]\s*['"][^'"]{6,}/i.test(line)) {
        return makeIssue('no-hardcoded-secret', 'error', 'Possible hardcoded secret — use environment variables', file, i + 1, 1, line.trim());
      }
      return null;
    },
  },
  {
    id: 'no-eval',
    description: 'Disallow eval() usage',
    severity: 'error',
    check: (line, i, _all, file) => {
      if (!/\beval\s*\(/.test(line)) return null;
      return makeIssue('no-eval', 'error', '`eval()` is a security risk', file, i + 1, line.indexOf('eval') + 1, line.trim());
    },
  },

  // ── Code style ────────────────────────────────────────────────────────────────
  {
    id: 'max-line-length',
    description: 'Lines should not exceed 120 characters',
    severity: 'warning',
    check: (line, i, _all, file) => {
      if (line.length <= 120) return null;
      return makeIssue('max-line-length', 'warning', `Line length ${line.length} exceeds 120 characters`, file, i + 1, 121, line.slice(0, 60) + '…');
    },
  },
  {
    id: 'no-trailing-whitespace',
    description: 'Lines must not end with whitespace',
    severity: 'info',
    check: (line, i, _all, file) => {
      if (!/\s+$/.test(line)) return null;
      return makeIssue('no-trailing-whitespace', 'info', 'Trailing whitespace', file, i + 1, line.trimEnd().length + 1, JSON.stringify(line));
    },
  },

  // ── TypeScript-specific ───────────────────────────────────────────────────────
  {
    id: 'no-any',
    description: 'Avoid explicit `any` type annotations',
    severity: 'warning',
    check: (line, i, _all, file) => {
      if (!/:\s*any\b/.test(line)) return null;
      return makeIssue('no-any', 'warning', 'Explicit `any` type — prefer a specific type or `unknown`', file, i + 1, line.search(/:\s*any\b/) + 1, line.trim());
    },
  },
  {
    id: 'no-non-null-assertion',
    description: 'Avoid non-null assertions (!)',
    severity: 'info',
    check: (line, i, _all, file) => {
      if (!/\w!\./.test(line) && !/\w!\s*[,)\];]/.test(line)) return null;
      return makeIssue('no-non-null-assertion', 'info', 'Non-null assertion — add a proper null check', file, i + 1, 1, line.trim());
    },
  },
];
