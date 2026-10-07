// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/* istanbul ignore file */
import path from 'node:path'
import { rootTemporaryDirectory } from 'tempy'
import { vi } from 'vitest'

vi.mock(import('@reelout/core/util/readJson'), async (importActual) => {
  const { readJson } = await importActual()

  return {
    readJson: async (...args: Parameters<typeof readJson>) => {
      try {
        return await readJson(...args)
      } catch (err) {
        const filePath = args[0]

        if (Error.isError(err) && err.message.includes(filePath)) {
          if (filePath.startsWith(rootTemporaryDirectory)) {
            const cwd = new RegExp(
              path.join(RegExp.escape(rootTemporaryDirectory), '[a-z0-9]{32}')
            )

            err.message = err.message.replace(
              filePath,
              filePath.replace(cwd, '<cwd>')
            )
          }
        }

        throw err
      }
    },
  }
})
