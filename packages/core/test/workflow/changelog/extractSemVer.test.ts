// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractSemVer } from '@reelout/core'
import { expect, test } from 'vitest'

test('recognizes plain and v-prefixed SemVer tokens', () => {
  expect(extractSemVer('2.0.0')).toEqual(['2.0.0'])
  expect(extractSemVer('2.1.0')).toEqual(['2.1.0'])
  expect(extractSemVer('v2.1.0')).toEqual(['2.1.0'])
})

test('accepts prerelease and build-metadata variants', () => {
  expect(extractSemVer('2026.1.1-rc.2')).toEqual(['2026.1.1-rc.2'])
  expect(extractSemVer('3.0.0-rc.1')).toEqual(['3.0.0-rc.1'])
  expect(extractSemVer('v2.0.0-dev.0')).toEqual(['2.0.0-dev.0'])
  expect(extractSemVer('v7.2.1-beta - Edge Channel')).toEqual(['7.2.1-beta'])
  expect(extractSemVer('v2.0.0-beta.1+exp.sha.5114f85')).toEqual([
    '2.0.0-beta.1+exp.sha.5114f85',
  ])
})

test('ignores non-version prefixes such as words and emojis', () => {
  expect(extractSemVer('Release v5.1.0')).toEqual(['5.1.0'])
  expect(extractSemVer('✨ v1.0.0-rc.1')).toEqual(['1.0.0-rc.1'])
  expect(extractSemVer('🚀 v9.0.0-beta.0 - Core Engine Rewrite')).toEqual([
    '9.0.0-beta.0',
  ])
})

test('handles versions followed by trailing text or dates', () => {
  expect(extractSemVer('2.0.0 (2026-01-01)')).toEqual(['2.0.0'])
  expect(extractSemVer('2.1.0-dev.0 (2026-03-01)')).toEqual(['2.1.0-dev.0'])
  expect(extractSemVer('v1.2.0 - January 1, 2026')).toEqual(['1.2.0'])
  expect(extractSemVer('v1.2.0-rc.1 - Jan 1, 2026')).toEqual(['1.2.0-rc.1'])
  expect(extractSemVer('v3.0.0 secondary text')).toEqual(['3.0.0'])
  expect(extractSemVer('v4.0.0 - Release Notes')).toEqual(['4.0.0'])
})

test('extracts versions from malformed markdown link syntax', () => {
  expect(extractSemVer('[v8.0.0](BrokenLink')).toEqual(['8.0.0'])
})

test('selects the highest SemVer when multiple tokens are present', () => {
  expect(extractSemVer('v1.1.0...v1.2.0')).toEqual(['1.1.0', '1.2.0'])
  expect(extractSemVer('v1.1.0...v1.2.0-dev.0')).toEqual([
    '1.1.0',
    '1.2.0-dev.0',
  ])
  expect(extractSemVer('v1.1.0...v1.2.0 (2026-01-01)')).toEqual([
    '1.1.0',
    '1.2.0',
  ])
  expect(extractSemVer('v1.1.0...v1.2.0-dev.0 (2026-02-01)')).toEqual([
    '1.1.0',
    '1.2.0-dev.0',
  ])
  expect(extractSemVer('v6.0.0 comparisons to v5.0.0')).toEqual([
    '6.0.0',
    '5.0.0',
  ])
})

test('returns null for non-version text and malformed version strings', () => {
  expect(extractSemVer('Changelog')).toEqual([])
  expect(extractSemVer('Unreleased')).toEqual([])
  expect(extractSemVer('v1.2.3.4')).toEqual([])
})
