// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { isMatch } from '@reelout/core'
import { expect, test } from 'vitest'

test('returns false when target or pattern array is empty', () => {
  expect(isMatch('main', [])).toBe(false)
  expect(isMatch('', [])).toBe(false)
  expect(isMatch('', 'main')).toBe(false)
})

test('accepts both a single string pattern and an array of patterns', () => {
  expect(isMatch('src/index.ts', 'src/*')).toBe(true)
  expect(isMatch('src/index.ts', ['src/*', 'test/*'])).toBe(true)
  expect(isMatch('docs/readme.md', ['src/*', 'test/*'])).toBe(false)
})

test('matches exact strings and single-level glob wildcards (*)', () => {
  expect(isMatch('main', 'main')).toBe(true)
  expect(isMatch('release/20260101', 'release/*')).toBe(true)

  expect(isMatch('develop', 'main')).toBe(false)
  expect(isMatch('develop', 'release/*')).toBe(false)
})

test('matches dotfiles by default across standard and recursive wildcards', () => {
  expect(isMatch('.gitignore', '*')).toBe(true)
  expect(isMatch('.gitignore', '.*')).toBe(true)
  expect(isMatch('.gitignore', '*.*')).toBe(true)
  expect(isMatch('.github/workflows/ci.yml', '.github/**')).toBe(true)
  expect(isMatch('.github/workflows/ci.yml', '**/*')).toBe(true)
})

test('evaluates semver release tags and pre-release patterns', () => {
  expect(isMatch('v1.0.0', '*')).toBe(true)
  expect(isMatch('v1.0.0-alpha.1', '*')).toBe(true)
  expect(isMatch('v1.0.0-rc', '*')).toBe(true)

  expect(isMatch('v1.0.0', 'v*.*.*')).toBe(true)
  expect(isMatch('v1.0.0-alpha.1', 'v*.*.*')).toBe(true)
  expect(isMatch('v1.0.0-rc', 'v*.*.*')).toBe(true)

  expect(isMatch('v1.0.0', 'v*.*.*-*')).toBe(false)
  expect(isMatch('v1.0.0-alpha.1', 'v*.*.*-*')).toBe(true)
  expect(isMatch('v1.0.0-rc', 'v*.*.*-*')).toBe(true)

  expect(isMatch('v1.0.0', 'v*.*.*-*.*')).toBe(false)
  expect(isMatch('v1.0.0-alpha.1', 'v*.*.*-*.*')).toBe(true)
  expect(isMatch('v1.0.0-rc', 'v*.*.*-*.*')).toBe(false)
})

test('returns true if target matches at least one positive pattern', () => {
  expect(isMatch('feature/login', ['main', 'feature/*'])).toBe(true)
  expect(isMatch('bugfix/login', ['main', 'feature/*'])).toBe(false)
})

test('auto-expands a single negative string pattern to imply standard inclusion (**/*)', () => {
  expect(isMatch('main', '!main')).toBe(false)
  expect(isMatch('develop', '!main')).toBe(true)
  expect(isMatch('release/20260101', '!main')).toBe(true)

  // Explicitly demonstrates why array with only negatives fails (positives.some() is false)
  expect(isMatch('main', ['!main'])).toBe(false)
  expect(isMatch('develop', ['!main'])).toBe(false)
  expect(isMatch('release/20260101', ['!main'])).toBe(false)
})

test('filters positive matches when matching negative patterns are present', () => {
  expect(isMatch('main', ['**/*', '!main'])).toBe(false)
  expect(isMatch('develop', ['**/*', '!main'])).toBe(true)
  expect(isMatch('release/20260101', ['**/*', '!main'])).toBe(true)

  expect(
    isMatch('feature/experimental', ['feature/*', '!feature/experimental'])
  ).toBe(false)
  expect(
    isMatch('feature/user-auth', ['feature/*', '!feature/experimental'])
  ).toBe(true)
})

test('requires all negative pattern rules to pass', () => {
  expect(isMatch('main', ['**/*', '!develop', '!release/*'])).toBe(true)
  expect(isMatch('develop', ['**/*', '!develop', '!release/*'])).toBe(false)
  expect(isMatch('release/20260101', ['**/*', '!develop', '!release/*'])).toBe(
    false
  )
})

test('treats leading exclamation marks in target paths as literal characters', () => {
  expect(isMatch('!q8Z_9xK#m2', '*')).toBe(true)
  expect(isMatch('!!!xK9_m2!vL/p0_Wk.txt', '**/*')).toBe(true)

  expect(isMatch('!q8Z_9xK#m2', ['*', '!q8Z_9xK#m2'])).toBe(true)
  expect(isMatch('q8Z_9xK#m2', ['*', '!q8Z_9xK#m2'])).toBe(false)
})
