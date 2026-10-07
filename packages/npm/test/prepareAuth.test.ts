// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import Config from '@npmcli/config'
import type { Package } from '@reelout/core'
import { prepareAuth, saveConfigSafely } from '@reelout/npm'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { afterEach, expect, test, vi } from 'vitest'
import { context } from '../../../test/mock/context'
import { HOME_DIR } from '../../../test/mock/env'

vi.mock(import('@npmcli/config'), async (importActual) => {
  const { default: Config, ...mod } = await importActual()

  vi.spyOn(Config.prototype, 'set')
  vi.spyOn(Config.prototype, 'save')
  vi.spyOn(Config.prototype, 'setCredentialsByURI')
  vi.spyOn(Config.prototype, 'clearCredentialsByURI')

  return { ...mod, default: Config }
})

vi.mock(import('@reelout/npm/saveConfigSafely'), async (importActual) => ({
  saveConfigSafely: vi.fn((await importActual()).saveConfigSafely),
}))

const pkg1 = { location: '.' } as Package
const pkg2 = { location: '.', name: '@scope/name' } as Package

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

test('returns undefined when NPM_TOKEN environment variable is absent and authentication does not exist', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    vi.stubEnv('NPM_TOKEN', undefined)

    expect(await prepareAuth(context, pkg1, {})).toBeUndefined()

    expect(saveConfigSafely).not.toHaveBeenCalled()
  })
})

test('skips configuration when authentication already exists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    const npmrc = path.join(cwd, '.npmrc')

    await writeFile(npmrc, '//registry.npmjs.org/:_authToken=mock-npm-token')

    await prepareAuth(context, pkg1, {})

    expect(Config.prototype.set).not.toHaveBeenCalled()
    expect(Config.prototype.save).not.toHaveBeenCalled()
    expect(await readFile(npmrc, 'utf-8')).toMatchInlineSnapshot(
      `"//registry.npmjs.org/:_authToken=mock-npm-token"`
    )
  })
})

test('returns npm configuration environment variables when package manager is npm', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    await using env = await prepareAuth(context, pkg1, { isNpm: true })

    expect(env).toMatchInlineSnapshot(`
      {
        "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
      }
    `)
  })
})

test('returns pnpm configuration environment variables when package manager is pnpm', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    await using env = await prepareAuth(context, pkg1, { isPnpm: true })

    expect(env).toMatchInlineSnapshot(`
      {
        "pnpm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
      }
    `)
  })
})

test('returns npm configuration environment variables when package manager is classic yarn', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    await using env = await prepareAuth(context, pkg1, { isYarnClassic: true })

    expect(env).toMatchInlineSnapshot(`
      {
        "npm_config_//registry.npmjs.org/:_authToken": "mock-npm-token",
      }
    `)
  })
})

test('returns YARN_NPM_AUTH_TOKEN environment variable when package manager is yarn berry', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    await using env = await prepareAuth(context, pkg1, { isYarnBerry: true })

    expect(env).toMatchInlineSnapshot(`
      {
        "YARN_NPM_AUTH_TOKEN": "mock-npm-token",
      }
    `)
  })
})

test('persists NPM_TOKEN to fallback configuration and invokes cleanup upon disposal when no specific package manager matches', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    {
      await using _ = await prepareAuth(context, pkg1, {})
    }

    expect(Config.prototype.setCredentialsByURI).toHaveBeenCalled()
    expect(Config.prototype.clearCredentialsByURI).toHaveBeenCalled()
    expect(saveConfigSafely).toHaveBeenCalled()
  })
})

test('persists NPM_TOKEN to user configuration and removes credentials upon disposal', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    const projectConfigPath = path.join(cwd, '.npmrc')
    const userConfigPath = path.join(HOME_DIR, '.npmrc')

    {
      await using _ = await prepareAuth(context, pkg1, {})

      await expect(stat(projectConfigPath)).rejects.toThrow(
        'ENOENT: no such file or directory'
      )
      expect(await readFile(userConfigPath, 'utf-8')).toMatchInlineSnapshot(`
        "//registry.npmjs.org/:_authToken=mock-npm-token
        "
      `)
    }

    await expect(stat(projectConfigPath)).rejects.toThrow(
      'ENOENT: no such file or directory'
    )
    await expect(stat(userConfigPath)).rejects.toThrow(
      'ENOENT: no such file or directory'
    )
  })
})

test('persists NPM_TOKEN to scoped registry configuration and removes credentials upon disposal', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    context.cwd = cwd

    context.env = { NPM_TOKEN: 'mock-npm-token' }

    const projectConfigPath = path.join(cwd, '.npmrc')
    const userConfigPath = path.join(HOME_DIR, '.npmrc')

    await writeFile(
      projectConfigPath,
      '@scope:registry=https://npm.pkg.github.com/'
    )

    {
      await using _ = await prepareAuth(context, pkg2, {})

      expect(await readFile(projectConfigPath, 'utf-8')).toMatchInlineSnapshot(
        `"@scope:registry=https://npm.pkg.github.com/"`
      )
      expect(await readFile(userConfigPath, 'utf-8')).toMatchInlineSnapshot(`
        "//npm.pkg.github.com/:_authToken=mock-npm-token
        "
      `)
    }

    expect(await readFile(projectConfigPath, 'utf-8')).toMatchInlineSnapshot(
      `"@scope:registry=https://npm.pkg.github.com/"`
    )
    await expect(stat(userConfigPath)).rejects.toThrow(
      'ENOENT: no such file or directory'
    )
  })
})
