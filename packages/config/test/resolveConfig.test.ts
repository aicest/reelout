// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { resolveConfig } from '@reelout/config'
import { createPlugin } from '@reelout/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('resolves default configuration when configuration file is absent', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config = await resolveConfig(cwd)

    expect(config).toEqual({
      author: {
        name: 'github-actions[bot]',
        email: '41898282+github-actions[bot]@users.noreply.github.com',
      },
      classifier: expect.any(Function),
      rules: [
        {
          type: 'branch',
          pattern: 'alpha',
          versionQualifier: 'alpha',
          releaseChannel: 'alpha',
        },
        {
          type: 'branch',
          pattern: 'beta',
          versionQualifier: 'beta',
          releaseChannel: 'beta',
        },
        {
          type: 'branch',
          pattern: 'next',
          versionQualifier: 'next',
          releaseChannel: 'next',
        },
      ],
      plugins: [
        [expect.any(Function), undefined],
        [expect.any(Function), undefined],
        [expect.any(Function), undefined],
        [expect.any(Function), undefined],
        [expect.any(Function), undefined],
        [expect.any(Function), undefined],
      ],
    })

    expect(await Promise.all(config.plugins.map(createPlugin))).toEqual([
      expect.objectContaining({ name: '@reelout/core/analyzer' }),
      expect.objectContaining({ name: '@reelout/core/builder' }),
      expect.objectContaining({ name: '@reelout/core/changelog' }),
      expect.objectContaining({ name: '@reelout/npm' }),
      expect.objectContaining({ name: '@reelout/git' }),
      expect.objectContaining({ name: '@reelout/github' }),
    ])
  })
})

test('merges user settings with default configuration when configuration file is present', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, '.reeloutrc.json'),
      JSON.stringify({
        author: {
          name: 'Custom Author',
          email: 'custom@example.com',
        },
        plugins: [],
      })
    )

    expect(await resolveConfig(cwd)).toEqual({
      author: {
        name: 'Custom Author',
        email: 'custom@example.com',
      },
      classifier: expect.any(Function),
      rules: [
        {
          type: 'branch',
          pattern: 'alpha',
          versionQualifier: 'alpha',
          releaseChannel: 'alpha',
        },
        {
          type: 'branch',
          pattern: 'beta',
          versionQualifier: 'beta',
          releaseChannel: 'beta',
        },
        {
          type: 'branch',
          pattern: 'next',
          versionQualifier: 'next',
          releaseChannel: 'next',
        },
      ],
      plugins: [],
    })
  })
})

test('searches for tool-specific configuration file when custom module name is provided', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await writeFile(
      path.join(cwd, '.customtoolrc.json'),
      JSON.stringify({
        author: {
          name: 'Tool Specific Author',
          email: 'tool@example.com',
        },
      })
    )

    expect(await resolveConfig(cwd, 'customtool')).toMatchObject({
      author: {
        name: 'Tool Specific Author',
        email: 'tool@example.com',
      },
    })
  })
})
