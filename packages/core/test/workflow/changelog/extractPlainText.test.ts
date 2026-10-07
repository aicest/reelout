// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractPlainText } from '@reelout/core'
import type { Paragraph } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { assert, expect, test } from 'vitest'
import { stripLeadingSpaces } from '../../../../../test/mock/changelog'

test('returns heading text for H2 version line', () => {
  const changelog = stripLeadingSpaces(`
    ## 2.0.0

    ### Features

    - Add support for recursive ast parsing
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('2.0.0')
})

test('returns paragraph text for top-level paragraph version line', () => {
  const changelog = stripLeadingSpaces(`
    v1.2.0 - November 9, 2018

    * Update: Resolve array boundary panic conditions (user1)
    * Fix: Handle edge case null bounds checking pointers (#42) (user2)
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'paragraph')

  expect(extractPlainText(node)).toBe('v1.2.0 - November 9, 2018')
})

test('flattens nested strong and emphasis and returns combined text', () => {
  const changelog = stripLeadingSpaces(`
    **_v3.0.0_** secondary text

    Drop support for Node.js v14
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'paragraph')

  expect(extractPlainText(node)).toBe('v3.0.0 secondary text')
})

test('handles inline code in heading and returns text', () => {
  const changelog = stripLeadingSpaces(`
    ## \`v7.2.1-beta\` - Edge Channel

    Internal testing release cycle
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('v7.2.1-beta - Edge Channel')
})

test('preserves leading emoji in heading text', () => {
  const changelog = stripLeadingSpaces(`
    ## 🚀 v9.0.0-beta.0 - Core Engine Rewrite

    Breaking changes landing early
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('🚀 v9.0.0-beta.0 - Core Engine Rewrite')
})

test('extracts text when version is inside a link with emoji prefix', () => {
  const changelog = stripLeadingSpaces(`
    ## ✨ [v1.0.0-rc.1](https://github.com)

    ### Features

    - Initial candidate testing infrastructure
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('✨ v1.0.0-rc.1')
})

test('extracts linked version from heading', () => {
  const changelog = stripLeadingSpaces(`
    ## [v2.1.0](https://github.com)

    ### Features

    - Added direct version-to-link parsing anchors
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('v2.1.0')
})

test('extracts paragraph starting with a link', () => {
  const changelog = stripLeadingSpaces(`
    [v4.0.0](https://github.com) - Release Notes

    Internal pipeline migration details
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'paragraph')

  expect(extractPlainText(node)).toBe('v4.0.0 - Release Notes')
})

test('captures plain text when link follows arbitrary text in heading', () => {
  const changelog = stripLeadingSpaces(`
    ## Release [v5.1.0](https://github.com)

    ### Patch Notes

    - Performance tuning on node iteration
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('Release v5.1.0')
})

test('handles multiple inline links and preserves order', () => {
  const changelog = stripLeadingSpaces(`
    [v6.0.0](https://github.com) comparisons to [v5.0.0](https://github.com)

    ### Migrations

    - Major breaking API restructuring
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'paragraph')

  expect(extractPlainText(node)).toBe('v6.0.0 comparisons to v5.0.0')
})

test('parses GitHub comparison links inside headings', () => {
  const changelog = stripLeadingSpaces(`
    ## [v1.1.0...v1.2.0](https://github.com) (2026-01-01)

    ### Patches

    - Incremental differential update parsing
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('v1.1.0...v1.2.0 (2026-01-01)')
})

test('accepts CalVer with rc metadata in heading', () => {
  const changelog = stripLeadingSpaces(`
    ## [2026.1.1-rc.2](https://github.com)

    ### Notes

    - Stability verification testing phase
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('2026.1.1-rc.2')
})

test('gracefully handles malformed link brackets', () => {
  const changelog = stripLeadingSpaces(`
    ## [v8.0.0](BrokenLink

    Incomplete markup string validation
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBe('[v8.0.0](BrokenLink')
})

test('returns null for empty link-only heading', () => {
  const changelog = stripLeadingSpaces(`
    ## [](https://github.com)

    ### Empty Link Heading Case
  `)

  const node = fromMarkdown(changelog).children[0]

  assert(node?.type === 'heading')

  expect(extractPlainText(node)).toBeNull()
})

test('returns null for nodes with no text or children', () => {
  const emptyNode: Paragraph = { type: 'paragraph', children: [] }

  expect(extractPlainText(emptyNode)).toBeNull()
  expect(extractPlainText(null)).toBeNull()
  expect(extractPlainText(undefined)).toBeNull()
})
