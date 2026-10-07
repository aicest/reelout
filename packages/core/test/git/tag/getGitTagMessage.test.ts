// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getGitTagMessage } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('gets git tag messages', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', ''])
    await execGit(cwd, ['tag', 'v3.0.0', '-a', '-m', 'Release v3\nLine 2'])
    await execGit(cwd, ['tag', 'v1.1.0', 'v1.0.0'])
    await execGit(cwd, ['tag', 'v3.1.0', 'v3.0.0'])

    expect(await getGitTagMessage(cwd, '--invalid-flag')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'v0.0.0')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'v1.0.0')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'v1.1.0')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'v2.0.0')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'v3.0.0')).toMatchInlineSnapshot(`
      "Release v3
      Line 2"
    `)
    expect(await getGitTagMessage(cwd, 'v3.1.0')).toMatchInlineSnapshot(`
      "Release v3
      Line 2"
    `)
    expect(await getGitTagMessage(cwd, 'refs/tags/v3.0.0')).toBeUndefined()
    expect(await getGitTagMessage(cwd, 'refs/tags/v3.1.0')).toBeUndefined()
  })
})
