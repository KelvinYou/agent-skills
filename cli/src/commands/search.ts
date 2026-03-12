import chalk from 'chalk';
import ora from 'ora';
import { fetchRepo, listAvailableSkills, readRemoteManifest } from '../utils/github.js';
import type { SearchOptions } from '../types/index.js';

export async function searchCommand(
  repoUrl: string,
  options: SearchOptions,
): Promise<void> {
  const spinner = ora({ color: 'cyan' }).start(
    `Fetching skill list from ${chalk.cyan(repoUrl)}`,
  );

  let repoPath: string;
  try {
    repoPath = await fetchRepo(repoUrl, {
      branch: options.branch,
      token: options.token,
      skipCache: false,
    });
    spinner.succeed('Repository ready');
  } catch (err) {
    spinner.fail('Failed to fetch repository');
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Repository fetch failed: ${msg}`);
  }

  let skillNames: string[];
  try {
    skillNames = await listAvailableSkills(repoPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  ✗ ${msg}\n`));
    process.exit(1);
  }

  if (skillNames.length === 0) {
    console.log(chalk.dim('\n  No skills found in this repository.\n'));
    return;
  }

  console.log(
    `\n  ${chalk.bold.underline('Available Skills')}  ${chalk.dim(`(${skillNames.length}) in ${repoUrl}`)}\n`,
  );

  const nameWidth = Math.max(...skillNames.map((n) => n.length), 4);

  for (const name of skillNames) {
    try {
      const manifest = await readRemoteManifest(repoPath, name);
      const nameCol = chalk.cyan(name.padEnd(nameWidth + 2));
      const verCol = chalk.gray(`v${manifest.version ?? '?'}`.padEnd(8));
      const tags =
        manifest.tags && manifest.tags.length > 0
          ? chalk.dim(`  [${manifest.tags.join(', ')}]`)
          : '';

      console.log(`  ${nameCol}${verCol}${manifest.description}${tags}`);
    } catch {
      console.log(`  ${chalk.cyan(name.padEnd(nameWidth + 2))}${chalk.dim('(unable to read manifest)')}`);
    }
  }

  console.log();
  console.log(
    chalk.dim(
      `  Install a skill:  skills add ${repoUrl} --skill <name>`,
    ),
  );
  console.log(
    chalk.dim('  Install all:      skills add ' + repoUrl + ' --skill all'),
  );
  console.log();
}
