// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, resolveGitRepository } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns null if not a git repository', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    expect(await resolveGitRepository(cwd)).toBeNull()
  })
})

test('returns null when origin remote is not set', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    expect(await resolveGitRepository(cwd)).toBeNull()
  })
})

test('parses origin remote URL in HTTPS format', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd, 'https://example.com/')

    expect(await resolveGitRepository(cwd)).toBeNull()

    await execGit(cwd, [
      'remote',
      'set-url',
      'origin',
      'https://github.com/user/repo.git',
    ])

    expect(await resolveGitRepository(cwd)).toMatchInlineSnapshot(`
      {
        "host": "github",
        "owner": "user",
        "repo": "repo",
        "url": "https://github.com/user/repo",
      }
    `)

    await execGit(cwd, [
      'remote',
      'set-url',
      'origin',
      'https://github.com:443/user/dot.dot.git',
    ])

    expect(await resolveGitRepository(cwd)).toMatchInlineSnapshot(`
      {
        "host": "github",
        "owner": "user",
        "repo": "dot.dot",
        "url": "https://github.com/user/dot.dot",
      }
    `)
  })
})

test('parses origin remote URL in SSH format', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd, 'git@github.com')

    expect(await resolveGitRepository(cwd)).toBeNull()

    await execGit(cwd, [
      'remote',
      'set-url',
      'origin',
      'git@github.com:user/repo.git',
    ])

    expect(await resolveGitRepository(cwd)).toMatchInlineSnapshot(`
      {
        "host": "github",
        "owner": "user",
        "repo": "repo",
        "url": "https://github.com/user/repo",
      }
    `)

    await execGit(cwd, [
      'remote',
      'set-url',
      'origin',
      'git@github.com:user/.net.git',
    ])

    expect(await resolveGitRepository(cwd)).toMatchInlineSnapshot(`
      {
        "host": "github",
        "owner": "user",
        "repo": ".net",
        "url": "https://github.com/user/.net",
      }
    `)
  })
})
