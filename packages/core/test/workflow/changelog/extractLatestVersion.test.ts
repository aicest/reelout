// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractLatestVersion } from '@reelout/core'
import { expect, test } from 'vitest'
import { stripLeadingSpaces } from '../../../../../test/mock/changelog'

test('extracts highest semver from heading nodes', () => {
  const changelog = stripLeadingSpaces(`
    # [1.2.0] - 2026-01-01

    ## Fixed

    - Bug fixes

    # 1.1.0

    - Initial release
  `)

  expect(extractLatestVersion(changelog)).toBe('1.2.0')
})

test('selects highest version when heading contains multiple candidates', () => {
  const changelog = stripLeadingSpaces(`
    # [v2.0.0...v2.1.0-beta.1](https://example.com/compare/v2.0.0...v2.1.0-beta.1)

    - Feature updates
  `)

  expect(extractLatestVersion(changelog)).toBe('2.1.0-beta.1')
})

test('falls back to single-line paragraphs when headings yield no semver', () => {
  const changelog = stripLeadingSpaces(`
    v1.0.4

    - Feature A
    - Feature B
  `)

  expect(extractLatestVersion(changelog)).toBe('1.0.4')
})

test('skips paragraphs exceeding length limits or ending with sentence terminals', () => {
  const changelog = stripLeadingSpaces(`
    This is a very long paragraph that goes on and on describing version 2.0.0 in great detail to ensure it exceeds eighty characters long.

    Version 3.0.0 was released.

    v1.0.1
  `)

  expect(extractLatestVersion(changelog)).toBe('1.0.1')
})

test('returns null when no valid semver is found', () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    All notable changes to this project will be documented in this file.

    ## [Unreleased]

    - Ongoing work
  `)

  expect(extractLatestVersion(changelog)).toBeNull()
})

test('returns null for empty content', () => {
  expect(extractLatestVersion('')).toBeNull()
})
