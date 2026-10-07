// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ConfigurationValueMap } from '@yarnpkg/core'
import { Configuration } from '@yarnpkg/core'
import { npath } from '@yarnpkg/fslib'
import NpmPlugin from '@yarnpkg/plugin-npm'

/**
 * Load Yarn configuration settings for a given directory.
 *
 * Resolves configuration files by converting the working directory path into a
 * portable format and initializing the Yarn Configuration with the npm plugin.
 *
 * @param cwd Working directory path to search for configuration files
 * @returns Resolved Yarn configuration instance
 */
export function loadYarnConfig(cwd: string) {
  return Configuration.find(npath.toPortablePath(cwd), {
    modules: new Map([[`@yarnpkg/plugin-npm`, NpmPlugin]]),
    plugins: new Set([`@yarnpkg/plugin-npm`]),
  })
}

export type GetMapValue<T> = T extends Map<unknown, infer V> ? V : never

export type YarnScopeConfig = GetMapValue<ConfigurationValueMap['npmScopes']>

export type YarnRegistryConfig = GetMapValue<
  ConfigurationValueMap['npmRegistries']
>
