// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { compact, execGit } from '#util'

/**
 * Push a branch and optional tags to the `origin` remote using an atomic push.
 *
 * @param cwd Repository working directory
 * @param branch Branch name to push
 * @param additionalTags Optional list of tag names to push alongside the branch
 * @returns Promise that resolves when the push completes
 */
export async function pushGitChanges(
  cwd: string,
  branch: string | null,
  ...additionalTags: readonly string[]
): Promise<void> {
  await execGit(cwd, [
    'push',
    'origin',
    ...compact([branch, ...additionalTags]),
    '--atomic',
    '--no-verify',
  ])
}
