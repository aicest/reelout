// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { generateGitTagName } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns v-prefixed tag for root', () => {
  expect(generateGitTagName(true, 'foo', null)).toBeNull()
  expect(generateGitTagName(true, 'foo', undefined)).toBeNull()
  expect(generateGitTagName(true, 'foo', '1.0.0')).toBe('v1.0.0')
})

test('returns v-prefixed for unnamed root', () => {
  expect(generateGitTagName(true, undefined, null)).toBeNull()
  expect(generateGitTagName(true, undefined, '1.0.0')).toBe('v1.0.0')
})

test('returns package-name tag for member package', () => {
  expect(generateGitTagName(false, 'foo', null)).toBeNull()
  expect(generateGitTagName(false, 'foo', '2.0.0')).toBe('foo@2.0.0')
})

test('throws for unnamed workspace package', () => {
  expect(generateGitTagName(false, undefined, null)).toBeNull()
  expect(() => generateGitTagName(false, undefined, '2.0.0')).toThrow(
    'Package name is required to build a tag name.'
  )
})
