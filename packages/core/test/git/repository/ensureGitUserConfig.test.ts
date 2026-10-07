// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit } from '#util'
import { ensureGitUserConfig, getGitConfigValue } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('returns undefined and preserves git config when both name and email are configured', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])
    await execGit(cwd, ['config', 'user.name', 'Existing User'])
    await execGit(cwd, ['config', 'user.email', 'existing@example.com'])

    {
      await using disposable = await ensureGitUserConfig(cwd, {
        name: 'New User',
        email: 'new@example.com',
      })

      expect(disposable).toBeUndefined()
    }

    expect(await getGitConfigValue(cwd, 'user.name')).toBe('Existing User')
    expect(await getGitConfigValue(cwd, 'user.email')).toBe(
      'existing@example.com'
    )
  })
})

test('sets git config temporarily and unsets both values on disposal when no prior config exists', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])

    {
      await using _disposable = await ensureGitUserConfig(cwd, {
        name: 'Test User',
        email: 'test@example.com',
      })

      expect(await getGitConfigValue(cwd, 'user.name')).toBe('Test User')
      expect(await getGitConfigValue(cwd, 'user.email')).toBe(
        'test@example.com'
      )
    }

    expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
    expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
  })
})

test('overrides git config temporarily and restores initial name on disposal when only name is configured', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])
    await execGit(cwd, ['config', 'user.name', 'Initial Name'])

    {
      await using _disposable = await ensureGitUserConfig(cwd, {
        name: 'Override Name',
        email: 'override@example.com',
      })

      expect(await getGitConfigValue(cwd, 'user.name')).toBe('Override Name')
      expect(await getGitConfigValue(cwd, 'user.email')).toBe(
        'override@example.com'
      )
    }

    expect(await getGitConfigValue(cwd, 'user.name')).toBe('Initial Name')
    expect(await getGitConfigValue(cwd, 'user.email')).toBeUndefined()
  })
})

test('overrides git config temporarily and restores initial email on disposal when only email is configured', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await execGit(cwd, ['init'])
    await execGit(cwd, ['config', 'user.email', 'initial@example.com'])

    {
      await using _disposable = await ensureGitUserConfig(cwd, {
        name: 'Override Name',
        email: 'override@example.com',
      })

      expect(await getGitConfigValue(cwd, 'user.name')).toBe('Override Name')
      expect(await getGitConfigValue(cwd, 'user.email')).toBe(
        'override@example.com'
      )
    }

    expect(await getGitConfigValue(cwd, 'user.name')).toBeUndefined()
    expect(await getGitConfigValue(cwd, 'user.email')).toBe(
      'initial@example.com'
    )
  })
})
