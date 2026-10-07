// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isTruthyString } from './isTruthyString'

/**
 * Determine whether the current process is running in a CI environment.
 *
 * Checks if the `CI` environment variable is set to a truthy value. Ignores
 * provider-specific variables such as `GITHUB_ACTIONS` to keep detection
 * generic.
 *
 * @param env Readonly process environment variables object
 * @returns `true` if `env.CI` normalizes to a truthy string, otherwise `false`
 */
export function isCI(env: Readonly<NodeJS.ProcessEnv>): boolean {
  return isTruthyString(env.CI)
}
