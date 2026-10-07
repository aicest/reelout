// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isSemVer, type Package, type Workspace } from '@reelout/core'
import path from 'node:path'
import { buildPackageFilePattern } from './buildPackageFilePattern'
import { readPackageJson } from './readPackageJson'

/**
 * Build metadata for a package within a workspace.
 *
 * Reads the package manifest and computes canonical fields used by the
 * release process, including normalized paths and file patterns.
 *
 * @param rootDir Current working directory
 * @param packageDir Package directory path (relative or absolute)
 * @param workspace Workspace metadata and configuration
 * @returns Package metadata object
 * @throws If the package version is not a valid semantic version
 */
export async function buildPackage(
  rootDir: string,
  packageDir: string,
  workspace: Workspace
): Promise<Package> {
  packageDir = path.resolve(rootDir, packageDir)

  const manifest = await readPackageJson(packageDir)

  packageDir = path.normalize(path.relative(rootDir, packageDir))

  const root = packageDir === '.'

  const entry = packageDir === workspace.entry

  const { version } = manifest

  if (!isSemVer(version)) {
    throw new Error(
      `Package version "${version}" in "${packageDir}" is not a valid semantic version.`
    )
  }

  return {
    name: manifest.name,
    version,
    private: manifest.private,
    root,
    entry,
    dependencies: Object.keys({
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.optionalDependencies,
    }).sort(),
    location: packageDir,
    files: buildPackageFilePattern(workspace, root, packageDir),
  }
}
