// ─── Skill Manifest ──────────────────────────────────────────────────────────

/** Schema for skill.json in each skill directory */
export interface SkillManifest {
  /** Unique skill identifier (lowercase, hyphens allowed) */
  name: string;
  /** Semver version string */
  version?: string;
  /** Human-readable description */
  description: string;
  /** Entry point filename relative to skill directory */
  entry: string;
  /** npm dependencies to install — object or array form */
  dependencies: Record<string, string> | string[];
  /** npm devDependencies to install */
  devDependencies?: Record<string, string>;
  /** Explicit list of files to copy (copies all if omitted) */
  files?: string[];
  /** Descriptive tags for discoverability */
  tags?: string[];
  /** Skill author */
  author?: string;
  /** SPDX license identifier */
  license?: string;
}

// ─── Registry ────────────────────────────────────────────────────────────────

/** A single installed skill entry in the registry */
export interface InstalledSkill {
  name: string;
  version: string;
  description: string;
  /** Source repository URL */
  source: string;
  /** Git branch fetched from */
  branch: string;
  /** ISO timestamp when first installed */
  installedAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
  /** Absolute path to installed skill directory */
  path: string;
  tags: string[];
}

/** The .agent/registry.json schema */
export interface SkillRegistry {
  /** Registry format version */
  version: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
  /** Map of skill name → installed skill record */
  skills: Record<string, InstalledSkill>;
}

// ─── Command Options ─────────────────────────────────────────────────────────

export interface AddOptions {
  /** One or more skill names, or ["all"] */
  skill: string[];
  /** Git branch to fetch */
  branch: string;
  /** GitHub personal access token for private repos */
  token?: string;
  /** Force reinstall even if already installed */
  force: boolean;
  /** Skip cache and re-clone */
  skipCache: boolean;
  /** Override install target directory */
  dir?: string;
}

export interface RemoveOptions {
  /** Skip confirmation prompt */
  force: boolean;
}

export interface ListOptions {
  /** Emit raw JSON instead of formatted table */
  json: boolean;
}

export interface SearchOptions {
  /** Git branch to inspect */
  branch: string;
  /** GitHub personal access token */
  token?: string;
}
