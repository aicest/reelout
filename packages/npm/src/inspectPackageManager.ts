// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ExecCommandOptions } from '@reelout/core'
import { getPackageManagerVersion } from './getPackageManagerVersion'
import type { PackageManager } from './resolvePackageManager'
import { resolvePackageManager } from './resolvePackageManager'

export interface PackageManagerInfo {
  name: PackageManager
  isNpm: boolean
  isPnpm: boolean
  isYarn: boolean
  isYarnClassic: boolean
  isYarnBerry: boolean
}

/**
 * Inspect the active package manager and its capabilities in a directory.
 *
 * Identifies the configured package manager executable and queries its major
 * version to distinguish between Yarn Classic and Yarn Berry releases.
 *
 * @param cwd Working directory path to inspect
 * @param options Additional execution, environment, and stream options
 * @returns Metadata object describing the active package manager
 */
export async function inspectPackageManager(
  cwd: string,
  options?: Partial<ExecCommandOptions>
): Promise<PackageManagerInfo> {
  const packageManager = await resolvePackageManager(cwd)
  let isYarnClassic = false
  let isYarnBerry = false

  if (packageManager === 'yarn') {
    const version = await getPackageManagerVersion(cwd, 'yarn', options)

    if (version != null && version >= 2) {
      isYarnBerry = true
    } else {
      isYarnClassic = true
    }
  }

  return {
    name: packageManager,
    isNpm: packageManager === 'npm',
    isPnpm: packageManager === 'pnpm',
    isYarn: packageManager === 'yarn',
    isYarnClassic,
    isYarnBerry,
  }
}
