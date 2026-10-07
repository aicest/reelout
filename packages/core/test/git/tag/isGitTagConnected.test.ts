// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, isGitTagConnected, pushGitChanges } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('determines whether a git tag is present in the current branch history', async () => {
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
      await execGit(cwd, ['tag', 'v4.0.0-dev.0'])

      await execGit(cwd, ['commit', '--allow-empty', '-m', 'add fifth commit'])
      await execGit(cwd, ['tag', 'v4.0.0-dev.1'])

      expect(await isGitTagConnected(cwd, 'v1.0.0')).toBe(true)
      expect(await isGitTagConnected(cwd, 'v2.1.0')).toBe(true)
      expect(await isGitTagConnected(cwd, 'v4.0.0-dev.1')).toBe(true)

      await execGit(cwd, ['checkout', 'main'])

      for (const [tag, expected] of [
        ['v0.0.0', false],
        ['v1.0.0', true],
        ['v2.0.0', true],
        ['v2.1.0', true],
        ['v3.0.0', true],
        ['v4.0.0-dev.0', false],
        ['v4.0.0-dev.1', false],
        ['v9.9.9', false],
      ] as const) {
        expect({
          tag,
          expected: await isGitTagConnected(cwd, tag),
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
          "v4.0.0-dev.1",
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
          "v4.0.0-dev.1",
        ]
      `)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "add fifth commit",
        ]
      `)

      expect(await isGitTagConnected(cwd, 'v1.0.0')).toBe(false)
      expect(await isGitTagConnected(cwd, 'v2.1.0')).toBe(false)
      expect(await isGitTagConnected(cwd, 'v4.0.0-dev.1')).toBe(true)

      expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
        [
          "v4.0.0-dev.1",
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
