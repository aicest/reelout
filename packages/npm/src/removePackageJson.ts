// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { rm } from 'node:fs/promises'
import path from 'node:path'

/**
 * Remove the `package.json` file from the specified directory.
 *
 * Safely removes package.json without error if the file or directory
 * does not exist. Uses the `force` flag to prevent throwing on missing files.
 *
 * @param cwd The target directory path containing the package.json file
 * @returns Promise that resolves when removal completes
 */
export async function removePackageJson(cwd: string): Promise<void> {
  await rm(path.join(cwd, 'package.json'), { force: true })
}
