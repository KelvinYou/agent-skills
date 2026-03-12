/**
 * Skill: resume-review
 *
 * AI-powered resume review with HR and senior hiring manager perspectives.
 * Parses PDF, DOCX, and TXT resumes and generates structured feedback.
 *
 * Usage:
 *   import { reviewResume, formatResumeReview } from '.agent/skills/resume-review/index.js';
 *
 *   const result = await reviewResume({ file: './resume.pdf', role: 'senior-engineer' });
 *   console.log(formatResumeReview(result));
 */

import * as path from 'path';
import { parsePdf } from './parsers/pdf.js';
import { parseDocx } from './parsers/docx.js';
import { parseText } from './parsers/text.js';
import { hrManagerPrompt } from './prompts/hr-manager.js';
import { seniorEngineerPrompt } from './prompts/senior-engineer.js';
import type {
  ResumeReviewOptions,
  ResumeReviewResult,
  ReviewRole,
  SupportedFormat,
  ResumeScore,
  BulletRewrite,
} from './types.js';

export type {
  ResumeReviewOptions,
  ResumeReviewResult,
  ReviewRole,
  SupportedFormat,
  ResumeScore,
  BulletRewrite,
};

const FORMAT_MAP: Record<string, SupportedFormat> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'txt',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detect the file format from its extension.
 */
export function detectFormat(filePath: string): SupportedFormat {
  const ext = path.extname(filePath).toLowerCase();
  const format = FORMAT_MAP[ext];
  if (!format) {
    throw new Error(
      `Unsupported file format "${ext}". Supported formats: ${Object.keys(FORMAT_MAP).join(', ')}`,
    );
  }
  return format;
}

/**
 * Parse a resume file into plain text.
 */
export async function parseResume(filePath: string): Promise<string> {
  const format = detectFormat(filePath);
  switch (format) {
    case 'pdf':
      return parsePdf(filePath);
    case 'docx':
      return parseDocx(filePath);
    case 'txt':
      return parseText(filePath);
  }
}

/**
 * Build the review prompt for the given role.
 */
export function buildPrompt(
  resumeText: string,
  role: ReviewRole,
  targetRole?: string,
): string {
  switch (role) {
    case 'hr':
    case 'hiring-manager':
      return hrManagerPrompt(resumeText, targetRole);
    case 'senior-engineer':
      return seniorEngineerPrompt(resumeText, targetRole);
  }
}

/**
 * Review a resume file and return structured feedback.
 *
 * This function parses the resume, builds a role-appropriate prompt,
 * and returns the prompt along with parsed text. The caller is responsible
 * for sending the prompt to an LLM and parsing the JSON response.
 *
 * For a complete end-to-end flow, use `reviewResumeWithLLM` instead.
 */
export async function reviewResume(
  options: ResumeReviewOptions,
): Promise<{ prompt: string; rawText: string; role: ReviewRole }> {
  const { file, role = 'hr', targetRole } = options;
  const resolvedPath = path.resolve(file);

  const rawText = await parseResume(resolvedPath);
  if (!rawText || rawText.length < 20) {
    throw new Error('Resume appears to be empty or too short to review.');
  }

  const prompt = buildPrompt(rawText, role, targetRole);

  return { prompt, rawText, role };
}

/**
 * Parse an LLM response into a structured ResumeReviewResult.
 */
export function parseReviewResponse(
  jsonString: string,
  file: string,
  role: ReviewRole,
  rawText: string,
): ResumeReviewResult {
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from LLM response.');
  }

  const data = JSON.parse(jsonMatch[0]);

  return {
    file,
    role,
    score: data.score,
    strengths: data.strengths ?? [],
    weaknesses: data.weaknesses ?? [],
    improvements: data.improvements ?? [],
    atsAdvice: data.atsAdvice ?? [],
    roleSpecificAdvice: data.roleSpecificAdvice ?? [],
    rewriteSuggestions: data.rewriteSuggestions ?? [],
    rawText,
  };
}

/**
 * Format a ResumeReviewResult as a readable report string.
 */
export function formatResumeReview(result: ResumeReviewResult): string {
  const lines: string[] = [];
  const { score, role, file } = result;

  lines.push('');
  lines.push(`Resume Review: ${path.basename(file)}`);
  lines.push(`Perspective: ${formatRole(role)}`);
  lines.push('═'.repeat(60));

  // Score
  lines.push('');
  lines.push(`Overall Score: ${score.overall}/10`);
  lines.push(`  Clarity: ${score.clarity}/10  |  Impact: ${score.impact}/10  |  Relevance: ${score.relevance}/10`);

  // Strengths
  if (result.strengths.length > 0) {
    lines.push('');
    lines.push('── Strengths');
    for (const s of result.strengths) {
      lines.push(`   + ${s}`);
    }
  }

  // Weaknesses
  if (result.weaknesses.length > 0) {
    lines.push('');
    lines.push('── Weaknesses');
    for (const w of result.weaknesses) {
      lines.push(`   - ${w}`);
    }
  }

  // Improvements
  if (result.improvements.length > 0) {
    lines.push('');
    lines.push('── Key Improvements');
    for (const imp of result.improvements) {
      lines.push(`   * ${imp}`);
    }
  }

  // ATS Advice
  if (result.atsAdvice.length > 0) {
    lines.push('');
    lines.push('── ATS Optimization');
    for (const a of result.atsAdvice) {
      lines.push(`   > ${a}`);
    }
  }

  // Role-specific Advice
  if (result.roleSpecificAdvice.length > 0) {
    lines.push('');
    lines.push('── Role-specific Advice');
    for (const r of result.roleSpecificAdvice) {
      lines.push(`   > ${r}`);
    }
  }

  // Rewrite Suggestions
  if (result.rewriteSuggestions.length > 0) {
    lines.push('');
    lines.push('── Rewrite Suggestions');
    for (const rw of result.rewriteSuggestions) {
      lines.push('');
      lines.push(`   Before: ${rw.original}`);
      lines.push(`   After:  ${rw.improved}`);
      lines.push(`   Why:    ${rw.reason}`);
    }
  }

  lines.push('');
  lines.push('═'.repeat(60));
  return lines.join('\n');
}

// ─── Internals ────────────────────────────────────────────────────────────────

function formatRole(role: ReviewRole): string {
  switch (role) {
    case 'hr':
      return 'HR Manager';
    case 'hiring-manager':
      return 'Hiring Manager';
    case 'senior-engineer':
      return 'Senior Engineer';
  }
}
