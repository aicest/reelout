// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isSemVer } from '@reelout/core'
import { expect, expectTypeOf, test } from 'vitest'

test('returns false when input is not a string', () => {
  expect(isSemVer(undefined)).toBe(false)
  expect(isSemVer({} as unknown as string)).toBe(false)
  expect(isSemVer(null)).toBe(false)
  expect(isSemVer([] as unknown as string)).toBe(false)
  expect(isSemVer(true as unknown as string)).toBe(false)
  expect(isSemVer(123 as unknown as string)).toBe(false)
})

test('returns true when input is a valid SemVer string', () => {
  expect(isSemVer('0.0.0')).toBe(true)
  expect(isSemVer('1.0.0-alpha.1')).toBe(true)
  expect(isSemVer('999999999.999999999.999999999')).toBe(true)
  expect(isSemVer('1.0.0')).toBe(true)
  expect(isSemVer('1.0.0-beta+exp.sha.5114f85')).toBe(true)
  expect(isSemVer('10.20.30')).toBe(true)
  expect(isSemVer('1.0.0-alpha+001')).toBe(true)
  expect(isSemVer('1.0.0-0.3.7')).toBe(true)
  expect(isSemVer('1.0.0-alpha')).toBe(true)
  expect(isSemVer('1.0.0+20130313144700')).toBe(true)
  expect(isSemVer('1.0.0-x.7.z.92')).toBe(true)
  expect(isSemVer('1.0.0-alpha.beta')).toBe(true)
})

test('returns false when input is an invalid SemVer string or range specifier', () => {
  expect(isSemVer('^1.0.0')).toBe(false)
  expect(isSemVer('v1.0.0')).toBe(false)
  expect(isSemVer('')).toBe(false)
  expect(isSemVer('1.0')).toBe(false)
  expect(isSemVer('1.0.0 - 2.0.0')).toBe(false)
  expect(isSemVer('1')).toBe(false)
  expect(isSemVer('~1.0.0')).toBe(false)
  expect(isSemVer(' 1.0.0 ')).toBe(false)
  expect(isSemVer('01.0.0')).toBe(false)
  expect(isSemVer('latest')).toBe(false)
  expect(isSemVer('>=1.0.0')).toBe(false)
  expect(isSemVer('1.0.0.0')).toBe(false)
  expect(isSemVer('1.x.x')).toBe(false)
  expect(isSemVer('not-a-version')).toBe(false)
  expect(isSemVer('1.0.0-')).toBe(false)
  expect(isSemVer('*')).toBe(false)
  expect(isSemVer('V1.0.0')).toBe(false)
  expect(isSemVer('1.01.0')).toBe(false)
  expect(isSemVer('<=1.0.0')).toBe(false)
  expect(isSemVer('1.0.0+')).toBe(false)
  expect(isSemVer('1.0.x')).toBe(false)
  expect(isSemVer('1.0.01')).toBe(false)
  expect(isSemVer(' ')).toBe(false)
  expect(isSemVer('1.0.0-01')).toBe(false)
  expect(isSemVer('1.0.0-alpha..1')).toBe(false)
})

test('narrows variable type to string when type guard returns true', () => {
  const value = '1.2.3' as string | null | undefined

  if (isSemVer(value)) {
    expectTypeOf(value).toEqualTypeOf<string>()
  } else {
    expectTypeOf(value).toEqualTypeOf<null | undefined>()
  }
})
