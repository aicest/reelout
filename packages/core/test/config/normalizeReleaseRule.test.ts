// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { normalizeReleaseRule } from '@reelout/core'
import { expect, test } from 'vitest'

test('expands string shorthand into resolved rule when input is a pattern string', () => {
  expect(normalizeReleaseRule('release/*')).toMatchInlineSnapshot(`
    {
      "pattern": "release/*",
      "releaseChannel": "release",
      "type": undefined,
      "versionQualifier": "release",
    }
  `)
})

test('preserves explicit type, pattern, qualifier, and channel when provided', () => {
  expect(
    normalizeReleaseRule({
      type: 'branch',
      pattern: 'release/*',
      qualifier: 'rc',
      channel: 'stable',
    })
  ).toMatchInlineSnapshot(`
    {
      "pattern": "release/*",
      "releaseChannel": "stable",
      "type": "branch",
      "versionQualifier": "rc",
    }
  `)
})

test('sanitizes pattern into versionQualifier and releaseChannel when qualifier and channel flags are true', () => {
  expect(
    normalizeReleaseRule({
      pattern: 'feature/user-auth--v2!',
      qualifier: true,
      channel: true,
    })
  ).toMatchInlineSnapshot(`
    {
      "pattern": "feature/user-auth--v2!",
      "releaseChannel": "feature-user-auth-v2",
      "type": undefined,
      "versionQualifier": "feature-user-auth-v2",
    }
  `)
})

test('sets versionQualifier and releaseChannel to undefined when qualifier and channel flags are false', () => {
  expect(
    normalizeReleaseRule({
      pattern: 'main',
      qualifier: false,
      channel: false,
    })
  ).toMatchInlineSnapshot(`
    {
      "pattern": "main",
      "releaseChannel": undefined,
      "type": undefined,
      "versionQualifier": undefined,
    }
  `)
})

test('sets versionQualifier and releaseChannel to undefined when qualifier and channel options are omitted', () => {
  expect(
    normalizeReleaseRule({
      pattern: 'main',
    })
  ).toMatchInlineSnapshot(`
    {
      "pattern": "main",
      "releaseChannel": undefined,
      "type": undefined,
      "versionQualifier": undefined,
    }
  `)
})

test('returns null when rule input is null', () => {
  expect(normalizeReleaseRule(null)).toBeNull()
})

test('returns null when rule input is undefined', () => {
  expect(normalizeReleaseRule(undefined)).toBeNull()
})

test('returns null when rule input is false', () => {
  expect(normalizeReleaseRule(false)).toBeNull()
})

test('returns null when pattern is missing from rule object', () => {
  expect(normalizeReleaseRule({})).toBeNull()
})

test('returns null when pattern is undefined', () => {
  expect(normalizeReleaseRule({ pattern: undefined })).toBeNull()
})
