// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleasePlan } from '@reelout/core'
import path from 'node:path'
import semver from 'semver'
import { readPackageJson } from './readPackageJson'
import type { PackageJson } from './types'
import { updatePackageJson } from './updatePackageJson'

/**
 * Update package versions and local dependency ranges across a workspace.
 *
 * Builds a map of packages that have a new release version, then iterates
 * through all workspace packages. For each package:
 * - Its own `version` field is updated if it has a release target.
 * - Any local dependency whose name appears in the release map and whose
 *   current range is a valid semver range is bumped to the new version,
 *   preserving the original prefix (`^` or `~`).
 *
 * Only packages with actual changes are written back to disk.
 *
 * @param cwd Absolute path to the workspace root
 * @param plans Release plans containing package metadata and target versions
 * @returns Promise that resolves once all modified package.json files are saved
 */
export async function bumpPackageDependencies(
  cwd: string,
  plans: readonly ReleasePlan[]
): Promise<void> {
  const versionMap = new Map<string, string>()

  for (const plan of plans) {
    if (plan.package.name && plan.release?.version) {
      versionMap.set(plan.package.name, plan.release.version)
    }
  }

  if (versionMap.size === 0) {
    return
  }

  await Promise.all(
    plans.map(async (plan) => {
      const packageDir = path.join(cwd, plan.package.location)
      const packageJson = await readPackageJson(packageDir)
      let hasChanges = false

      if (plan.release?.version) {
        packageJson.version = plan.release.version
        hasChanges = true
      }

      for (const key of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ] satisfies (keyof PackageJson)[]) {
        const deps = packageJson[key]

        if (deps) {
          for (const [depName, currentRange] of Object.entries(deps)) {
            const newVersion = versionMap.get(depName)

            if (newVersion && semver.validRange(currentRange)) {
              const prefix = currentRange.match(/^[\^~]/)?.[0] || ''
              deps[depName] = `${prefix}${newVersion}`
              hasChanges = true
            }
          }
        }
      }

      if (hasChanges) {
        await updatePackageJson(packageDir, packageJson)
      }
    })
  )
}
