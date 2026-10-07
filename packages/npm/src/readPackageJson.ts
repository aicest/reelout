// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { readJson } from '@reelout/core'
import path from 'node:path'
import type { PackageJson } from './types'

/**
 * Read and parse `package.json` from `cwd`.
 *
 * @param cwd Directory containing the package.json file
 * @returns Parsed package.json object
 */
export function readPackageJson<T extends object = PackageJson>(
  cwd: string
): Promise<T> {
  return readJson<T>(path.join(cwd, 'package.json'))
}
