// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { GitCommit } from '@reelout/core'
import { normalizeCommitFilter } from '@reelout/core'
import { expect, test } from 'vitest'

test('normalizes null/undefined into no-op classifier returning null', () => {
  for (const classifier of [
    normalizeCommitFilter(null),
    normalizeCommitFilter(undefined),
  ]) {
    expect(classifier({} as GitCommit)).toBe(null)
    expect(classifier({ type: 'feat' } as GitCommit)).toBe(null)
    expect(classifier({ type: 'chore' } as GitCommit)).toBe(null)
  }
})

test('applies function-based classifier to map commits to release types', () => {
  const classifier = normalizeCommitFilter((commit) => {
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
  })

  expect(classifier({} as GitCommit)).toBe(null)
  expect(classifier({ type: 'feat' } as GitCommit)).toBe('minor')
  expect(classifier({ type: 'fix' } as GitCommit)).toBe('patch')
  expect(classifier({ type: 'perf' } as GitCommit)).toBe('major')
  expect(classifier({ type: 'chore' } as GitCommit)).toBe(null)
  expect(classifier({ type: 'chore', scope: 'release' } as GitCommit)).toBe(
    'patch'
  )
  expect(classifier({ type: 'docs' } as GitCommit)).toBe(null)
  expect(classifier({ type: 'docs', scope: 'release' } as GitCommit)).toBe(null)
})

test('applies object-based classifier mapping commit types to release types', () => {
  const classifier = normalizeCommitFilter({
    major: ['perf'],
    minor: ['feat'],
    patch: ['fix'],
  })

  expect(classifier({} as GitCommit)).toBe(null)
  expect(classifier({ type: 'feat' } as GitCommit)).toBe('minor')
  expect(classifier({ type: 'fix' } as GitCommit)).toBe('patch')
  expect(classifier({ type: 'perf' } as GitCommit)).toBe('major')
  expect(classifier({ type: 'chore' } as GitCommit)).toBe(undefined)
  expect(classifier({ type: 'chore', scope: 'release' } as GitCommit)).toBe(
    undefined
  )
  expect(classifier({ type: 'docs' } as GitCommit)).toBe(undefined)
  expect(classifier({ type: 'docs', scope: 'release' } as GitCommit)).toBe(
    undefined
  )
})
