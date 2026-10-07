// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getCurrentGitTag } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns tag or null when untagged', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    expect(await getCurrentGitTag(cwd)).toBeNull()

    await initializeGitRepository(cwd)

    expect(await getCurrentGitTag(cwd)).toBeNull()

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    expect(await getCurrentGitTag(cwd)).toBeNull()

    await execGit(cwd, ['tag', 'v1.0.0'])

    expect(await getCurrentGitTag(cwd)).toBe('v1.0.0')

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])

    expect(await getCurrentGitTag(cwd)).toBeNull()

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])

    expect(await getCurrentGitTag(cwd)).toBeNull()

    await execGit(cwd, ['tag', 'v2.0.0'])
    await execGit(cwd, ['tag', 'v2.1.0', '-a', '-m', 'v2.1.0'])
    await execGit(cwd, ['tag', 'v2.2.0', 'v2.1.0', '-a', '-m', 'v2.2.0'])

    expect(await getCurrentGitTag(cwd)).toBeOneOf(['v2.1.0', 'v2.2.0'])

    await execGit(cwd, ['checkout', 'v1.0.0'])

    expect(await getCurrentGitTag(cwd)).toBe('v1.0.0')

    await execGit(cwd, ['checkout', 'v2.0.0'])

    expect(await getCurrentGitTag(cwd)).toBeOneOf(['v2.1.0', 'v2.2.0'])

    await execGit(cwd, ['checkout', 'v2.1.0'])

    expect(await getCurrentGitTag(cwd)).toBeOneOf(['v2.1.0', 'v2.2.0'])

    await execGit(cwd, ['checkout', 'v2.2.0'])

    expect(await getCurrentGitTag(cwd)).toBeOneOf(['v2.1.0', 'v2.2.0'])
  })
})
