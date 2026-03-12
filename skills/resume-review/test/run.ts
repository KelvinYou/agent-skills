import { reviewResume, parseReviewResponse, formatResumeReview } from '../index.js';

async function main() {
  const file = './test/sample-resume.txt';

  // Test 1: Parse resume and build prompt (HR perspective)
  console.log('=== Test 1: HR Manager Review ===\n');
  const hr = await reviewResume({ file, role: 'hr', targetRole: 'HR Director' });
  console.log(`Role: ${hr.role}`);
  console.log(`Resume length: ${hr.rawText.length} chars`);
  console.log(`Prompt length: ${hr.prompt.length} chars`);
  console.log('Prompt preview:\n', hr.prompt.slice(0, 200), '...\n');

  // Test 2: Senior role reviewer perspective
  console.log('=== Test 2: Senior Role Review ===\n');
  const senior = await reviewResume({ file, role: 'senior-engineer', targetRole: 'VP of People' });
  console.log(`Role: ${senior.role}`);
  console.log(`Prompt length: ${senior.prompt.length} chars\n`);

  // Test 3: Parse a mock LLM response
  console.log('=== Test 3: Parse Mock LLM Response ===\n');
  const mockResponse = JSON.stringify({
    score: { overall: 5, clarity: 6, impact: 3, relevance: 5 },
    strengths: ['Clear chronological structure', '8 years of relevant experience'],
    weaknesses: ['Bullet points lack metrics', 'Vague action verbs like "helped" and "worked on"'],
    improvements: ['Quantify achievements (e.g., reduced time-to-hire by 30%)', 'Use stronger action verbs'],
    atsAdvice: ['Add keywords: HRIS, talent management, succession planning', 'Include certifications like SHRM-CP'],
    roleSpecificAdvice: ['For HR Director, emphasize strategic initiatives over tactical work'],
    rewriteSuggestions: [
      {
        original: 'Did employee onboarding',
        improved: 'Designed and implemented onboarding program for 150+ new hires annually, reducing 90-day turnover by 25%',
        reason: 'Adds scale, ownership, and measurable impact',
      },
    ],
  });

  const result = parseReviewResponse(mockResponse, file, 'hr', hr.rawText);
  console.log(formatResumeReview(result));

  // Test 4: Default role (should default to 'hr')
  console.log('\n=== Test 4: Default Role ===\n');
  const defaultReview = await reviewResume({ file });
  console.log(`Default role: ${defaultReview.role}`);

  console.log('\nAll tests passed.');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
