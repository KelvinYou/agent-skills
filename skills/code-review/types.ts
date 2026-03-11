export interface CodeReviewOptions {
  /** File or directory path to review */
  target: string;
  /** File extensions to include (default: .ts .tsx .js .jsx) */
  extensions?: string[];
  /** Rules to skip by ID */
  skipRules?: string[];
  /** Maximum files to review (default: 200) */
  maxFiles?: number;
}

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  ruleId: string;
  severity: IssueSeverity;
  message: string;
  file: string;
  line: number;
  column: number;
  snippet: string;
}

export interface RuleDefinition {
  id: string;
  description: string;
  severity: IssueSeverity;
  check: (line: string, lineIndex: number, allLines: string[], filePath: string) => Issue | null;
}

export interface FileReviewResult {
  file: string;
  issues: Issue[];
  linesReviewed: number;
}

export interface CodeReviewResult {
  target: string;
  filesReviewed: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  byFile: FileReviewResult[];
  byRule: Record<string, Issue[]>;
  passed: boolean;
}
