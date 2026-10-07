// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  compact,
  normalizeCommitFilter,
  normalizeReleaseRule,
  resolvePlugin,
  type GitAuthor,
  type ReleaseConfig,
  type ResolvedReleaseConfig,
} from '@reelout/core'
import { defaultConfig } from './defaultConfig'

/**
 * Normalize and resolve a release configuration.
 *
 * Applies default author settings when incomplete, normalizes commit filters
 * and release rules, and loads specified plugins.
 *
 * @param cwd Working directory path used for plugin resolution
 * @param config User-supplied release configuration
 * @returns Resolved and normalized release configuration
 * @throws If a configured plugin cannot be resolved
 */
export async function normalizeConfig(
  cwd: string,
  config: Required<ReleaseConfig>
): Promise<ResolvedReleaseConfig> {
  const author: GitAuthor =
    config.author.name && config.author.email
      ? { name: config.author.name, email: config.author.email }
      : { ...defaultConfig.author }

  const classifier = normalizeCommitFilter(config.classifier)

  const rules = compact(config.rules.map((rule) => normalizeReleaseRule(rule)))

  const plugins = compact(
    await Promise.all(
      config.plugins.map(async (plugin) => {
        try {
          return await resolvePlugin(cwd, plugin)
        } catch (err) {
          try {
            return await resolvePlugin(import.meta.filename, plugin)
          } catch {}

          throw err
        }
      })
    )
  )

  return {
    ...config,
    author,
    classifier,
    rules,
    plugins,
  }
}
