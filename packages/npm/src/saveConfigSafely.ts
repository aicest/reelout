// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type Config from '@npmcli/config'
import { access, constants, open } from 'node:fs/promises'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 50

/**
 * Save an npm configuration file with retries and file existence verification.
 *
 * Attempts to persist configuration updates, handling file sync operations and
 * retrying on transient missing-file errors up to a maximum threshold.
 *
 * @param config Configuration instance containing data to save
 * @param where Target configuration file type
 * @returns Resolves when the file is saved and verified
 * @throws When saving fails due to unexpected errors or exhausted retries
 */
export async function saveConfigSafely(
  config: Config,
  where: Config.ConfFileType
): Promise<void> {
  const configFile =
    where === 'user' || where === 'project' ? config.data.get(where) : undefined

  if (!configFile) {
    return
  }

  const isEmpty = Object.keys(configFile.raw).length === 0
  const filePath = configFile.source

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await wait(BASE_DELAY_MS * attempt)

      await config.save(where)

      if (isEmpty) {
        await access(filePath, constants.F_OK)
      } else {
        await using file = await open(filePath, 'r')

        await file.sync()

        await access(filePath, constants.F_OK)

        return
      }
    } catch (err) {
      const errorCode = (err as NodeJS.ErrnoException)?.code

      if (isEmpty) {
        return
      }

      if (errorCode !== 'ENOENT' || attempt + 1 === MAX_RETRIES) {
        throw err
      }
    }
  }
}

async function wait(ms: number): Promise<void> {
  if (ms > 0) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
