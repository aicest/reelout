// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isStableVersion } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns true for stable releases when major > 0 and no prerelease', () => {
  expect(isStableVersion('1.0.0')).toBe(true)
  expect(isStableVersion('2.5.1')).toBe(true)
  expect(isStableVersion('10.0.0')).toBe(true)
})

test('returns false for initial development versions (0.x.x)', () => {
  expect(isStableVersion('0.1.0')).toBe(false)
  expect(isStableVersion('0.0.1')).toBe(false)
  expect(isStableVersion('0.5.9')).toBe(false)
})

test('returns false for versions that include prerelease identifiers', () => {
  expect(isStableVersion('1.0.0-alpha.1')).toBe(false)
  expect(isStableVersion('2.0.0-beta.0')).toBe(false)
  expect(isStableVersion('3.1.2-rc.5')).toBe(false)
})

test('returns false for prerelease versions during initial development', () => {
  expect(isStableVersion('0.1.0-alpha.1')).toBe(false)
})

test('treats build metadata as stable when other conditions are met', () => {
  expect(isStableVersion('1.0.0+build.123')).toBe(true)
})

test('throws an error for invalid SemVer strings', () => {
  expect(() => isStableVersion('invalid')).toThrowErrorMatchingInlineSnapshot(
    `[Error: The version "[1minvalid[22m" is not a valid SemVer.]`
  )
  expect(() => isStableVersion('1.0')).toThrowErrorMatchingInlineSnapshot(
    `[Error: The version "[1m1.0[22m" is not a valid SemVer.]`
  )
  expect(() => isStableVersion('1.x.x')).toThrowErrorMatchingInlineSnapshot(
    `[Error: The version "[1m1.x.x[22m" is not a valid SemVer.]`
  )
})
