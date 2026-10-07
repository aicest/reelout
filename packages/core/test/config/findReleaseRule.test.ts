// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  findReleaseRule,
  type GitRef,
  type GitRefType,
  type ResolvedReleaseRule,
} from '@reelout/core'
import { expect, test } from 'vitest'

const sampleRef: GitRef = { type: 'branch', name: 'main' }

test('returns undefined when rules array is empty', () => {
  expect(findReleaseRule(sampleRef, [])).toBeUndefined()
})

test('returns matching rule when reference type and pattern match release ref', () => {
  const rules: ResolvedReleaseRule[] = [
    {
      type: 'branch',
      pattern: 'main',
      versionQualifier: undefined,
      releaseChannel: 'latest',
    },
  ]

  expect(findReleaseRule(sampleRef, rules)).toEqual(rules[0])
})

test('returns matching rule when rule type is omitted and pattern matches reference name', () => {
  const rules: ResolvedReleaseRule[] = [
    {
      type: undefined,
      pattern: 'main',
      versionQualifier: undefined,
      releaseChannel: 'latest',
    },
  ]

  expect(findReleaseRule(sampleRef, rules)).toEqual(rules[0])
})

test('returns first matching rule when multiple rules match reference', () => {
  const rules: ResolvedReleaseRule[] = [
    {
      type: undefined,
      pattern: 'm*',
      versionQualifier: undefined,
      releaseChannel: 'primary',
    },
    {
      type: undefined,
      pattern: 'main',
      versionQualifier: undefined,
      releaseChannel: 'secondary',
    },
  ]

  expect(findReleaseRule(sampleRef, rules)).toEqual(rules[0])
})

test('returns undefined when rule type mismatches reference type', () => {
  const rules: ResolvedReleaseRule[] = [
    {
      type: 'tag' as string as GitRefType,
      pattern: 'main',
      versionQualifier: undefined,
      releaseChannel: 'latest',
    },
  ]

  expect(findReleaseRule(sampleRef, rules)).toBeUndefined()
})

test('returns undefined when no rule pattern matches reference name', () => {
  const rules: ResolvedReleaseRule[] = [
    {
      type: 'branch',
      pattern: 'release/*',
      versionQualifier: undefined,
      releaseChannel: 'stable',
    },
  ]

  expect(findReleaseRule(sampleRef, rules)).toBeUndefined()
})
