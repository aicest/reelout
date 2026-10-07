// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, isGitAncestor } from '@reelout/core'
import { writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('correctly identifies ancestor relationships between refs', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 1.0.0'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writePackageJson(cwd, { version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 2.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0'])

    await execGit(cwd, ['reset', '--hard', 'HEAD^'])

    await writePackageJson(cwd, { version: '3.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 3.0.0'])
    await execGit(cwd, ['tag', 'v3.0.0'])

    for (const [ancestor, descendant, expected] of [
      ['v1.0.0', 'v2.0.0', true],
      ['v1.0.0', 'v3.0.0', true],
      ['v1.0.0', 'HEAD', true],
      ['v2.0.0', 'v1.0.0', false],
      ['v3.0.0', 'v1.0.0', false],
      ['HEAD', 'v1.0.0', false],
      ['v2.0.0', 'v3.0.0', false],
      ['v3.0.0', 'v2.0.0', false],
      ['v2.0.0', 'HEAD', false],
      ['HEAD', 'v2.0.0', false],
      ['v3.0.0', 'HEAD', true],
      ['HEAD', 'v3.0.0', true],
      ['HEAD', 'HEAD', true],
      ['HEAD', 'HEAD^', false],
      ['HEAD^', 'HEAD', true],
      ['HEAD^', 'HEAD^', true],
      ['refs/tags/v1.0.0', 'refs/tags/v2.0.0', true],
      ['refs/tags/v2.0.0', 'refs/tags/v1.0.0', false],
      ['refs/tags/v1.0.0', 'HEAD', true],
    ] as const) {
      expect(await isGitAncestor(cwd, ancestor, descendant)).toBe(expected)
    }
  })
})

test('throws when either ref is invalid or missing', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 1.0.0'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await writePackageJson(cwd, { version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 2.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0'])

    await expect(isGitAncestor(cwd, 'v1.0.0', 'v9.9.9')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git merge-base --is-ancestor v1.0.0 v9.9.9' failed (exit code 128)
      fatal: Not a valid object name v9.9.9]
    `)

    await expect(isGitAncestor(cwd, 'v2.0.0', 'v9.9.9')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git merge-base --is-ancestor v2.0.0 v9.9.9' failed (exit code 128)
      fatal: Not a valid object name v9.9.9]
    `)

    await expect(isGitAncestor(cwd, 'v9.9.9', 'v1.0.0')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git merge-base --is-ancestor v9.9.9 v1.0.0' failed (exit code 128)
      fatal: Not a valid object name v9.9.9]
    `)

    await expect(isGitAncestor(cwd, 'v9.9.9', 'v2.0.0')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git merge-base --is-ancestor v9.9.9 v2.0.0' failed (exit code 128)
      fatal: Not a valid object name v9.9.9]
    `)

    await expect(isGitAncestor(cwd, 'v9.9.9', 'v9.9.9')).rejects
      .toMatchInlineSnapshot(`
      [Error: Command 'git merge-base --is-ancestor v9.9.9 v9.9.9' failed (exit code 128)
      fatal: Not a valid object name v9.9.9]
    `)
  })
})
