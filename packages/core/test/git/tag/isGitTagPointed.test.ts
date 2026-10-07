// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, isGitTagPointed } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  getGitCommitHashes,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('returns true or false for tag at commit', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
    await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'v2.0.0'])
    await execGit(cwd, ['tag', 'v2.1.0', 'v2.0.0'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])

    const entries = await getGitCommitHashes(cwd)

    for (const [tag, commit, expected] of [
      ['v1.0.0', '', false],
      ['v1.0.0', entries[0], true],
      ['v1.0.0', entries[1], false],
      ['v1.0.0', entries[2], false],
      ['v2.0.0', entries[0], false],
      ['v2.0.0', entries[1], true],
      ['v2.0.0', entries[2], false],
      ['v2.1.0', entries[0], false],
      ['v2.1.0', entries[1], true],
      ['v2.1.0', entries[2], false],
      ['v9.9.9', entries[0], false],
      ['v9.9.9', entries[1], false],
      ['v9.9.9', entries[2], false],
    ] as const) {
      expect({
        tag,
        commit,
        expected: await isGitTagPointed(cwd, tag, commit as string),
      }).toEqual({
        tag,
        commit,
        expected,
      })
    }
  })
})
