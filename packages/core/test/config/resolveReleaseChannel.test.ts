// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import {
  resolveReleaseChannel,
  type GitRef,
  type ResolvedReleaseRule,
} from '@reelout/core'
import { expect, test } from 'vitest'

const ref1: GitRef = {
  type: 'branch',
  name: 'develop',
}

const ref2: GitRef = {
  type: 'branch',
  name: 'release',
}

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

test('resolves channel from release rule when channel is undefined', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: rule1,
    templateParams: {},
    channel: undefined,
  })

  expect(result).toBe('dev')
})

test('returns undefined when channel is undefined and rule contains no channel', () => {
  const result = resolveReleaseChannel({
    ref: ref2,
    rule: rule2,
    templateParams: {},
    channel: undefined,
  })

  expect(result).toBe(undefined)
})

test('resolves channel from release rule when channel is true', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: rule1,
    templateParams: {},
    channel: true,
  })

  expect(result).toBe('dev')
})

test('falls back to sanitized git ref name when channel is true and rule contains no channel', () => {
  const result = resolveReleaseChannel({
    ref: { type: 'branch', name: 'feat/experimental-branch-2026.01.01!!!' },
    rule: rule2,
    templateParams: {},
    channel: true,
  })

  expect(result).toBe('feat-experimental-branch-2026-01-01')
})

test('returns undefined when channel is set to false', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: rule1,
    templateParams: {},
    channel: false,
  })

  expect(result).toBe(undefined)
})

test('overrides release rule channel when explicit string channel is specified', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: rule1,
    templateParams: {},
    channel: 'beta',
  })

  expect(result).toBe('beta')
})

test('returns empty string when channel is set to empty string', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: rule1,
    templateParams: {},
    channel: '',
  })

  expect(result).toBe('')
})

test('interpolates template parameters when channel contains placeholders', () => {
  const result = resolveReleaseChannel({
    ref: ref1,
    rule: undefined,
    templateParams: { date: '20260101', month: '202601' },
    channel: 'dev.{date}.{month}',
  })

  expect(result).toBe('dev.20260101.202601')
})
