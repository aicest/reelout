// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { defaultConfig, normalizeConfig } from '@reelout/config'
import { createPlugin, type ReleaseConfig } from '@reelout/core'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('applies default git author when author configuration is empty', async () => {
  const config: Required<ReleaseConfig> = {
    author: {},
    classifier: {},
    rules: [],
    plugins: [],
  }

  expect(await normalizeConfig(__dirname, config)).toEqual({
    author: {
      name: 'github-actions[bot]',
      email: '41898282+github-actions[bot]@users.noreply.github.com',
    },
    classifier: expect.any(Function),
    rules: [],
    plugins: [],
  })
})

test('applies default git author email when only name is provided', async () => {
  const config: Required<ReleaseConfig> = {
    author: { name: 'Test User' },
    classifier: {},
    rules: [],
    plugins: [],
  }

  expect(await normalizeConfig(__dirname, config)).toEqual({
    author: {
      name: 'github-actions[bot]',
      email: '41898282+github-actions[bot]@users.noreply.github.com',
    },
    classifier: expect.any(Function),
    rules: [],
    plugins: [],
  })
})

test('applies default git author name when only email is provided', async () => {
  const config: Required<ReleaseConfig> = {
    author: { email: 'test@example.com' },
    classifier: {},
    rules: [],
    plugins: [],
  }

  expect(await normalizeConfig(__dirname, config)).toEqual({
    author: {
      name: 'github-actions[bot]',
      email: '41898282+github-actions[bot]@users.noreply.github.com',
    },
    classifier: expect.any(Function),
    rules: [],
    plugins: [],
  })
})

test('preserves explicit author settings when both name and email are provided', async () => {
  const config: Required<ReleaseConfig> = {
    author: { name: 'Test User', email: 'test@example.com' },
    classifier: {},
    rules: [],
    plugins: [],
  }

  expect(await normalizeConfig(__dirname, config)).toEqual({
    author: { name: 'Test User', email: 'test@example.com' },
    classifier: expect.any(Function),
    rules: [],
    plugins: [],
  })
})

test('normalizes release rules into structured qualifier and channel configurations', async () => {
  const config: Required<ReleaseConfig> = {
    ...defaultConfig,
    rules: [
      { pattern: 'main' },
      { pattern: 'alpha', qualifier: true, channel: true },
      { pattern: 'rc', qualifier: 'rc', channel: false },
    ],
    plugins: [],
  }

  expect(await normalizeConfig(__dirname, config)).toEqual({
    ...defaultConfig,
    classifier: expect.any(Function),
    rules: [
      {
        type: undefined,
        pattern: 'main',
        versionQualifier: undefined,
        releaseChannel: undefined,
      },
      {
        type: undefined,
        pattern: 'alpha',
        versionQualifier: 'alpha',
        releaseChannel: 'alpha',
      },
      {
        type: undefined,
        pattern: 'rc',
        versionQualifier: 'rc',
        releaseChannel: undefined,
      },
    ],
    plugins: [],
  })
})

test('resolves valid plugins and filters falsey values when plugin list contains mixed inputs', async () => {
  const config: Required<ReleaseConfig> = {
    ...defaultConfig,
    rules: [],
    plugins: [
      '@reelout/core/analyzer',
      '@reelout/core/builder',
      false,
      null,
      undefined,
    ],
  }

  const normalized = await normalizeConfig(__dirname, config)

  expect(normalized).toEqual({
    ...defaultConfig,
    classifier: expect.any(Function),
    rules: [],
    plugins: [
      [expect.any(Function), undefined],
      [expect.any(Function), undefined],
    ],
  })

  expect(await Promise.all(normalized.plugins.map(createPlugin))).toEqual([
    expect.objectContaining({ name: '@reelout/core/analyzer' }),
    expect.objectContaining({ name: '@reelout/core/builder' }),
  ])
})

test('rejects normalization when plugin package cannot be resolved', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const config: Required<ReleaseConfig> = {
      ...defaultConfig,
      rules: [],
      plugins: ['nonexistent-plugin-package'],
    }

    await expect(normalizeConfig(cwd, config)).rejects.toThrow(
      "Cannot find module 'nonexistent-plugin-package'"
    )
  })
})

test('rejects normalization when plugin module evaluation throws an error', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    const filePath = path.join(cwd, 'plugin.mjs')

    await writeFile(
      filePath,
      'throw new Error("Failed to evaluate plugin module")'
    )

    const config: Required<ReleaseConfig> = {
      ...defaultConfig,
      rules: [],
      plugins: [filePath],
    }

    await expect(normalizeConfig(cwd, config)).rejects.toThrow(
      'Failed to evaluate plugin module'
    )
  })
})
