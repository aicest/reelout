// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getGitRemote } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'

test('returns the remote URL or null if not set', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      expect(await getGitRemote(cwd)).toBe(null)
      expect(await getGitRemote(cwd, 'origin')).toBe(null)
      expect(await getGitRemote(cwd, 'upstream')).toBe(null)

      await execGit(remote, ['init', '--bare'])
      await execGit(cwd, ['init'])

      expect(await getGitRemote(cwd)).toBe(null)
      expect(await getGitRemote(cwd, 'origin')).toBe(null)
      expect(await getGitRemote(cwd, 'upstream')).toBe(null)

      await execGit(cwd, [
        'remote',
        'add',
        'origin',
        'ssh://git@github.com/user/repo.git',
      ])

      expect(await getGitRemote(cwd)).toBe('ssh://git@github.com/user/repo.git')

      expect(await getGitRemote(cwd, 'origin')).toBe(
        'ssh://git@github.com/user/repo.git'
      )

      await execGit(cwd, ['remote', 'set-url', 'origin', remote])

      expect(await getGitRemote(cwd)).toBe(remote)
      expect(await getGitRemote(cwd, 'origin')).toBe(remote)
      expect(await getGitRemote(cwd, 'upstream')).toBe(null)

      await execGit(cwd, [
        'remote',
        'add',
        'upstream',
        'git@github.com:org/repo.git',
      ])

      expect(await getGitRemote(cwd, 'upstream')).toBe(
        'git@github.com:org/repo.git'
      )
    })
  })
})
