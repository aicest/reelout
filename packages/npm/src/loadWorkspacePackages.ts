// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package, Workspace } from '@reelout/core'
import { glob } from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import { buildPackage } from './buildPackage'

/**
 * Load all workspace packages defined in the workspace configuration.
 *
 * Discovers packages matching workspace member glob patterns and loads each
 * one, returning an array of settled results.
 *
 * @param cwd Repository working directory
 * @param workspace Workspace configuration containing member glob patterns
 * @returns Promise resolving to an array of settled package load results
 */
export async function loadWorkspacePackages(
  cwd: string,
  workspace: Workspace
): Promise<PromiseSettledResult<Package>[]> {
  const { members } = workspace

  if (!members) {
    return []
  }

  const packageJsonFiles = await glob(
    members.map((pattern) => path.join(pattern, 'package.json')),
    { cwd, ignore: ['**/node_modules/**'], fs }
  )

  return Promise.allSettled(
    packageJsonFiles
      .sort((a, b) => a.localeCompare(b))
      .map((filePath) => buildPackage(cwd, path.dirname(filePath), workspace))
  )
}
