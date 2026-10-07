// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  resolveVersionQualifier,
  type ResolvedReleaseRule,
} from '@reelout/core'
import { expect, test } from 'vitest'

const rule1: ResolvedReleaseRule = {
  type: 'branch',
  pattern: 'develop',
  versionQualifier: 'dev',
  releaseChannel: 'dev',
}

const rule2: ResolvedReleaseRule = {
  type: 'branch',
  pattern: 'release',
  versionQualifier: undefined,
  releaseChannel: undefined,
}

test('resolves qualifier from release rule when qualifier is undefined', () => {
  const result = resolveVersionQualifier({
    rule: rule1,
    templateParams: {},
    qualifier: undefined,
  })

  expect(result).toBe('dev')
})

test('returns undefined when qualifier is undefined and rule contains no qualifier', () => {
  const result = resolveVersionQualifier({
    rule: rule2,
    templateParams: {},
    qualifier: undefined,
  })

  expect(result).toBe(undefined)
})

test('resolves qualifier from release rule when qualifier is true', () => {
  const result = resolveVersionQualifier({
    rule: rule1,
    templateParams: {},
    qualifier: true,
  })

  expect(result).toBe('dev')
})

test('falls back to empty string when qualifier is true and rule contains no qualifier', () => {
  const result = resolveVersionQualifier({
    rule: rule2,
    templateParams: {},
    qualifier: true,
  })

  expect(result).toBe('')
})

test('returns undefined when qualifier is set to false', () => {
  const result = resolveVersionQualifier({
    rule: rule1,
    templateParams: {},
    qualifier: false,
  })

  expect(result).toBe(undefined)
})

test('overrides release rule qualifier when explicit string qualifier is specified', () => {
  const result = resolveVersionQualifier({
    rule: rule1,
    templateParams: {},
    qualifier: 'beta',
  })

  expect(result).toBe('beta')
})

test('returns empty string when qualifier is set to empty string', () => {
  const result = resolveVersionQualifier({
    rule: rule1,
    templateParams: {},
    qualifier: '',
  })

  expect(result).toBe('')
})

test('interpolates template parameters when qualifier contains placeholders', () => {
  const result = resolveVersionQualifier({
    rule: undefined,
    templateParams: { date: '20260101', month: '202601' },
    qualifier: 'dev.{date}.{month}',
  })

  expect(result).toBe('dev.20260101.202601')
})

test('throws error when resolved qualifier is an invalid SemVer prerelease identifier', () => {
  expect(
    resolveVersionQualifier({
      rule: undefined,
      templateParams: {},
      qualifier: '0',
    })
  ).toBe('0')

  expect(
    resolveVersionQualifier({
      rule: undefined,
      templateParams: {},
      qualifier: '1',
    })
  ).toBe('1')

  expect(
    resolveVersionQualifier({
      rule: undefined,
      templateParams: {},
      qualifier: '10',
    })
  ).toBe('10')

  expect(() =>
    resolveVersionQualifier({
      rule: undefined,
      templateParams: {},
      qualifier: '01',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: The resolved version qualifier "01" is not a valid SemVer prerelease identifier.]`
  )

  expect(() =>
    resolveVersionQualifier({
      rule: undefined,
      templateParams: {},
      qualifier: 'not valid',
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: The resolved version qualifier "not valid" is not a valid SemVer prerelease identifier.]`
  )
})
