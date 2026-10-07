// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, getCurrentGitBranch } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('returns current branch name for valid branch names', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    expect(await getCurrentGitBranch(cwd)).toBe('main')

    await expect(execGit(cwd, ['checkout', '-b', ''])).rejects.toThrow()
    await expect(execGit(cwd, ['checkout', '-b', ' '])).rejects.toThrow()
    await expect(execGit(cwd, ['checkout', '-b', '\t'])).rejects.toThrow()
    await expect(execGit(cwd, ['checkout', '-b', '\n'])).rejects.toThrow()

    for (const name of [
      'feature/awesome',
      'bugfix-123',
      'release-1.6',
      'hotfix/urgent',
      'name.with.dot',
      'name_with_underscore',
      '中文-分支',
    ]) {
      await execGit(cwd, ['checkout', '-b', name])
      expect(await getCurrentGitBranch(cwd)).toBe(name)
    }
  })
})

test('rejects when repository is in detached HEAD state', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    await execGit(cwd, ['tag', 'v1.0.0'])

    await execGit(cwd, ['checkout', 'v1.0.0'])

    await expect(getCurrentGitBranch(cwd)).rejects.toMatchInlineSnapshot(
      `[Error: Command 'git symbolic-ref -q --short HEAD' failed (exit code 1)]`
    )

    await execGit(cwd, [
      'checkout',
      (await execGit(cwd, ['rev-parse', 'HEAD^{commit}'])).trim(),
    ])

    await expect(getCurrentGitBranch(cwd)).rejects.toMatchInlineSnapshot(
      `[Error: Command 'git symbolic-ref -q --short HEAD' failed (exit code 1)]`
    )
  })
})
