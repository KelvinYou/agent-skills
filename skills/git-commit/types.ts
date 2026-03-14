export interface CommitMessageOptions {
  /** Working directory (default: process.cwd()) */
  cwd?: string;
  /** Include only these file paths in the diff (default: all staged) */
  paths?: string[];
  /** Maximum diff lines to analyze (default: 500) */
  maxDiffLines?: number;
  /** Commit type override — skip auto-detection */
  type?: CommitType;
  /** Scope override (e.g. "auth", "api") */
  scope?: string;
  /** Whether this is a breaking change */
  breaking?: boolean;
}

export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

export interface CommitLintResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  subject: string;
  type: string | null;
  scope: string | null;
  body: string | null;
}

export interface GeneratedCommit {
  /** Full formatted commit message */
  message: string;
  /** Detected or overridden type */
  type: CommitType;
  /** Detected or overridden scope */
  scope: string | null;
  /** One-line subject */
  subject: string;
  /** Optional body with details */
  body: string | null;
  /** Whether the commit is marked as breaking */
  breaking: boolean;
  /** Summary of what changed */
  changeSummary: string[];
}
