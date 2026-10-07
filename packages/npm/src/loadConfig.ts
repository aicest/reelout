// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import Config from '@npmcli/config'
import defaultOptions from '@npmcli/config/lib/definitions/index.js'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

export interface LoadConfigOptions {
  env?: Readonly<NodeJS.ProcessEnv> | undefined
}

/**
 * Load npm configuration settings for a given directory.
 *
 * Resolves the system npm binary path to initialize an `@npmcli/config` instance,
 * loading options from `.npmrc` files and environment variables.
 *
 * @param cwd Working directory path to search for config files
 * @param options Runtime environment and configuration settings
 * @returns Loaded npm configuration instance
 */
export async function loadConfig(
  cwd: string,
  options: LoadConfigOptions
): Promise<Config> {
  const npmBin = await realpath(resolve(process.execPath, '..', 'npm'))

  const npmPath = resolve(npmBin, '..', '..')

  const config = new Config({
    ...defaultOptions,
    npmPath,
    cwd,
    env: {
      HOME: process.env.HOME,
      PATH: process.env.PATH,
      ...options.env,
    },
  })

  await config.load()

  return config
}
