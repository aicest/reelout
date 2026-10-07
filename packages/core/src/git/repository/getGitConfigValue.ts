// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'

/**
 * Get a local git configuration value for `key` in the repository at `cwd`.
 *
 * Returns the config value when present; otherwise `undefined`.
 *
 * @param cwd Repository working directory
 * @param key Git config key to read
 * @returns The config value or `undefined` if not set
 */
export async function getGitConfigValue(
  cwd: string,
  key: string
): Promise<string | undefined> {
  try {
    const stdout = await execGit(cwd, ['config', '--local', '--get', key])
    const value = stdout.trim()

    return value ? value : undefined
  } catch {
    return undefined
  }
}
