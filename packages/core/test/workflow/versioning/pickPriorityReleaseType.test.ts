// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import type { ReleaseType } from '@reelout/core'
import { pickPriorityReleaseType } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns more significant release type', () => {
  expect(pickPriorityReleaseType('major', null)).toBe('major')
  expect(pickPriorityReleaseType(null, 'major')).toBe('major')

  expect(pickPriorityReleaseType('minor', null)).toBe('minor')
  expect(pickPriorityReleaseType(null, 'minor')).toBe('minor')

  expect(pickPriorityReleaseType('patch', null)).toBe('patch')
  expect(pickPriorityReleaseType(null, 'patch')).toBe('patch')

  expect(pickPriorityReleaseType('minor', 'major')).toBe('major')
  expect(pickPriorityReleaseType('major', 'patch')).toBe('major')

  expect(pickPriorityReleaseType('patch', 'minor')).toBe('minor')
  expect(pickPriorityReleaseType('minor', 'patch')).toBe('minor')

  expect(pickPriorityReleaseType('patch', 'patch')).toBe('patch')
})

test('returns null if both release types are null or unknown', () => {
  expect(pickPriorityReleaseType(null, null)).toBe(null)
  expect(pickPriorityReleaseType('unknown' as ReleaseType, null)).toBe(null)
  expect(pickPriorityReleaseType(null, 'unknown' as ReleaseType)).toBe(null)
  expect(
    pickPriorityReleaseType('max' as ReleaseType, 'min' as ReleaseType)
  ).toBe(null)
})
