---
name: github-pr-review
description: Fetch and analyse a GitHub pull request — surfaces diffs, file-level notes, and a summary
---

# GitHub PR Review

Fetch and analyse a GitHub pull request. Returns a structured review object with per-file notes and an overall summary.

## Usage

```typescript
import { reviewPullRequest, printReview } from '.agent/skills/github-pr-review/index.js';

const review = await reviewPullRequest({
  owner: 'my-org',
  repo: 'my-repo',
  pullNumber: 42,
  token: process.env.GITHUB_TOKEN!,
});

// Structured data
console.log(review.summary);
console.log(review.files);

// Or pretty-print to stdout
printReview(review);
```

## ReviewOptions

| Field       | Type     | Required | Description                                 |
|-------------|----------|----------|---------------------------------------------|
| owner       | string   | yes      | GitHub organisation or user                 |
| repo        | string   | yes      | Repository name                             |
| pullNumber  | number   | yes      | Pull request number                         |
| token       | string   | yes      | GitHub personal access token                |
| maxFiles    | number   |          | Max files to review (default: 50)           |

## What the analyser checks

- Large diffs (> 300 lines added)
- Significant deletions relative to additions
- Debug statements (`console.log`, `debugger`)
- TODO / FIXME / HACK markers introduced in the diff
- Possible hardcoded secrets heuristic
- Missing tests for source files with substantial additions

## Requirements

- Node.js >= 18
- A GitHub personal access token with `repo` or `public_repo` scope
