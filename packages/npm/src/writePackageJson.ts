// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { writeJson } from '@reelout/core'
import path from 'node:path'
import { sortPackageJson } from 'sort-package-json'
import type { PackageJson } from './types'

/**
 * Write `package.json` after sorting its keys and formatting.
 *
 * @param cwd Directory containing the package.json file
 * @param packageJson Package manifest object to write
 * @returns Promise that resolves when the file is written
 */
export async function writePackageJson<T extends object = PackageJson>(
  cwd: string,
  packageJson: T
): Promise<void> {
  await writeJson(path.join(cwd, 'package.json'), sortPackageJson(packageJson))
}
