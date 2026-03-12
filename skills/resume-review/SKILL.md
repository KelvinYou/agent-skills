---
name: resume-review
description: AI-powered resume review with HR and senior hiring manager perspectives
---

# Resume Review

AI-powered resume analysis that provides professional feedback from multiple hiring perspectives. Supports PDF, DOCX, and plain text resumes.

## Usage

```typescript
import { reviewResume, parseReviewResponse, formatResumeReview } from '.agent/skills/resume-review/index.js';

// Step 1: Parse resume and build prompt
const { prompt, rawText, role } = await reviewResume({
  file: './resume.pdf',
  role: 'senior-engineer',
  targetRole: 'engineering manager',
});

// Step 2: Send prompt to your LLM and get response
const llmResponse = await yourLLM(prompt);

// Step 3: Parse and format
const result = parseReviewResponse(llmResponse, './resume.pdf', role, rawText);
console.log(formatResumeReview(result));
```

## Supported Formats

- PDF (`.pdf`) — via `pdf-parse`
- Word (`.docx`) — via `mammoth`
- Plain text (`.txt`)

## Review Modes

| Role | Flag | Focus |
|------|------|-------|
| HR Manager | `--role hr` | Clarity, structure, ATS, red flags |
| Hiring Manager | `--role hiring-manager` | Overall impression, culture fit, career story |
| Senior Role Reviewer | `--role senior-engineer` | Domain expertise, impact, leadership signals |

## Features

- Structured feedback with scores (1-10) for overall, clarity, impact, and relevance
- Strengths and weaknesses analysis
- Actionable improvement suggestions
- ATS optimization advice
- Role-specific hiring insights
- Concrete bullet point rewrites with explanations

## Requirements

- Node.js >= 18
