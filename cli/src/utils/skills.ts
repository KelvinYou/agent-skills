import * as path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import type { InstalledSkill, SkillManifest } from '../types/index.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse and validate the skill.json manifest from a directory.
 */
export async function readSkillManifest(skillDir: string): Promise<SkillManifest> {
  const manifestPath = path.join(skillDir, 'skill.json');

  if (!(await fs.pathExists(manifestPath))) {
    throw new Error(`No skill.json found in ${skillDir}`);
  }

  const manifest = (await fs.readJson(manifestPath)) as Partial<SkillManifest>;
  validateManifest(manifest);
  return manifest as SkillManifest;
}

/**
 * Copy skill files from `sourceDir` to `targetDir`, install npm dependencies
 * in the user's project root, and return the registry record.
 */
export async function installSkill(
  sourceDir: string,
  targetDir: string,
  manifest: SkillManifest,
  sourceUrl: string,
  branch: string,
  projectDir: string,
): Promise<InstalledSkill> {
  await fs.ensureDir(targetDir);

  const filesToCopy = await resolveFilesToCopy(sourceDir, manifest);

  for (const relativePath of filesToCopy) {
    const src = path.join(sourceDir, relativePath);
    const dest = path.join(targetDir, relativePath);
    await fs.ensureDir(path.dirname(dest));
    await fs.copy(src, dest, { overwrite: true });
  }

  // Always copy the manifest
  await fs.copy(
    path.join(sourceDir, 'skill.json'),
    path.join(targetDir, 'skill.json'),
    { overwrite: true },
  );

  // Install dependencies into the user's project if applicable
  if (hasDependencies(manifest)) {
    const hasPackageJson = await fs.pathExists(
      path.join(projectDir, 'package.json'),
    );
    if (hasPackageJson) {
      await installDependencies(manifest, projectDir);
    }
  }

  const now = new Date().toISOString();
  return {
    name: manifest.name,
    version: manifest.version ?? '0.0.0',
    description: manifest.description,
    source: sourceUrl,
    branch,
    installedAt: now,
    updatedAt: now,
    path: targetDir,
    tags: manifest.tags ?? [],
  };
}

/**
 * Delete all files belonging to an installed skill.
 */
export async function removeSkillFiles(skillPath: string): Promise<void> {
  if (await fs.pathExists(skillPath)) {
    await fs.remove(skillPath);
  }
}

/**
 * Canonical install path for a skill inside a project.
 */
export function getSkillInstallPath(projectDir: string, skillName: string): string {
  return path.join(projectDir, '.agent', 'skills', skillName);
}

// ─── File Resolution ─────────────────────────────────────────────────────────

async function resolveFilesToCopy(
  sourceDir: string,
  manifest: SkillManifest,
): Promise<string[]> {
  // Honour explicit file list from manifest
  if (manifest.files && manifest.files.length > 0) {
    return manifest.files;
  }

  // Otherwise copy everything except skill.json and node_modules
  return collectFiles(sourceDir, sourceDir);
}

async function collectFiles(
  rootDir: string,
  currentDir: string,
): Promise<string[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'skill.json') continue;
    if (entry.name === 'node_modules') continue;

    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      const sub = await collectFiles(rootDir, fullPath);
      results.push(...sub);
    } else {
      results.push(path.relative(rootDir, fullPath));
    }
  }

  return results;
}

// ─── Dependency Installation ──────────────────────────────────────────────────

function hasDependencies(manifest: SkillManifest): boolean {
  const deps = manifest.dependencies;
  if (Array.isArray(deps)) return deps.length > 0;
  return Object.keys(deps).length > 0;
}

function normaliseDeps(manifest: SkillManifest): string[] {
  const deps = manifest.dependencies;
  if (Array.isArray(deps)) return deps;
  return Object.entries(deps).map(([pkg, ver]) => `${pkg}@${ver}`);
}

async function installDependencies(
  manifest: SkillManifest,
  projectDir: string,
): Promise<void> {
  const pm = await detectPackageManager(projectDir);
  const deps = normaliseDeps(manifest);
  if (deps.length === 0) return;

  const { cmd, args } = buildInstallCommand(pm, deps);
  await execa(cmd, args, { cwd: projectDir, stdio: 'pipe' });
}

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

async function detectPackageManager(dir: string): Promise<PackageManager> {
  if (await fs.pathExists(path.join(dir, 'bun.lockb'))) return 'bun';
  if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fs.pathExists(path.join(dir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function buildInstallCommand(
  pm: PackageManager,
  deps: string[],
): { cmd: string; args: string[] } {
  const table: Record<PackageManager, { cmd: string; args: string[] }> = {
    npm: { cmd: 'npm', args: ['install', '--save', ...deps] },
    yarn: { cmd: 'yarn', args: ['add', ...deps] },
    pnpm: { cmd: 'pnpm', args: ['add', ...deps] },
    bun: { cmd: 'bun', args: ['add', ...deps] },
  };
  return table[pm];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateManifest(manifest: Partial<SkillManifest>): void {
  const required = ['name', 'description', 'entry'] as const;

  for (const field of required) {
    if (!manifest[field]) {
      throw new Error(
        `Invalid skill.json: missing required field "${field}"`,
      );
    }
  }

  if (typeof manifest.name !== 'string') {
    throw new Error('Invalid skill.json: "name" must be a string');
  }

  if (!/^[a-z0-9][a-z0-9-_]*$/.test(manifest.name)) {
    throw new Error(
      `Invalid skill name "${manifest.name}": ` +
        'must start with a letter or digit and only contain lowercase ' +
        'letters, digits, hyphens, and underscores',
    );
  }

  if (!manifest.dependencies) {
    manifest.dependencies = {};
  }
}
