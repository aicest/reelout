// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getGitConfigValue } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('returns undefined if not a repo', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
    expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
  })
})

test('returns git config if set', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])
    await execGit(cwd, ['config', 'user.name', 'Test User'])

    expect(await getGitConfigValue(cwd, 'user.name')).toBe('Test User')
    expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
  })
})

test('ignores empty string values', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])
    await execGit(cwd, ['config', 'user.name', ''])
    await execGit(cwd, ['config', 'user.email', ''])

    expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
    expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
  })
})
