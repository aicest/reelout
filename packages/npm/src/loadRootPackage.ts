// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { Package, Workspace } from '@reelout/core'
import { buildPackage } from './buildPackage'

/**
 * Load the root package and return a settled result.
 *
 * Attempts to build package metadata for the root package directory.
 * Returns a fulfilled settled result on success, or a rejected result on error.
 *
 * @param cwd Repository working directory
 * @param workspace Workspace configuration
 * @returns Promise resolving to a settled package load result
 */
export async function loadRootPackage(
  cwd: string,
  workspace: Workspace
): Promise<PromiseSettledResult<Package>> {
  try {
    return {
      status: 'fulfilled',
      value: await buildPackage(cwd, '.', workspace),
    }
  } catch (err) {
    return {
      status: 'rejected',
      reason: err,
    }
  }
}
