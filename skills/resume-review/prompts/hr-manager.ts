/**
 * Prompt template for HR Manager / recruiter perspective review.
 */
export function hrManagerPrompt(resumeText: string, targetRole?: string): string {
  const roleContext = targetRole
    ? `The candidate is targeting a ${targetRole} position.`
    : 'No specific target role was provided.';

  return `You are a senior HR manager with 15+ years of experience in talent acquisition and resume screening.

${roleContext}

Analyze the following resume and provide a structured review:

1. **Overall Score (1-10)** — How effective is this resume at getting an interview?
   Also rate: clarity (1-10), impact (1-10), relevance (1-10).

2. **Strengths** — What does this resume do well?

3. **Weaknesses** — What are the gaps, red flags, or issues?

4. **Key Improvements** — Specific, actionable changes to make.

5. **ATS Optimization** — Will this resume pass applicant tracking systems? What keywords are missing? Are there formatting issues that could cause parsing failures?

6. **Hiring Manager Perspective** — What would a hiring manager think when they see this resume? What would make them reach out vs. pass?

7. **Rewrite Suggestions** — Pick the 3 weakest bullet points and rewrite them to be stronger. For each, explain why the rewrite is better.

Focus on:
- Resume structure and formatting clarity
- Whether the resume tells a compelling career story
- Red flags (gaps, job hopping, vague descriptions)
- ATS-friendliness (keywords, section headers, file format)
- First-impression impact (would this get past a 6-second scan?)

RESUME:
---
${resumeText}
---

Respond with valid JSON matching this structure:
{
  "score": { "overall": number, "clarity": number, "impact": number, "relevance": number },
  "strengths": [string],
  "weaknesses": [string],
  "improvements": [string],
  "atsAdvice": [string],
  "roleSpecificAdvice": [string],
  "rewriteSuggestions": [{ "original": string, "improved": string, "reason": string }]
}`;
}
