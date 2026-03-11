/**
 * Skill: github-pr-review
 *
 * Fetches a GitHub pull request and returns a structured review object
 * containing per-file analysis and an overall summary.
 *
 * Usage:
 *   import { reviewPullRequest } from '.agent/skills/github-pr-review/index.js';
 *
 *   const review = await reviewPullRequest({
 *     owner: 'my-org',
 *     repo: 'my-repo',
 *     pullNumber: 42,
 *     token: process.env.GITHUB_TOKEN!,
 *   });
 *
 *   console.log(review.summary);
 */

import { Octokit } from '@octokit/rest';
import { analyseFile, buildSummary } from './analyser.js';
import type { ReviewOptions, PullRequestReview } from './types.js';

export type { ReviewOptions, PullRequestReview };

/**
 * Fetch and analyse a GitHub pull request.
 */
export async function reviewPullRequest(
  options: ReviewOptions,
): Promise<PullRequestReview> {
  const { owner, repo, pullNumber, token, maxFiles = 50 } = options;

  const octokit = new Octokit({ auth: token });

  // Fetch PR metadata
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // Fetch changed files (paginated, up to maxFiles)
  const filesResponse = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: Math.min(maxFiles, 100),
  });

  const files = filesResponse.data.slice(0, maxFiles);

  // Analyse each file
  const fileReviews = files.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    notes: analyseFile(file.filename, file.patch, file.additions, file.deletions),
  }));

  const totalAdditions = files.reduce((n, f) => n + f.additions, 0);
  const totalDeletions = files.reduce((n, f) => n + f.deletions, 0);

  return {
    title: pr.title,
    body: pr.body ?? '',
    author: pr.user?.login ?? 'unknown',
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    filesChanged: files.length,
    totalAdditions,
    totalDeletions,
    files: fileReviews,
    summary: buildSummary(fileReviews),
  };
}

/**
 * Print a human-readable review to stdout.
 */
export function printReview(review: PullRequestReview): void {
  const hr = '─'.repeat(60);

  console.log(`\n${hr}`);
  console.log(`PR:      ${review.title}`);
  console.log(`Author:  ${review.author}  (${review.headBranch} → ${review.baseBranch})`);
  console.log(
    `Changes: ${review.filesChanged} file(s)  +${review.totalAdditions} -${review.totalDeletions}`,
  );
  console.log(hr);

  for (const file of review.files) {
    console.log(`\n  ${file.filename}  [${file.status}]  +${file.additions} -${file.deletions}`);
    for (const note of file.notes) {
      console.log(`    • ${note}`);
    }
  }

  console.log(`\n${hr}`);
  console.log('Summary:\n');
  console.log(review.summary);
  console.log(`${hr}\n`);
}
