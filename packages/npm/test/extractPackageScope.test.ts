// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractPackageScope } from '@reelout/npm'
import { expect, test } from 'vitest'

test('returns null when input is null, undefined, or empty', () => {
  expect(extractPackageScope(null)).toBe(null)
  expect(extractPackageScope(undefined)).toBe(null)
  expect(extractPackageScope('')).toBe(null)
})

test('returns null when path starts with an invalid @/ prefix', () => {
  expect(extractPackageScope('@/package')).toBe(null)
  expect(extractPackageScope('@/package/core')).toBe(null)
})

test('returns null when package name lacks a scope', () => {
  expect(extractPackageScope('package')).toBe(null)
  expect(extractPackageScope('package/core')).toBe(null)
  expect(extractPackageScope('package/logging')).toBe(null)
})

test('returns the scope string when given a valid scoped package name', () => {
  expect(extractPackageScope('@scope/package')).toBe('scope')
  expect(extractPackageScope('@scope/package/core')).toBe('scope')
})
