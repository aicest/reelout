// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { buildReleaseNotes, type GitCommit } from '@reelout/core'
import { beforeEach, expect, test } from 'vitest'
import { context, repository } from '../../../../../test/mock/context'
import { createMockCommit } from '../../../../../test/mock/git'

beforeEach(() => {
  context.repository = repository
})

test('returns an empty string for an empty commit history', async () => {
  const commits: GitCommit[] = []

  const result = await buildReleaseNotes(context, commits)

  expect(result).toBe('')
})

test('generates formatted markdown with shifted heading depths for provided commits', async () => {
  const commits = [
    await createMockCommit('abc1234', 'feat(core): add release notes builder'),
    await createMockCommit('def5678', 'fix(util): correct markdown formatting'),
  ]

  const result = await buildReleaseNotes(context, commits)

  expect(result).toMatchInlineSnapshot(`
    "## Features

    - **core:** add release notes builder ([abc1234](https://github.com/mock-owner/mock-repo/commit/abc1234))

    ## Bug Fixes

    - **util:** correct markdown formatting ([def5678](https://github.com/mock-owner/mock-repo/commit/def5678))
    "
  `)
})
