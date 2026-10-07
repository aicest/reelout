// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import '../../../test/mock/env'

import { loadConfig } from '@reelout/npm'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('resolves configuration values from the project-level .npmrc file', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, '.npmrc'),
      ['strict-ssl=false', 'registry=https://npm.pkg.github.com/'].join('\n')
    )

    expect(process.env.npm_config_registry).toBeUndefined()

    const config = await loadConfig(cwd, { env: {} })

    expect(process.env.npm_config_registry).toBeUndefined()

    expect(config.get('strict-ssl', undefined)).toBe(false)
    expect(config.get('strict-ssl', 'project')).toBe(false)
    expect(config.get('strict-ssl', 'user')).toBe(undefined)
    expect(config.get('strict-ssl', 'global')).toBe(undefined)
    expect(config.get('strict-ssl', 'default')).toBe(true)

    expect(config.get('registry', undefined)).toBe(
      'https://npm.pkg.github.com/'
    )
    expect(config.get('registry', 'project')).toBe(
      'https://npm.pkg.github.com/'
    )
    expect(config.get('registry', 'user')).toBe(undefined)
    expect(config.get('registry', 'global')).toBe(undefined)
    expect(config.get('registry', 'default')).toBe(
      'https://registry.npmjs.org/'
    )
  })
})
