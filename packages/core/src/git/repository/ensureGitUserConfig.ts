// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitAuthor } from '#types'
import { execGit } from '#util'
import { getGitConfigValue } from './getGitConfigValue'

/**
 * Ensure Git user configuration is set and return a cleanup handle.
 *
 * Checks the existing `user.name` and `user.email` configuration for the given
 * working directory. Updates the configuration if either value is missing and
 * returns an `AsyncDisposable` resource that restores the original state upon
 * disposal.
 *
 * @param cwd Working directory path in which to check and set Git configuration
 * @param user Git author details containing name and email
 * @returns Async disposable cleanup object if updated, or undefined if already set
 */
export async function ensureGitUserConfig(
  cwd: string,
  user: GitAuthor
): Promise<AsyncDisposable | undefined> {
  const initialName = await getGitConfigValue(cwd, 'user.name')
  const initialEmail = await getGitConfigValue(cwd, 'user.email')

  if (initialName && initialEmail) {
    return
  }

  // https://github.com/actions/checkout?tab=readme-ov-file#push-a-commit-using-the-built-in-token
  await execGit(cwd, ['config', 'user.name', user.name])
  await execGit(cwd, ['config', 'user.email', user.email])

  return {
    async [Symbol.asyncDispose]() {
      if (initialName) {
        await execGit(cwd, ['config', 'user.name', initialName])
      } else {
        await execGit(cwd, ['config', '--unset', 'user.name'])
      }

      if (initialEmail) {
        await execGit(cwd, ['config', 'user.email', initialEmail])
      } else {
        await execGit(cwd, ['config', '--unset', 'user.email'])
      }
    },
  }
}
