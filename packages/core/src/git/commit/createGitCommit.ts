// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Stage all changes and create a git commit with the specified message.
 *
 * Validates the commit message and working directory status before staging
 * all changes and executing the commit command.
 *
 * @param cwd The target directory path for executing git commands
 * @param message The message to associate with the commit
 * @returns A promise that resolves when the operation completes
 */
export async function createGitCommit(
  cwd: string,
  message: string | null | undefined
): Promise<void> {
  if (!message) return

  await execGit(cwd, ['add', '.'])

  const stdout = (await execGit(cwd, ['status', '--porcelain'])).trim()

  if (!stdout) return

  await execGit(cwd, ['commit', '--message', message])
}
