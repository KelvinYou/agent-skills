import * as path from 'path';
import fs from 'fs-extra';
import type { InstalledSkill, SkillRegistry } from '../types/index.js';

const REGISTRY_VERSION = '1.0.0';

// ─── Path Helpers ─────────────────────────────────────────────────────────────

export function getRegistryPath(projectDir: string): string {
  return path.join(projectDir, '.agent', 'registry.json');
}

export function getAgentDir(projectDir: string): string {
  return path.join(projectDir, '.agent');
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export async function loadRegistry(projectDir: string): Promise<SkillRegistry> {
  const registryPath = getRegistryPath(projectDir);

  if (!(await fs.pathExists(registryPath))) {
    return createEmptyRegistry();
  }

  try {
    const data = await fs.readJson(registryPath);
    return data as SkillRegistry;
  } catch {
    return createEmptyRegistry();
  }
}

export async function saveRegistry(
  projectDir: string,
  registry: SkillRegistry,
): Promise<void> {
  const registryPath = getRegistryPath(projectDir);
  await fs.ensureDir(path.dirname(registryPath));
  registry.updatedAt = new Date().toISOString();
  await fs.writeJson(registryPath, registry, { spaces: 2 });
}

// ─── Skill Operations ─────────────────────────────────────────────────────────

export async function registerSkill(
  projectDir: string,
  skill: InstalledSkill,
): Promise<void> {
  const registry = await loadRegistry(projectDir);
  registry.skills[skill.name] = skill;
  await saveRegistry(projectDir, registry);
}

export async function unregisterSkill(
  projectDir: string,
  skillName: string,
): Promise<void> {
  const registry = await loadRegistry(projectDir);
  delete registry.skills[skillName];
  await saveRegistry(projectDir, registry);
}

export async function isSkillInstalled(
  projectDir: string,
  skillName: string,
): Promise<boolean> {
  const registry = await loadRegistry(projectDir);
  return skillName in registry.skills;
}

export async function getInstalledSkill(
  projectDir: string,
  skillName: string,
): Promise<InstalledSkill | null> {
  const registry = await loadRegistry(projectDir);
  return registry.skills[skillName] ?? null;
}

export async function getAllInstalledSkills(
  projectDir: string,
): Promise<InstalledSkill[]> {
  const registry = await loadRegistry(projectDir);
  return Object.values(registry.skills);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createEmptyRegistry(): SkillRegistry {
  return {
    version: REGISTRY_VERSION,
    updatedAt: new Date().toISOString(),
    skills: {},
  };
}
