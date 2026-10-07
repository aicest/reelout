// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { detectGitRelationship, execGit, GIT_REL_FLAGS } from '@reelout/core'
import { updatePackageJson, writePackageJson } from '@reelout/npm'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import { initializeGitRepository } from '../../../../../test/mock/git'

test('determines ancestor relationship between git refs', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await writePackageJson(cwd, { version: '1.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 1.0.0'])
    await execGit(cwd, ['tag', 'v1.0.0'])

    await updatePackageJson(cwd, { version: '2.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 2.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0'])

    await execGit(cwd, ['reset', '--hard', 'HEAD^'])

    await updatePackageJson(cwd, { version: '3.0.0' })
    await execGit(cwd, ['add', '.'])
    await execGit(cwd, ['commit', '-m', 'Update version to 3.0.0'])
    await execGit(cwd, ['tag', 'v3.0.0'])

    for (const [ref1, ref2, expected] of [
      ['v1.0.0', 'v2.0.0', GIT_REL_FLAGS.IS_ANCESTOR],
      ['v2.0.0', 'v1.0.0', GIT_REL_FLAGS.IS_DESCENDANT],
      ['v1.0.0', 'v3.0.0', GIT_REL_FLAGS.IS_ANCESTOR],
      ['v3.0.0', 'v1.0.0', GIT_REL_FLAGS.IS_DESCENDANT],
      ['v2.0.0', 'v3.0.0', GIT_REL_FLAGS.NONE],
      ['v3.0.0', 'v2.0.0', GIT_REL_FLAGS.NONE],
      ['v1.0.0', 'HEAD', GIT_REL_FLAGS.IS_ANCESTOR],
      ['v2.0.0', 'HEAD', GIT_REL_FLAGS.NONE],
      ['v3.0.0', 'HEAD', GIT_REL_FLAGS.IS_EQUAL],
      ['HEAD', 'HEAD', GIT_REL_FLAGS.IS_EQUAL],
      ['HEAD', 'v1.0.0', GIT_REL_FLAGS.IS_DESCENDANT],
      ['HEAD', 'v2.0.0', GIT_REL_FLAGS.NONE],
      ['HEAD', 'v3.0.0', GIT_REL_FLAGS.IS_EQUAL],
    ] as const) {
      expect(await detectGitRelationship(cwd, ref1, ref2)).toBe(expected)
    }
  })
})
