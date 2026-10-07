// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { CommitClassifier, GitCommit } from '@reelout/core'
import { determineReleaseType, normalizeCommitFilter } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns major for breaking changes', () => {
  const classifier = normalizeCommitFilter({})

  const commit = {
    notes: [{ title: 'BREAKING CHANGE', text: '' }],
  } as GitCommit

  expect(determineReleaseType(classifier, commit)).toBe('major')
})

test('returns release type based on commit type and config', () => {
  const classifier: CommitClassifier = (commit) => {
    switch (commit.type) {
      case 'perf':
        return 'major'
      case 'feat':
        return 'minor'
      case 'fix':
        return 'patch'
      case 'chore':
        return commit.scope === 'release' ? 'patch' : null
      default:
        return null
    }
  }

  for (const [releaseType, commit] of [
    ['minor', { type: 'feat' } as GitCommit],
    ['patch', { type: 'fix' } as GitCommit],
    ['major', { type: 'perf' } as GitCommit],
    [null, { type: 'chore' } as GitCommit],
    [null, { type: 'chore', scope: 'deps' } as GitCommit],
    ['patch', { type: 'chore', scope: 'release' } as GitCommit],
    [null, { type: null, scope: null } as GitCommit],
    [null, { type: 'docs', scope: 'release' } as GitCommit],
  ] as const) {
    expect(determineReleaseType(classifier, { ...commit, notes: [] })).toBe(
      releaseType
    )
  }
})
