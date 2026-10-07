// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Read a file's contents from a specific Git revision.
 *
 * Runs `git show <ref>:<filePath>` and returns the command output as a
 * string. If the file does not exist at the given revision or the Git
 * command fails for any reason, the function returns `null`.
 *
 * The returned string is the raw file contents as emitted by Git; callers
 * that need binary-safe handling should decode or process the bytes
 * accordingly. This function intentionally swallows Git errors and signals
 * absence via a `null` result rather than throwing.
 *
 * @param cwd Repository working directory
 * @param ref Commit-ish reference (commit SHA, tag, or branch) to read from
 * @param filePath Path to the file relative to the repository root
 * @returns File contents as a string, or `null` if the file is unavailable at the ref
 */
export function readGitFile(
  cwd: string,
  ref: string,
  filePath: string
): Promise<string | null> {
  return execGit(cwd, ['show', `${ref}:${filePath}`]).catch(() => null)
}
