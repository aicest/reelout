// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package, Workspace } from '@reelout/core'
import { loadRootPackage } from './loadRootPackage'
import { loadWorkspacePackages } from './loadWorkspacePackages'

/**
 * Load the root and workspace packages for release planning.
 *
 * Loads the root package first, then all workspace packages, returning
 * an array of settled results in order.
 *
 * @param cwd Repository working directory
 * @param workspace Workspace configuration
 * @returns Promise resolving to an array of settled package load results (root first, then workspace packages)
 */
export async function loadPackages(
  cwd: string,
  workspace: Workspace
): Promise<PromiseSettledResult<Package>[]> {
  const rootPackage = await loadRootPackage(cwd, workspace)

  const workspacePackages = await loadWorkspacePackages(cwd, workspace)

  return [rootPackage, ...workspacePackages]
}
