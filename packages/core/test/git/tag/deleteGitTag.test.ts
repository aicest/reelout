// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { deleteGitTag, execGit } from '@reelout/core'
import { temporaryDirectoryTask } from 'tempy'
import { expect, test } from 'vitest'
import {
  getGitTags,
  initializeGitRepository,
} from '../../../../../test/mock/git'

test('deletes git tags and returns false for non-existent tags', async () => {
  await temporaryDirectoryTask(async (cwd) => {
    await initializeGitRepository(cwd)

    await execGit(cwd, ['commit', '--allow-empty', '-m', 'Initial commit'])
    await execGit(cwd, ['tag', 'v1.0.0'])
    await execGit(cwd, ['tag', 'v2.0.0', '-a', '-m', 'Release v2'])

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
      [
        "v1.0.0",
        "v2.0.0 Release v2",
      ]
    `)

    expect(await deleteGitTag(cwd, 'v1.0.0')).toBe(true)

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
      [
        "v2.0.0 Release v2",
      ]
    `)

    expect(await deleteGitTag(cwd, 'refs/tags/v2.0.0')).toBe(false)

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`
      [
        "v2.0.0 Release v2",
      ]
    `)

    expect(await deleteGitTag(cwd, 'v2.0.0')).toBe(true)

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`[]`)

    expect(await deleteGitTag(cwd, 'v0.9.0')).toBe(false)
    expect(await deleteGitTag(cwd, 'v1.0.0')).toBe(false)
    expect(await deleteGitTag(cwd, 'refs/tags/v0.9.0')).toBe(false)
    expect(await deleteGitTag(cwd, 'refs/tags/v1.0.0')).toBe(false)

    expect(await getGitTags(cwd)).toMatchInlineSnapshot(`[]`)
  })
})
