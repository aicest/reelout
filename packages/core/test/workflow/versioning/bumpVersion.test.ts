// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { bumpVersion } from '@reelout/core'
import { expect, test } from 'vitest'

test('throws error when version is not valid semver', () => {
  expect(() =>
    bumpVersion({ version: '1.0', release: 'patch' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Version "1.0" is not a valid semantic version.]`
  )

  expect(() =>
    bumpVersion({ version: 'a.b.c', release: 'patch' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: Version "a.b.c" is not a valid semantic version.]`
  )
})

test('returns null when release type is null or undefined', () => {
  expect(bumpVersion({ version: '0.0.0', release: null })).toBe(null)
  expect(bumpVersion({ version: '0.0.0', release: undefined })).toBe(null)
})

test('graduates prerelease or increments core version when identifier is omitted', () => {
  for (const [version, release, expected] of [
    // normal
    ['1.0.0', 'major', '2.0.0'],
    ['1.0.0', 'minor', '1.1.0'],
    ['1.0.0', 'patch', '1.0.1'],
    ['0.0.0', 'major', '1.0.0'],
    ['0.0.0', 'minor', '0.1.0'],
    ['0.0.0', 'patch', '0.0.1'],
    // premajor
    ['1.0.0-alpha.4', 'major', '1.0.0'],
    ['1.0.0-alpha.4', 'minor', '1.0.0'],
    ['1.0.0-alpha.4', 'patch', '1.0.0'],
    ['0.0.0-alpha.4', 'major', '0.0.0'],
    ['0.0.0-alpha.4', 'minor', '0.0.0'],
    ['0.0.0-alpha.4', 'patch', '0.0.0'],
    // normal
    ['1.2.0', 'major', '2.0.0'],
    ['1.2.0', 'minor', '1.3.0'],
    ['1.2.0', 'patch', '1.2.1'],
    ['0.2.0', 'major', '1.0.0'],
    ['0.2.0', 'minor', '0.3.0'],
    ['0.2.0', 'patch', '0.2.1'],
    // preminor
    ['1.2.0-alpha.3', 'major', '2.0.0'],
    ['1.2.0-alpha.3', 'minor', '1.2.0'],
    ['1.2.0-alpha.3', 'patch', '1.2.0'],
    ['0.2.0-alpha.3', 'major', '1.0.0'],
    ['0.2.0-alpha.3', 'minor', '0.2.0'],
    ['0.2.0-alpha.3', 'patch', '0.2.0'],
    // normal
    ['1.2.3', 'major', '2.0.0'],
    ['1.2.3', 'minor', '1.3.0'],
    ['1.2.3', 'patch', '1.2.4'],
    ['0.2.3', 'major', '1.0.0'],
    ['0.2.3', 'minor', '0.3.0'],
    ['0.2.3', 'patch', '0.2.4'],
    // prepatch
    ['1.2.3-alpha.4', 'major', '2.0.0'],
    ['1.2.3-alpha.4', 'minor', '1.3.0'],
    ['1.2.3-alpha.4', 'patch', '1.2.3'],
    ['0.2.3-alpha.4', 'major', '1.0.0'],
    ['0.2.3-alpha.4', 'minor', '0.3.0'],
    ['0.2.3-alpha.4', 'patch', '0.2.3'],
  ] as const) {
    expect(bumpVersion({ version, release })).toBe(expected)
  }
})

test('initiates or increments prerelease version when matching identifier is specified', () => {
  for (const [version, release, expected] of [
    // normal
    ['1.0.0', 'major', '2.0.0-alpha.0'],
    ['1.0.0', 'minor', '1.1.0-alpha.0'],
    ['1.0.0', 'patch', '1.0.1-alpha.0'],
    // premajor
    ['1.0.0-alpha.4', 'major', '1.0.0-alpha.5'],
    ['1.0.0-alpha.4', 'minor', '1.0.0-alpha.5'],
    ['1.0.0-alpha.4', 'patch', '1.0.0-alpha.5'],
    // normal
    ['1.2.0', 'major', '2.0.0-alpha.0'],
    ['1.2.0', 'minor', '1.3.0-alpha.0'],
    ['1.2.0', 'patch', '1.2.1-alpha.0'],
    // preminor
    ['1.2.0-alpha.3', 'major', '2.0.0-alpha.0'],
    ['1.2.0-alpha.3', 'minor', '1.2.0-alpha.4'],
    ['1.2.0-alpha.3', 'patch', '1.2.0-alpha.4'],
    // normal
    ['1.2.3', 'major', '2.0.0-alpha.0'],
    ['1.2.3', 'minor', '1.3.0-alpha.0'],
    ['1.2.3', 'patch', '1.2.4-alpha.0'],
    // prepatch
    ['1.2.3-alpha.4', 'major', '2.0.0-alpha.0'],
    ['1.2.3-alpha.4', 'minor', '1.3.0-alpha.0'],
    ['1.2.3-alpha.4', 'patch', '1.2.3-alpha.5'],
  ] as const) {
    expect(bumpVersion({ version, release, identifier: 'alpha' })).toBe(
      expected
    )
  }
})

test('resets prerelease counter when switching to a different identifier', () => {
  for (const [version, release, expected] of [
    // normal
    ['1.0.0', 'major', '2.0.0-beta.0'],
    ['1.0.0', 'minor', '1.1.0-beta.0'],
    ['1.0.0', 'patch', '1.0.1-beta.0'],
    // premajor
    ['1.0.0-alpha.4', 'major', '1.0.0-beta.0'],
    ['1.0.0-alpha.4', 'minor', '1.0.0-beta.0'],
    ['1.0.0-alpha.4', 'patch', '1.0.0-beta.0'],
    // normal
    ['1.2.0', 'major', '2.0.0-beta.0'],
    ['1.2.0', 'minor', '1.3.0-beta.0'],
    ['1.2.0', 'patch', '1.2.1-beta.0'],
    // preminor
    ['1.2.0-alpha.3', 'major', '2.0.0-beta.0'],
    ['1.2.0-alpha.3', 'minor', '1.2.0-beta.0'],
    ['1.2.0-alpha.3', 'patch', '1.2.0-beta.0'],
    // normal
    ['1.2.3', 'major', '2.0.0-beta.0'],
    ['1.2.3', 'minor', '1.3.0-beta.0'],
    ['1.2.3', 'patch', '1.2.4-beta.0'],
    // prepatch
    ['1.2.3-alpha.4', 'major', '2.0.0-beta.0'],
    ['1.2.3-alpha.4', 'minor', '1.3.0-beta.0'],
    ['1.2.3-alpha.4', 'patch', '1.2.3-beta.0'],
  ] as const) {
    expect(bumpVersion({ version, release, identifier: 'beta' })).toBe(expected)
  }
})

test('applies numeric prerelease tag when identifier is an empty string', () => {
  for (const [version, release, expected] of [
    // normal
    ['1.0.0', 'major', '2.0.0-0'],
    ['1.0.0', 'minor', '1.1.0-0'],
    ['1.0.0', 'patch', '1.0.1-0'],
    ['0.0.0', 'major', '1.0.0-0'],
    ['0.0.0', 'minor', '0.1.0-0'],
    ['0.0.0', 'patch', '0.0.1-0'],
    // premajor
    ['1.0.0-4', 'major', '1.0.0-5'],
    ['1.0.0-4', 'minor', '1.0.0-5'],
    ['1.0.0-4', 'patch', '1.0.0-5'],
    ['0.0.0-4', 'major', '0.0.0-5'],
    ['0.0.0-4', 'minor', '0.0.0-5'],
    ['0.0.0-4', 'patch', '0.0.0-5'],
    // normal
    ['1.2.0', 'major', '2.0.0-0'],
    ['1.2.0', 'minor', '1.3.0-0'],
    ['1.2.0', 'patch', '1.2.1-0'],
    // preminor
    ['1.2.0-3', 'major', '2.0.0-0'],
    ['1.2.0-3', 'minor', '1.2.0-4'],
    ['1.2.0-3', 'patch', '1.2.0-4'],
    // normal
    ['1.2.3', 'major', '2.0.0-0'],
    ['1.2.3', 'minor', '1.3.0-0'],
    ['1.2.3', 'patch', '1.2.4-0'],
    // prepatch
    ['1.2.3-4', 'major', '2.0.0-0'],
    ['1.2.3-4', 'minor', '1.3.0-0'],
    ['1.2.3-4', 'patch', '1.2.3-5'],
  ] as const) {
    expect(bumpVersion({ version, release, identifier: '' })).toBe(expected)
  }
})

test('advances core version with numeric prerelease tag when transitioning from named qualifier to empty string identifier', () => {
  for (const [version, release, expected] of [
    ['1.0.0-alpha.4', 'major', '2.0.0-0'],
    ['1.0.0-alpha.4', 'minor', '1.1.0-0'],
    ['1.0.0-alpha.4', 'patch', '1.0.1-0'],
    ['1.2.0-beta.3', 'minor', '1.3.0-0'],
    ['1.2.3-rc.1', 'patch', '1.2.4-0'],
  ] as const) {
    expect(bumpVersion({ version, release, identifier: '' })).toBe(expected)
  }
})

test('returns bumped version according to transition strategy when transition parameter is specified', () => {
  for (const [version, identifier, transition, expected] of [
    ['1.2.0', 'dev', 'advance', '1.3.0-dev.0'],
    ['1.2.0', 'dev', 'continue', null],
    ['1.2.0', undefined, 'advance', '1.3.0'],
    ['1.2.0', undefined, 'continue', null],
    ['1.2.0-dev.3', 'dev', 'advance', '1.3.0-dev.0'],
    ['1.2.0-dev.3', 'dev', 'continue', '1.2.0-dev.4'],
    ['1.2.0-dev.3', undefined, 'advance', null],
    ['1.2.0-dev.3', undefined, 'continue', '1.2.0'],
  ] as const) {
    expect(
      bumpVersion({ version, release: 'minor', identifier, transition })
    ).toBe(expected)
  }
})
