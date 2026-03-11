#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { searchCommand } from './commands/search.js';

const program = new Command();

program
  .name('skills')
  .description('Install and manage reusable AI agent skills from GitHub repos')
  .version('1.0.0');

// ─── add ─────────────────────────────────────────────────────────────────────

program
  .command('add <repo>')
  .description('Install one or more skills from a GitHub repository')
  .option(
    '-s, --skill <names...>',
    'skill name(s) to install — use "all" to install every skill in the repo',
  )
  .option('-b, --branch <branch>', 'git branch to use', 'main')
  .option(
    '-t, --token <token>',
    'GitHub personal access token (for private repos)',
  )
  .option('-f, --force', 'reinstall even if the skill is already installed', false)
  .option('--skip-cache', 'bypass the local repo cache and re-clone', false)
  .option(
    '-d, --dir <directory>',
    'project directory to install into (defaults to cwd)',
  )
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  ${chalk.cyan('$ skills add https://github.com/my-org/agent-skills --skill github-pr-review')}
  ${chalk.cyan('$ skills add my-org/agent-skills --skill codebase-search code-review')}
  ${chalk.cyan('$ skills add my-org/agent-skills --skill all --branch develop')}
  ${chalk.cyan('$ skills add https://github.com/private/repo --skill my-skill --token ghp_xxx')}
`,
  )
  .action(async (repo: string, options) => {
    try {
      if (!options.skill || options.skill.length === 0) {
        console.error(chalk.red('\n  Error: --skill <name> is required\n'));
        console.log(
          `  ${chalk.dim('Example:')} skills add <repo> --skill github-pr-review`,
        );
        console.log(
          `  ${chalk.dim('Install all:')} skills add <repo> --skill all`,
        );
        console.log();
        process.exit(1);
      }

      await addCommand(repo, {
        skill: options.skill,
        branch: options.branch ?? 'main',
        token: options.token,
        force: options.force ?? false,
        skipCache: options.skipCache ?? false,
        dir: options.dir,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n  Error: ${msg}\n`));
      process.exit(1);
    }
  });

// ─── list ─────────────────────────────────────────────────────────────────────

program
  .command('list')
  .description('List all skills installed in the current project')
  .option('--json', 'output registry as JSON', false)
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  ${chalk.cyan('$ skills list')}
  ${chalk.cyan('$ skills list --json | jq .skills')}
`,
  )
  .action(async (options) => {
    try {
      await listCommand({ json: options.json ?? false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n  Error: ${msg}\n`));
      process.exit(1);
    }
  });

// ─── remove ───────────────────────────────────────────────────────────────────

program
  .command('remove <skill>')
  .alias('rm')
  .description('Remove an installed skill')
  .option('-f, --force', 'skip confirmation output', false)
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  ${chalk.cyan('$ skills remove github-pr-review')}
  ${chalk.cyan('$ skills rm codebase-search --force')}
`,
  )
  .action(async (skill: string, options) => {
    try {
      await removeCommand(skill, { force: options.force ?? false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n  Error: ${msg}\n`));
      process.exit(1);
    }
  });

// ─── search ───────────────────────────────────────────────────────────────────

program
  .command('search <repo>')
  .description('Browse available skills in a remote repository without installing')
  .option('-b, --branch <branch>', 'git branch to inspect', 'main')
  .option('-t, --token <token>', 'GitHub personal access token')
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  ${chalk.cyan('$ skills search https://github.com/my-org/agent-skills')}
  ${chalk.cyan('$ skills search my-org/agent-skills --branch develop')}
`,
  )
  .action(async (repo: string, options) => {
    try {
      await searchCommand(repo, {
        branch: options.branch ?? 'main',
        token: options.token,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n  Error: ${msg}\n`));
      process.exit(1);
    }
  });

// ─── cache ────────────────────────────────────────────────────────────────────

program
  .command('cache')
  .description('Manage the local repository cache')
  .addCommand(
    new Command('clear')
      .description('Delete all cached repository clones')
      .action(async () => {
        const { clearCache, getCacheSize } = await import('./utils/github.js');
        const size = await getCacheSize();
        await clearCache();
        const mb = (size / 1024 / 1024).toFixed(1);
        console.log(chalk.green(`\n  ✓ Cache cleared (freed ~${mb} MB)\n`));
      }),
  )
  .addCommand(
    new Command('size')
      .description('Show current cache disk usage')
      .action(async () => {
        const { getCacheSize } = await import('./utils/github.js');
        const size = await getCacheSize();
        const mb = (size / 1024 / 1024).toFixed(2);
        console.log(`\n  Cache size: ${chalk.cyan(mb + ' MB')}\n`);
      }),
  );

program.parse();
