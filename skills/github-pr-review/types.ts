export interface ReviewOptions {
  /** GitHub repo owner */
  owner: string;
  /** GitHub repo name */
  repo: string;
  /** Pull request number */
  pullNumber: number;
  /** GitHub personal access token */
  token: string;
  /** Maximum files to review (default: 50) */
  maxFiles?: number;
}

export interface FileReview {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed' | string;
  additions: number;
  deletions: number;
  /** Automated notes for this file */
  notes: string[];
}

export interface PullRequestReview {
  title: string;
  body: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  filesChanged: number;
  totalAdditions: number;
  totalDeletions: number;
  files: FileReview[];
  summary: string;
}
