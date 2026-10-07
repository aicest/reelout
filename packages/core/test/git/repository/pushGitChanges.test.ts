// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import * as core from '@reelout/core'
import { createGitTag, pushGitChanges } from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test, vi } from 'vitest'
import {
  getGitCommitSubjects,
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('pushes branch and tags atomically', async () => {
  await temporaryDirectoryTask(async (remote) => {
    await temporaryDirectoryTask(async (cwd) => {
      using execGit = vi.spyOn(core, 'execGit')

      await initializeGitRepository(cwd, remote)

      await writePackageJson(cwd, { version: '0.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Initial commit'])
      await createGitTag(cwd, 'v0.0.0', 'Initial version')
      await createGitTag(cwd, 'v0.0.1')
      await createGitTag(cwd, 'v0.0.2')

      expect(await getGitTags(remote)).toEqual([])

      await updatePackageJson(cwd, { version: '1.0.0' })
      await execGit(cwd, ['add', '.'])
      await execGit(cwd, ['commit', '-m', 'Update version to 1.0.0'])
      await createGitTag(cwd, 'v1.0.0', 'Release version 1.0.0')
      await createGitTag(cwd, 'v1.0.1')
      await createGitTag(cwd, 'v1.0.2')
      await createGitTag(cwd, 'v1.0.3')

      await pushGitChanges(cwd, 'main', 'v0.0.2')
      await pushGitChanges(cwd, 'v1.0.0', 'v1.0.1')
      await pushGitChanges(cwd, 'v1.0.1', 'v1.0.3')
      await pushGitChanges(cwd, 'v1.0.3')

      expect(await getGitCommitSubjects(remote)).toEqual([
        'Initial commit',
        'Update version to 1.0.0',
      ])
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "v0.0.2",
          "v1.0.0 Release version 1.0.0",
          "v1.0.1",
          "v1.0.3",
        ]
      `)

      await pushGitChanges(cwd, null, ':v1.0.0', ':v1.0.1')

      expect(await getGitCommitSubjects(remote)).toEqual([
        'Initial commit',
        'Update version to 1.0.0',
      ])
      expect(await getGitTags(remote)).toMatchInlineSnapshot(`
        [
          "v0.0.2",
          "v1.0.3",
        ]
      `)
    })
  })
})
