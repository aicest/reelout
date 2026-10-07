// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

/* istanbul ignore file */
import { vol } from 'memfs'
import { join } from 'node:path'
import { ufs, type IFS } from 'unionfs'
import { afterEach, beforeAll, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => {
  let fs = await importOriginal<IFS>()
  fs = { ...fs, ...ufs }
  return { ...fs, default: fs }
})

vi.mock('node:fs/promises', async (importOriginal) => {
  ufs.promises.rm ||= async function rm(path, options = {}) {
    try {
      await ufs.promises.unlink(path)
    } catch (err) {
      if (
        (err as NodeJS.ErrnoException).code === 'EISDIR' ||
        (err as NodeJS.ErrnoException).code === 'EPERM'
      ) {
        if (options.recursive) {
          await Promise.all(
            (await ufs.promises.readdir(path)).map((item) =>
              rm(join(path as string, item), options)
            )
          )
        }

        return await ufs.promises.rmdir(path)
      }

      if (options.force && (err as NodeJS.ErrnoException).code === 'ENOENT') {
        return
      }

      throw err
    }
  }

  let fs = await importOriginal<IFS['promises']>()
  fs = { ...fs, ...ufs.promises }
  return { ...fs, default: fs }
})

beforeAll(async () => {
  ufs.use(vol as object as IFS)
  ufs.use(await vi.importActual<IFS>('node:fs'))
})

afterEach(() => {
  vol.reset()
})
