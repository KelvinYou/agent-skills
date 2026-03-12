export type ReviewRole = 'hr' | 'senior-engineer' | 'hiring-manager';

export interface ResumeReviewOptions {
  /** Path to the resume file (.pdf, .docx, or .txt) */
  file: string;
  /** Review perspective to use */
  role?: ReviewRole;
  /** Target job title for role-specific advice */
  targetRole?: string;
}

export interface ResumeScore {
  overall: number;
  clarity: number;
  impact: number;
  relevance: number;
}

export interface BulletRewrite {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeReviewResult {
  file: string;
  role: ReviewRole;
  score: ResumeScore;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  atsAdvice: string[];
  roleSpecificAdvice: string[];
  rewriteSuggestions: BulletRewrite[];
  rawText: string;
}

export type SupportedFormat = 'pdf' | 'docx' | 'txt';
