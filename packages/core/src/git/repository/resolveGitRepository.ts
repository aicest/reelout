// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitRepository } from '#types'
import GitHost from 'hosted-git-info'
import { getGitRemote } from './getGitRemote'

/**
 * Resolve Git repository host, owner, and project metadata from the `origin` remote URL.
 *
 * @param cwd Repository working directory
 * @returns Promise that resolves to a `GitRepository` object, or `null` when unavailable
 */
export async function resolveGitRepository(
  cwd: string
): Promise<GitRepository | null> {
  const origin = await getGitRemote(cwd)

  if (!origin) {
    return null
  }

  const info = GitHost.fromUrl(origin)

  if (
    info &&
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

  return null
}
