// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getLatestGitTag } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  getGitCommitSubjects,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('returns latest tag or null', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    expect(await getLatestGitTag(cwd)).toBeNull()

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['tag', 'v1.1.0'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])

    expect(await getLatestGitTag(cwd)).toBe('v1.0.0')

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])
    await execGit(cwd, ['tag', 'v2.0.0'])
    await execGit(cwd, ['tag', 'v2.1.0', 'v2.0.0', '-a', '-m', 'Annotated tag'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])

    expect(await getLatestGitTag(cwd)).toBe('v2.1.0')

    await execGit(cwd, ['checkout', '-b', 'next'])
    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fifth commit'])
    await execGit(cwd, ['tag', 'v3.0.0'])

    expect(await getLatestGitTag(cwd)).toBe('v3.0.0')

    await execGit(cwd, ['checkout', 'main'])

    expect(await getLatestGitTag(cwd)).toBe('v2.1.0')

    await execGit(cwd, ['reset', '--hard', 'HEAD~2'])

    expect(await getGitCommitSubjects(cwd)).toEqual([
      'Initial commit',
      'Second commit',
    ])

    expect(await getLatestGitTag(cwd)).toBe('v1.0.0')

    await execGit(cwd, ['tag', 'v2.2.0', 'v2.1.0'])

    expect(await getLatestGitTag(cwd)).toBe('v1.0.0')

    await execGit(cwd, ['tag', 'v2.3.0', 'v2.2.0', '-a', '-m', 'Annotated tag'])

    expect(await getLatestGitTag(cwd)).toBe('v1.0.0')
  })
})
