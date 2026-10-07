// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { stat } from 'node:fs/promises'
import path from 'node:path'
import { readPackageJson } from './readPackageJson'

export type PackageManager = 'npm' | 'pnpm' | 'yarn'

/**
 * Resolve the package manager used by the repository at `cwd`.
 *
 * Checks the `packageManager` field in `package.json` first, then scans for
 * common lock files. Falls back to `npm` if no indicator is found.
 *
 * @param cwd Repository working directory
 * @returns Detected package manager identifier
 */
export async function resolvePackageManager(
  cwd: string
): Promise<PackageManager> {
  try {
    const manifest = await readPackageJson<{ packageManager?: string }>(cwd)

    const name = manifest.packageManager?.split('@')[0]

    switch (name) {
      case 'pnpm':
      case 'yarn':
      case 'npm':
        return name
    }
  } catch {}

  const lockFiles: ReadonlyArray<[PackageManager, string]> = [
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
    ['npm', 'package-lock.json'],
  ]

  for (const [manager, fileName] of lockFiles) {
    try {
      const stats = await stat(path.join(cwd, fileName))

      /* istanbul ignore else */
      if (stats.isFile()) {
        return manager
      }
    } catch {}
  }

  return 'npm'
}
