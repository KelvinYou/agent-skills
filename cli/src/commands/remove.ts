import chalk from 'chalk';
import ora from 'ora';
import { loadRegistry, unregisterSkill } from '../utils/registry.js';
import { removeSkillFiles } from '../utils/skills.js';
import type { RemoveOptions } from '../types/index.js';

export async function removeCommand(
  skillName: string,
  options: RemoveOptions,
): Promise<void> {
  const projectDir = process.cwd();

  // ── Guard: skill must be installed ───────────────────────────────────────────
  const registry = await loadRegistry(projectDir);
  const skill = registry.skills[skillName];

  if (!skill) {
    console.error(chalk.red(`\n  ✗ Skill "${skillName}" is not installed.\n`));

    const installed = Object.keys(registry.skills);
    if (installed.length > 0) {
      console.log(chalk.dim(`  Installed skills: ${installed.join(', ')}`));
    } else {
      console.log(chalk.dim('  No skills are currently installed.'));
    }
    console.log();
    process.exit(1);
  }

  // ── Confirm (unless --force) ─────────────────────────────────────────────────
  if (!options.force) {
    console.log(
      chalk.yellow(`\n  Removing skill: ${chalk.bold(skillName)}`),
    );
    console.log(chalk.dim(`  Path: ${skill.path}`));
    console.log(chalk.dim(`  Source: ${skill.source}`));
    console.log();
  }

  // ── Remove ───────────────────────────────────────────────────────────────────
  const spinner = ora({ color: 'red' }).start(
    `Removing ${chalk.cyan(skillName)}`,
  );

  try {
    await removeSkillFiles(skill.path);
    await unregisterSkill(projectDir, skillName);
    spinner.succeed(`${chalk.green(skillName)} removed successfully`);
    console.log();
  } catch (err) {
    spinner.fail(`Failed to remove ${skillName}`);
    throw err;
  }
}
