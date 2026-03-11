import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fetchRepo, listAvailableSkills } from '../utils/github.js';
import { readSkillManifest, installSkill, getSkillInstallPath } from '../utils/skills.js';
import { isSkillInstalled, registerSkill } from '../utils/registry.js';
import type { AddOptions } from '../types/index.js';

type InstallResults = {
  installed: string[];
  skipped: string[];
  failed: { name: string; error: string }[];
};

// ─── Command Entry ────────────────────────────────────────────────────────────

export async function addCommand(
  repoUrl: string,
  options: AddOptions,
): Promise<void> {
  const projectDir = options.dir
    ? path.resolve(options.dir)
    : process.cwd();

  const spinner = ora({ color: 'cyan' });
  const skillNames = options.skill;

  const repoLabel = chalk.cyan(repoUrl);
  const branchLabel = chalk.cyan(options.branch);
  const count = skillNames.length;

  console.log(
    chalk.bold(
      `\n  Installing ${count === 1 ? `skill ${chalk.cyan(skillNames[0])}` : `${count} skills`} from ${repoLabel}\n`,
    ),
  );

  // ── Step 1: Fetch the repository ────────────────────────────────────────────
  spinner.start(`Fetching repository  (branch: ${branchLabel})`);

  let repoPath: string;
  try {
    repoPath = await fetchRepo(repoUrl, {
      branch: options.branch,
      token: options.token,
      skipCache: options.skipCache,
    });
    spinner.succeed(`Repository ready`);
  } catch (err) {
    spinner.fail('Failed to fetch repository');
    throw enrichError(err, 'Repository fetch failed');
  }

  // ── Step 2: Resolve skill list ───────────────────────────────────────────────
  let targets = skillNames;

  if (skillNames.length === 1 && skillNames[0] === 'all') {
    spinner.start('Discovering available skills');
    try {
      targets = await listAvailableSkills(repoPath);
      spinner.succeed(
        `Found ${targets.length} skill${targets.length !== 1 ? 's' : ''}: ` +
          targets.map((s) => chalk.cyan(s)).join(', '),
      );
    } catch (err) {
      spinner.fail('Failed to discover skills');
      throw enrichError(err, 'Skills discovery failed');
    }
  }

  // ── Step 3: Install each skill ───────────────────────────────────────────────
  const results: InstallResults = { installed: [], skipped: [], failed: [] };

  for (const skillName of targets) {
    await installOne(
      skillName,
      repoPath,
      repoUrl,
      options,
      projectDir,
      results,
      spinner,
    );
  }

  printSummary(results);
}

// ─── Single Skill Install ─────────────────────────────────────────────────────

async function installOne(
  skillName: string,
  repoPath: string,
  repoUrl: string,
  options: AddOptions,
  projectDir: string,
  results: InstallResults,
  spinner: ReturnType<typeof ora>,
): Promise<void> {
  const label = chalk.cyan(skillName);
  spinner.start(`Installing ${label}`);

  try {
    // Guard: already installed
    if (!options.force && (await isSkillInstalled(projectDir, skillName))) {
      spinner.warn(`${chalk.yellow(skillName)} — already installed (--force to reinstall)`);
      results.skipped.push(skillName);
      return;
    }

    // Verify skill exists in repo
    const skillSourceDir = path.join(repoPath, 'skills', skillName);
    const { default: fsExtra } = await import('fs-extra');

    if (!(await fsExtra.pathExists(skillSourceDir))) {
      const available = await listAvailableSkills(repoPath);
      throw new Error(
        `Skill "${skillName}" not found in repository.\n` +
          `Available: ${available.length > 0 ? available.join(', ') : '(none)'}`,
      );
    }

    // Read manifest
    const manifest = await readSkillManifest(skillSourceDir);

    // Determine install path
    const installPath = getSkillInstallPath(projectDir, skillName);

    // Copy files + install deps
    const record = await installSkill(
      skillSourceDir,
      installPath,
      manifest,
      repoUrl,
      options.branch,
      projectDir,
    );

    // Register
    await registerSkill(projectDir, record);

    spinner.succeed(
      `${chalk.green(skillName)} v${record.version}  ${chalk.dim(installPath)}`,
    );
    results.installed.push(skillName);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(`${chalk.red(skillName)} — ${message}`);
    results.failed.push({ name: skillName, error: message });
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function printSummary(results: InstallResults): void {
  console.log();

  if (results.installed.length > 0) {
    console.log(chalk.green(`  ✓ Installed:  ${results.installed.join(', ')}`));
  }
  if (results.skipped.length > 0) {
    console.log(chalk.yellow(`  ⚠ Skipped:   ${results.skipped.join(', ')}`));
  }
  if (results.failed.length > 0) {
    console.log(chalk.red(`  ✗ Failed:    ${results.failed.map((f) => f.name).join(', ')}`));
  }

  console.log();

  if (results.installed.length > 0) {
    console.log(chalk.dim('  Run `skills list` to see all installed skills.'));
    console.log();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichError(err: unknown, prefix: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  return new Error(`${prefix}: ${msg}`);
}
