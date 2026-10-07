// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { buildTrailerPattern } from '@reelout/core'
import { expect, test } from 'vitest'

test('ensures standard alphanumeric trailers match with default configuration', () => {
  const regex = buildTrailerPattern()
  const match = regex.exec('Signed-off-by: Test Author <author@example.test>')

  expect(match).not.toBeNull()
  expect(match?.[1]).toBe('Signed-off-by')
  expect(match?.[2]).toBe('Test Author <author@example.test>')
})

test('ensures keys containing letters, numbers, underscores, and hyphens match', () => {
  const regex = buildTrailerPattern()
  const match = regex.exec('My_Custom-Header123: Some value here')

  expect(match).not.toBeNull()
  expect(match?.[1]).toBe('My_Custom-Header123')
  expect(match?.[2]).toBe('Some value here')
})

test('ensures trailers with flexible spacing and tabs around the colon match', () => {
  const regex = buildTrailerPattern()
  const match = regex.exec('Fixes \t : \t  #42')

  expect(match).not.toBeNull()
  expect(match?.[1]).toBe('Fixes')
  expect(match?.[2]).toBe('#42')
})

test('ensures custom markers containing special regular expression characters match', () => {
  const regex = buildTrailerPattern([
    'BREAKING CHANGE',
    'Acked-by (v2)',
    'C++-Review',
  ])

  const match1 = regex.exec('BREAKING CHANGE: drops support for Node 16')
  expect(match1).not.toBeNull()
  expect(match1?.[1]).toBe('BREAKING CHANGE')
  expect(match1?.[2]).toBe('drops support for Node 16')

  const match2 = regex.exec('Acked-by (v2): Test Reviewer')
  expect(match2).not.toBeNull()
  expect(match2?.[1]).toBe('Acked-by (v2)')
  expect(match2?.[2]).toBe('Test Reviewer')

  const match3 = regex.exec('C++-Review: Approved')
  expect(match3).not.toBeNull()
  expect(match3?.[1]).toBe('C++-Review')
  expect(match3?.[2]).toBe('Approved')
})

test('ensures strict matching against provided custom markers succeeds', () => {
  const regex = buildTrailerPattern(['[Requires-Testing]'])
  const match = regex.exec('[Requires-Testing]: True')

  expect(match).not.toBeNull()
  expect(match?.[1]).toBe('[Requires-Testing]')
  expect(match?.[2]).toBe('True')
})

test('returns null when the colon separator is missing', () => {
  const regex = buildTrailerPattern()
  const match = regex.exec('Signed-off-by Test Author')

  expect(match).toBeNull()
})

test('returns null for keys containing unsupported characters under default settings', () => {
  const regex = buildTrailerPattern()
  const match = regex.exec('Invalid(Key): Value')

  expect(match).toBeNull()
})
