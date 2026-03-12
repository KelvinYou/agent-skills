# resume-review

AI-powered resume review skill that analyzes resumes from multiple hiring perspectives. Works for any profession — software engineering, HR, accounting, marketing, healthcare, and more.

## Installation

```bash
npx skills add https://github.com/<repo> --skill resume-review
```

## Supported Resume Formats

| Format | Extension | Library |
|--------|-----------|---------|
| PDF | `.pdf` | `pdf-parse` |
| Word | `.docx` | `mammoth` |
| Plain text | `.txt` | built-in |

File type is automatically detected from the extension.

## Usage

### CLI

```bash
skills run resume-review --file resume.pdf --role senior-engineer
skills run resume-review --file resume.docx --role hr
skills run resume-review --file resume.txt --role hiring-manager
```

### Programmatic

```typescript
import {
  reviewResume,
  parseReviewResponse,
  formatResumeReview,
} from '.agent/skills/resume-review/index.js';

// Parse resume and get the LLM prompt
const { prompt, rawText, role } = await reviewResume({
  file: './resume.pdf',
  role: 'senior-engineer',
  targetRole: 'engineering manager',
});

// Send the prompt to your LLM of choice
const llmResponse = await callLLM(prompt);

// Parse the JSON response into a structured result
const result = parseReviewResponse(llmResponse, './resume.pdf', role, rawText);

// Pretty-print the review
console.log(formatResumeReview(result));

// Or access structured data directly
console.log(`Score: ${result.score.overall}/10`);
console.log(`Strengths: ${result.strengths.length}`);
console.log(`Weaknesses: ${result.weaknesses.length}`);
```

## Review Modes

### HR Manager (`--role hr`)

Reviews from a recruiter/HR screening perspective:
- Resume clarity and structure
- ATS compatibility and keyword optimization
- Red flags (gaps, job hopping, vague descriptions)
- First-impression analysis (6-second scan test)
- Wording and formatting improvements

### Hiring Manager (`--role hiring-manager`)

Reviews from a hiring manager's decision-making perspective:
- Overall candidate impression
- Career narrative and progression
- Culture fit signals
- Whether the resume warrants an interview

### Senior Role Reviewer (`--role senior-engineer`)

Reviews from a senior hiring panel perspective, adapting to the candidate's field:
- Depth and breadth of domain expertise
- Evidence of impact (metrics, scale, outcomes)
- Strategic thinking and decision-making signals
- Leadership and cross-functional collaboration
- Professional development (certifications, publications, community involvement)
- Career progression and growth trajectory

Works for any role: software engineer, HR director, accountant, product manager, nurse, startup founder, etc.

## Output Structure

The review produces structured feedback:

1. **Overall Score** (1-10) with sub-scores for clarity, impact, and relevance
2. **Strengths** — what the resume does well
3. **Weaknesses** — gaps, red flags, or issues
4. **Key Improvements** — specific actionable changes
5. **ATS Optimization** — keyword and formatting advice
6. **Role-specific Advice** — perspective-based hiring insights
7. **Rewrite Suggestions** — improved bullet points with explanations

## Dependencies

- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX text extraction

## Requirements

- Node.js >= 18
