# github-pr-review

Fetch and analyse a GitHub pull request. Returns a structured review object with per-file notes and an overall summary.

## Install

```bash
npx skills add https://github.com/KelvinYou/agent-skills --skill github-pr-review
```

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
| owner       | string   | ✓        | GitHub organisation or user                 |
| repo        | string   | ✓        | Repository name                             |
| pullNumber  | number   | ✓        | Pull request number                         |
| token       | string   | ✓        | GitHub personal access token                |
| maxFiles    | number   |          | Max files to review (default: 50)           |

## PullRequestReview shape

```typescript
{
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
```

## What the analyser checks

- Large diffs (> 300 lines added)
- Significant deletions relative to additions
- Debug statements (`console.log`, `debugger`)
- TODO / FIXME / HACK markers introduced in the diff
- Possible hardcoded secrets heuristic
- Missing tests for source files with substantial additions

## Requirements

- Node.js ≥ 18
- A GitHub personal access token with `repo` or `public_repo` scope
