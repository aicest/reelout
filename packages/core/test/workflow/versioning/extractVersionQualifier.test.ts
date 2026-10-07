// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractVersionQualifier } from '@reelout/core'
import semver from 'semver'
import { expect, test } from 'vitest'

test('returns undefined when version input is null or undefined', () => {
  expect(extractVersionQualifier(null)).toBeUndefined()
  expect(extractVersionQualifier(undefined)).toBeUndefined()
})

test('returns undefined when version has no prerelease components', () => {
  expect(extractVersionQualifier(semver.parse('1.2.3'))).toBeUndefined()
})

test('returns full qualifier when prerelease is a single non-numeric identifier', () => {
  expect(extractVersionQualifier(semver.parse('2.0.0-beta'))).toBe('beta')
})

test('returns dot-separated string when prerelease has multiple non-numeric identifiers', () => {
  expect(extractVersionQualifier(semver.parse('1.0.0-alpha.beta'))).toBe(
    'alpha.beta'
  )
})

test('strips trailing counter when prerelease ends with numeric index', () => {
  expect(extractVersionQualifier(semver.parse('1.1.0-dev.3'))).toBe('dev')
})

test('strips trailing counter when multi-segment qualifier ends with numeric index', () => {
  expect(extractVersionQualifier(semver.parse('1.0.0-alpha.beta.1'))).toBe(
    'alpha.beta'
  )
})

test('preserves numeric identifier when located in non-terminal position', () => {
  expect(extractVersionQualifier(semver.parse('1.0.0-alpha.1.beta'))).toBe(
    'alpha.1.beta'
  )
})

test('strips only final numeric segment when prerelease contains multiple numbers', () => {
  expect(extractVersionQualifier(semver.parse('3.0.0-rc.1.4'))).toBe('rc.1')
})

test('returns empty string when prerelease consists solely of a numeric counter', () => {
  expect(extractVersionQualifier(semver.parse('1.0.0-1'))).toBe('')
})
