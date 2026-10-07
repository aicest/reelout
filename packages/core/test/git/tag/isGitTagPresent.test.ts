// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, isGitTagPresent, pushGitChanges } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('verifies local presence of a given tag', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'initial commit'])
      await execGit(cwd, ['tag', 'v1.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'add second commit'])
      await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'v2.0.0'])
      await execGit(cwd, ['tag', 'v2.1.0', 'v2.0.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'add third commit'])
      await execGit(cwd, ['tag', 'v3.0.0'])

      await execGit(cwd, ['checkout', '-b', 'next'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'add fourth commit'])
      await execGit(cwd, ['commit', '--allow-empty', '-m', 'add fifth commit'])
      await execGit(cwd, ['tag', 'v4.0.0-dev.0'])

      expect(await isGitTagPresent(cwd, 'v1.0.0')).toBe(true)
      expect(await isGitTagPresent(cwd, 'v2.1.0')).toBe(true)
      expect(await isGitTagPresent(cwd, 'v4.0.0-dev.0')).toBe(true)

      await execGit(cwd, ['checkout', 'main'])

      for (const [tag, expected] of [
        ['v0.0.0', false],
        ['v1.0.0', true],
        ['v2.0.0', true],
        ['v2.1.0', true],
        ['v3.0.0', true],
        ['v4.0.0-dev.0', true],
        ['v9.9.9', false],
      ] as const) {
        expect({
          tag,
          expected: await isGitTagPresent(cwd, tag),
        }).toEqual({
          tag,
          expected,
        })
      }

      await pushGitChanges(cwd, 'main', 'next', '--tags')

      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "v1.0.0",
          "v2.0.0 v2.0.0",
          "v2.1.0 v2.0.0",
          "v3.0.0",
          "v4.0.0-dev.0",
        ]
      `)
      expect(await getGitCommitSubjects(remote)).toMatchInlineSnapshot(`
        [
          "initial commit",
          "add second commit",
          "add third commit",
        ]
      `)
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote, 'next')

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0-dev.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "add fifth commit",
        ]
      `)

      expect(await isGitTagPresent(cwd, 'v4.0.0-dev.0')).toBe(true)
      expect(await isGitTagPresent(cwd, 'v2.1.0')).toBe(false)
      expect(await isGitTagPresent(cwd, 'v1.0.0')).toBe(false)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0-dev.0",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "add fifth commit",
        ]
      `)
    })
  })
})

test('detects present and missing revisions locally', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await execGit(cwd, ['tag', 'v1'])

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Second commit'])
    await execGit(cwd, ['tag', 'v2', '-a', '-m', 'v2'])

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Third commit'])

    await execGit(cwd, ['checkout', '-b', 'release/20260101'])

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Fourth commit'])

    for (const [ref, expected] of [
      ['main', false],
      ['refs/heads/main', false],
      ['release/20260101', false],
      ['refs/heads/release/20260101', false],

      ['v1', true],
      ['refs/tags/v1', false],
      ['v2', true],
      ['refs/tags/v2', false],

      [(await execGit(cwd, ['rev-parse', 'HEAD'])).trim(), false],
      ['HEAD', false],
      ['HEAD^', false],
      ['HEAD~1', false],

      ['v9.9.9', false],
      ['refs/tags/v9.9.9', false],
      ['HEAD~99', false],
      ['', false],
      ['--invalid-flag', false],
      ['non-existent-branch', false],
      ['refs/heads/non-existent-branch', false],
    ] as const) {
      expect(await isGitTagPresent(cwd, ref)).toBe(expected)
    }
  })
})
