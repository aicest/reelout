// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Workspace } from '#types'
import path from 'node:path'

/**
 * Normalize and validate workspace configuration for a repository.
 *
 * Resolves the workspace entry directory relative to `cwd` and normalizes
 * the path representation. Returns a workspace object with normalized `entry`
 * and optional workspace members.
 *
 * @param cwd Repository working directory
 * @param workspace Partial workspace configuration (optional)
 * @returns Normalized workspace object
 */
export function normalizeWorkspace(
  cwd: string,
  workspace?: {
    entry?: string | null | undefined
    members?: readonly string[] | null | undefined
  }
): Workspace {
  let entry = workspace?.entry || '.'
  const members = workspace?.members ?? null

  entry = path.normalize(path.relative(cwd, path.resolve(cwd, entry)))

  return {
    entry,
    members,
  }
}
