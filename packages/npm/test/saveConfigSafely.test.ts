// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { loadConfig, saveConfigSafely } from '@reelout/npm'
import { chmod, readFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { afterEach, expect, test, vi } from 'vitest'
import { HOME_DIR } from '../../../test/mock/env'

vi.mock(import('node:fs/promises'), async (importActual) => {
  const { ...fs } = await importActual()

  fs.default.open = fs.open = vi.fn(fs.open)
  fs.default.chmod = fs.chmod = vi.fn(fs.chmod)

  return fs
})

afterEach(() => {
  vi.resetAllMocks()
})

test('saves user configuration successfully', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const userConfigPath = path.join(HOME_DIR, '.npmrc')

    const config = await loadConfig(cwd, { env: {} })

    config.set('hello', 'world', 'user')

    await saveConfigSafely(config, 'user')

    expect(await readFile(userConfigPath, 'utf-8')).toMatchInlineSnapshot(`
      "hello=world
      "
    `)

    config.delete('hello', 'user')

    await saveConfigSafely(config, 'user')

    await expect(readFile(userConfigPath, 'utf-8')).rejects.toThrow(
      'ENOENT: no such file or directory'
    )
  })
})

test('saves project configuration successfully', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const projectConfigPath = path.join(cwd, '.npmrc')

    const config = await loadConfig(cwd, { env: {} })

    config.set('hello', 'world', 'project')

    await saveConfigSafely(config, 'project')

    expect(await readFile(projectConfigPath, 'utf-8')).toMatchInlineSnapshot(`
      "hello=world
      "
    `)

    config.delete('hello', 'project')

    await saveConfigSafely(config, 'project')

    await expect(readFile(projectConfigPath, 'utf-8')).rejects.toThrow(
      'ENOENT: no such file or directory'
    )
  })
})

test('returns early when configuration type is unhandled or file path is missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config = await loadConfig(cwd, { env: {} })

    using spy = vi.spyOn(config, 'save')

    await saveConfigSafely(config, 'global')

    expect(spy).not.toHaveBeenCalled()
  })
})

test('retries on ENOENT error and eventually succeeds', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config = await loadConfig(cwd, { env: {} })

    config.set('hello', 'world', 'user')

    let attempts = 0

    vi.mocked(chmod).mockImplementation(async () => {
      attempts++

      if (attempts < 3) {
        const err = new Error(
          'ENOENT: no such file or directory'
        ) as NodeJS.ErrnoException

        err.code = 'ENOENT'

        throw err
      }
    })

    await saveConfigSafely(config, 'user')

    expect(attempts).toBe(3)
    expect(chmod).toHaveBeenCalledTimes(3)
  })
})

test('exhausts retries and throws error when ENOENT persists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config = await loadConfig(cwd, { env: {} })

    config.set('hello', 'world', 'user')

    let attempts = 0

    vi.mocked(chmod).mockImplementation(async () => {
      attempts++

      const err = new Error(
        'ENOENT: no such file or directory'
      ) as NodeJS.ErrnoException

      err.code = 'ENOENT'

      throw err
    })

    await expect(saveConfigSafely(config, 'user')).rejects.toThrow(
      'ENOENT: no such file or directory'
    )

    expect(attempts).toBe(3)
    expect(chmod).toHaveBeenCalledTimes(3)
  })
})

test('throws immediately if error code is not ENOENT', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config = await loadConfig(cwd, { env: {} })

    config.set('hello', 'world', 'user')

    await using _ = vi.mocked(chmod).mockImplementation(async () => {
      const err = new Error(
        'EACCES: permission denied'
      ) as NodeJS.ErrnoException

      err.code = 'EACCES'

      throw err
    })

    await expect(saveConfigSafely(config, 'user')).rejects.toThrow(
      'EACCES: permission denied'
    )
  })
})
