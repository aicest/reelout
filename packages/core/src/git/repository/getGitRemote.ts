// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get the URL for the named remote (defaults to `origin`).
 *
 * @param cwd Repository working directory
 * @param remoteName Remote name (defaults to `'origin'`)
 * @returns Remote URL string or `null` when unavailable
 */
export function getGitRemote(
  cwd: string,
  remoteName = 'origin'
): Promise<string | null> {
  return execGit(cwd, ['remote', 'get-url', remoteName])
    .then((stdout) => stdout.trim())
    .catch(() => null)
}
