import chalk from 'chalk';
import { loadRegistry } from '../utils/registry.js';
import type { ListOptions } from '../types/index.js';

export async function listCommand(options: ListOptions): Promise<void> {
  const projectDir = process.cwd();
  const registry = await loadRegistry(projectDir);
  const skills = Object.values(registry.skills);

  // ── JSON output ──────────────────────────────────────────────────────────────
  if (options.json) {
    console.log(JSON.stringify(registry, null, 2));
    return;
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (skills.length === 0) {
    console.log(chalk.dim('\n  No skills installed yet.\n'));
    console.log(
      `  Run ${chalk.cyan('skills add <repo> --skill <name>')} to install one.\n`,
    );
    return;
  }

  // ── Table ────────────────────────────────────────────────────────────────────
  const nameWidth = Math.max(...skills.map((s) => s.name.length), 4);
  const verWidth = Math.max(...skills.map((s) => `v${s.version}`.length), 7);

  const header =
    chalk.bold('  ' + 'NAME'.padEnd(nameWidth + 2)) +
    chalk.bold('VERSION'.padEnd(verWidth + 2)) +
    chalk.bold('DESCRIPTION');

  const divider = chalk.dim('  ' + '─'.repeat(nameWidth + verWidth + 30));

  console.log(`\n  ${chalk.bold.underline(`Installed Skills`)}  ${chalk.dim(`(${skills.length})`)}\n`);
  console.log(header);
  console.log(divider);

  for (const skill of skills) {
    const nameCol = chalk.cyan(skill.name.padEnd(nameWidth + 2));
    const verCol = chalk.gray(`v${skill.version}`.padEnd(verWidth + 2));
    const descCol = skill.description;

    console.log(`  ${nameCol}${verCol}${descCol}`);

    if (skill.tags && skill.tags.length > 0) {
      const tagLine = skill.tags.map((t) => chalk.bgGray.white(` ${t} `)).join(' ');
      const indent = '  ' + ' '.repeat(nameWidth + 2) + ' '.repeat(verWidth + 2);
      console.log(`${indent}${tagLine}`);
    }

    const meta =
      chalk.dim(`  source: ${skill.source}`) +
      chalk.dim(`  installed: ${formatDate(skill.installedAt)}`);
    const indent = '  ' + ' '.repeat(nameWidth + 2) + ' '.repeat(verWidth + 2);
    console.log(`${indent}${meta}`);
    console.log();
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
