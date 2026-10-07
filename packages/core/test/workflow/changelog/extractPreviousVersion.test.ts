// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fai

import { extractPreviousVersion } from '@reelout/core'
import { expect, test } from 'vitest'
import { stripLeadingSpaces } from '../../../../../test/mock/changelog'

test('throws when current version is not valid semver', async () => {
  const changelog = stripLeadingSpaces(`
    ## v1.0.0

    Initial baseline configuration loop.
  `)

  await expect(
    extractPreviousVersion(null, changelog)
  ).rejects.toMatchInlineSnapshot(
    `[Error: The current version "[1mnull[22m" is not a valid semantic version.]`
  )

  await expect(
    extractPreviousVersion('invalid-semver', changelog)
  ).rejects.toMatchInlineSnapshot(
    `[Error: The current version "[1minvalid-semver[22m" is not a valid semantic version.]`
  )
})

test('throws when current version is already a stable release (major >= 1)', async () => {
  const changelog = stripLeadingSpaces(`
    # Changelog

    ## v2.1.0

    Production release notes.
  `)

  await expect(
    extractPreviousVersion('1.0.0', changelog)
  ).rejects.toMatchInlineSnapshot(
    `[Error: The current version "[1m1.0.0[22m" is already a stable release.]`
  )
})

test('returns first listed version if it differs from current version', async () => {
  const changelog = stripLeadingSpaces(`
    ## v1.5.0

    - Different version than current version before tracking loop anchors.
  `)

  expect(await extractPreviousVersion('1.6.0-rc.1', changelog)).toBe('1.5.0')
})

test('returns previous version when first changelog entry matches current version', async () => {
  const changelog = stripLeadingSpaces(`
    ## v1.6.0-rc.1

    Current active version header block.

    ## v1.5.0

    Target matching prior stable layout.
  `)

  expect(await extractPreviousVersion('1.6.0-rc.1', changelog)).toBe('1.5.0')
})

test('throws when changelog contains duplicate versions', async () => {
  const changelog = stripLeadingSpaces(`
    ## v1.6.0-rc.1

    First instance wrapper.

    ## v1.6.0-rc.1

    Broken non-decreasing sequence match tracking.
  `)

  await expect(
    extractPreviousVersion('1.6.0-rc.1', changelog)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Each newer release must have a higher version, but "[1m1.6.0-rc.1[22m" appears before "[1m1.6.0-rc.1[22m".]`
  )
})

test('throws when versions in changelog are not in strict descending order', async () => {
  const changelog = stripLeadingSpaces(`
    ## v1.5.0-rc.1

    - Baseline validation anchor initialization block.

    ## v1.6.0

    - Sequential check failure payload step.
  `)

  await expect(
    extractPreviousVersion('1.5.0-rc.1', changelog)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Each newer release must have a higher version, but "[1m1.5.0-rc.1[22m" appears before "[1m1.6.0[22m".]`
  )
})

test('skips prereleases within the same base version for major >= 1 current versions', async () => {
  const changelog = stripLeadingSpaces(`
    ## v2.0.0-rc.2

    Matches currentVersion loop initialization state.

    ## v2.0.0-rc.1

    Skipped: same base version group (2.0.0 === 2.0.0).

    ## v2.0.0-beta.0

    Skipped: same base version group (2.0.0 === 2.0.0).

    ## v1.8.4

    Discovered target matching base version deviation rules.
  `)

  expect(await extractPreviousVersion('2.0.0-rc.2', changelog)).toBe('1.8.4')
})

test('returns null for major-0 prerelease current versions', async () => {
  const changelog = stripLeadingSpaces(`
    ## v0.2.0-beta.1

    Matches currentVersion tracking state.

    ## v0.1.0

    Skipped because parsedCurrent.major is 0 (fails the parsedCurrent.major >= 1 check).

    ## v0.0.1

    Older major 0 release that keeps the document in descending order.
  `)

  expect(await extractPreviousVersion('0.2.0-beta.1', changelog)).toBeNull()
})

test('ignores versions found in non-heading/non-paragraph markdown blocks', async () => {
  const changelog = stripLeadingSpaces(`
    Version v1.8.0 was released on 2026-01-01.

    Skipped: inline paragraph content block without heading element.

    > v1.7.0

    Skipped: blockquote element wrapper type block.

    \`\`\`
    v1.6.5
    \`\`\`

    Skipped: code block element wrapper type block.

    ## v1.6.0

    Valid target heading depth 2.
  `)

  expect(await extractPreviousVersion('1.9.0-alpha.1', changelog)).toBe('1.6.0')
})

test('skips empty headings and continues searching for valid version', async () => {
  const changelog = stripLeadingSpaces(`
    ##

    - Empty heading structure forces ternary evaluation branch down to null fallback.

    ## v1.5.0
  `)

  expect(await extractPreviousVersion('1.6.0-rc.1', changelog)).toBe('1.5.0')
})

test('returns null when no previous version outside base version group is found', async () => {
  const changelog = stripLeadingSpaces(`
    ## v2.0.0-beta.0

    Matches base version loop tracking criteria.
  `)

  expect(await extractPreviousVersion('2.0.0-beta.0', changelog)).toBeNull()
})

test('returns null when changelog content is empty or whitespace-only', async () => {
  expect(await extractPreviousVersion('1.0.0-rc.1', '')).toBeNull()
  expect(await extractPreviousVersion('1.0.0-rc.1', '   \n  \t  ')).toBeNull()
})
