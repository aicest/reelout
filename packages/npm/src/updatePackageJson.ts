// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { mergeWith } from 'lodash-es'
import { readPackageJson } from './readPackageJson'
import type { PackageJson } from './types'
import { writePackageJson } from './writePackageJson'

/**
 * Merge fields into a package.json file, deleting undefined properties.
 *
 * Reads the package.json at `cwd`, deep merges with provided fields, and
 * removes any properties set to `undefined`. Empty strings are preserved.
 *
 * @param cwd Repository working directory
 * @param packageJson Fields to merge into package.json
 * @returns Promise that resolves when the package.json is written
 */
export async function updatePackageJson(
  cwd: string,
  packageJson: PackageJson
): Promise<void> {
  packageJson = mergeWith(
    await readPackageJson(cwd),
    packageJson,
    (objValue, srcValue, key, obj) => {
      if (srcValue === undefined) {
        obj[key] = srcValue
      }
    }
  )

  await writePackageJson(cwd, packageJson)
}
