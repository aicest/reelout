// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Create a git tag in the repository at `cwd`.
 *
 * Creates an annotated tag when `message` is provided.
 *
 * @param cwd Repository working directory
 * @param tag Tag name to create
 * @param message Optional tag message (creates an annotated tag when present)
 * @returns Promise that resolves when the tag is created
 */
export async function createGitTag(
  cwd: string,
  tag: string,
  message?: string
): Promise<void> {
  await execGit(cwd, [
    'tag',
    ...(message ? ['-a', tag, '-m', message, '--cleanup=whitespace'] : [tag]),
  ])
}
