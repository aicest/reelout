// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit, GitCommitNote } from '@reelout/core'
import { deriveReleaseType, normalizeCommitFilter } from '@reelout/core'
import { expect, test } from 'vitest'

const classifier = normalizeCommitFilter({
  minor: ['feat'],
  patch: ['fix'],
})

test('ignores unrecognized commit types', () => {
  expect(deriveReleaseType(classifier, [])).toBeNull()

  expect(
    deriveReleaseType(classifier, [
      { type: 'chore', notes: [] as GitCommitNote[] },
      { type: 'docs', notes: [] as GitCommitNote[] },
    ] as GitCommit[])
  ).toBeNull()
})

test('returns most significant release type', () => {
  expect(
    deriveReleaseType(classifier, [
      { type: 'fix', notes: [] as GitCommitNote[] },
      { type: 'feat', notes: [] as GitCommitNote[] },
    ] as GitCommit[])
  ).toBe('minor')
})

test('returns major for breaking changes regardless of commit type', () => {
  expect(
    deriveReleaseType(classifier, [
      { type: 'feat', notes: [] as GitCommitNote[] },
      { notes: [{ title: 'BREAKING CHANGE', text: '' }] as GitCommitNote[] },
      { type: 'fix', notes: [] as GitCommitNote[] },
    ] as GitCommit[])
  ).toBe('major')
})
