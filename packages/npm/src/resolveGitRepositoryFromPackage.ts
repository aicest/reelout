// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRepository } from '@reelout/core'
import GitHost from 'hosted-git-info'
import { readPackageJson } from './readPackageJson'

/**
 * Resolve Git repository metadata from the package manifest in a directory.
 *
 * Reads `package.json` at the given path and parses repository information
 * using `hosted-git-info` to identify the host type, owner, repository, and URL.
 *
 * @param cwd Directory containing the package manifest
 * @returns Git repository details or null if missing or unresolvable
 */
export async function resolveGitRepositoryFromPackage(
  cwd: string
): Promise<GitRepository | null> {
  try {
    const packageJson = await readPackageJson(cwd)
    const info = GitHost.fromManifest(packageJson)

    if (
      info &&
      typeof info === 'object' &&
      typeof info.type === 'string' &&
      typeof info.user === 'string' &&
      typeof info.project === 'string'
    ) {
      return {
        host: info.type,
        owner: info.user,
        repo: info.project,
        url: info.browse(),
      }
    }
  } catch {}

  return null
}
