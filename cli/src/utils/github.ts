import * as path from 'path';
import * as os from 'os';
import fs from 'fs-extra';
import { simpleGit } from 'simple-git';
import type { SkillManifest } from '../types/index.js';

/** Directory used to cache cloned repositories */
const CACHE_DIR = path.join(os.homedir(), '.skills-cache');

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FetchOptions {
  branch?: string;
  token?: string;
  skipCache?: boolean;
}

/**
 * Clone (or update from cache) a GitHub repository, OR resolve a local path.
 * Returns the local path to the usable repo directory.
 */
export async function fetchRepo(
  repoUrl: string,
  options: FetchOptions = {},
): Promise<string> {
  const { branch = 'main', token, skipCache = false } = options;

  // ── Local path shortcut ─────────────────────────────────────────────────────
  // If the input looks like a filesystem path and the directory exists, use it
  // directly without cloning (useful for local development).
  if (await isLocalPath(repoUrl)) {
    return path.resolve(repoUrl);
  }

  // ── Remote clone ─────────────────────────────────────────────────────────────
  const normalizedUrl = normalizeGitHubUrl(repoUrl);
  const cacheKey = generateCacheKey(normalizedUrl, branch);
  const cachedPath = path.join(CACHE_DIR, cacheKey);

  if (!skipCache && (await fs.pathExists(cachedPath))) {
    await refreshCachedRepo(cachedPath, branch);
    return cachedPath;
  }

  const cloneUrl = token
    ? injectTokenIntoUrl(normalizedUrl, token)
    : normalizedUrl;

  await fs.ensureDir(CACHE_DIR);

  if (await fs.pathExists(cachedPath)) {
    await fs.remove(cachedPath);
  }

  const git = simpleGit();
  await git.clone(cloneUrl, cachedPath, ['--branch', branch, '--depth', '1']);

  return cachedPath;
}

/**
 * Returns all valid skill names (directories containing skill.json)
 * found in the `skills/` directory of the cloned repo.
 */
export async function listAvailableSkills(repoPath: string): Promise<string[]> {
  const skillsDir = path.join(repoPath, 'skills');

  if (!(await fs.pathExists(skillsDir))) {
    throw new Error(
      "No skills/ directory found in the repository.\n" +
        "Make sure the repo follows the skills/ directory convention.",
    );
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const validSkills: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(skillsDir, entry.name, 'skill.json');
    if (await fs.pathExists(manifestPath)) {
      validSkills.push(entry.name);
    }
  }

  return validSkills;
}

/**
 * Read and parse the skill.json manifest for a given skill inside a repo.
 */
export async function readRemoteManifest(
  repoPath: string,
  skillName: string,
): Promise<SkillManifest> {
  const manifestPath = path.join(repoPath, 'skills', skillName, 'skill.json');

  if (!(await fs.pathExists(manifestPath))) {
    throw new Error(`skill.json not found for "${skillName}"`);
  }

  return fs.readJson(manifestPath) as Promise<SkillManifest>;
}

/**
 * Delete all locally cached repositories.
 */
export async function clearCache(): Promise<void> {
  if (await fs.pathExists(CACHE_DIR)) {
    await fs.remove(CACHE_DIR);
  }
}

/**
 * Return total disk usage of the cache directory in bytes.
 */
export async function getCacheSize(): Promise<number> {
  if (!(await fs.pathExists(CACHE_DIR))) return 0;

  let total = 0;
  const walk = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else {
        const stat = await fs.stat(full);
        total += stat.size;
      }
    }
  };

  await walk(CACHE_DIR);
  return total;
}

// ─── Internals ────────────────────────────────────────────────────────────────

/**
 * Return true if the string is a local filesystem path that actually exists.
 */
async function isLocalPath(input: string): Promise<boolean> {
  // Absolute path
  if (input.startsWith('/') || input.startsWith('~')) {
    return fs.pathExists(input.startsWith('~') ? input.replace('~', os.homedir()) : input);
  }
  // Explicit relative path
  if (input.startsWith('./') || input.startsWith('../')) {
    return fs.pathExists(input);
  }
  return false;
}

/**
 * Normalise a GitHub URL or short `owner/repo` form to an HTTPS URL without .git suffix.
 */
function normalizeGitHubUrl(url: string): string {
  // Short form: "owner/repo" (no protocol, no domain)
  if (!url.includes('://') && !url.startsWith('git@') && url.includes('/')) {
    return `https://github.com/${url}`;
  }

  // SSH form: git@github.com:owner/repo.git
  if (url.startsWith('git@github.com:')) {
    return url
      .replace('git@github.com:', 'https://github.com/')
      .replace(/\.git$/, '');
  }

  return url.replace(/\.git$/, '');
}

function generateCacheKey(url: string, branch: string): string {
  return `${url.replace(/[^a-zA-Z0-9]/g, '_')}__${branch}`;
}

function injectTokenIntoUrl(url: string, token: string): string {
  const parsed = new URL(url);
  parsed.username = token;
  parsed.password = 'x-oauth-basic';
  return parsed.toString();
}

async function refreshCachedRepo(repoPath: string, branch: string): Promise<void> {
  try {
    const git = simpleGit(repoPath);
    await git.fetch('origin', branch);
    await git.reset(['--hard', `origin/${branch}`]);
  } catch {
    // Network unavailable or other transient error — continue with cached copy
  }
}
