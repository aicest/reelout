// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { sanitizePrereleaseLabel } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns input unchanged when label is already compliant', () => {
  expect(sanitizePrereleaseLabel('beta')).toBe('beta')
  expect(sanitizePrereleaseLabel('rc-1')).toBe('rc-1')
})

test('retains uppercase casing when label contains uppercase characters', () => {
  expect(sanitizePrereleaseLabel('SNAPSHOT')).toBe('SNAPSHOT')
  expect(sanitizePrereleaseLabel('Release-Candidate')).toBe('Release-Candidate')
})

test('replaces non-alphanumeric characters with a single hyphen when special characters are present', () => {
  expect(sanitizePrereleaseLabel('fix_bug_123')).toBe('fix-bug-123')
  expect(sanitizePrereleaseLabel('feat/feature-name')).toBe('feat-feature-name')
  expect(sanitizePrereleaseLabel('feat*name')).toBe('feat-name')
  expect(sanitizePrereleaseLabel('alpha...1')).toBe('alpha-1')
  expect(sanitizePrereleaseLabel('a---b')).toBe('a-b')
  expect(sanitizePrereleaseLabel('release/*')).toBe('release')
})

test('strips leading and trailing hyphens when present in label', () => {
  expect(sanitizePrereleaseLabel('-alpha-')).toBe('alpha')
  expect(sanitizePrereleaseLabel('---beta---')).toBe('beta')
  expect(sanitizePrereleaseLabel('/feat/branch/')).toBe('feat-branch')
})

test('returns empty string when input contains no alphanumeric characters', () => {
  expect(sanitizePrereleaseLabel('')).toBe('')
  expect(sanitizePrereleaseLabel('///')).toBe('')
})
