// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isSameReleaseCycle } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns false when either version is null, undefined, or unparseable', () => {
  expect(isSameReleaseCycle(null, '1.0.0')).toBe(false)
  expect(isSameReleaseCycle('1.0.0', undefined)).toBe(false)
  expect(isSameReleaseCycle('invalid', '1.0.0')).toBe(false)
  expect(isSameReleaseCycle(null, null)).toBe(false)
})

test('returns true when main version components are identical', () => {
  expect(isSameReleaseCycle('1.0.0', '1.0.0')).toBe(true)
  expect(isSameReleaseCycle('1.0.0-alpha.1', '1.0.0-beta.2')).toBe(true)
  expect(isSameReleaseCycle('2.3.4-rc.1', '2.3.4')).toBe(true)
})

test('returns true when transitioning from a non-zero 0.x version to 1.0.0', () => {
  expect(isSameReleaseCycle('0.1.0', '1.0.0-alpha.1')).toBe(true)
  expect(isSameReleaseCycle('0.1.0', '1.0.0-beta.2')).toBe(true)
  expect(isSameReleaseCycle('0.1.0', '1.0.0-rc.1')).toBe(true)
  expect(isSameReleaseCycle('0.1.0', '1.0.0')).toBe(true)
  expect(isSameReleaseCycle('0.9.3-alpha.1', '1.0.0-beta.0')).toBe(true)
  expect(isSameReleaseCycle('0.0.1', '1.0.0')).toBe(true)
})

test('returns false when main versions differ for stable releases', () => {
  expect(isSameReleaseCycle('1.0.0', '1.0.1')).toBe(false)
  expect(isSameReleaseCycle('1.0.0', '1.1.0')).toBe(false)
  expect(isSameReleaseCycle('1.0.0', '2.0.0')).toBe(false)
})

test('returns false when 0.x transitions to a version beyond 1.0.0', () => {
  expect(isSameReleaseCycle('0.1.0', '1.0.1-alpha.1')).toBe(false)
  expect(isSameReleaseCycle('0.1.0', '1.0.1')).toBe(false)
  expect(isSameReleaseCycle('0.1.0', '1.1.0')).toBe(false)
  expect(isSameReleaseCycle('0.1.0', '2.0.0')).toBe(false)
})
