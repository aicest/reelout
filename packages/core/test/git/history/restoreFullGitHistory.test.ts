// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, pushGitChanges, restoreFullGitHistory } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('restores full git history for shallow clones and returns false for non-repositories', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])

      await pushGitChanges(cwd, 'main')
    })

    await temporaryDirectoryTask(async (cwd) => {
      expect(await restoreFullGitHistory(cwd)).toBe(false)

      await cloneGitRepository(cwd, remote)

      expect(await restoreFullGitHistory(cwd)).toBe(true)

      expect(await getGitCommitSubjects(cwd)).toEqual([
        'Initial commit',
        'Second commit',
        'Third commit',
      ])

      expect(await restoreFullGitHistory(cwd)).toBe(false)

      expect(await getGitCommitSubjects(cwd)).toEqual([
        'Initial commit',
        'Second commit',
        'Third commit',
      ])
    })
  })
})
