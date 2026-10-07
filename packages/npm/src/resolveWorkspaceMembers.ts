// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import fs from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { readPackageJson } from './readPackageJson'

/**
 * Resolve workspace member glob patterns for the repository.
 *
 * Checks `pnpm-workspace.yaml` first (preferred), then falls back to
 * `package.json` workspaces configuration when present.
 *
 * @param cwd Repository working directory
 * @returns Array of workspace member glob patterns, or `null` if not found
 */
export async function resolveWorkspaceMembers(
  cwd: string
): Promise<string[] | null> {
  try {
    const workspacePath = path.join(cwd, 'pnpm-workspace.yaml')
    const content = await fs.readFile(workspacePath, 'utf-8')
    const parsed = parse(content) as { packages?: string[] } | null

    if (Array.isArray(parsed?.packages)) {
      return parsed.packages
    }
  } catch {}

  try {
    const manifest = await readPackageJson<{ workspaces?: string[] }>(cwd)

    if (Array.isArray(manifest.workspaces)) {
      return manifest.workspaces
    }
  } catch {}

  return null
}
