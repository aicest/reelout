// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseConfig, ResolvedReleaseConfig } from '@reelout/core'
import { cosmiconfig } from 'cosmiconfig'
import { defaultConfig } from './defaultConfig'
import { mergeConfig } from './mergeConfig'
import { normalizeConfig } from './normalizeConfig'

/**
 * Resolve and normalize a release configuration for a target directory.
 *
 * Searches for configuration files using `cosmiconfig`, merges discovered user
 * settings with default configurations, and normalizes the resulting structure.
 *
 * @param cwd Working directory path to search from
 * @param name Module name used for configuration file discovery
 * @returns Resolved and normalized release configuration
 */
export async function resolveConfig(
  cwd: string,
  name = 'reelout'
): Promise<ResolvedReleaseConfig> {
  const explorer = cosmiconfig(name)

  const result = await explorer.search(cwd)

  const config = mergeConfig<Required<ReleaseConfig>>(
    defaultConfig,
    result?.config
  )

  return normalizeConfig(cwd, config)
}
