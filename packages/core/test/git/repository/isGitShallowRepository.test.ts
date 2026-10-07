// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { execGit, isGitShallowRepository, pushGitChanges } from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  cloneGitRepository,
  getGitCommitSubjects,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('returns false for non-shallow repos', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])

    expect(await isGitShallowRepository(cwd)).toBe(false)
  })
})

test('returns true for shallow and false after unshallow', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '1.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Initial commit'])

      await updatePackageJson(cwd, { version: '2.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Second commit'])

      await updatePackageJson(cwd, { version: '3.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Third commit'])

      await pushGitChanges(cwd, 'main')

      expect(await getGitCommitSubjects(remote)).toEqual([
        'Initial commit',
        'Second commit',
        'Third commit',
      ])
    })

    await temporaryDirectoryTask(async (cwd) => {
      await cloneGitRepository(cwd, remote)

      expect(await isGitShallowRepository(cwd)).toBe(true)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Third commit",
        ]
      `)

      await execGit(cwd, ['fetch', '--unshallow'])

      expect(await isGitShallowRepository(cwd)).toBe(false)
      expect(await getGitCommitSubjects(cwd)).toMatchInlineSnapshot(`
        [
          "Initial commit",
          "Second commit",
          "Third commit",
        ]
      `)
    })
  })
})
